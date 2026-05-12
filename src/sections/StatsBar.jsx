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
    <section className="bg-[#0A0F16] py-4 md:py-8 px-4 md:px-[80px]" ref={ref}>
      <motion.div
        className="max-w-[1280px] mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-4 gap-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="stat-card bg-[#0A0F16] text-center p-2 md:p-[20px_12px] flex flex-col justify-center"
              style={{ opacity: 0 }}
            >
              {/* Nilai */}
              <div className="font-display font-extrabold text-[#F1F5F9] tracking-tighter leading-none text-[12px] md:text-[32px] lg:text-[42px]">
                {item.value}
              </div>

              {/* Label + live dot */}
              <div className="mt-1 md:mt-2 font-bold tracking-tight md:tracking-widest text-[7px] md:text-[11px] flex items-center justify-center gap-1 text-[#4B6478]">
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

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.35 } : { opacity: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center text-[7px] md:text-[10px] text-[#4B6478] mt-4 md:mt-6 uppercase tracking-[0.18em] font-bold"
        >
          *Data diperbarui otomatis setiap jam dari transaksi nyata
        </motion.p>
      </motion.div>
    </section>
  );
};

export default StatsBar;
