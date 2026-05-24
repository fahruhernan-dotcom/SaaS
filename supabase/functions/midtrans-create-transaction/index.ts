// ─────────────────────────────────────────────────────────────────────────────
// Edge Function : midtrans-create-transaction
// Phase         : B4 — DRAFT, not deployed
// Purpose       : Create a Midtrans Snap transaction for a pending invoice and
//                 return the redirect URL. Source of truth for payment status
//                 remains the webhook handler (B5).
//
// SECURITY
//   • MIDTRANS_SERVER_KEY is read from Edge Function secrets only.
//     Never stored in DB. Never returned to frontend.
//   • Caller must present a Supabase JWT in Authorization: Bearer <token>.
//   • Caller must have role='owner' for the invoice's tenant in EITHER
//     tenant_memberships (newer source) OR profiles (legacy source). Other
//     roles (staff/viewer/member) are rejected.
//   • Amount is read from `subscription_invoices.amount` server-side.
//     The frontend payload only carries `invoice_id`; gross_amount is never
//     accepted from the client.
//   • Invoice must be `status = 'pending'`. Any other status → 409.
//
// IDEMPOTENCY
//   • If the invoice already has `provider_order_id` AND `provider_payment_url`
//     AND the previous `provider_status` is not a dead-state (expire/cancel/
//     deny/failure), the existing Snap redirect URL is returned unchanged.
//   • If the previous Snap order is in a dead state, a fresh Midtrans order
//     is created with a suffix `-R<ts>` appended to `invoice_number` (Midtrans
//     requires order_id uniqueness per merchant for production lifetime).
//
// SIDE EFFECTS (writes)
//   • subscription_invoices row UPDATE with:
//       payment_provider = 'midtrans'
//       payment_method   = 'midtrans_snap'
//       provider_order_id, provider_payment_url, provider_status = 'pending'
//       provider_payload = { create: <full Midtrans response> }
//       updated_at       = now
//   • Guarded by `.eq('status','pending')` so a paid invoice can never be
//     overwritten by a late retry of this function.
//
// PERSIST-FAILURE BEHAVIOR
//   • If the Midtrans Snap order is created but the DB UPDATE fails, the
//     function returns HTTP 500 with a generic error message and DOES NOT
//     return the redirect_url to the frontend. This prevents a user from
//     paying against an order that the DB does not know about.
//   • The failure is logged server-side via console.error with invoice.id
//     and orderId for operator forensics; no Midtrans response body or
//     internal detail is leaked to the caller.
//
// WHAT THIS FUNCTION DOES NOT DO
//   • Does NOT mark the invoice as paid.
//   • Does NOT update tenants.plan or plan_expires_at.
//   • Does NOT verify webhook signatures (that is the B5 webhook handler).
//   • Does NOT manage refunds, cancellations, or status polling.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  tenant_id: string;
  plan: string | null;
  billing_months: number | null;
  amount: number;
  status: string;
  payment_provider: string | null;
  provider_order_id: string | null;
  provider_payment_url: string | null;
  provider_status: string | null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ─── Structured server-side loggers ─────────────────────────────────────────
// Safe for the Supabase function log stream. NEVER pass JWT, server keys,
// raw request bodies, full Midtrans payloads, or user PII (email, profile).
// Keep metadata to scalar identifiers (uuids, http status codes, db error codes).

const log = (action: string, meta: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ fn: "midtrans-create-transaction", action, ...meta }));

const logEdgeError = (
  action: string,
  error: unknown,
  metadata: Record<string, unknown> = {},
) => {
  const safeError = error && typeof error === "object"
    ? {
      name: (error as { name?: unknown }).name,
      message: (error as { message?: unknown }).message,
      code: (error as { code?: unknown }).code,
    }
    : { message: String(error) };

  console.error(JSON.stringify({ fn: "midtrans-create-transaction", action, error: safeError, ...metadata }));
};

