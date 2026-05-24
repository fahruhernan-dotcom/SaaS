// ─────────────────────────────────────────────────────────────────────────────
// Edge Function : midtrans-webhook
// Phase         : B5
// Purpose       : Receive Midtrans payment notifications, verify signature,
//                 and call confirm_invoice_and_update_plan() RPC to update
//                 invoice status and tenant plan.
//
// SECURITY
//   • JWT verification is DISABLED (verify_jwt = false in config.toml).
//     Midtrans does not send a Supabase user JWT.
//   • Authentication relies exclusively on Midtrans signature_key verification.
//   • Signature formula: SHA512(order_id + status_code + gross_amount + SERVER_KEY)
//   • signature_key is NEVER stored in DB or logged.
//   • Uses SUPABASE_SERVICE_ROLE_KEY to call the RPC — this key is never
//     returned to callers.
//
// IDEMPOTENCY
//   • Signature check happens before any DB write.
//   • RPC confirm_invoice_and_update_plan() checks invoice.status before writing:
//     if already 'paid' / 'expired' / 'cancelled', returns skipped=true.
//   • Repeated Midtrans retries are safe.
//
// RESPONSE CODES
//   • 200 — webhook received and processed (or safely skipped)
//   • 400 — invalid signature or malformed payload (do not retry)
//   • 405 — non-POST request
//   • 500 — server/DB error (Midtrans will retry)
//
// LOGGING
//   • Every significant branch emits a structured JSON log line.
//   • Logs are safe for the Supabase function log stream:
//     no JWT, no server keys, no raw Midtrans payloads, no user PII.
//   • Identifiers logged: order_id, invoice_id (UUID), transaction_status.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// Statuses that confirm a successful payment.
// "capture" is used for credit card; requires fraud_status = 'accept'.
const CONFIRMED_STATUSES = new Set(["settlement", "capture"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const log = (action: string, meta: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ fn: "midtrans-webhook", action, ...meta }));

const logError = (action: string, error: unknown, meta: Record<string, unknown> = {}) => {
  const safeError = error && typeof error === "object"
    ? {
      name: (error as { name?: unknown }).name,
      message: (error as { message?: unknown }).message,
      code: (error as { code?: unknown }).code,
    }
    : { message: String(error) };
  console.error(JSON.stringify({ fn: "midtrans-webhook", action, error: safeError, ...meta }));
};

