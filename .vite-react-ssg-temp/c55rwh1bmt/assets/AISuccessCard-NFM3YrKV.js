import React__default, { useState, useRef, useEffect, useCallback } from "react";
import { s as supabase, as as getEffectivePlan, u as useAuth } from "../main.mjs";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { A as AI_PLAN_CONFIG } from "./planGating-BwKbTRBv.js";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { AlertCircle, Pencil, Search, Wallet, TrendingUp, ShoppingCart, Shield, Package, Activity, Truck, AlertTriangle, Loader2, Check, Lock, MessageCircle, X, Plus, Undo2 } from "lucide-react";
import { format } from "date-fns";
function buildContextSnapshot(snapshot, userMessage = "") {
  const { farms = [], rpas = [], customers = [], suppliers = [], products = [] } = snapshot;
  const msgLower = userMessage.toLowerCase();
  const counts = [
    farms.length ? `${farms.length} farm` : "",
    rpas.length ? `${rpas.length} RPA` : "",
    customers.length ? `${customers.length} cust` : "",
    suppliers.length ? `${suppliers.length} supp` : "",
    products.length ? `${products.length} produk` : ""
  ].filter(Boolean).join(", ");
  const tier1 = counts ? `[${counts}]` : "[belum ada entitas]";
  const compactList = (arr, label, limit = Infinity) => {
    if (!arr.length) return "";
    const items = limit < Infinity ? arr.slice(0, limit) : arr;
    const suffix = limit < Infinity && arr.length > limit ? ` ...(+${arr.length - limit})` : "";
    return `${label}: ${items.map((i) => `${i.name}(id:${i.id})`).join(", ")}${suffix}`;
  };
  const buildTier2 = (limit = Infinity) => [
    compactList(farms, "Farms", limit),
    compactList(rpas, "RPAs", limit),
    compactList(customers, "Customers", limit),
    compactList(suppliers, "Suppliers", limit),
    compactList(products, "Produk", limit)
  ].filter(Boolean).join("\n");
  const allEntities = [
    ...farms.map((i) => ({ ...i, _type: "Farm" })),
    ...rpas.map((i) => ({ ...i, _type: "RPA" })),
    ...customers.map((i) => ({ ...i, _type: "Customer" })),
    ...suppliers.map((i) => ({ ...i, _type: "Supplier" })),
    ...products.map((i) => ({ ...i, _type: "Produk" }))
  ];
  const tier3 = allEntities.filter((i) => i.name && msgLower.includes(i.name.toLowerCase())).map((i) => {
    const extra = i.sell_price ? `, harga:${i.sell_price}` : "";
    return `[Detail] ${i._type} "${i.name}" → id:${i.id}${extra}`;
  }).join("\n");
  let tier2 = buildTier2();
  let result = [tier1, tier2, tier3].filter(Boolean).join("\n");
  if (result.length > 6e3) {
    console.warn("[aiPrompt] buildContextSnapshot: snapshot melebihi 6000 char, Tier 2 dipangkas ke 10 item.");
    tier2 = buildTier2(10);
    result = [tier1, tier2, tier3].filter(Boolean).join("\n");
  }
  return result;
}
function buildSystemPrompt(ctx) {
  const {
    userType,
    businessName,
    userName,
    contextPage = "",
    snapshot = {},
    today,
    vertical = "generic",
    userMessage = ""
  } = ctx;
  const todayStr = today ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const roleSection = {
    broker: buildBrokerSection(),
    peternak: buildPeternakSection(),
    rpa: buildRPASection()
  }[userType] ?? "";
  let verticalSection = "";
  if (vertical === "sapi_penggemukan") {
    verticalSection = `
KONTEKS VERTICAL: Sapi Penggemukan
Pada CATAT_HARIAN, prioritaskan field: avg_weight_kg (bobot rata-rata sapi per ekor, kg)
dan dead_count (deplesi/kematian). Jika user menyebut bobot total tanpa rata-rata,
hitung avg_weight_kg = bobot_total / populasi_aktif. Tidak ada field reproduksi.`;
  } else if (vertical === "domba_penggemukan") {
    verticalSection = `
KONTEKS VERTICAL: Domba Penggemukan
Pada CATAT_HARIAN, prioritaskan field: avg_weight_kg (bobot rata-rata domba per ekor, kg)
dan dead_count (deplesi/kematian). Jika user menyebut bobot total tanpa rata-rata,
hitung avg_weight_kg = bobot_total / populasi_aktif. Tidak ada field reproduksi.`;
  } else {
    if (vertical !== "generic") {
      console.warn("[aiPrompt] vertical not in pilot: " + vertical);
    }
  }
  const contextData = buildContextSnapshot(snapshot, userMessage);
  return `
Kamu adalah asisten pencatatan TernakOS untuk ${userName} (${businessName}, role: ${userType}).
Hari ini: ${todayStr}. Halaman: ${contextPage || "dashboard"}.

TUGASMU: Ekstrak data dari pesan dan kembalikan JSON terstruktur.
Pengguna bicara bahasa Indonesia sehari-hari, tidak formal, sering singkat.
Cerdas mengisi yang bisa diinfer. Tanya jika ada data kritis yang ambigu.
Jika satu pesan mengandung lebih dari 1 transaksi, ekstrak SEMUA sebagai array intents[].
${verticalSection}
${roleSection}

DATA ENTITAS (gunakan untuk resolve nama ke ID):
${contextData || "(belum ada data entitas)"}

ATURAN TANGGAL:
- "tadi/barusan/mau" → ${todayStr}
- "kemarin/wingi" → ${offsetDate(todayStr, -1)}
- "2 hari lalu" → ${offsetDate(todayStr, -2)}
- "besok/sesuk" → ${offsetDate(todayStr, 1)}
- Tidak disebutkan → ${todayStr}

ATURAN ANGKA: "28rb"→28000, "1,5jt"→1500000, "1ton"→1000kg, "½kw"→50kg.

ATURAN KOREKSI: Jika intent KOREKSI dan target_id null,
set confidence: 0.4 dan clarification: [pertanyaan spesifik + maks 3 pilihan].

FORMAT OUTPUT — kembalikan HANYA JSON ini:
{"intents":[{"id":"1","intent":"<INTENT>","data":{...},"dependency":null,"confidence":0.95,"clarification":null}],"display_summary":"<balasan natural 1-2 kalimat, TANPA markdown>"}

CONFIDENCE: 0.9-1.0=lengkap, 0.7-0.89=ada inferensi, <0.7=wajib isi clarification.
TANYA_DATA: jika user bertanya (bukan mencatat), data={"query":"...","answer":"..."}.
TIDAK_DIKENALI: jika pesan tidak relevan sama sekali.
GAYA: DILARANG markdown bold/bullet di display_summary.
`.trim();
}
function buildBrokerSection() {
  return `
ROLE: BROKER AYAM — mencatat transaksi jual beli ayam hidup.

FORMAT HARGA KHUSUS BROKER:
- "20.00"/"23.00" dalam konteks harga → ×1.000 (20.00 = Rp 20.000). Harga ayam min Rp 10.000/kg.
- "20,5" → Rp 20.500. Angka 10–50 setelah kata "harga" → ribuan.
- "4t"→4000kg, "½kw"→50kg, "2,5kw"→250kg.

ATURAN PENGIRIMAN:
- Waktu muat & berangkat pakai format HH:MM (misal "14:30"), BUKAN datetime penuh.
- "Berangkat jam X" → departure_time=X, load_time=X minus 1 jam (atau sama jika tidak ada info muat).
- JANGAN taruh waktu di field notes.

DEPENDENCY: CATAT_PENGIRIMAN bergantung pada CATAT_PEMBELIAN/PENJUALAN (set dependency=id parent).


INTENT YANG DIKENALI:

1. CATAT_PEMBELIAN — user membeli ayam dari peternak/supplier
   PENTING: Di bisnis broker, Total Berat (kg) jauh LEBIH PENTING daripada jumlah ekor.
   DILARANG KERAS meminta klarifikasi soal "qty_ekor" jika "total_weight_kg" sudah diketahui.
   Jika "qty_ekor" tidak disebutkan, estimasi dari total_weight_kg / avg_weight_kg.
   Trigger: "beli", "ambil dari", "serap dari", "stok dari"
   Field data:
   {
     "supplier_name": "<nama kandang/supplier>",
     "supplier_id": "<uuid atau null>",
     "qty_ekor": <integer atau null>,
     "avg_weight_kg": <number, bobot rata-rata per ekor, default 1.85>,
     "total_weight_kg": <number atau null>,
     "price_per_kg": <integer, harga per kg>,
     "purchase_date": "<YYYY-MM-DD>",
     "notes": "<catatan tambahan atau null>"
   }

2. CATAT_PENJUALAN — user menjual ayam ke RPA/pembeli
   PENTING: Berat (kg) adalah prioritas. Jangan tanya ekor jika berat ada.
   Trigger: "jual", "kirim ke", "setor ke", "pasok ke"
   Field data:
   {
     "rpa_name": "<nama RPA/pembeli>",
     "rpa_id": "<uuid atau null>",
     "qty_ekor": <integer atau null>,
     "avg_weight_kg": <number, default 2.0>,
     "total_weight_kg": <number atau null>,
     "price_per_kg": <integer>,
     "payment_status": "<'lunas'|'belum_lunas'|'sebagian'>",
     "paid_amount": <integer, nominal yang dibayar/DP jika sebagian>,
     "due_date": "<YYYY-MM-DD, wajib jika payment_status != lunas>",
     "sale_date": "<YYYY-MM-DD>",
     "notes": "<atau null>"
   }

3. CATAT_BAYAR — mencatat pembayaran dari customer
   Trigger: "bayar", "transfer", "lunas", "cicil", "DP"
   Field data:
   {
     "payer_name": "<nama yang bayar>",
     "amount": <integer, nominal rupiah>,
     "payment_method": "<transfer|tunai|null>",
     "payment_date": "<YYYY-MM-DD>",
     "notes": "<nomor rekening / keterangan atau null>"
   }

4. CATAT_PENGIRIMAN — mencatat info pengiriman/armada
   Trigger: "kirim", "berangkat", "muat", "sopir", "truk", "armada"
   Field data:
   {
     "vehicle_plate": "<plat kendaraan atau null>",
     "vehicle_id": "<uuid atau null>",
     "driver_name": "<nama sopir atau null>",
     "driver_id": "<uuid atau null>",
     "load_time": "<HH:MM jam muat atau null>",
     "departure_time": "<HH:MM jam berangkat atau null>",
     "initial_weight_kg": <number, berat awal muatan atau null>,
     "delivery_cost": <integer, biaya pengiriman total atau 0>,
     "notes": "<rute, catatan atau null>"
   }

5. TANYA_DATA — pertanyaan tentang bisnis
   Contoh: "margin bulan ini berapa?", "siapa yang belum bayar?",
           "total pembelian minggu ini?", "pengiriman yang belum sampai ada berapa?"

6. KOREKSI — user mengoreksi data yang baru saja dikirim
   Trigger: "eh salah", "bukan", "koreksi", "maksudnya", "ralat",
            "harusnya", "maaf salah", "yang tadi salah"
   Field data:
   {
     "field_to_fix": "<nama field yang dikoreksi, e.g. 'price_per_kg'>",
     "old_value": "<nilai lama jika disebutkan, atau null>",
     "new_value": "<nilai baru yang benar>",
     "notes": "<konteks koreksi atau null>"
   }
   Contoh input: "eh salah tadi, harganya 29.500 bukan 29.000"
`;
}
function buildPeternakSection() {
  return `
ROLE: PETERNAK
Kamu membantu mencatat data harian kandang, pakan, panen, dan pengeluaran siklus.

INTENT YANG DIKENALI:

1. CATAT_HARIAN — catatan harian kandang (mati, sakit, bobot)
   Trigger: "mati", "deplesi", "afkir", "timbang", "bobot rata"
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "record_date": "<YYYY-MM-DD>",
     "dead_count": <integer atau 0>,
     "culled_count": <integer atau 0>,
     "avg_weight_kg": <number atau null>,
     "notes": "<atau null>"
   }
   Contoh input: "hari ini mati 12 ekor di kandang A"
   Contoh input: "timbang kandang B bobot rata 1.8 kg"

2. CATAT_PAKAN — catat pemakaian atau pembelian pakan
   Trigger: "pakan", "voer", "konsentrat", "beli pakan", "pakai pakan"
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "feed_type": "<jenis pakan, e.g. 'BR1', 'konsentrat', atau string bebas>",
     "qty_kg": <number>,
     "price_per_kg": <integer atau null>,
     "record_date": "<YYYY-MM-DD>",
     "action": "<'beli'|'pakai'>",
     "notes": "<atau null>"
   }
   Contoh input: "beli pakan BR1 500kg harga 4ribu per kg"
   Contoh input: "kandang C pakai pakan 120kg hari ini"

3. CATAT_PANEN — catat hasil panen
   Trigger: "panen", "jual ayam", "panen habis", "close siklus"
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "harvest_date": "<YYYY-MM-DD>",
     "qty_ekor": <integer>,
     "total_weight_kg": <number>,
     "price_per_kg": <integer atau null>,
     "buyer_name": "<nama pembeli atau null>",
     "notes": "<atau null>"
   }
   Contoh input: "panen kandang A 4200 ekor total 8900 kg harga 31rb"

4. CATAT_PENGELUARAN — catat pengeluaran siklus
   Trigger: "beli", "bayar", "keluar uang", "biaya", "ongkos"
   (Gunakan ini jika bukan pakan — untuk DOC, obat, vaksin, listrik, tenaga kerja, dll)
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "expense_date": "<YYYY-MM-DD>",
     "category": "<'doc'|'obat'|'vaksin'|'listrik'|'tenaga_kerja'|'lainnya'>",
     "amount": <integer, rupiah>,
     "description": "<keterangan singkat>",
     "notes": "<atau null>"
   }
   Contoh input: "beli vaksin ND 150 ribu buat kandang B"

5. TANYA_DATA — pertanyaan tentang data siklus
   Contoh: "FCR siklus ini berapa?", "populasi sekarang?", "sudah berapa hari siklus kandang A?"

6. KOREKSI — user mengoreksi data yang baru saja dikirim
   Trigger: "eh salah", "bukan", "koreksi", "maksudnya", "ralat",
            "harusnya", "maaf salah", "yang tadi salah"
   Field data:
   {
     "field_to_fix": "<nama field yang dikoreksi, e.g. 'price_per_kg'>",
     "old_value": "<nilai lama jika disebutkan, atau null>",
     "new_value": "<nilai baru yang benar>",
     "notes": "<konteks koreksi atau null>"
   }
   Contoh input: "ralat tanggalnya, harusnya kemarin bukan hari ini"
`;
}
function buildRPASection() {
  return `
ROLE: RUMAH POTONG AYAM (RPA)
Kamu membantu mencatat order pembelian ayam, invoice ke customer, dan produk.

INTENT YANG DIKENALI:

1. BUAT_INVOICE — buat invoice penjualan ke customer
   Trigger: "invoice", "nota", "tagih", "jual ke", "catat penjualan"
   Field data:
   {
     "customer_name": "<nama customer>",
     "customer_id": "<uuid atau null>",
     "invoice_date": "<YYYY-MM-DD>",
     "items": [
       {
         "product_name": "<nama produk>",
         "product_id": "<uuid atau null>",
         "qty": <number>,
         "unit": "<'kg'|'ekor'|'pack'>",
         "price_per_unit": <integer>
       }
     ],
     "notes": "<atau null>"
   }
   Contoh input: "invoice Pak Budi 30 ekor WB harga 38rb sama ceker 5kg 15rb"

2. CATAT_ORDER — order beli ayam hidup dari broker
   Trigger: "order", "pesan", "minta", "butuh ayam"
   Field data:
   {
     "broker_name": "<nama broker>",
     "broker_id": "<uuid atau null>",
     "qty_ekor": <integer>,
     "target_weight_kg": <number atau null>,
     "price_per_kg": <integer atau null>,
     "order_date": "<YYYY-MM-DD>",
     "needed_date": "<YYYY-MM-DD atau null>",
     "notes": "<atau null>"
   }
   Contoh input: "order 500 ekor dari Broker Maju, butuhnya besok"

3. TAMBAH_PRODUK — daftarkan produk baru
   Trigger: "produk baru", "tambah produk", "daftar produk"
   Field data:
   {
     "name": "<nama produk>",
     "unit": "<'kg'|'ekor'|'pack'>",
     "sell_price": <integer>,
     "notes": "<atau null>"
   }
   Contoh input: "tambah produk WB 1kg harga jual 35ribu"

4. TANYA_DATA — pertanyaan tentang data RPA
   Contoh: "siapa customer terbanyak bulan ini?", "order yang belum datang?",
           "stok produk WB masih berapa?"

5. KOREKSI — user mengoreksi data yang baru saja dikirim
   Trigger: "eh salah", "bukan", "koreksi", "maksudnya", "ralat",
            "harusnya", "maaf salah", "yang tadi salah"
   Field data:
   {
     "field_to_fix": "<nama field yang dikoreksi, e.g. 'sell_price'>",
     "old_value": "<nilai lama jika disebutkan, atau null>",
     "new_value": "<nilai baru yang benar>",
     "notes": "<konteks koreksi atau null>"
   }
   Contoh input: "koreksi harga WB tadi, harusnya 36rb bukan 35rb"
`;
}
function offsetDate(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function validateBusinessRules(entry, allEntries = [], contextSnapshot = {}) {
  const { intent, extracted_data: data, dependency_id, _ai_id } = entry;
  const errors = [];
  const warnings = [];
  if (!intent) {
    errors.push("Intent tidak terdeteksi");
    return { valid: false, errors, warnings };
  }
  if (!data || typeof data !== "object") {
    errors.push("Data ekstraksi kosong");
    return { valid: false, errors, warnings };
  }
  const parent = allEntries.find(
    (e) => dependency_id && e.id === dependency_id || data._dependency_ai_id && (e._ai_id === data._dependency_ai_id || e.id === data._dependency_ai_id)
  );
  const parentData = parent == null ? void 0 : parent.extracted_data;
  const validator = VALIDATORS[intent];
  if (validator) {
    validator(data, errors, warnings, parentData, contextSnapshot);
  }
  validateCommonRules(data, errors, warnings);
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
function validateCommonRules(data, errors, warnings) {
  const dateFields = [
    "purchase_date",
    "sale_date",
    "payment_date",
    "record_date",
    "harvest_date",
    "expense_date",
    "invoice_date",
    "order_date",
    "due_date"
  ];
  for (const field of dateFields) {
    if (data[field]) {
      const d = new Date(data[field]);
      if (isNaN(d.getTime())) {
        errors.push(`Tanggal "${field}" tidak valid`);
        continue;
      }
      const now = /* @__PURE__ */ new Date();
      const diffDays = (now - d) / (1e3 * 60 * 60 * 24);
      if (diffDays > 30) {
        warnings.push(`Tanggal "${field}" lebih dari 30 hari lalu — yakin?`);
      }
      if (diffDays < -7) {
        warnings.push(`Tanggal "${field}" lebih dari 7 hari ke depan — yakin?`);
      }
    }
  }
}
const VALIDATORS = {
  CATAT_PEMBELIAN: (data, errors, warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) {
      if (data.total_weight_kg > 0) {
        warnings.push("Jumlah ekor kosong, akan diestimasi otomatis dari berat.");
      } else {
        errors.push("Jumlah ekor atau total berat harus diisi");
      }
    }
    if (data.qty_ekor > 5e4) warnings.push("Jumlah ekor sangat besar (>50.000) — yakin?");
    if (!data.price_per_kg || data.price_per_kg <= 0) errors.push("Harga per kg harus > 0");
    if (data.price_per_kg < 5e3) errors.push("Harga per kg terlalu rendah (< Rp 5.000)");
    if (data.price_per_kg > 1e5) warnings.push("Harga per kg sangat mahal (> Rp 100.000) — yakin?");
    if (!data.purchase_date) warnings.push("Tanggal beli tidak diisi, akan default ke hari ini");
    if (data.transport_cost > 5e6) warnings.push("Ongkos angkut mencurigakan (> 5 jt) — yakin?");
  },
  CATAT_PENJUALAN: (data, errors, warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) {
      if (data.weight_kg > 0) {
        warnings.push("Jumlah ekor kosong, akan diestimasi otomatis dari berat.");
      } else {
        errors.push("Jumlah ekor atau total berat harus diisi");
      }
    }
    if (data.qty_ekor > 5e4) warnings.push("Jumlah ekor sangat besar (>50.000) — yakin?");
    if (!data.price_per_kg || data.price_per_kg <= 0) errors.push("Harga per kg harus > 0");
    if (data.price_per_kg < 5e3) errors.push("Harga per kg terlalu rendah (< Rp 5.000)");
    if (data.price_per_kg > 1e5) warnings.push("Harga per kg sangat mahal (> Rp 100.000) — yakin?");
    if (!data.sale_date) warnings.push("Tanggal jual tidak diisi, akan default ke hari ini");
    if (data.payment_status === "sebagian" && (!data.paid_amount || data.paid_amount <= 0)) {
      errors.push('Status bayar "Sebagian" wajib mencantumkan nominal yang sudah dibayar');
    }
    if (data.payment_status !== "lunas" && !data.due_date) {
      warnings.push("Pilih tanggal jatuh tempo untuk transaksi hutang/piutang");
    }
  },
  CATAT_BAYAR: (data, errors, warnings, parentData, snapshot) => {
    if (!data.amount || data.amount <= 0) errors.push("Nominal pembayaran harus diisi (> 0)");
    if (data.amount < 1e4) warnings.push("Nominal sangat kecil (< Rp 10.000). Yakin?");
    if (data.amount > 5e9) errors.push("Nominal terlalu besar (> 5 miliar)");
    if (!data.payer_name && !data.payer_id) warnings.push("Nama pembayar belum diisi");
    if (!data.payment_method) warnings.push("Metode bayar belum dipilih (Default: Transfer)");
    const parent = parentData || (snapshot == null ? void 0 : snapshot.parentContext);
    const accumulated = (snapshot == null ? void 0 : snapshot.accumulatedTotal) || 0;
    if (parent) {
      const parentTotal = Number(parent.total_revenue || parent.qty_ekor * parent.price_per_kg || parent.amount || 0);
      const currentTotal = accumulated + Number(data.amount || 0);
      if (parentTotal > 0 && currentTotal > parentTotal * 1.01) {
        errors.push(`Total bayar (Rp ${currentTotal.toLocaleString()}) melebihi total tagihan (Rp ${parentTotal.toLocaleString()})!`);
      } else if (parentTotal > 0 && currentTotal > parentTotal) {
        warnings.push(`Total bayar sedikit melebihi tagihan. Pastikan angka sudah benar.`);
      }
    }
  },
  CATAT_PENGIRIMAN: (data, errors, warnings, parentData, snapshot) => {
    if (data.initial_weight_kg && data.initial_weight_kg <= 0) errors.push("Berat awal harus > 0");
    if (data.arrived_weight_kg && data.initial_weight_kg) {
      if (data.arrived_weight_kg > data.initial_weight_kg) {
        warnings.push("Berat tiba > berat awal — susut negatif?");
      }
      const shrinkPct = (data.initial_weight_kg - data.arrived_weight_kg) / data.initial_weight_kg * 100;
      if (shrinkPct > 10) warnings.push(`Susut ${shrinkPct.toFixed(1)}% — cukup tinggi`);
    }
    if (data.load_time && data.departure_time) {
      if (data.departure_time < data.load_time) {
        errors.push("Jam berangkat tidak boleh sebelum jam muat");
      }
    }
    const parent = parentData || (snapshot == null ? void 0 : snapshot.parentContext);
    const accumulated = (snapshot == null ? void 0 : snapshot.accumulatedTotal) || 0;
    if (parent) {
      const parentQty = parent.quantity || parent.qty_ekor || 0;
      const currentQty = accumulated + (data.qty_ekor || 0);
      if (parentQty > 0 && currentQty > parentQty) {
        errors.push(`Total kirim (${currentQty} ekor) melebihi jumlah beli/jual (${parentQty} ekor)!`);
      }
    }
  },
  CATAT_HARIAN: (data, errors, warnings) => {
    if (data.dead_count !== void 0 && data.dead_count < 0) errors.push("Jumlah mati tidak boleh negatif");
    if (data.culled_count !== void 0 && data.culled_count < 0) errors.push("Jumlah afkir tidak boleh negatif");
    if (data.dead_count > 500) warnings.push("Deplesi >500 ekor dalam sehari — yakin?");
    if (data.avg_weight_kg && (data.avg_weight_kg < 0.1 || data.avg_weight_kg > 10)) {
      warnings.push("Bobot rata-rata di luar range normal (0.1-10 kg)");
    }
  },
  CATAT_PAKAN: (data, errors, warnings) => {
    if (!data.qty_kg || data.qty_kg <= 0) errors.push("Jumlah pakan harus > 0");
    if (data.qty_kg > 5e4) warnings.push("Jumlah pakan >50 ton — yakin?");
    if (data.price_per_kg && data.price_per_kg < 1e3) warnings.push("Harga pakan < Rp 1.000/kg — yakin?");
  },
  CATAT_PANEN: (data, errors, warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) errors.push("Jumlah ekor panen harus > 0");
    if (!data.total_weight_kg || data.total_weight_kg <= 0) errors.push("Total berat panen harus > 0");
    if (data.qty_ekor && data.total_weight_kg) {
      const avgWeight = data.total_weight_kg / data.qty_ekor;
      if (avgWeight < 0.5 || avgWeight > 5) {
        warnings.push(`Bobot rata-rata ${avgWeight.toFixed(2)} kg/ekor — di luar range normal`);
      }
    }
  },
  CATAT_PENGELUARAN: (data, errors, warnings) => {
    if (!data.amount || data.amount <= 0) errors.push("Nominal pengeluaran harus > 0");
    if (data.amount > 1e9) warnings.push("Nominal >1 miliar — yakin ini benar?");
  },
  BUAT_INVOICE: (data, errors, _warnings) => {
    if (!data.customer_name && !data.customer_id) errors.push("Customer belum ditentukan");
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push("Invoice harus punya minimal 1 item");
    } else {
      data.items.forEach((item, i) => {
        if (!item.qty || item.qty <= 0) errors.push(`Item ${i + 1}: qty harus > 0`);
        if (!item.price_per_unit || item.price_per_unit <= 0) errors.push(`Item ${i + 1}: harga harus > 0`);
      });
    }
  },
  CATAT_ORDER: (data, errors, _warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) errors.push("Jumlah order harus > 0");
  },
  TAMBAH_PRODUK: (data, errors, _warnings) => {
    if (!data.name) errors.push("Nama produk wajib diisi");
    if (!data.sell_price || data.sell_price <= 0) errors.push("Harga jual harus > 0");
  }
};
const useBusinessSnapshot = () => {
  const getAccumulatedTotal = async (parentId, type) => {
    if (!parentId) return 0;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentId);
    let productionTotal = 0;
    let stagedTotal = 0;
    if (type === "DELIVERY") {
      if (isUUID) {
        const { data: prodData } = await supabase.from("deliveries").select("initial_count").eq("sale_id", parentId).eq("is_deleted", false);
        productionTotal = (prodData == null ? void 0 : prodData.reduce((acc, curr) => acc + (curr.initial_count || 0), 0)) || 0;
      }
      const { data: stagedData } = await supabase.from("ai_staged_transactions").select("payload").eq("intent", "CATAT_PENGIRIMAN").eq("status", "staged");
      stagedTotal = (stagedData == null ? void 0 : stagedData.reduce((acc, curr) => {
        var _a, _b, _c;
        if (((_a = curr.payload) == null ? void 0 : _a.sale_id) === parentId) {
          return acc + (((_b = curr.payload) == null ? void 0 : _b.initial_count) || ((_c = curr.payload) == null ? void 0 : _c.qty_ekor) || 0);
        }
        return acc;
      }, 0)) || 0;
    }
    if (type === "PAYMENT") {
      if (isUUID) {
        const { data: prodData } = await supabase.from("payments").select("amount").eq("sale_id", parentId);
        productionTotal = (prodData == null ? void 0 : prodData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)) || 0;
      }
      if (isUUID) {
        const { data: stagedData } = await supabase.from("ai_staged_transactions").select("payload").eq("intent", "CATAT_BAYAR").eq("status", "staged");
        stagedTotal = (stagedData == null ? void 0 : stagedData.reduce((acc, curr) => {
          var _a, _b;
          if (((_a = curr.payload) == null ? void 0 : _a.sale_id) === parentId) {
            return acc + Number(((_b = curr.payload) == null ? void 0 : _b.amount) || 0);
          }
          return acc;
        }, 0)) || 0;
      }
    }
    return productionTotal + stagedTotal;
  };
  const getParentContext = async (parentId, intent) => {
    if (!parentId) return null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentId);
    if (!isUUID) return null;
    if (intent === "CATAT_PENGIRIMAN" || intent === "CATAT_BAYAR") {
      const { data } = await supabase.from("sales").select("*").eq("id", parentId).single();
      return data;
    }
    return null;
  };
  return { getAccumulatedTotal, getParentContext };
};
function useAIQuota(tenant) {
  const plan = getEffectivePlan(tenant);
  const planConfig = AI_PLAN_CONFIG[plan] || AI_PLAN_CONFIG.starter;
  const limit = planConfig.chat_sessions_per_month;
  const now = /* @__PURE__ */ new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: used = 0, isLoading } = useQuery({
    queryKey: ["ai-quota", tenant == null ? void 0 : tenant.id, now.getFullYear(), now.getMonth()],
    queryFn: async () => {
      const { count, error } = await supabase.from("ai_conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("created_at", firstOfMonth);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!(tenant == null ? void 0 : tenant.id) && limit !== Infinity,
    staleTime: 6e4
  });
  const canUseFeature = (featureName) => {
    var _a;
    return ((_a = planConfig.features) == null ? void 0 : _a[featureName]) === true;
  };
  if (limit === Infinity) {
    return {
      plan,
      limit,
      used: 0,
      remaining: Infinity,
      quotaStatus: "ok",
      canUseFeature,
      isLoading: false
    };
  }
  const remaining = Math.max(0, limit - used);
  let quotaStatus = "ok";
  if (used >= limit) quotaStatus = "exceeded";
  else if (used >= limit * 0.8) quotaStatus = "warning";
  return {
    plan,
    limit,
    used,
    remaining,
    quotaStatus,
    canUseFeature,
    isLoading
  };
}
const AGENT_STATE = {
  IDLE: "IDLE",
  PRE_CHECKING: "PRE_CHECKING",
  THINKING: "THINKING",
  AWAITING_CONFIRMATION: "AWAITING_CONFIRMATION",
  AWAITING_CLARIFICATION: "AWAITING_CLARIFICATION",
  ERROR: "ERROR"
};
const intentCache = /* @__PURE__ */ new Map();
let requestHistory = [];
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};
const checkRateLimit = () => {
  const now = Date.now();
  requestHistory = requestHistory.filter((ts) => now - ts < 6e4);
  if (requestHistory.length >= 20) return false;
  requestHistory.push(now);
  return true;
};
const fuzzyScore = (a, b) => {
  const norm = (s) => s.toLowerCase().replace(/\b(pak|bu|ibu|cv|ud|rpa|pt|toko|farm|kandang)\b/g, "").replace(/[^a-z0-9]/g, "").trim();
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  let matches = 0;
  const used = new Array(longer.length).fill(false);
  for (const ch of shorter) {
    const idx = longer.split("").findIndex((c, i) => c === ch && !used[i]);
    if (idx !== -1) {
      matches++;
      used[idx] = true;
    }
  }
  return matches / longer.length;
};
const INTENT_TABLE_MAP = {
  CATAT_PEMBELIAN: "purchases",
  CATAT_PENJUALAN: "sales",
  CATAT_BAYAR: "payments",
  CATAT_PENGIRIMAN: "deliveries",
  CATAT_HARIAN: "daily_records",
  CATAT_PAKAN: "feed_stocks",
  CATAT_PANEN: "harvest_records",
  CATAT_PENGELUARAN: "cycle_expenses",
  BUAT_INVOICE: "rpa_invoices",
  CATAT_ORDER: "orders",
  TAMBAH_PRODUK: "rpa_products"
};
const ENTITY_MAP = {
  CATAT_PEMBELIAN: [{ nameField: "supplier_name", idField: "supplier_id", snapshotKey: "suppliers" }],
  CATAT_PENJUALAN: [{ nameField: "rpa_name", idField: "rpa_id", snapshotKey: "rpas" }],
  CATAT_BAYAR: [{ nameField: "payer_name", idField: "payer_id", snapshotKey: "rpas" }],
  CATAT_PENGIRIMAN: [],
  BUAT_INVOICE: [{ nameField: "customer_name", idField: "customer_id", snapshotKey: "customers" }],
  CATAT_ORDER: [],
  TAMBAH_PRODUK: [],
  CATAT_HARIAN: [{ nameField: "farm_name", idField: "farm_id", snapshotKey: "farms" }],
  CATAT_PAKAN: [{ nameField: "farm_name", idField: "farm_id", snapshotKey: "farms" }],
  CATAT_PANEN: [{ nameField: "farm_name", idField: "farm_id", snapshotKey: "farms" }],
  CATAT_PENGELUARAN: [{ nameField: "farm_name", idField: "farm_id", snapshotKey: "farms" }]
};
const UNDO_WINDOW_MS = 8e3;
function useAIAssistant({ userType, contextPage }) {
  var _a;
  const { profile, tenant } = useAuth();
  const { getAccumulatedTotal, getParentContext } = useBusinessSnapshot();
  const aiQuota = useAIQuota(tenant);
  const [messages, setMessages] = useState([]);
  const [agentState, setAgentState] = useState(AGENT_STATE.IDLE);
  const [pendingEntries, setPendingEntries] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [conversationSummary, setConversationSummary] = useState("");
  const [undoEntry, setUndoEntry] = useState(null);
  const undoTimerRef = useRef(null);
  const [entryResults, setEntryResults] = useState({});
  const [_aiIdToEntryIdMap, setAiIdToEntryIdMap] = useState({});
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const snapshotCacheRef = useRef(null);
  const SNAPSHOT_TTL_MS = 90 * 1e3;
  useEffect(() => {
    if (!(tenant == null ? void 0 : tenant.id) || !(profile == null ? void 0 : profile.id) || historyLoaded) return;
    const loadHistory = async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
        const { data } = await supabase.from("ai_conversations").select("id, messages, metadata").eq("tenant_id", tenant.id).eq("profile_id", profile.id).eq("user_type", userType).gte("created_at", cutoff).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (data) {
          const rawMessages = data.messages || [];
          if (rawMessages.length > 10) {
            const older = rawMessages.slice(0, -10);
            const summaryText = older.filter((m) => m.role === "assistant" && m.intent).map((m) => `[${m.intent}] ${m.content}`).slice(-3).join(" | ");
            setConversationSummary(summaryText || "");
            setMessages(rawMessages.slice(-10));
          } else {
            setMessages(rawMessages);
          }
          setConversationId(data.id);
        }
      } catch (err) {
        console.error("[AI] History load failed:", err);
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [tenant == null ? void 0 : tenant.id, profile == null ? void 0 : profile.id, userType, historyLoaded]);
  const buildContextSnapshot2 = useCallback(async (forceRefresh = false) => {
    if (!(tenant == null ? void 0 : tenant.id)) return {};
    const now = Date.now();
    if (!forceRefresh && snapshotCacheRef.current && now - snapshotCacheRef.current.timestamp < SNAPSHOT_TTL_MS) {
      return snapshotCacheRef.current.data;
    }
    const snapshot = { farms: [], rpas: [], customers: [], suppliers: [], products: [], vehicles: [], drivers: [] };
    try {
      if (userType === "broker") {
        const [rpasRes, farmsRes, vehiclesRes, driversRes] = await Promise.all([
          supabase.from("rpa_clients").select("id, rpa_name").eq("tenant_id", tenant.id).eq("is_deleted", false).order("created_at", { ascending: false }).limit(25),
          supabase.from("farms").select("id, farm_name, owner_name").eq("tenant_id", tenant.id).eq("is_deleted", false).order("created_at", { ascending: false }).limit(25),
          supabase.from("vehicles").select("id, vehicle_plate, vehicle_type").eq("tenant_id", tenant.id).eq("status", "aktif").eq("is_deleted", false).limit(25),
          supabase.from("drivers").select("id, full_name, phone").eq("tenant_id", tenant.id).eq("status", "aktif").eq("is_deleted", false).limit(25)
        ]);
        snapshot.rpas = (rpasRes.data || []).map((r) => ({ id: r.id, name: r.rpa_name }));
        snapshot.farms = (farmsRes.data || []).map((f) => ({ id: f.id, name: f.farm_name }));
        snapshot.vehicles = (vehiclesRes.data || []).map((v) => ({ id: v.id, name: v.vehicle_plate, type: v.vehicle_type }));
        snapshot.drivers = (driversRes.data || []).map((d) => ({ id: d.id, name: d.full_name, phone: d.phone }));
        const ownerMap = /* @__PURE__ */ new Map();
        (farmsRes.data || []).forEach((f) => {
          if (f.owner_name && !ownerMap.has(f.owner_name)) ownerMap.set(f.owner_name, f.id);
        });
        snapshot.suppliers = Array.from(ownerMap.entries()).map(([name, id]) => ({ id, name }));
      } else if (userType === "peternak") {
        const { data: farms } = await supabase.from("peternak_farms").select("id, farm_name").eq("tenant_id", tenant.id).eq("is_deleted", false).limit(25);
        snapshot.farms = (farms || []).map((f) => ({ id: f.id, name: f.farm_name }));
      } else if (userType === "rpa") {
        const { data: customers } = await supabase.from("rpa_customers").select("id, customer_name").eq("tenant_id", tenant.id).eq("is_deleted", false).limit(25);
        snapshot.customers = (customers || []).map((c) => ({ id: c.id, name: c.customer_name }));
        const { data: products } = await supabase.from("rpa_products").select("id, product_name, sell_price").eq("tenant_id", tenant.id).eq("is_deleted", false).limit(25);
        snapshot.products = (products || []).map((p) => ({ id: p.id, name: p.product_name, sell_price: p.sell_price }));
      }
    } catch (err) {
      console.error("[AI] Snapshot error:", err);
    }
    snapshotCacheRef.current = { data: snapshot, timestamp: Date.now() };
    return snapshot;
  }, [tenant == null ? void 0 : tenant.id, userType]);
  const saveConversation = useCallback(async (allMessages, snapshot, telemetry = {}) => {
    if (!(tenant == null ? void 0 : tenant.id) || !(profile == null ? void 0 : profile.id)) return null;
    const messagesForDB = allMessages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      ...m.intent ? { intent: m.intent } : {},
      ...m.confidence !== void 0 ? { confidence: m.confidence } : {}
    }));
    const payload = {
      messages: messagesForDB,
      metadata: { ...telemetry, summary: conversationSummary, last_updated: (/* @__PURE__ */ new Date()).toISOString() }
    };
    if (conversationId) {
      await supabase.from("ai_conversations").update(payload).eq("id", conversationId);
      return conversationId;
    }
    const { data, error: insertError } = await supabase.from("ai_conversations").insert({
      ...payload,
      tenant_id: tenant.id,
      profile_id: profile.id,
      user_type: userType,
      context_page: contextPage || null,
      context_snapshot: snapshot || null
    }).select("id").single();
    if (insertError) {
      console.error("[AI] Conversation insert error:", insertError);
      return null;
    }
    setConversationId(data.id);
    return data.id;
  }, [tenant == null ? void 0 : tenant.id, profile == null ? void 0 : profile.id, conversationId, userType, contextPage, conversationSummary]);
  const updateSummary = useCallback(() => {
    if (messages.length <= 12) return;
    const olderMessages = messages.slice(0, -5);
    const summaryParts = olderMessages.filter((m) => m.intent || m.role === "user").map((m) => {
      if (m.role === "user") return `User: "${m.content.substring(0, 60)}"`;
      return `[${m.intent}] ${m.content.substring(0, 80)}`;
    }).slice(-6);
    setConversationSummary(summaryParts.join(" → "));
  }, [messages]);
  useEffect(() => {
    updateSummary();
  }, [messages.length, updateSummary]);
  const isEntryLocked = useCallback((entry) => {
    if (!entry.dependency_id) return false;
    const parentResult = entryResults[entry.dependency_id];
    return (parentResult == null ? void 0 : parentResult.status) !== "confirmed";
  }, [entryResults]);
  const resolveEntities = useCallback((intent, extractedData, snapshot) => {
    const entityDefs = ENTITY_MAP[intent] ?? [];
    const unresolved = [];
    for (const { nameField, idField, snapshotKey } of entityDefs) {
      const extractedName = extractedData[nameField];
      if (extractedData[idField] || !extractedName) continue;
      const pool = snapshot[snapshotKey] ?? [];
      const candidates = pool.map((item) => ({ id: item.id, name: item.name, score: fuzzyScore(extractedName, item.name) })).filter((c) => c.score >= 0.6).sort((a, b) => b.score - a.score).slice(0, 4);
      unresolved.push({ nameField, idField, extractedName, candidates });
    }
    return unresolved;
  }, []);
  const processAIParsedResult = useCallback(async (parsed, snapshot, telemetry = {}, _anomalies = []) => {
    var _a2, _b;
    let intents = parsed.intents || [];
    if (intents.length === 0 && parsed.intent) {
      intents = [{ intent: parsed.intent, data: parsed.data ?? {}, confidence: parsed.confidence ?? 1, clarification: parsed.clarification ?? null }];
    }
    intents = intents.map((item) => {
      if (["CATAT_PEMBELIAN", "CATAT_PENJUALAN"].includes(item.intent)) {
        const data = item.data || {};
        if (!data.qty_ekor && data.weight_kg > 0) {
          data.qty_ekor = Math.round(data.weight_kg / 1.85);
          item.data = data;
        }
      }
      return item;
    });
    const firstIntent = intents[0];
    const assistantMsg = {
      role: "assistant",
      content: parsed.display_summary || "Siap boss!",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      intent: firstIntent == null ? void 0 : firstIntent.intent,
      usage: telemetry.token_usage,
      // Pass usage to UI
      provider: telemetry.provider
      // Pass provider to UI
    };
    const potentialParents = intents.filter((it) => ["CATAT_PEMBELIAN", "CATAT_PENJUALAN"].includes(it.intent)).map((it) => it.id);
    intents = intents.map((item, idx) => {
      if (["CATAT_PENGIRIMAN", "CATAT_BAYAR"].includes(item.intent) && !item.dependency) {
        const closestParent = intents.slice(0, idx).reverse().find((it) => ["CATAT_PEMBELIAN", "CATAT_PENJUALAN"].includes(it.intent));
        if (closestParent) {
          return { ...item, dependency: closestParent.id };
        }
        if (potentialParents.length === 1) {
          return { ...item, dependency: potentialParents[0] };
        }
      }
      return item;
    });
    setMessages((prev) => [...prev, assistantMsg]);
    if ((firstIntent == null ? void 0 : firstIntent.intent) === "TANYA_DATA" || (firstIntent == null ? void 0 : firstIntent.intent) === "TIDAK_DIKENALI") {
      setAgentState(AGENT_STATE.IDLE);
      return;
    }
    const convId = await saveConversation([...messages, assistantMsg], snapshot, telemetry);
    if (convId) {
      const contextResults = await Promise.all(intents.map(async (item) => {
        var _a3, _b2;
        if (item.intent === "KOREKSI" || item.intent === "TANYA_DATA") return null;
        const parentId = item.dependency || ((_a3 = item.data) == null ? void 0 : _a3.sale_id) || ((_b2 = item.data) == null ? void 0 : _b2.purchase_id);
        const type = item.intent === "CATAT_PENGIRIMAN" ? "DELIVERY" : item.intent === "CATAT_BAYAR" ? "PAYMENT" : null;
        const [accumulatedTotal, parentContext] = await Promise.all([
          getAccumulatedTotal(parentId, type),
          getParentContext(parentId, item.intent)
        ]);
        return { accumulatedTotal, parentContext, snapshot };
      }));
      for (const item of intents.filter((i) => i.intent === "KOREKSI")) {
        if (pendingEntries.length > 0) {
          const last = pendingEntries[pendingEntries.length - 1];
          const field = (_a2 = item.data) == null ? void 0 : _a2.field_to_fix;
          if (field && ((_b = item.data) == null ? void 0 : _b.new_value) !== void 0) {
            const patched = {
              ...last,
              extracted_data: { ...last.extracted_data, [field]: item.data.new_value },
              _dirty: { ...last._dirty || {}, [field]: { original: last.extracted_data[field], edited: item.data.new_value } }
            };
            await supabase.from("ai_pending_entries").update({ extracted_data: patched.extracted_data }).eq("id", last.id);
            setPendingEntries((prev) => [...prev.slice(0, -1), patched]);
            toast.success("Data dikoreksi");
          }
        }
      }
      const dataIntents = intents.filter((i) => i.intent !== "KOREKSI");
      if (dataIntents.length > 0) {
        const dataContextResults = dataIntents.map((item) => contextResults[intents.indexOf(item)]);
        const preValidations = dataIntents.map(
          (item, i) => validateBusinessRules({
            intent: item.intent,
            extracted_data: item.data,
            _ai_id: item.id,
            dependency_id: item.dependency
          }, pendingEntries, dataContextResults[i])
        );
        const { data: batchEntries } = await supabase.from("ai_pending_entries").insert(dataIntents.map((item) => ({
          conversation_id: convId,
          tenant_id: tenant.id,
          profile_id: profile.id,
          intent: item.intent,
          extracted_data: { ...item.data ?? {}, _ai_id: item.id, _dependency_ai_id: item.dependency },
          target_table: INTENT_TABLE_MAP[item.intent] || null,
          status: "pending",
          confidence: item.confidence ?? 1,
          raw_ai_response: parsed
        }))).select();
        if (batchEntries == null ? void 0 : batchEntries.length) {
          const localAiIdMap = {};
          batchEntries.forEach((entry, i) => {
            var _a3;
            const aiId = (_a3 = dataIntents[i]) == null ? void 0 : _a3.id;
            if (aiId) localAiIdMap[aiId] = entry.id;
          });
          const insertedEntries = batchEntries.map((entry, i) => {
            const item = dataIntents[i];
            return {
              ...entry,
              dependency_id: item.dependency ? localAiIdMap[item.dependency] || null : null,
              _unresolved: resolveEntities(item.intent, item.data ?? {}, snapshot),
              _original_data: { ...item.data ?? {} },
              status: "pending",
              _validation: preValidations[i],
              _context: dataContextResults[i],
              _anomalies: [],
              _clarification: item.clarification || null
            };
          });
          setAiIdToEntryIdMap((prev) => ({ ...prev, ...localAiIdMap }));
          setPendingEntries((prev) => [...prev, ...insertedEntries]);
        }
      }
    }
    if ((firstIntent == null ? void 0 : firstIntent.clarification) || (firstIntent == null ? void 0 : firstIntent.confidence) < 0.8) {
      setAgentState(AGENT_STATE.AWAITING_CLARIFICATION);
    } else {
      setAgentState(AGENT_STATE.AWAITING_CONFIRMATION);
    }
  }, [messages, tenant, profile, saveConversation, pendingEntries, resolveEntities, getAccumulatedTotal, getParentContext]);
  const abortControllerRef = useRef(null);
  const cancelAI = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setAgentState(AGENT_STATE.IDLE);
      toast.info("Proses dihentikan.");
    }
  }, []);
  const sendMessage = useCallback(async (userMessage) => {
    var _a2, _b;
    if (!(userMessage == null ? void 0 : userMessage.trim()) || !(tenant == null ? void 0 : tenant.id) || !(profile == null ? void 0 : profile.id)) return;
    setError(null);
    setLastFailedMessage(null);
    if (!checkRateLimit()) {
      toast.error("Pelan-pelan boss! Max 15 pesan/menit.");
      return;
    }
    if (aiQuota.quotaStatus === "exceeded") {
      const errMsg = "Kuota AI bulan ini sudah habis. Silakan upgrade plan untuk lanjut.";
      setMessages((prev) => [...prev, { role: "user", content: userMessage.trim(), timestamp: (/* @__PURE__ */ new Date()).toISOString() }]);
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg, timestamp: (/* @__PURE__ */ new Date()).toISOString(), isQuotaBlocked: true }]);
      setAgentState(AGENT_STATE.IDLE);
      return;
    }
    const userMsg = { role: "user", content: userMessage.trim(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setAgentState(AGENT_STATE.PRE_CHECKING);
    const startTime = Date.now();
    try {
      const normalizeQuery = userMessage.toLowerCase().trim();
      const preCheck = [
        { reg: /^(ping|cek koneksi|test|tes|p)$/i, res: "Pong! Koneksi aman bossku. ⚡" },
        { reg: /^(halo|hi|hai|halo ai|bot|halo bot)$/i, res: `Halo ${profile.full_name}! Ada transaksi yang mau dicatat?` },
        { reg: /^(siapa (ini|kamu)|nama kamu)$/i, res: "Saya TernakOS AI, asisten bisnismu." }
      ].find((r) => r.reg.test(normalizeQuery));
      if (preCheck) {
        setMessages((prev) => [...prev, { role: "assistant", content: preCheck.res, timestamp: (/* @__PURE__ */ new Date()).toISOString() }]);
        setAgentState(AGENT_STATE.IDLE);
        return;
      }
      setAgentState(AGENT_STATE.THINKING);
      const qHash = hashString(`${tenant.id}:${normalizeQuery}`);
      if (intentCache.has(qHash)) {
        const cached = intentCache.get(qHash);
        await processAIParsedResult(cached.parsed, await buildContextSnapshot2(), cached.telemetry, cached.anomalies);
        return;
      }
      const maiaApiKey = "sk-B-eEPY96ImM7MY8uVc1YnQ";
      const maiaModel = "xai/grok-4-1-fast-reasoning";
      const glmApiKey = "101b66393a1f4e9e8537f6316bc6a8cd.MChrxVHuw8CJzgAO";
      if (!maiaApiKey && !glmApiKey) ;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const shortTermMemory = messages.slice(-5).map((m) => ({ role: m.role, content: m.content }));
      const snapshot = await buildContextSnapshot2();
      const systemPrompt = buildSystemPrompt({
        userType,
        businessName: tenant.business_name || "",
        userName: profile.full_name || "",
        contextPage,
        snapshot,
        today: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        vertical: (tenant == null ? void 0 : tenant.business_vertical) || "generic",
        businessModel: "generic"
      });
      const requestTools = [{
        type: "function",
        function: {
          name: "submit_transaction",
          description: "Kirim data transaksi ke sistem TernakOS.",
          parameters: {
            type: "object",
            properties: {
              intents: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    intent: { type: "string" },
                    data: { type: "object" },
                    dependency: { type: "string" },
                    confidence: { type: "number" },
                    clarification: { type: "string" }
                  }
                }
              },
              display_summary: { type: "string" }
            },
            required: ["intents", "display_summary"]
          }
        }
      }];
      const requestBase = {
        temperature: normalizeQuery.includes("?") ? 0.7 : 0.1,
        messages: [{ role: "system", content: systemPrompt }, ...shortTermMemory, { role: "user", content: userMessage }],
        tools: requestTools,
        tool_choice: "auto"
      };
      const fetchAI = async (url, key, body, timeoutMs) => {
        const combinedSignal = typeof AbortSignal.any === "function" ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : signal;
        console.log("[AI] Request →", body.model, JSON.stringify(body).slice(0, 400));
        const res = await fetch(url, {
          method: "POST",
          signal: combinedSignal,
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          let errDetail = "";
          try {
            errDetail = await res.text();
          } catch {
          }
          console.error("[AI] API error", body.model, res.status, errDetail);
          throw new Error(`${body.model} ${res.status}: ${errDetail.slice(0, 200)}`);
        }
        return res.json();
      };
      let parsed = null;
      let activeProvider = null;
      let usage = null;
      const parseResult = (result) => {
        var _a3, _b2, _c;
        const choice = (_b2 = (_a3 = result.choices) == null ? void 0 : _a3[0]) == null ? void 0 : _b2.message;
        if (((_c = choice == null ? void 0 : choice.tool_calls) == null ? void 0 : _c.length) > 0) {
          try {
            return JSON.parse(choice.tool_calls[0].function.arguments);
          } catch {
          }
        }
        const raw = (choice == null ? void 0 : choice.content) || (choice == null ? void 0 : choice.reasoning_content) || "";
        if (raw) {
          const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (match) {
            try {
              return JSON.parse(match[0]);
            } catch {
            }
          }
          return { intents: [], display_summary: raw };
        }
        return { intents: [], display_summary: "Maaf, tidak bisa memproses permintaan ini." };
      };
      const maiaUrl = "https://api.maiarouter.ai/v1/chat/completions";
      const glmUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
      const maiaBody = {
        model: maiaModel,
        temperature: requestBase.temperature,
        messages: requestBase.messages
      };
      const glmBody = {
        model: "glm-4.7-flash",
        temperature: requestBase.temperature,
        messages: requestBase.messages
      };
      try {
        const result = await fetchAI(maiaUrl, maiaApiKey, maiaBody, 25e3);
        activeProvider = "MAIA";
        usage = result.usage;
        parsed = parseResult(result);
      } catch (maiaErr) {
        console.warn("[AI] MAIA failed, falling back to GLM...", maiaErr.message);
        if (glmApiKey) {
          toast.info("Menghubungi jalur cadangan...");
          const result = await fetchAI(glmUrl, glmApiKey, glmBody, 3e4);
          activeProvider = "GLM-BACKUP";
          usage = result.usage;
          parsed = parseResult(result);
        }
      }
      if (!parsed) throw new Error("Format jawaban AI tidak valid.");
      const telemetry = {
        latency_ms: Date.now() - startTime,
        token_usage: usage ?? null,
        provider: activeProvider,
        intent: ((_b = (_a2 = parsed.intents) == null ? void 0 : _a2[0]) == null ? void 0 : _b.intent) || "UNKNOWN"
      };
      intentCache.set(qHash, { parsed, anomalies: [], telemetry });
      await processAIParsedResult(parsed, snapshot, telemetry, []);
    } catch (err) {
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        console.log("[AI] Process aborted or timed out.");
        setAgentState(AGENT_STATE.IDLE);
        return;
      }
      console.error("[AI Error]", err);
      supabase.from("ai_error_logs").insert({
        tenant_id: (tenant == null ? void 0 : tenant.id) ?? null,
        profile_id: (profile == null ? void 0 : profile.id) ?? null,
        error_msg: err.message ?? "Unknown error",
        provider: null,
        user_message: (userMessage == null ? void 0 : userMessage.slice(0, 200)) ?? null,
        context_page: contextPage ?? null
      }).then(({ error: logErr }) => {
        if (logErr) console.warn("[AI] Could not write error log:", logErr.message);
      });
      setLastFailedMessage(userMessage);
      const errMsg = err.code === "RATE_LIMITED" ? "Pelan-pelan bos, server lagi cooldown." : "Server sibuk bos. Coba lagi bentar ya? 🙏";
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg, timestamp: (/* @__PURE__ */ new Date()).toISOString() }]);
      setAgentState(AGENT_STATE.ERROR);
      setError(err.message);
    } finally {
      abortControllerRef.current = null;
      setAgentState((prev) => prev === AGENT_STATE.THINKING ? AGENT_STATE.IDLE : prev);
    }
  }, [messages, tenant, profile, userType, contextPage, buildContextSnapshot2, processAIParsedResult]);
  const retryLastMessage = useCallback(() => {
    if (lastFailedMessage) {
      setMessages((prev) => prev.slice(0, -1));
      setAgentState(AGENT_STATE.IDLE);
      setError(null);
      sendMessage(lastFailedMessage);
    }
  }, [lastFailedMessage, sendMessage]);
  const confirmEntry = useCallback(async (entryId) => {
    var _a2, _b;
    const entry = pendingEntries.find((p) => p.id === entryId);
    if (!entry) return;
    if (isEntryLocked(entry)) {
      const parent = pendingEntries.find((p) => p.id === entry.dependency_id);
      const parentName = parent ? parent.intent.replace("CATAT_", "") : "transaksi utama";
      toast.error(`Sabar boss, konfirmasi dulu ${parentName}-nya!`);
      return;
    }
    try {
      const type = entry.intent === "CATAT_PENGIRIMAN" ? "DELIVERY" : entry.intent === "CATAT_BAYAR" ? "PAYMENT" : null;
      const [accumulatedTotal, parentContext] = await Promise.all([
        getAccumulatedTotal(entry.dependency_id || ((_a2 = entry.extracted_data) == null ? void 0 : _a2.sale_id), type),
        getParentContext(entry.dependency_id || ((_b = entry.extracted_data) == null ? void 0 : _b.sale_id), entry.intent)
      ]);
      const contextSnapshot = { accumulatedTotal, parentContext };
      const validation = validateBusinessRules(entry, pendingEntries, contextSnapshot);
      if (!validation.valid) {
        const errorMsg = validation.errors[0];
        toast.error(errorMsg);
        setEntryResults((prev) => ({ ...prev, [entryId]: { status: "failed", error: errorMsg } }));
        return null;
      }
      const { data: staged, error: stageError } = await supabase.from("ai_staged_transactions").insert({
        tenant_id: tenant.id,
        profile_id: profile.id,
        pending_entry_id: entry.id,
        target_table: entry.target_table,
        intent: entry.intent,
        payload: entry.extracted_data,
        original_data: entry._original_data,
        is_edited: !!entry.is_edited,
        status: "staged"
      }).select().single();
      if (stageError) throw stageError;
      setPendingEntries((prev) => prev.filter((e) => e.id !== entryId));
      setEntryResults((prev) => ({ ...prev, [entryId]: { status: "confirmed" } }));
      snapshotCacheRef.current = null;
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoEntry({ id: entryId, entry, stagedId: staged.id });
      undoTimerRef.current = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("Sesi sudah habis, silakan login ulang.");
          const { error: commitError } = await supabase.functions.invoke("ai-commit", {
            body: { stagedId: staged.id },
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (commitError) throw commitError;
          setUndoEntry(null);
          toast.success("Pencatatan berhasil!");
        } catch (e) {
          console.error("[AI] Commit failed:", e);
          toast.error("Gagal memproses transaksi final. Hubungi admin.");
        }
      }, UNDO_WINDOW_MS);
      return staged.id;
    } catch (err) {
      console.error("[AI] Confirm error:", err);
      const errorMsg = err.message || "Gagal menyimpan data";
      toast.error(errorMsg);
      setEntryResults((prev) => ({ ...prev, [entryId]: { status: "failed", error: errorMsg } }));
      return null;
    }
  }, [pendingEntries, tenant, profile, isEntryLocked]);
  const undoLastConfirm = useCallback(async () => {
    if (!undoEntry) return;
    const { id, entry, stagedId } = undoEntry;
    try {
      const childrenToUndo = Object.entries(entryResults).filter(([_resId, res]) => res.status === "confirmed").map(([resId]) => pendingEntries.find((p) => p.id === resId)).filter((p) => p && p.dependency_id === id);
      for (const _child of childrenToUndo) {
      }
      const { error: undoError } = await supabase.from("ai_staged_transactions").update({ status: "undone" }).eq("id", stagedId);
      if (undoError) throw undoError;
      setPendingEntries((prev) => [...prev, entry]);
      setEntryResults((prev) => {
        const next = { ...prev, [id]: { status: "undone" } };
        childrenToUndo.forEach((c) => {
          next[c.id] = { status: "pending" };
        });
        return next;
      });
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoEntry(null);
      if (childrenToUndo.length > 0) {
        toast.warning("Transaksi terpilih dan semua turunannya berhasil dibatalkan.");
      } else {
        toast.success("Berhasil dibatalkan!");
      }
    } catch (err) {
      console.error("[AI] Undo error:", err);
      toast.error("Gagal membatalkan transaksi.");
    }
  }, [undoEntry, pendingEntries, entryResults]);
  const rejectEntry = useCallback(async (id) => {
    const dependents = pendingEntries.filter((e) => e.dependency_id === id);
    const allIdsToReject = [id, ...dependents.map((d) => d.id)];
    try {
      await supabase.from("ai_pending_entries").update({ status: "rejected" }).in("id", allIdsToReject);
      setPendingEntries((prev) => prev.filter((e) => !allIdsToReject.includes(e.id)));
      setEntryResults((prev) => {
        const next = { ...prev };
        allIdsToReject.forEach((rid) => {
          next[rid] = { status: "rejected" };
        });
        return next;
      });
      if (dependents.length > 0) {
        toast.warning(`${dependents.length} transaksi turunan juga ikut dibatalkan agar data sinkron.`);
      }
    } catch (err) {
      console.error("[AI] Reject error:", err);
      toast.error("Gagal membatalkan transaksi.");
    }
  }, [pendingEntries]);
  const confirmAll = useCallback(async () => {
    const results = { success: 0, failed: 0, errors: [] };
    const entriesToProcess = [...pendingEntries].sort((a, b) => {
      if (a.dependency_id === b.id) return 1;
      if (b.dependency_id === a.id) return -1;
      return 0;
    });
    for (const entry of entriesToProcess) {
      try {
        const result = await confirmEntry(entry.id);
        if (result) results.success++;
        else results.failed++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${entry.intent}: ${err.message}`);
      }
    }
    if (results.failed > 0) {
      toast.error(`${results.success} berhasil, ${results.failed} gagal`);
    } else if (results.success > 0) {
      toast.success(`${results.success} transaksi berhasil disimpan`);
    }
    return results;
  }, [pendingEntries, confirmEntry]);
  const editEntryField = useCallback((entryId, fieldName, newValue) => {
    setPendingEntries((prev) => prev.map((entry) => {
      var _a2;
      if (entry.id !== entryId) return entry;
      const originalValue = (_a2 = entry._original_data) == null ? void 0 : _a2[fieldName];
      const isChanged = originalValue !== newValue;
      return {
        ...entry,
        extracted_data: { ...entry.extracted_data, [fieldName]: newValue },
        _dirty: {
          ...entry._dirty || {},
          ...isChanged ? { [fieldName]: { original: originalValue, edited: newValue } } : {}
        },
        // Re-validate on edit with full context (incl. snapshot)
        _validation: validateBusinessRules({
          ...entry,
          extracted_data: { ...entry.extracted_data, [fieldName]: newValue }
        }, prev, entry._context)
      };
    }));
  }, [pendingEntries]);
  const resolveEntity = useCallback((idField, selectedId, selectedName, isNew = false) => {
    setPendingEntries((prev) => {
      if (!prev.length) return prev;
      const first = { ...prev[0] };
      first.extracted_data = {
        ...first.extracted_data,
        [idField]: isNew ? null : selectedId,
        [`${idField}_is_new`]: isNew,
        [`${idField}_new_name`]: isNew ? selectedName : void 0
      };
      first._unresolved = (first._unresolved ?? []).filter((e) => e.idField !== idField);
      return [first, ...prev.slice(1)];
    });
  }, []);
  const resetConversation = useCallback(() => {
    setMessages([]);
    setAgentState(AGENT_STATE.IDLE);
    setPendingEntries([]);
    setConversationId(null);
    setConversationSummary("");
    setError(null);
    setEntryResults({});
    setLastFailedMessage(null);
    setUndoEntry(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);
  return {
    // Core
    messages,
    agentState,
    isLoading: agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PRE_CHECKING,
    sendMessage,
    error,
    conversationId,
    // Pending entries (each has independent state = entry isolation)
    pendingEntries,
    pendingEntry: pendingEntries[0] ?? null,
    pendingCount: pendingEntries.length,
    // Actions
    confirmEntry,
    rejectEntry,
    confirmAll,
    clearPending: () => setPendingEntries([]),
    editEntryField,
    // Entity resolution
    unresolvedEntities: ((_a = pendingEntries[0]) == null ? void 0 : _a._unresolved) ?? [],
    resolveEntity,
    // Undo
    undoEntry,
    undoLastConfirm,
    undoTimeoutMs: UNDO_WINDOW_MS,
    // Retry
    lastFailedMessage,
    retryLastMessage,
    // Partial success
    entryResults,
    // Dependency Handling
    isEntryLocked,
    getEntryParent: (entry) => pendingEntries.find((p) => p.id === entry.dependency_id),
    // New chat
    cancelAI,
    resetConversation
  };
}
const INTENT_CONFIG = {
  // ── Broker (Poultry) ───────────────────────────────────────
  CATAT_PEMBELIAN: { label: "Pembelian Ayam", Icon: ShoppingCart, color: "emerald", fields: [] },
  CATAT_PENJUALAN: { label: "Penjualan Ayam", Icon: TrendingUp, color: "blue", fields: [] },
  CATAT_BAYAR: { label: "Pencatatan Bayar", Icon: Wallet, color: "amber", fields: [] },
  CATAT_PENGIRIMAN: { label: "Info Pengiriman", Icon: Truck, color: "purple", fields: [] },
  BUAT_INVOICE: { label: "Invoice Baru", Icon: ShoppingCart, color: "blue", fields: [] },
  CATAT_ORDER: { label: "Order Baru", Icon: Truck, color: "emerald", fields: [] },
  TAMBAH_PRODUK: { label: "Produk Baru", Icon: ShoppingCart, color: "amber", fields: [] },
  // ── Peternak ───────────────────────────────────────────────
  CATAT_HARIAN: {
    label: "Catatan Harian",
    Icon: Activity,
    color: "purple",
    fields: ["record_date", "farm_name", "avg_weight_kg", "dead_count", "culled_count", "notes"]
  },
  CATAT_PAKAN: {
    label: "Catatan Pakan",
    Icon: Package,
    color: "amber",
    fields: ["record_date", "farm_name", "feed_type", "qty_kg", "price_per_kg", "action", "notes"]
  },
  CATAT_PANEN: {
    label: "Catatan Panen",
    Icon: TrendingUp,
    color: "emerald",
    fields: ["harvest_date", "farm_name", "qty_ekor", "total_weight_kg", "price_per_kg", "buyer_name", "notes"]
  },
  CATAT_VAKSIN_OBAT: {
    label: "Vaksin / Obat",
    Icon: Shield,
    color: "blue",
    fields: ["record_date", "farm_name", "medicine_name", "qty", "unit", "notes"]
  },
  CATAT_BELI_TERNAK: {
    label: "Beli Ternak",
    Icon: ShoppingCart,
    color: "emerald",
    fields: ["purchase_date", "supplier_name", "qty_ekor", "avg_weight_kg", "total_harga", "notes"]
  },
  CATAT_JUAL_TERNAK: {
    label: "Jual Ternak",
    Icon: TrendingUp,
    color: "blue",
    fields: ["sale_date", "customer_name", "qty_ekor", "avg_weight_kg", "total_harga", "notes"]
  },
  CATAT_PENGELUARAN: {
    label: "Pengeluaran",
    Icon: Wallet,
    color: "red",
    fields: ["expense_date", "farm_name", "category", "amount", "description", "notes"]
  },
  TANYA_DATA: { label: "Pertanyaan Data", Icon: Search, color: "purple", fields: ["query"] },
  KOREKSI: {
    label: "Koreksi Data",
    Icon: Pencil,
    color: "amber",
    fields: ["target_intent", "target_id", "field_to_correct", "new_value"]
  },
  TIDAK_DIKENALI: { label: "Tidak Dikenali", Icon: AlertCircle, color: "red", fields: [] }
};
const FIELD_LABELS = {
  // ── Broker fields ──────────────────────────────────────────
  supplier_name: "Kandang (Supplier)",
  rpa_name: "RPA / MK (Buyer)",
  qty_ekor: "Jumlah (Ekor)",
  price_per_kg: "Harga (Rp/kg)",
  weight_kg: "Total Berat (kg)",
  total_weight_kg: "Total Berat (kg)",
  purchase_date: "Tanggal Transaksi",
  sale_date: "Tanggal Jual",
  payment_date: "Tgl Bayar",
  payer_name: "Yang Bayar",
  amount: "Nominal",
  payment_method: "Metode Bayar",
  driver_name: "Sopir",
  vehicle_plate: "Kendaraan Armada",
  departure_time: "Jam Berangkat",
  departed_at: "Jam Berangkat",
  arrived_at: "Jam Tiba",
  initial_weight_kg: "Berat Awal",
  arrived_weight_kg: "Berat Tiba",
  farm_name: "Kandang",
  record_date: "Tanggal",
  dead_count: "Jumlah Mati",
  culled_count: "Afkir",
  avg_weight_kg: "Bobot Rata²",
  feed_type: "Jenis Pakan",
  qty_kg: "Jumlah (kg)",
  harvest_date: "Tgl Panen",
  buyer_name: "Pembeli",
  category: "Kategori",
  description: "Keterangan",
  customer_name: "Customer",
  invoice_date: "Tgl Invoice",
  items: "Item",
  broker_name: "Broker",
  order_date: "Tgl Order",
  needed_date: "Dibutuhkan",
  target_weight_kg: "Target Berat",
  name: "Nama",
  unit: "Satuan",
  sell_price: "Harga Jual",
  notes: "Catatan Tambahan",
  expense_date: "Tgl Pengeluaran",
  transport_cost: "Ongkos Angkut",
  other_cost: "Biaya Lain",
  delivery_cost: "Total Biaya Pengiriman",
  payment_status: "Status Bayar",
  paid_amount: "Sudah Dibayar",
  due_date: "Jatuh Tempo",
  load_time: "Jam Muat",
  // ── Peternak fields (new) ──────────────────────────────────
  medicine_name: "Nama Obat/Vitamin",
  source: "Sumber/Toko",
  target_intent: "Jenis Data yang Dikoreksi",
  target_id: "ID Data Target",
  field_to_correct: "Field yang Salah",
  new_value: "Nilai Baru",
  qty: "Jumlah",
  total_harga: "Total Harga",
  deplesi_persen: "Deplesi (%)",
  kandang_id: "Kandang",
  action: "Aksi",
  jumlah: "Jumlah (Rp)",
  keterangan: "Keterangan",
  kategori: "Kategori",
  query: "Pertanyaan",
  answer: "Jawaban"
};
const FIELD_OPTIONS = {
  payment_status: [
    { value: "belum_lunas", label: "BELUM LUNAS" },
    { value: "sebagian", label: "SEBAGIAN" },
    { value: "lunas", label: "LUNAS" }
  ],
  payment_method: [
    { value: "transfer", label: "TRANSFER BANK" },
    { value: "cash", label: "TUNAI (CASH)" },
    { value: "giro", label: "GIRO / CEK" },
    { value: "qris", label: "QRIS" }
  ],
  action: [
    { value: "beli", label: "BELI" },
    { value: "pakai", label: "PAKAI" }
  ],
  category: [
    { value: "doc", label: "DOC" },
    { value: "obat", label: "OBAT" },
    { value: "vaksin", label: "VAKSIN" },
    { value: "listrik", label: "LISTRIK" },
    { value: "tenaga_kerja", label: "TENAGA KERJA" },
    { value: "lainnya", label: "LAINNYA" }
  ]
};
const NUMBER_FIELDS = /* @__PURE__ */ new Set([
  "qty_ekor",
  "price_per_kg",
  "weight_kg",
  "total_weight_kg",
  "amount",
  "initial_weight_kg",
  "arrived_weight_kg",
  "dead_count",
  "culled_count",
  "avg_weight_kg",
  "qty_kg",
  "sell_price",
  "target_weight_kg",
  "transport_cost",
  "other_cost",
  "delivery_cost",
  "paid_amount",
  "qty",
  "total_harga",
  "jumlah"
]);
const DATE_FIELDS = /* @__PURE__ */ new Set([
  "purchase_date",
  "sale_date",
  "payment_date",
  "record_date",
  "harvest_date",
  "invoice_date",
  "order_date",
  "expense_date",
  "needed_date",
  "due_date"
]);
const TIME_FIELDS = /* @__PURE__ */ new Set([
  "load_time",
  "departure_time",
  "departed_at",
  "arrived_at"
]);
const READONLY_FIELDS = /* @__PURE__ */ new Set(["items"]);
const CORE_BY_INTENT = {
  CATAT_PEMBELIAN: ["supplier_name", "farm_name", "purchase_date", "qty_ekor", "avg_weight_kg", "total_weight_kg", "price_per_kg", "notes"],
  CATAT_PENJUALAN: ["rpa_name", "sale_date", "qty_ekor", "avg_weight_kg", "total_weight_kg", "price_per_kg", "payment_status", "paid_amount", "due_date", "notes"],
  CATAT_PENGIRIMAN: ["vehicle_plate", "driver_name", "load_time", "departure_time", "initial_weight_kg", "delivery_cost", "notes"],
  CATAT_HARIAN: ["record_date", "farm_name", "avg_weight_kg", "dead_count", "culled_count", "notes"],
  CATAT_PAKAN: ["record_date", "farm_name", "feed_type", "qty_kg", "price_per_kg", "action", "notes"],
  CATAT_PANEN: ["harvest_date", "farm_name", "qty_ekor", "total_weight_kg", "price_per_kg", "buyer_name", "notes"],
  CATAT_VAKSIN_OBAT: ["record_date", "farm_name", "medicine_name", "qty", "unit", "notes"],
  CATAT_BELI_TERNAK: ["purchase_date", "supplier_name", "qty_ekor", "avg_weight_kg", "total_harga", "notes"],
  CATAT_JUAL_TERNAK: ["sale_date", "customer_name", "qty_ekor", "avg_weight_kg", "total_harga", "notes"],
  CATAT_PENGELUARAN: ["expense_date", "farm_name", "category", "amount", "description", "notes"],
  TANYA_DATA: ["query"],
  KOREKSI: ["target_intent", "target_id", "field_to_correct", "new_value"],
  TIDAK_DIKENALI: []
};
function formatValue(key, value) {
  if (value === null || value === void 0) {
    if (DATE_FIELDS.has(key)) return /* @__PURE__ */ jsx("span", { className: "text-amber-500 font-bold italic", children: "Tgl Belum Set" });
    if (TIME_FIELDS.has(key)) return /* @__PURE__ */ jsx("span", { className: "text-amber-500 font-bold italic", children: "Jam Belum Set" });
    if (NUMBER_FIELDS.has(key)) return /* @__PURE__ */ jsx("span", { className: "text-emerald-500/70 font-bold text-right", children: "0" });
    return /* @__PURE__ */ jsx("span", { className: "text-white/30 italic font-medium", children: "Belum diisi" });
  }
  if (key === "payment_status") {
    const statusMap = {
      lunas: /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-black tracking-tighter", children: "LUNAS" }),
      belum_lunas: /* @__PURE__ */ jsx("span", { className: "text-red-400 font-black tracking-tighter", children: "BELUM LUNAS" }),
      sebagian: /* @__PURE__ */ jsx("span", { className: "text-amber-400 font-black tracking-tighter", children: "SEBAGIAN" })
    };
    return statusMap[value] || /* @__PURE__ */ jsx("span", { className: "uppercase font-bold text-white/70", children: String(value).replace("_", " ") });
  }
  if (key === "payment_method") {
    const methodMap = { transfer: "Transfer", cash: "Tunai", giro: "Giro / Cek", qris: "QRIS" };
    return /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: methodMap[value] || value });
  }
  if (TIME_FIELDS.has(key)) return String(value).slice(0, 5);
  if (/price|amount|cost|sell_price|revenue|paid_amount|delivery_cost|total_harga|jumlah/.test(key) && typeof value === "number") return `Rp ${value.toLocaleString("id-ID")}`;
  if (/qty_ekor|count/.test(key) && typeof value === "number") return `${value.toLocaleString("id-ID")} ekor`;
  if (/weight|qty_kg/.test(key) && typeof value === "number") return `${value.toLocaleString("id-ID")} kg`;
  if (DATE_FIELDS.has(key) && (typeof value === "string" || value instanceof Date)) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return format(d, "dd MMM yyyy");
    } catch {
    }
  }
  if (Array.isArray(value)) return `${value.length} item`;
  return String(value);
}
const colorMap = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" }
};
function getVisibleFields(intentName, allKeys, vertical) {
  if (intentName === "CATAT_HARIAN") {
    if (vertical === "sapi_penggemukan" || vertical === "domba_penggemukan") {
      return allKeys.filter((k) => k !== "deplesi_persen");
    }
    if (vertical === "broiler") {
      return allKeys.filter((k) => k !== "avg_weight_kg");
    }
  }
  return allKeys;
}
function getAbkSummary(intent, data = {}) {
  const rp = (v) => v != null && v !== "" ? `Rp${Number(v).toLocaleString("id-ID")}` : null;
  const kg = (v) => v != null && v !== "" ? `${v} kg` : null;
  switch (intent) {
    case "CATAT_HARIAN":
      return [data.farm_name, kg(data.avg_weight_kg), data.dead_count != null ? `mati: ${data.dead_count}` : null].filter(Boolean).join(" · ") || "—";
    case "CATAT_PAKAN":
      return [data.feed_type, kg(data.qty_kg), data.farm_name].filter(Boolean).join(" · ") || "—";
    case "CATAT_VAKSIN_OBAT":
      return [data.medicine_name, data.qty != null ? `${data.qty}${data.unit || ""}` : null, data.farm_name].filter(Boolean).join(" · ") || "—";
    case "CATAT_BELI_TERNAK":
      return [data.qty_ekor != null ? `${data.qty_ekor} ekor` : null, kg(data.avg_weight_kg), rp(data.total_harga)].filter(Boolean).join(" · ") || "—";
    case "CATAT_JUAL_TERNAK":
      return [data.qty_ekor != null ? `${data.qty_ekor} ekor` : null, rp(data.total_harga)].filter(Boolean).join(" · ") || "—";
    case "CATAT_PENGELUARAN":
      return [data.category || data.kategori, rp(data.amount || data.jumlah)].filter(Boolean).join(" · ") || "—";
    case "KOREKSI":
      return `Koreksi ${(data.target_intent || "").replace("CATAT_", "") || "?"} — ${data.field_to_correct || "?"}`;
    default:
      return intent.replace(/^CATAT_/, "").replace(/_/g, " ");
  }
}
function InlineEditField({ fieldKey, value, isDirty, onEdit, options }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const isNumber = NUMBER_FIELDS.has(fieldKey);
  const isDate = DATE_FIELDS.has(fieldKey);
  const isTime = TIME_FIELDS.has(fieldKey);
  const isCurrency = /price|amount|cost|sell_price|revenue|paid_amount|delivery_cost|total_harga|jumlah/.test(fieldKey);
  const isReadonly = READONLY_FIELDS.has(fieldKey);
  const normalizedValue = options && value ? String(value).toLowerCase() : value;
  if (isReadonly) {
    return /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-[#F1F5F9] text-right truncate", children: formatValue(fieldKey, value) });
  }
  const formatInput = (val) => {
    if (!isCurrency || !val) return val;
    const num = String(val).replace(/\D/g, "");
    return num ? Number(num).toLocaleString("id-ID") : "";
  };
  const handleSave = (valOverride) => {
    let rawValue = valOverride !== void 0 ? valOverride : tempValue;
    let finalValue = rawValue;
    if (isNumber) {
      const clean = String(rawValue).replace(/\D/g, "");
      finalValue = clean ? Number(clean) : null;
    }
    onEdit(fieldKey, finalValue);
    setEditing(false);
  };
  if (!editing) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => {
          setEditing(true);
          const raw = value ?? "";
          if (isDate) setTempValue(typeof raw === "string" ? raw.slice(0, 10) : "");
          else if (isTime) setTempValue(typeof raw === "string" ? raw.slice(0, 5) : "");
          else if (isCurrency) setTempValue(formatInput(raw));
          else setTempValue(raw);
        },
        className: "group flex items-center gap-1.5 text-right ml-auto min-w-[60px] justify-end",
        children: [
          /* @__PURE__ */ jsx("span", { className: `text-[12px] font-bold text-right truncate ${isDirty ? "text-amber-300" : "text-[#F1F5F9]"}`, children: formatValue(fieldKey, value) || /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] italic opacity-50", children: "Ketik..." }) }),
          /* @__PURE__ */ jsx(Pencil, { size: 10, className: "text-[#4B6478] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" }),
          isDirty && /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" })
        ]
      }
    );
  }
  if (options) {
    return /* @__PURE__ */ jsxs(
      "select",
      {
        autoFocus: true,
        value: normalizedValue || "",
        onBlur: () => setEditing(false),
        onChange: (e) => {
          handleSave(e.target.value);
          setEditing(false);
        },
        className: "bg-[#111C24] border border-emerald-500/60 rounded-lg px-2 py-1 text-[11px] font-black text-emerald-400 focus:outline-none uppercase tracking-tighter cursor-pointer hover:bg-emerald-500/5 transition-colors",
        children: [
          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Pilih..." }),
          options.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.value, children: opt.label }, opt.value))
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 ml-auto w-full max-w-[140px]", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center w-full", children: [
    isCurrency && /* @__PURE__ */ jsx("span", { className: "absolute left-2 text-[10px] font-black text-emerald-500/60 pointer-events-none", children: "Rp" }),
    /* @__PURE__ */ jsx(
      "input",
      {
        autoFocus: true,
        type: isDate ? "date" : isTime ? "time" : "text",
        value: tempValue,
        placeholder: "Ketik...",
        onChange: (e) => {
          const val = e.target.value;
          if (isCurrency) setTempValue(formatInput(val));
          else setTempValue(val);
        },
        onKeyDown: (e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        },
        onBlur: () => handleSave(),
        className: `bg-[#0C1319] border border-emerald-500/60 rounded-lg py-1 text-[12px] font-bold text-white focus:outline-none text-right transition-all shadow-[0_0_10px_rgba(2, 26, 2,0.1)] ${isCurrency ? "pl-7 pr-2 w-full" : "px-2 w-full"}`
      }
    )
  ] }) });
}
function ResolveStep({ entity, totalSteps, currentStep, onResolveEntity }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    totalSteps > 1 && /* @__PURE__ */ jsxs("p", { className: "text-[9px] font-bold text-[#4B6478]/60 uppercase tracking-widest", children: [
      "Langkah ",
      currentStep,
      " dari ",
      totalSteps
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Search, { size: 15, className: "text-blue-400" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-[12px] font-black text-white tracking-tight", children: [
          "Cari “",
          entity.extractedName,
          "”"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-medium text-[#4B6478] mt-0.5", children: [
          FIELD_LABELS[entity.nameField] || entity.nameField,
          " — pilih yang sesuai:"
        ] })
      ] })
    ] }),
    entity.candidates.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: entity.candidates.map((candidate) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => onResolveEntity(entity.idField, candidate.id, candidate.name, false),
        className: "w-full flex items-center justify-between gap-2 bg-[#111C24] border border-white/5 hover:border-emerald-500/40 rounded-xl px-3.5 py-2.5 transition-all group active:scale-[0.98]",
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-[#F1F5F9] text-left truncate", children: candidate.name }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-[#4B6478] tabular-nums", children: [
              Math.round(candidate.score * 100),
              "%"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity", children: "Pilih" })
          ] })
        ]
      },
      candidate.id
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "pt-1", children: [
      entity.candidates.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-[10px] font-medium text-amber-400/80 mb-1.5", children: "Tidak ditemukan kecocokan." }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => onResolveEntity(entity.idField, null, entity.extractedName, true),
          className: "w-full flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/[0.03] border border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[11px] font-bold text-[#94A3B8] hover:text-emerald-400 transition-all",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 13 }),
            " Buat baru: “",
            entity.extractedName,
            "”"
          ]
        }
      )
    ] })
  ] });
}
function AIConfirmCard({
  pendingEntry,
  queuePosition = 1,
  queueTotal = 1,
  onConfirm,
  onReject,
  onEdit,
  isLoading,
  unresolvedEntities = [],
  onResolveEntity,
  isLocked = false,
  parentIntent = null,
  // ── New props ─────────────────────────────────────────────
  vertical = "generic",
  userRole = "owner",
  onCommit
  // optional: enables 8s countdown before commit
}) {
  var _a, _b, _c;
  const [step, setStep] = useState(unresolvedEntities.length > 0 ? "resolve" : "confirm");
  const [pendingCommit, setPendingCommit] = useState(false);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  useEffect(() => {
    if (unresolvedEntities.length === 0) setStep("confirm");
  }, [unresolvedEntities]);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    if (pendingCommit) {
      el.style.transition = "none";
      el.style.width = "100%";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = "width 8000ms linear";
          el.style.width = "0%";
        });
      });
    } else {
      el.style.transition = "none";
      el.style.width = "100%";
    }
  }, [pendingCommit]);
  const dynamicFieldOptions = React__default.useMemo(() => {
    var _a2;
    const snapshot = ((_a2 = pendingEntry == null ? void 0 : pendingEntry._context) == null ? void 0 : _a2.snapshot) || {};
    const farmOpts = (snapshot.farms || []).map((f) => ({ value: f.name, label: f.name }));
    const rpaOpts = (snapshot.rpas || []).map((r) => ({ value: r.name, label: r.name }));
    const vehOpts = (snapshot.vehicles || []).map((v) => ({ value: v.name, label: `${v.name}${v.type ? ` · ${v.type}` : ""}` }));
    const drvOpts = (snapshot.drivers || []).map((d) => ({ value: d.name, label: `${d.name}${d.phone ? ` · ${d.phone}` : ""}` }));
    return {
      ...FIELD_OPTIONS,
      supplier_name: farmOpts,
      farm_name: farmOpts,
      rpa_name: rpaOpts,
      vehicle_plate: vehOpts,
      driver_name: drvOpts
    };
  }, [pendingEntry]);
  if (!pendingEntry) return null;
  const config = INTENT_CONFIG[pendingEntry.intent] || { label: pendingEntry.intent, Icon: ShoppingCart, color: "emerald", fields: [] };
  const { label, Icon, color } = config;
  const c = colorMap[color] || colorMap.emerald;
  const confidence = pendingEntry.confidence ?? 1;
  const isLowConfidence = confidence < 0.8;
  const validation = pendingEntry._validation;
  const hasDirtyFields = Object.keys(pendingEntry._dirty || {}).length > 0;
  const handleConfirmClick = () => {
    if (onCommit) {
      setPendingCommit(true);
      timerRef.current = setTimeout(() => {
        setPendingCommit(false);
        onCommit(pendingEntry.id);
      }, 8e3);
    } else {
      onConfirm(pendingEntry.id);
    }
  };
  const handleCancelCommit = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setPendingCommit(false);
  };
  const coreKeys = CORE_BY_INTENT[pendingEntry.intent] || config.fields || [];
  const extractedKeys = Object.keys(pendingEntry.extracted_data || {});
  const rawKeys = Array.from(/* @__PURE__ */ new Set([...coreKeys, ...extractedKeys])).filter(
    (key) => !key.endsWith("_id") && !key.endsWith("_is_new") && !key.endsWith("_new_name") && key !== "id" && FIELD_LABELS[key]
  );
  const allKeys = getVisibleFields(pendingEntry.intent, rawKeys, vertical);
  const dataEntries = allKeys.map((key) => [key, (pendingEntry.extracted_data || {})[key]]);
  if (userRole === "abk") {
    const summary = getAbkSummary(pendingEntry.intent, pendingEntry.extracted_data || {});
    return /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 8, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.97 },
        transition: { duration: 0.25, ease: "easeOut" },
        className: "bg-[#111C24] rounded-2xl p-4 space-y-3 border border-white/8",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center shrink-0`, children: /* @__PURE__ */ jsx(Icon, { size: 15, className: c.text }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: `text-[11px] font-black uppercase tracking-widest ${c.text}`, children: label }),
              /* @__PURE__ */ jsx("p", { className: "text-[13px] font-bold text-white truncate mt-0.5", children: summary })
            ] })
          ] }),
          isLowConfidence && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 13, className: "text-amber-400 shrink-0" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-amber-300/90", children: "AI kurang yakin — owner perlu verifikasi" })
          ] }),
          pendingCommit ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-1.5 bg-emerald-500/20 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { ref: progressRef, className: "h-full bg-emerald-500 rounded-full", style: { width: "100%" } }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-emerald-400", children: "Menyimpan..." }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleCancelCommit,
                  className: "text-[11px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors",
                  children: "Batalkan"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                disabled: isLoading || isLocked,
                onClick: handleConfirmClick,
                className: "w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[13px] font-black text-black transition-all active:scale-[0.98]",
                children: isLoading ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Check, { size: 16 }),
                  " Konfirmasi"
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onReject,
                disabled: isLoading,
                className: "w-full text-[11px] font-bold text-[#4B6478] hover:text-red-400 transition-colors py-1",
                children: "Batal"
              }
            )
          ] })
        ]
      }
    );
  }
  if (userRole === "view_only") {
    return /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 8, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.97 },
        transition: { duration: 0.25, ease: "easeOut" },
        className: "bg-[#111C24] rounded-2xl p-4 space-y-3 border border-white/8 opacity-75",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`, children: /* @__PURE__ */ jsx(Icon, { size: 15, className: c.text }) }),
            /* @__PURE__ */ jsx("span", { className: `text-[12px] font-black uppercase tracking-widest ${c.text}`, children: label })
          ] }),
          dataEntries.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1.5 bg-white/[0.02] rounded-xl p-3", children: dataEntries.map(([key, val]) => {
            const formatted = formatValue(key, val);
            if (!formatted) return null;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-wider shrink-0", children: FIELD_LABELS[key] || key.replace(/_/g, " ") }),
              /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-[#F1F5F9] text-right truncate", children: formatted })
            ] }, key);
          }) }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-[#4B6478] text-center uppercase tracking-widest", children: "Mode Lihat Saja" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 8, scale: 0.97 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 8, scale: 0.97 },
      transition: { duration: 0.25, ease: "easeOut" },
      className: `bg-[#111C24] rounded-2xl p-4 space-y-3 relative overflow-hidden ${isLocked ? "grayscale-[0.5] opacity-80 border-white/5" : validation && !validation.valid ? "border border-red-500/30" : isLowConfidence ? "border border-amber-500/30" : hasDirtyFields ? "border border-amber-500/20" : "border border-white/8"}`,
      children: [
        isLocked && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-[#0C1319]/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 p-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(Lock, { size: 18, className: "text-[#4B6478]" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-[#F1F5F9]", children: "Transaksi Terkunci" }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-[#4B6478] mt-1", children: [
            "Selesaikan konfirmasi ",
            /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: (parentIntent == null ? void 0 : parentIntent.replace("CATAT_", "")) || "transaksi utama" }),
            " terlebih dahulu."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          queueTotal > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[9px] font-black text-[#4B6478] uppercase tracking-widest", children: [
              "Transaksi ",
              queuePosition,
              " dari ",
              queueTotal
            ] }),
            hasDirtyFields && /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Pencil, { size: 9 }),
              " Diedit"
            ] })
          ] }),
          pendingEntry._clarification && /* @__PURE__ */ jsxs("div", { className: "p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300", children: [
            /* @__PURE__ */ jsx(MessageCircle, { size: 14, className: "text-orange-400 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-orange-200/90 leading-tight", children: pendingEntry._clarification })
          ] })
        ] }),
        step === "resolve" && unresolvedEntities.length > 0 && /* @__PURE__ */ jsx(
          ResolveStep,
          {
            entity: unresolvedEntities[0],
            totalSteps: unresolvedEntities.length,
            currentStep: 1,
            onResolveEntity
          }
        ),
        step === "confirm" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`, children: /* @__PURE__ */ jsx(Icon, { size: 15, className: c.text }) }),
              /* @__PURE__ */ jsx("span", { className: `text-[12px] font-black uppercase tracking-widest ${c.text}`, children: label })
            ] }),
            ((_a = pendingEntry._context) == null ? void 0 : _a.parentContext) && /* @__PURE__ */ jsxs("div", { className: "px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-500", children: [
              /* @__PURE__ */ jsx("span", { className: "w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-cyan-200/80 uppercase", children: pendingEntry.intent === "CATAT_PENGIRIMAN" ? `Sisa: ${(pendingEntry._context.parentContext.quantity || pendingEntry._context.parentContext.qty_ekor) - pendingEntry._context.accumulatedTotal} ekor` : pendingEntry.intent === "CATAT_BAYAR" ? `Sisa: Rp ${((pendingEntry._context.parentContext.total_revenue || 0) - pendingEntry._context.accumulatedTotal).toLocaleString()}` : null })
            ] })
          ] }),
          dataEntries.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1.5 bg-white/[0.02] rounded-xl p-3", children: dataEntries.map(([key, val]) => {
            const formatted = formatValue(key, val);
            if (!formatted) return null;
            const isDirty = !!(pendingEntry._dirty || {})[key];
            return /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-[#4B6478] uppercase tracking-wider shrink-0", children: FIELD_LABELS[key] || key.replace(/_/g, " ") }),
              /* @__PURE__ */ jsx(
                InlineEditField,
                {
                  fieldKey: key,
                  value: val,
                  isDirty,
                  onEdit: (field, newVal) => onEdit == null ? void 0 : onEdit(pendingEntry.id, field, newVal),
                  options: dynamicFieldOptions[key]
                }
              )
            ] }, key);
          }) }),
          validation && !validation.valid && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5", children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 14, className: "text-red-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: validation.errors.map((e, i) => /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-red-300/90", children: e }, i)) })
          ] }),
          ((_b = validation == null ? void 0 : validation.warnings) == null ? void 0 : _b.length) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-amber-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: validation.warnings.map((w, i) => /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-amber-300/90", children: w }, i)) })
          ] }),
          isLowConfidence && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-amber-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] font-bold text-amber-300/90", children: [
              "AI kurang yakin (",
              Math.round(confidence * 100),
              "%) — cek datanya"
            ] })
          ] }),
          ((_c = pendingEntry._anomalies) == null ? void 0 : _c.length) > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1.5", children: pendingEntry._anomalies.map((a, i) => {
            var _a2;
            return /* @__PURE__ */ jsxs("div", { className: `flex items-start gap-2 rounded-xl px-3 py-2.5 border ${a.severity === "critical" ? "bg-red-500/10 border-red-500/30" : "bg-amber-500/5 border-amber-500/15"}`, children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: a.severity === "critical" ? "text-red-400 mt-0.5 shrink-0" : "text-amber-400 mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ jsxs("p", { className: `text-[11px] font-black uppercase tracking-widest ${a.severity === "critical" ? "text-red-400" : "text-amber-400"}`, children: [
                  "DETEKSI ANOMALI: ",
                  (_a2 = a.field) == null ? void 0 : _a2.replace(/_/g, " ")
                ] }),
                /* @__PURE__ */ jsx("p", { className: `text-[11px] font-bold ${a.severity === "critical" ? "text-red-300/90" : "text-amber-300/90"}`, children: a.reason })
              ] })
            ] }, i);
          }) }),
          pendingCommit && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-1 bg-emerald-500/20 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { ref: progressRef, className: "h-full bg-emerald-500 rounded-full", style: { width: "100%" } }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-emerald-400", children: "Menyimpan dalam 8 detik..." }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleCancelCommit,
                  className: "text-[11px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors",
                  children: "Batalkan"
                }
              )
            ] })
          ] }),
          !pendingCommit && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: onReject,
                disabled: isLoading,
                className: "flex-1 h-9 rounded-xl bg-white/[0.03] border border-white/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40",
                children: [
                  /* @__PURE__ */ jsx(X, { size: 13 }),
                  " Batal"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                disabled: isLoading || isLocked || validation && !validation.valid,
                onClick: handleConfirmClick,
                className: "flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-[12px] font-black text-black transition-all active:scale-[0.98]",
                children: isLoading ? /* @__PURE__ */ jsx(Loader2, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Check, { size: 15 }),
                  " Simpan"
                ] })
              }
            )
          ] })
        ] })
      ]
    }
  );
}
function AISuccessCard({ entry, onUndo, onClose, undoCountdown }) {
  if (!entry) return null;
  const { extracted_data: data, intent } = entry;
  const isPenjualan = intent === "CATAT_PENJUALAN";
  const isPembelian = intent === "CATAT_PEMBELIAN";
  const isPengiriman = intent === "CATAT_PENGIRIMAN";
  const source = (data == null ? void 0 : data.supplier_name) || (data == null ? void 0 : data.farm_name) || "Kandang";
  const dest = (data == null ? void 0 : data.rpa_name) || (data == null ? void 0 : data.customer_name) || "RPA / Pembeli";
  const weight = (data == null ? void 0 : data.weight_kg) ? (data.weight_kg / 1e3).toFixed(2) : 0;
  const qty = (data == null ? void 0 : data.qty_ekor) || 0;
  const formattedDate = (data == null ? void 0 : data.sale_date) || (data == null ? void 0 : data.purchase_date) || (data == null ? void 0 : data.departed_at) || (data == null ? void 0 : data.record_date) || /* @__PURE__ */ new Date();
  let displayDate = "Hari ini";
  try {
    displayDate = format(new Date(formattedDate), "dd MMM yyyy");
  } catch (_e) {
  }
  const revenue = isPenjualan ? (data.weight_kg || 0) * (data.price_per_kg || 0) : 0;
  const estimatedCost = isPenjualan ? revenue * 0.865 : 0;
  const marginEst = isPenjualan ? revenue - estimatedCost : 0;
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.95, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: -10 },
      className: "bg-[#111C24] mx-4 rounded-3xl p-6 border border-emerald-500/20 shadow-[0_10px_40px_rgba(2, 26, 2,0.1)] relative",
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10", children: /* @__PURE__ */ jsx(Check, { size: 32, className: "text-emerald-500" }) }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-center text-white font-bold text-xl tracking-tight", children: "Pesanan Dicatat!" }),
        /* @__PURE__ */ jsx("p", { className: "text-center justify-center text-[#4B6478] text-xs font-semibold mb-6", children: displayDate }),
        /* @__PURE__ */ jsxs("div", { className: "border border-white/5 bg-white/[0.02] rounded-2xl p-4 space-y-3 mb-4", children: [
          (isPembelian || isPenjualan) && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[13px]", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] font-medium", children: "Dari" }),
              /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: source })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[13px]", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] font-medium", children: "Ke" }),
              /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: dest })
            ] })
          ] }),
          isPengiriman && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[13px]", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] font-medium", children: "Kendaraan" }),
              /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: data.vehicle_plate || "-" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[13px]", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] font-medium", children: "Sopir" }),
              /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: data.driver_name || "-" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[13px] pt-2 border-t border-white/5 mt-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#4B6478] font-medium", children: "Berat" }),
            /* @__PURE__ */ jsxs("span", { className: "text-white font-bold tracking-tight", children: [
              weight,
              " ton ",
              /* @__PURE__ */ jsxs("span", { className: "text-[#4B6478] font-medium text-xs ml-1", children: [
                "· ",
                qty.toLocaleString("id-ID"),
                " ekor"
              ] })
            ] })
          ] })
        ] }),
        isPenjualan && revenue > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-[#0C1A14] border border-emerald-500/20 rounded-2xl p-4 mb-5 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-emerald-500/60 text-[10px] uppercase tracking-widest font-black mb-1", children: "Estimasi Keuntungan" }),
          /* @__PURE__ */ jsxs("p", { className: "text-emerald-400 text-2xl font-black mb-1 tracking-tighter", children: [
            "+Rp ",
            marginEst.toLocaleString("id-ID", { maximumFractionDigits: 0 })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[#4B6478] text-[10px] font-medium", children: [
            "Modal Rp ",
            estimatedCost.toLocaleString("id-ID", { maximumFractionDigits: 0 }),
            " · Jual Rp ",
            revenue.toLocaleString("id-ID", { maximumFractionDigits: 0 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          undoCountdown > 0 && onUndo && /* @__PURE__ */ jsxs("button", { onClick: onUndo, className: "h-11 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[12px] flex items-center justify-center gap-2 transition-colors border border-amber-500/20", children: [
            /* @__PURE__ */ jsx(Undo2, { size: 16 }),
            " Batal (",
            Math.ceil(undoCountdown / 1e3),
            "s)"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[12px] flex justify-center items-center transition-colors", children: "Tutup" })
        ] })
      ]
    }
  );
}
export {
  AGENT_STATE as A,
  AISuccessCard as a,
  AIConfirmCard as b,
  useAIQuota as c,
  useAIAssistant as u
};