// Midtrans transaction_status values that mean the previous Snap order can no
// longer be reused — either already paid or definitively rejected.
// "settlement" / "capture" = already paid; token is consumed, 409 on reuse.
// "expire" / "cancel" / "deny" / "failure" = definitively dead.
const DEAD_STATUSES = new Set([
  "settlement",
  "capture",
  "expire",
  "expired",
  "cancel",
  "cancelled",
  "deny",
  "failure",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  log("request.received", { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    logEdgeError("request.method_not_allowed", new Error(`Expected POST, got ${req.method}`), { method: req.method });
    return json({ error: "Method not allowed" }, 405);
  }

  // ─── 1. Env (Server Key NEVER leaves this function) ─────────────────────────
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY");
  const MIDTRANS_IS_PRODUCTION =
    Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    logEdgeError(
      "env.supabase_misconfigured",
      new Error("Missing Supabase env vars"),
      {
        has_url: !!SUPABASE_URL,
        has_service: !!SUPABASE_SERVICE_ROLE_KEY,
        has_anon: !!SUPABASE_ANON_KEY,
      },
    );
    return json({ error: "Server misconfigured" }, 500);
  }
  if (!MIDTRANS_SERVER_KEY) {
    logEdgeError(
      "env.midtrans_key_missing",
      new Error("MIDTRANS_SERVER_KEY not set"),
      {
        is_production: MIDTRANS_IS_PRODUCTION,
      },
    );
    return json({ error: "Payment gateway not configured" }, 503);
  }

  // ─── 2. Authenticate caller via JWT ─────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    logEdgeError("auth.missing_bearer", new Error("No Bearer token"), {
      has_auth_header: authHeader.length > 0,
    });
    return json({ error: "Unauthorized" }, 401);
  }
  const jwt = authHeader.slice(7).trim();

  const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await supaUser.auth.getUser();
  if (userErr || !userData?.user) {
    logEdgeError(
      "auth.get_user_failed",
      userErr ?? new Error("No user on session"),
      {
        has_user_data: !!userData?.user,
      },
    );
    return json({ error: "Unauthorized" }, 401);
  }
  const authUserId = userData.user.id;
  const userEmail = userData.user.email ?? "";
  log("auth.verified", { auth_user_id: authUserId });

  // ─── 3. Parse + validate body ───────────────────────────────────────────────
  let body: { invoice_id?: unknown };
  try {
    body = await req.json();
  } catch (e) {
    logEdgeError("body.invalid_json", e, { auth_user_id: authUserId });
    return json({ error: "Invalid JSON body" }, 400);
  }
  const invoiceId = typeof body?.invoice_id === "string"
    ? body.invoice_id.trim()
    : "";
  if (!invoiceId) {
    logEdgeError("body.invoice_id_missing", new Error("invoice_id absent"), {
      auth_user_id: authUserId,
    });
    return json({ error: "invoice_id is required" }, 400);
  }
  if (!UUID_RE.test(invoiceId)) {
    logEdgeError(
      "body.invoice_id_malformed",
      new Error("invoice_id not a UUID"),
      {
        auth_user_id: authUserId,
      },
    );
    return json({ error: "invoice_id must be a UUID" }, 400);
  }

  // ─── 4. Service-role client (for DB reads/writes that bypass RLS safely) ────
  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ─── 5. Fetch invoice ───────────────────────────────────────────────────────
  const { data: invoice, error: invErr } = await supa
    .from("subscription_invoices")
    .select(
      "id, invoice_number, tenant_id, plan, billing_months, amount, status, " +
        "payment_provider, provider_order_id, provider_payment_url, provider_status",
    )
    .eq("id", invoiceId)
    .maybeSingle<InvoiceRow>();

  if (invErr) {
    logEdgeError("db.invoice_fetch_failed", invErr, {
      invoice_id: invoiceId,
      auth_user_id: authUserId,
    });
    return json({ error: "Database error" }, 500);
  }
  if (!invoice) {
    logEdgeError("invoice.not_found", new Error("Invoice id has no row"), {
      invoice_id: invoiceId,
      auth_user_id: authUserId,
    });
    return json({ error: "Invoice not found" }, 404);
  }
  log("invoice.fetched", {
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    tenant_id: invoice.tenant_id,
    status: invoice.status,
    plan: invoice.plan,
    billing_months: invoice.billing_months,
  });

  if (invoice.status !== "pending") {
    logEdgeError(
      "invoice.wrong_status",
      new Error(`status=${invoice.status}`),
      {
        invoice_id: invoice.id,
        auth_user_id: authUserId,
        invoice_status: invoice.status,
      },
    );
    return json({
      error:
        `Invoice status is "${invoice.status}"; only pending invoices can be paid`,
    }, 409);
  }

  // ─── 6. Ownership check — caller must be tenant owner ───────────────────────
  // Owner can be recorded in EITHER table during the M:N transition window:
  //   • tenant_memberships(auth_user_id, tenant_id, role='owner')   — newer source
  //   • profiles(auth_user_id, tenant_id, role='owner')             — legacy source
  // Both are queried in parallel; either one with role='owner' is sufficient.
  // Staff / viewer / member roles are explicitly rejected.
  const [memRes, profRes] = await Promise.all([
    supa
      .from("tenant_memberships")
      .select("role")
      .eq("tenant_id", invoice.tenant_id)
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
    supa
      .from("profiles")
      .select("role")
      .eq("tenant_id", invoice.tenant_id)
      .eq("auth_user_id", authUserId)
      .maybeSingle(),
  ]);

  if (memRes.error && profRes.error) {
    logEdgeError("db.ownership_lookup_failed", memRes.error, {
      invoice_id: invoice.id,
      tenant_id: invoice.tenant_id,
      auth_user_id: authUserId,
      profiles_err: (profRes.error as { code?: unknown } | null)?.code ?? null,
    });
    return json({ error: "Authorization check failed" }, 500);
  }
  const isOwner = memRes.data?.role === "owner" ||
    profRes.data?.role === "owner";

  log("auth.ownership_checked", {
    invoice_id: invoice.id,
    tenant_id: invoice.tenant_id,
    auth_user_id: authUserId,
    is_owner: isOwner,
  });

  if (!isOwner) {
    logEdgeError("auth.not_owner", new Error("Caller is not tenant owner"), {
      invoice_id: invoice.id,
      tenant_id: invoice.tenant_id,
      auth_user_id: authUserId,
      mem_role: memRes.data?.role ?? null,
      profile_role: profRes.data?.role ?? null,
    });
    return json({
      error: "Forbidden — only the tenant owner can initiate payment",
    }, 403);
  }

  // ─── 7. Idempotency — reuse existing Snap URL if still alive ────────────────
  // DB provider_status may lag behind Midtrans (e.g. before B5 webhook runs).
  // Always verify live status from Midtrans before reusing a token to avoid
  // returning an already-consumed token (Midtrans responds 409 on reuse).
  const hasExistingOrder = !!invoice.provider_order_id &&
    !!invoice.provider_payment_url;
  const dbStatusIsDead = !!invoice.provider_status &&
    DEAD_STATUSES.has(invoice.provider_status);
  let liveStatusIsDead = false;

  if (hasExistingOrder && !dbStatusIsDead) {
    const statusBaseUrl = MIDTRANS_IS_PRODUCTION
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";
    try {
      const statusRes = await fetch(
        `${statusBaseUrl}/${invoice.provider_order_id}/status`,
        { headers: { "Authorization": `Basic ${btoa(`${MIDTRANS_SERVER_KEY}:`)}` } },
      );
      if (statusRes.ok) {
        const statusBody = await statusRes.json() as { transaction_status?: string };
        if (statusBody.transaction_status) {
          liveStatusIsDead = DEAD_STATUSES.has(statusBody.transaction_status);
        }
      } else {
        // Non-200 from status check (e.g. 404 = order never reached Midtrans).
        // Treat as dead so we mint a fresh order rather than returning a broken URL.
        liveStatusIsDead = true;
      }
    } catch {
      // Network failure — conservatively treat as dead to avoid returning a broken URL.
      liveStatusIsDead = true;
    }

    if (!liveStatusIsDead) {
      log("idempotency.reusing_existing_url", {
        invoice_id: invoice.id,
        order_id: invoice.provider_order_id,
        db_status: invoice.provider_status,
      });
      return json({
        reused: true,
        order_id: invoice.provider_order_id,
        redirect_url: invoice.provider_payment_url,
      });
    }

    log("idempotency.dead_order_reissuing", {
      invoice_id: invoice.id,
      order_id: invoice.provider_order_id,
      db_status_dead: dbStatusIsDead,
      live_status_dead: liveStatusIsDead,
    });
  }

  // ─── 8. Validate amount from DB (NEVER trust frontend) ──────────────────────
  const grossAmount = Number(invoice.amount);
  if (
    !Number.isFinite(grossAmount) || grossAmount <= 0 ||
    !Number.isInteger(grossAmount)
  ) {
    logEdgeError(
      "invoice.invalid_amount",
      new Error("Amount not a positive integer"),
      {
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
        amount_typeof: typeof invoice.amount,
      },
    );
    return json({ error: "Invalid invoice amount" }, 422);
  }

  // ─── 9. Build Midtrans Snap payload ─────────────────────────────────────────
  // Guard: invoice_number must exist before we build a Midtrans order_id from
  // it. A row with a NULL invoice_number is a DB integrity bug; refuse to
  // proceed rather than minting a derived id that the webhook cannot match.
  const invoiceNumber = typeof invoice.invoice_number === "string"
    ? invoice.invoice_number.trim()
    : "";
  if (!invoiceNumber) {
    logEdgeError(
      "invoice.number_missing",
      new Error("invoice_number NULL or empty"),
      {
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
      },
    );
    return json({ error: "Invoice number missing" }, 422);
  }

  // Midtrans order_id must be unique per merchant. We use invoice_number
  // (already unique like INV-XYZ-ABCD). When re-issuing after a dead order,
  // append a base36 timestamp suffix so Midtrans does not reject duplicates.
  const orderId = (dbStatusIsDead || liveStatusIsDead)
    ? `${invoiceNumber}-R${Date.now().toString(36).toUpperCase()}`
    : invoiceNumber;

  const planLabel = String(invoice.plan ?? "plan").toUpperCase();
  const itemName = `TernakOS ${planLabel} (${invoice.billing_months} bln)`
    .slice(0, 50);

  const snapPayload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: [
      {
        id: String(invoice.plan ?? "plan").slice(0, 50),
        price: grossAmount,
        quantity: 1,
        name: itemName,
      },
    ],
    customer_details: userEmail ? { email: userEmail } : {},
    // Snap accepts up to 3 custom fields. Stash invoice.id so the webhook (B5)
    // has a redundant lookup key in addition to order_id. The webhook MUST
    // still use provider_order_id / order_id as the primary key — this is
    // belt-and-suspenders only.
    custom_field1: invoice.id,
    // The webhook (B5) is the authoritative status source. The frontend may
    // also call back to /upgrade?status=... after redirect for UX only.
    callbacks: {
      finish: "https://ternakos.my.id/upgrade?payment=finish",
      unfinish: "https://ternakos.my.id/upgrade?payment=unfinish",
      error: "https://ternakos.my.id/upgrade?payment=error",
    },
    // Sandbox only: restrict to stable test payment methods.
    // QRIS/GoPay sandbox is unreliable ("error=2603") — VA and credit card
    // simulators work consistently. Production shows all methods by default
    // (no enabled_payments = Midtrans decides based on merchant config).
    ...(!MIDTRANS_IS_PRODUCTION && {
      enabled_payments: [
        "bank_transfer",
        "bca_va",
        "bni_va",
        "bri_va",
        "permata_va",
        "other_va",
        "credit_card",
      ],
    }),
  };

  log("snap.payload_built", {
    invoice_id: invoice.id,
    order_id: orderId,
    gross_amount: grossAmount,
    plan: invoice.plan,
    billing_months: invoice.billing_months,
    is_production: MIDTRANS_IS_PRODUCTION,
    is_reissue: dbStatusIsDead || liveStatusIsDead,
  });

  // ─── 10. POST to Midtrans Snap ──────────────────────────────────────────────
  const snapBaseUrl = MIDTRANS_IS_PRODUCTION
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const basicAuth = btoa(`${MIDTRANS_SERVER_KEY}:`);

  let snapRes: Response;
  try {
    snapRes = await fetch(snapBaseUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify(snapPayload),
    });
  } catch (e) {
    logEdgeError("gateway.fetch_failed", e, {
      invoice_id: invoice.id,
      order_id: orderId,
      is_production: MIDTRANS_IS_PRODUCTION,
    });
    return json({ error: "Payment gateway unreachable" }, 502);
  }

  const snapBody: {
    token?: string;
    redirect_url?: string;
    error_messages?: unknown;
  } = await snapRes.json().catch(() => ({} as Record<string, unknown>));

  if (!snapRes.ok) {
    logEdgeError(
      "gateway.non_ok_response",
      new Error(`Midtrans ${snapRes.status}`),
      {
        invoice_id: invoice.id,
        order_id: orderId,
        http_status: snapRes.status,
        error_messages: snapBody?.error_messages ?? null,
      },
    );
    return json({ error: "Payment gateway rejected the request" }, 502);
  }

  const snapToken = snapBody?.token;
  const redirectUrl = snapBody?.redirect_url;
  if (!snapToken || !redirectUrl) {
    logEdgeError(
      "gateway.missing_redirect_url",
      new Error("Snap response lacked token or redirect_url"),
      {
        invoice_id: invoice.id,
        order_id: orderId,
        has_token: !!snapToken,
        has_redirect: !!redirectUrl,
      },
    );
    return json({ error: "Payment gateway returned no redirect URL" }, 502);
  }

  log("snap.token_received", {
    invoice_id: invoice.id,
    order_id: orderId,
    has_token: !!snapToken,
    has_redirect_url: !!redirectUrl,
  });

  // ─── 11. Persist provider-neutral fields (status guard prevents overwrite) ──
  const { data: updated, error: updErr } = await supa
    .from("subscription_invoices")
    .update({
      payment_provider: "midtrans",
      payment_method: "midtrans_snap",
      provider_order_id: orderId,
      provider_payment_url: redirectUrl,
      provider_status: "pending",
      provider_payload: { create: snapBody },
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    // FAIL-CLOSED: The Snap order exists at Midtrans, but the DB has no record
    // linking it back to this invoice. Returning the redirect_url here would
    // let a user pay against an order the system cannot reconcile, so we
    // refuse and surface a generic error. Operator-only forensics are logged.
    logEdgeError(
      "db.persist_failed",
      updErr ?? new Error("Update returned no rows"),
      {
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
        order_id: orderId,
        had_db_error: !!updErr,
        updated: !!updated,
      },
    );
    return json({
      error:
        "Payment transaction created but could not be linked. Please contact admin.",
    }, 500);
  }

  log("db.invoice_updated", {
    invoice_id: invoice.id,
    order_id: orderId,
    tenant_id: invoice.tenant_id,
  });

  // ─── 12. Done ───────────────────────────────────────────────────────────────
  log("transaction.done", {
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    order_id: orderId,
    tenant_id: invoice.tenant_id,
    plan: invoice.plan,
    billing_months: invoice.billing_months,
    gross_amount: grossAmount,
    is_production: MIDTRANS_IS_PRODUCTION,
  });

  return json({
    reused: false,
    order_id: orderId,
    redirect_url: redirectUrl,
    snap_token: snapToken,
  });
});