async function sha512hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Parse Midtrans datetime strings ("2024-01-15 10:30:00") to ISO-8601.
// Midtrans uses WIB (UTC+7) for settlement_time / transaction_time.
// Returns null if the string is unparseable (caller should fall back to now()).
function midtransTimeToISO(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = new Date(raw.replace(" ", "T") + "+07:00");
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

serve(async (req) => {
  // ─── 0. Log every inbound request ──────────────────────────────────────────
  log("request.received", { method: req.method });

  if (req.method !== "POST") {
    logError(
      "request.method_not_allowed",
      new Error(`Expected POST, got ${req.method}`),
      { method: req.method },
    );
    return json({ error: "Method not allowed" }, 405);
  }

  // ─── 1. Read environment variables ─────────────────────────────────────────
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError("env.missing_supabase", new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"), {
      has_url: !!SUPABASE_URL,
      has_service_role: !!SUPABASE_SERVICE_ROLE_KEY,
    });
    return json({ error: "Server configuration error" }, 500);
  }
  if (!MIDTRANS_SERVER_KEY) {
    logError("env.missing_midtrans_key", new Error("MIDTRANS_SERVER_KEY not set"), {});
    return json({ error: "Server configuration error" }, 500);
  }

  // ─── 2. Parse request body ──────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (parseErr) {
    logError("payload.parse_error", parseErr, {
      content_type: req.headers.get("content-type") ?? "unknown",
    });
    return json({ error: "Invalid JSON body" }, 400);
  }

  // ─── 3. Extract and type-guard required fields ──────────────────────────────
  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : null;
  const statusCode = typeof body.status_code === "string" ? body.status_code.trim() : null;
  const grossAmount = typeof body.gross_amount === "string" ? body.gross_amount.trim() : null;
  const signatureKey = typeof body.signature_key === "string" ? body.signature_key.trim() : null;
  const transactionStatus = typeof body.transaction_status === "string"
    ? body.transaction_status.trim()
    : null;
  const transactionId = typeof body.transaction_id === "string" ? body.transaction_id.trim() : "";
  const fraudStatus = typeof body.fraud_status === "string" ? body.fraud_status.trim() : "";
  const paymentType = typeof body.payment_type === "string" ? body.payment_type.trim() : "";
  const settlementTime = typeof body.settlement_time === "string" ? body.settlement_time : null;
  const transactionTime = typeof body.transaction_time === "string" ? body.transaction_time : null;

  log("payload.extracted", {
    order_id: orderId,
    transaction_status: transactionStatus,
    status_code: statusCode,
    payment_type: paymentType,
    has_fraud_status: !!fraudStatus,
    has_settlement_time: !!settlementTime,
    has_transaction_time: !!transactionTime,
    has_signature_key: !!signatureKey,
    has_gross_amount: !!grossAmount,
  });

  if (!orderId || !statusCode || !grossAmount || !signatureKey || !transactionStatus) {
    logError("payload.missing_fields", new Error("One or more required fields are absent or wrong type"), {
      has_order_id: !!orderId,
      has_status_code: !!statusCode,
      has_gross_amount: !!grossAmount,
      has_signature_key: !!signatureKey,
      has_transaction_status: !!transactionStatus,
    });
    return json({ error: "Missing required fields" }, 400);
  }

  // ─── 4. Verify Midtrans signature ───────────────────────────────────────────
  // Formula: SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
  const expectedSig = await sha512hex(
    `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`,
  );

  if (signatureKey !== expectedSig) {
    logError("signature.invalid", new Error("Signature mismatch — possible spoofed notification"), {
      order_id: orderId,
      transaction_status: transactionStatus,
      status_code: statusCode,
    });
    return json({ error: "Invalid signature" }, 400);
  }

  log("signature.verified", {
    order_id: orderId,
    transaction_status: transactionStatus,
    status_code: statusCode,
  });

  // ─── 5. Build safe payload (strip signature_key before storing) ─────────────
  const { signature_key: _stripped, ...safePayload } = body;

  // ─── 6. Determine if payment is confirmed ──────────────────────────────────
  const isConfirmed = CONFIRMED_STATUSES.has(transactionStatus) &&
    (transactionStatus !== "capture" || fraudStatus === "accept");

  log("payment.status_determined", {
    order_id: orderId,
    transaction_status: transactionStatus,
    fraud_status: fraudStatus || null,
    is_confirmed: isConfirmed,
    payment_type: paymentType || null,
  });

  // ─── 7. Resolve paid_at timestamp ──────────────────────────────────────────
  // Use settlement_time for confirmed payments, fall back to transaction_time,
  // then to now(). Log a warning if datetime strings are unparseable.
  let paidAt: string;
  if (isConfirmed) {
    const rawTime = settlementTime ?? transactionTime;
    const parsed = midtransTimeToISO(rawTime);
    if (!parsed) {
      logError(
        "timestamp.parse_failed",
        new Error("Could not parse settlement_time or transaction_time — falling back to now()"),
        {
          order_id: orderId,
          settlement_time: settlementTime,
          transaction_time: transactionTime,
        },
      );
      paidAt = new Date().toISOString();
    } else {
      paidAt = parsed;
    }
  } else {
    paidAt = new Date().toISOString();
  }

  // ─── 8. Call RPC ────────────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  log("rpc.calling", {
    order_id: orderId,
    transaction_status: transactionStatus,
    is_confirmed: isConfirmed,
    paid_at: isConfirmed ? paidAt : null,
  });

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "confirm_invoice_and_update_plan",
    {
      p_provider_order_id: orderId,
      p_transaction_id: transactionId,
      p_transaction_status: transactionStatus,
      p_fraud_status: fraudStatus,
      p_gross_amount_str: grossAmount,
      p_paid_at: paidAt,
      p_provider_payload: safePayload,
      p_signature_verified: true,
    },
  );

  // ─── 9. Handle Supabase transport/network error ─────────────────────────────
  if (rpcError) {
    logError("rpc.transport_error", rpcError, {
      order_id: orderId,
      transaction_status: transactionStatus,
      rpc_code: (rpcError as { code?: unknown }).code ?? null,
    });
    return json({ error: "Database error" }, 500);
  }

  // ─── 10. Handle RPC-level errors (success: false in returned JSONB) ─────────
  const result = rpcResult as Record<string, unknown>;

  if (result?.success === false) {
    const rpcErr = result?.error as string ?? "unknown_rpc_error";
    logError("rpc.logic_error", new Error(`RPC returned success=false: ${rpcErr}`), {
      order_id: orderId,
      transaction_status: transactionStatus,
      rpc_error: rpcErr,
      invoice_id: result?.invoice_id ?? null,
      tenant_id: result?.tenant_id ?? null,
    });
    // Return 200 so Midtrans does not retry — these are data-level errors
    // (invoice_not_found, amount_mismatch, etc.) that won't self-resolve on retry.
    return json({ received: true, result });
  }

  // ─── 11. Log outcome ────────────────────────────────────────────────────────
  if (result?.skipped === true) {
    log("rpc.skipped_already_processed", {
      order_id: orderId,
      transaction_status: transactionStatus,
      invoice_id: result?.invoice_id ?? null,
      current_status: result?.current_status ?? null,
      received_status: result?.received_status ?? null,
    });
  } else if (result?.payment_confirmed === true) {
    log("rpc.plan_activated", {
      order_id: orderId,
      invoice_id: result?.invoice_id ?? null,
      invoice_number: result?.invoice_number ?? null,
      tenant_id: result?.tenant_id ?? null,
      plan: result?.plan ?? null,
      billing_months: result?.billing_months ?? null,
      plan_expires_at: result?.plan_expires_at ?? null,
    });
  } else {
    log("rpc.non_payment_status", {
      order_id: orderId,
      transaction_status: transactionStatus,
      invoice_id: result?.invoice_id ?? null,
      invoice_status: result?.invoice_status ?? null,
      payment_confirmed: false,
    });
  }

  log("webhook.done", {
    order_id: orderId,
    transaction_status: transactionStatus,
    is_confirmed: isConfirmed,
    skipped: result?.skipped ?? false,
    payment_confirmed: result?.payment_confirmed ?? false,
  });

  return json({ received: true, result });
});
