import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import anime from '../lib/animation';
import { usePlatformStats } from '@/lib/hooks/usePlatformStats';
import { usePlanConfigs } from '@/lib/hooks/useAdminData';

/**
 * StatsBar — menampilkan 4 counter platform publik.
 *
 * Data: get_landing_stats() RPC
 *   - Jika admin mengisi site_config.stats_*, tampilkan placeholder admin.
 *   - Jika kosong, tampilkan data real dari platform_stats (cron per jam).
 *
 * Loading state: '—' (tidak tampilkan '0+' palsu saat fetch)
 */
const StatsBar = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const { stats, loading } = usePlatformStats();
  const { data: planConfigs } = usePlanConfigs();

  const DASH = '—';
  const trialDays = planConfigs?.trial_config?.pro ?? 14;

  const items = [
    {
      value: loading ? DASH : stats.active_users_text,
      label: 'Pengguna Aktif',
      isLive: !loading,
    },
    {
      value: loading ? DASH : stats.total_transactions_text,
      label: 'Aktivitas Transaksi',
      isLive: !loading,
    },
    {
      value: loading ? DASH : stats.transaction_volume_text,
      label: 'Volume Penjualan',
      isLive: !loading,
      isShiny: true,
    },
    {
      value: `${trialDays} Hari`,
      label: 'Coba Gratis',
      isLive: false,
    },
  ];

  useEffect(() => {
    if (!isInView || !ref.current) return;
    const cards = ref.current.querySelectorAll('.stat-card');
    if (!cards.length) return;
    anime({
      targets: cards,
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(150, { from: 'center' }),
      duration: 800,
      easing: 'easeOutExpo',
    });
  }, [isInView]);

  return (
    <section className="bg-bg-base border-y border-border-subtle py-12 px-6" ref={ref}>
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div
              key={i}
              className={`stat-card text-center flex flex-col justify-center ${i < 3 ? 'md:border-r border-border-subtle' : ''}`}
              style={{ opacity: 0 }}
            >
              {/* Nilai */}
              <div className="font-display text-3xl font-black text-text-primary mb-1">
                {item.value}
              </div>

              {/* Label + live dot */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] tracking-wide text-text-muted mt-1">
                {item.isLive && (
                  <span
                    className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse inline-block"
                    title="Data real-time dari transaksi aktual"
                  />
                )}
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default StatsBar;
