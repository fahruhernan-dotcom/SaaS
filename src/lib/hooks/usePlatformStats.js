/**
 * usePlatformStats — hook untuk mengambil data statistik landing page dari Supabase RPC.
 *
 * Sumber data: public.get_landing_stats()
 * RPC ini menggabungkan:
 *   - public.platform_stats  (data real dari cron job per jam)
 *   - public.site_config     (placeholder override dari admin Site Info)
 *
 * Behavior:
 *   - Jika admin mengisi stats_users/stats_transactions/stats_value di site_config,
 *     maka *_text fields mengembalikan teks admin tersebut.
 *   - Jika admin mengosongkannya, *_text fields mengembalikan data real terformat.
 *
 * Mapping label UI:
 *   active_users_text       → Pengguna Aktif
 *   total_transactions_text → Aktivitas Transaksi
 *   transaction_volume_text → Volume Penjualan
 *   active_businesses       → Bisnis Aktif (hanya angka, format manual jika perlu)
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** Default kosong — loading state menampilkan '—' bukan '0+' yang palsu */
const DEFAULT_STATS = {
  // Raw numbers (dari platform_stats)
  active_businesses: 0,
  active_users: 0,
  total_transactions: 0,
  transaction_volume: 0,
  market_listings: 0,
  // Pre-formatted text (admin override OR real data)
  active_users_text: '—',
  total_transactions_text: '—',
  transaction_volume_text: '—',
  // Admin config raw (opsional)
  stats_users_config: '',
  stats_transactions_config: '',
  stats_value_config: '',
  updated_at: null,
};

export function usePlatformStats() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      setLoading(true);

      const { data, error: rpcError } = await supabase.rpc('get_landing_stats');

      if (!mounted) return;

      if (rpcError) {
        console.error('[usePlatformStats] RPC error:', rpcError);
        setError(rpcError);
        setLoading(false);
        return;
      }

      // RPC bisa return array atau object tunggal
      const latest = Array.isArray(data) ? data[0] : data;

      if (!latest) {
        setLoading(false);
        return;
      }

      setStats({
        active_businesses: latest.active_businesses ?? 0,
        active_users: latest.active_users ?? 0,
        total_transactions: latest.total_transactions ?? 0,
        transaction_volume: latest.transaction_volume ?? 0,
        market_listings: latest.market_listings ?? 0,
        // Pre-formatted: admin override atau real data (sudah diformat di DB)
        active_users_text: latest.active_users_text ?? '—',
        total_transactions_text: latest.total_transactions_text ?? '—',
        transaction_volume_text: latest.transaction_volume_text ?? '—',
        // Raw admin config values
        stats_users_config: latest.stats_users_config ?? '',
        stats_transactions_config: latest.stats_transactions_config ?? '',
        stats_value_config: latest.stats_value_config ?? '',
        updated_at: latest.updated_at ?? null,
      });

      setLoading(false);
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading, error };
}

// ─── Formatters (masih dipakai untuk non-stats-bar display) ──────────────────

/**
 * formatCompactNumber(20)      → "20"
 * formatCompactNumber(1200)    → "1.2rb"
 * formatCompactNumber(50000)   → "50rb"
 * formatCompactNumber(1500000) → "1.5jt"
 */
export function formatCompactNumber(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1).replace('.0', '')}rb`;
  return String(n);
}

/**
 * formatRupiahCompact(1400000)    → "Rp1.4jt+"
 * formatRupiahCompact(250000000)  → "Rp250jt+"
 * formatRupiahCompact(2600000000) → "Rp2.6 Miliar+"
 */
export function formatRupiahCompact(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1).replace('.0', '')} Miliar+`;
  if (n >= 1_000_000)     return `Rp${(n / 1_000_000).toFixed(1).replace('.0', '')}jt+`;
  if (n >= 1_000)         return `Rp${(n / 1_000).toFixed(1).replace('.0', '')}rb+`;
  return `Rp${n}+`;
}
