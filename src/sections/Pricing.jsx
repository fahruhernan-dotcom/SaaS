import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Sparkles, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import AnimatedPrice from '../components/AnimatedPrice';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import { usePricingConfig, usePlanConfigs } from '@/lib/hooks/useAdminData';

// Social proof avatars for BUSINESS card
const AVATARS = [
  { bg: '#10B981', initials: 'BP' },
  { bg: '#7C3AED', initials: 'SA' },
  { bg: '#F59E0B', initials: 'RK' },
  { bg: '#3B82F6', initials: 'DW' },
  { bg: '#EC4899', initials: 'NF' },
];

const Pricing = ({ activeRole, setActiveRole }) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const switchRef = useRef(null);

  const { data: dbPricing } = usePricingConfig();
  const { data: dbConfigs } = usePlanConfigs();

  const handleToggle = useCallback((checked) => {
    setIsAnnual(checked);
    if (checked) {
      const rect = switchRef.current?.getBoundingClientRect();
      if (rect) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ['#10B981', '#34D399', '#F59E0B'],
        });
      }
    }
  }, []);

  const getPrices = (role) => {
    const discountPct = dbConfigs?.annual_discount?.discount_percent || 20;
    
    let basePro = 0; let baseBiz = 0;
    let originalPro = 0; let originalBiz = 0;
    
    // Default fallback values
    switch (role) {
      case 'peternak':
        basePro = 499000; baseBiz = 999000; break;
      case 'rpa':
        basePro = 699000; baseBiz = 1499000; break;
      case 'broker':
      default:
        basePro = 999000; baseBiz = 1499000; break;
    }
    
    originalPro = basePro + 500000;
    originalBiz = baseBiz + 1000000;
    
    // Override with DB data if available
    if (dbPricing?.[role]) {
      if (dbPricing[role].pro) {
          basePro = dbPricing[role].pro.price;
          originalPro = dbPricing[role].pro.originalPrice || basePro + 500000;
      }
      if (dbPricing[role].business) {
          baseBiz = dbPricing[role].business.price;
          originalBiz = dbPricing[role].business.originalPrice || baseBiz + 1000000;
      }
    }
    
    const proAnnual = Math.round(basePro * (1 - (discountPct / 100)));
    const bizAnnual = Math.round(baseBiz * (1 - (discountPct / 100)));
    
    return {
      pro: basePro,
      biz: baseBiz,
      proAnnual: proAnnual,
      bizAnnual: bizAnnual,
      proAnchor: originalPro,
      bizAnchor: originalBiz,
      proSaving: (basePro - proAnnual) * 12,
      bizSaving: (baseBiz - bizAnnual) * 12,
      bizAnnualLoss: (baseBiz * 12) - (bizAnnual * 12),
    };
  };

  const currentPrices = useMemo(() => getPrices(activeRole), [activeRole, dbPricing, dbConfigs]);
  const discountPctDisplay = dbConfigs?.annual_discount?.discount_percent || 20;

  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID').format(n);

  const plans = useMemo(() => {
    const trialPro = dbConfigs?.trial_config?.pro || 14;
    const trialBiz = dbConfigs?.trial_config?.business || 14;

    const starterFeatures = {
      peternak: [
        { text: '1 Kandang aktif', highlight: false },
        { text: '1 Jenis ternak', highlight: false },
        { text: 'Input harian & laporan dasar', highlight: false },
        { text: 'FCR & IP Score tracking', highlight: false },
        { text: 'Akses mobile dashboard', highlight: false },
      ],
      broker: [
        { text: 'Input transaksi harian', highlight: false },
        { text: 'Laporan harian dasar', highlight: false },
        { text: 'Manajemen 1 armada/sopir', highlight: false },
        { text: 'Harga pasar realtime', highlight: false },
        { text: 'Akses mobile dashboard', highlight: false },
      ],
      rpa: [
        { text: 'Input harian operasional', highlight: false },
        { text: 'Laporan stok dasar', highlight: false },
        { text: 'Manajemen 1 unit RPA', highlight: false },
        { text: 'Harga pasar realtime', highlight: false },
        { text: 'Akses mobile dashboard', highlight: false },
      ]
    };

    return [
      {
        name: 'STARTER',
        subtitle: activeRole === 'broker' ? 'Broker' : activeRole === 'peternak' ? 'Peternak' : 'RPA',
        price: 'Gratis',
        description: 'Langkah awal digitalisasi bisnismu secara gratis selamanya.',
        features: starterFeatures[activeRole] || starterFeatures.peternak,
        buttonText: 'Mulai Gratis',
        href: '/register',
        isPopular: false,
        isSocial: false,
        anchorPrice: 0,
        monthlyPrice: 0,
        annualPrice: 0,
        savingAmount: 0,
      },
      {
        name: 'PRO',
        subtitle: activeRole === 'broker' ? 'Broker' : activeRole === 'peternak' ? 'Peternak' : 'RPA',
        monthlyPrice: currentPrices.pro,
        annualPrice: currentPrices.proAnnual,
        anchorPrice: currentPrices.proAnchor,
        savingAmount: currentPrices.proSaving,
        description: 'Solusi lengkap untuk manajemen operasional harian.',
        features: [
          { text: activeRole === 'peternak' ? 'Manajemen kandang & populasi' : 'Manajemen transaksi & operasional', highlight: false },
          { text: activeRole === 'peternak' ? 'Tracking pakan & mortalitas' : 'Tracking pengiriman & loss report', highlight: false },
          { text: activeRole === 'peternak' ? 'Prediksi panen & bobot' : 'RPA & piutang management', highlight: false },
          { text: 'Cash flow & laporan keuangan', highlight: false },
          { text: activeRole === 'broker' ? 'Armada & tim (maks 3 anggota)' : 'Manajemen tim & akses', highlight: false },
          { text: 'Harga pasar realtime', highlight: false },
        ],
        buttonText: `Mulai ${trialPro} Hari Gratis`,
        href: '/register',
        isPopular: false,
        isSocial: false,
      },
      {
        name: 'BUSINESS',
        subtitle: activeRole === 'broker' ? 'Broker' : activeRole === 'peternak' ? 'Peternak' : 'RPA',
        monthlyPrice: currentPrices.biz,
        annualPrice: currentPrices.bizAnnual,
        anchorPrice: currentPrices.bizAnchor,
        savingAmount: currentPrices.bizSaving,
        annualLoss: currentPrices.bizAnnualLoss,
        description: 'Optimalkan profit dengan kecerdasan buatan dan analitik mendalam.',
        features: [
          { text: 'Semua fitur PRO', highlight: false },
          { text: 'TernakBot AI (Grok 4.1 Fast)', highlight: true },
          { text: 'Analisis profit otomatis', highlight: false },
          { text: 'Deteksi anomali transaksi', highlight: false },
          { text: activeRole === 'peternak' ? 'AI Health Monitor (Beta)' : 'Prediksi panen AI', highlight: true },
          { text: 'Laporan PDF/Excel otomatis', highlight: false },
          { text: 'Tim unlimited', highlight: false },
        ],
        buttonText: `Mulai ${trialBiz} Hari Gratis`,
        href: '/register',
        isPopular: true,
        isSocial: true,
      },
    ];
  }, [activeRole, currentPrices, dbConfigs]);

  const faqs = [
    { q: 'Bisa cancel kapan saja?', a: 'Tentu. Tidak ada kontrak panjang. Anda bisa berhenti berlangganan kapan saja.' },
    { q: 'Kalau HP rusak, data saya hilang?', a: 'Tidak. Semua data tersimpan aman di cloud TernakOS. Cukup login di HP baru, semua data kembali seperti semula.' },
    { q: 'Komoditas apa yang didukung sekarang?', a: 'Saat ini TernakOS berfokus pada ayam broiler dan pejantan. Kami akan terus menambah komoditas lain.' },
    { q: 'Apakah data saya aman?', a: 'Sangat aman. Kami menggunakan enkripsi kelas bank untuk melindungi data transaksi dan harga pasar Anda. Data Anda tidak akan dibagikan ke pihak ketiga.' },
  ];

  return (
    <section id="harga" className="bg-[#06090F] section-padding relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-5 relative z-10">
        <div className="text-center mb-10">
          <AnimatedContent direction="vertical" distance={20}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3.5">
              <Sparkles size={12} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">PRICING PLANS</span>
            </div>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={30} delay={0.1}>
            <h2 className="font-display text-2xl md:text-3xl font-black text-white mb-3.5 uppercase tracking-tight">
              PILIH PLAN <span className="text-emerald-500">TERBAIKMU</span>
            </h2>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={20} delay={0.2}>
            <p className="text-[#94A3B8] max-w-lg mx-auto mb-8 text-sm font-medium leading-relaxed">
              Mulai gratis selamanya dengan paket Starter, atau pilih plan Pro/Business untuk fitur yang lebih powerful.
            </p>
          </AnimatedContent>

          {/* Role Toggle Tabs */}
          <AnimatedContent direction="vertical" distance={20} delay={0.25} className="flex justify-center mb-8">
            <div className="inline-flex bg-[#111C24] border border-white/10 p-1.5 rounded-full relative z-20 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              {['broker', 'peternak', 'rpa'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-4 sm:px-6 md:px-8 py-2.5 rounded-full font-display text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${activeRole === role
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_2px_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                      : 'text-[#4B6478] hover:text-white hover:bg-white/[0.03]'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </AnimatedContent>

          {/* Toggle Switch */}
          <AnimatedContent direction="vertical" distance={20} delay={0.3}>
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-[11px] font-black uppercase tracking-widest ${!isAnnual ? 'text-white' : 'text-[#4B6478]'}`}>
                Bulanan
              </span>
              <div ref={switchRef}>
                <Switch checked={isAnnual} onCheckedChange={handleToggle} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-widest ${isAnnual ? 'text-white' : 'text-[#4B6478]'}`}>
                  Tahunan
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                  Hemat {discountPctDisplay}%
                </span>
              </div>
            </div>
          </AnimatedContent>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={
                plan.isPopular
                  ? { opacity: 1, y: -8, scale: 1 }
                  : { opacity: 1, y: 0, scale: 0.98 }
              }
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={cn(
                'relative p-2 md:p-8 rounded-xl md:rounded-[32px] border flex flex-col h-full transition-all duration-300',
                plan.isPopular
                  ? 'bg-[#0C1319] border-emerald-500 border-[1.5px] md:border-2 shadow-[0_12px_24px_-8px_rgba(16,185,129,0.2)] md:shadow-[0_32px_64px_-16px_rgba(16,185,129,0.2)] z-10'
                  : 'bg-[#0C1319] border-white/8 hover:border-white/20'
              )}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 px-2 md:px-4 py-0.5 md:py-1 rounded-full bg-emerald-500 text-white text-[7px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 whitespace-nowrap z-20">
                  Paling Populer
                </div>
              )}

              {/* Card header */}
              <div className="mb-3 md:mb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-1 md:gap-2 mb-2 md:mb-6">
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className={cn('text-[7px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em]', plan.isPopular ? 'text-emerald-500' : 'text-[#4B6478]')}>
                      {plan.name === 'ENTERPRISE' ? '' : plan.subtitle}
                    </span>
                    <h3 className="font-display text-[11px] md:text-2xl font-black text-white uppercase leading-none md:leading-normal">{plan.name}</h3>
                  </div>

                  {/* Social proof avatars — BUSINESS only */}
                  {plan.isSocial && (
                    <div className="hidden md:flex flex-col items-end gap-1">
                      <div className="flex -space-x-2">
                        {AVATARS.map((av, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full border-2 border-[#0C1319] flex items-center justify-center text-[8px] font-black text-white shrink-0"
                            style={{ backgroundColor: av.bg }}
                          >
                            {av.initials}
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-[#94A3B8]">+500 bisnis aktif</span>
                    </div>
                  )}
                </div>

                {/* Pricing block */}
                <div className="mb-2 md:mb-4">
                  {plan.price === 'Gratis' ? (
                    <div className="h-6 md:h-12 flex items-center">
                      <span className="text-xs md:text-4xl font-black text-white uppercase tracking-tight">GRATIS</span>
                    </div>
                  ) : plan.price === 'Custom' ? (
                    <div className="h-6 md:h-12 flex items-center">
                      <span className="text-xs md:text-4xl font-black text-white uppercase tracking-tight">CUSTOM</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5 md:space-y-1">
                      {/* Anchoring: strikethrough original price */}
                      <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2">
                        <span className="text-[8px] md:text-sm font-bold text-[#4B6478] line-through">
                          {formatRupiah(plan.anchorPrice)}
                        </span>
                        <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                          Hemat Rp {formatRupiah(plan.savingAmount)}/bln
                        </span>
                      </div>

                      {/* Actual price with animated number */}
                      <div className="flex items-baseline gap-0.5 md:gap-1 h-6 md:h-10">
                        <span className="text-[10px] md:text-lg font-black text-white tracking-tight mr-0.5">Rp</span>
                        <AnimatedPrice
                          value={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                          className="text-[13px] md:text-4xl font-black text-white tabular-nums tracking-tighter"
                        />
                        <span className="text-[#4B6478] text-[7px] md:text-[10px] font-black uppercase tracking-widest ml-0.5">/Bln</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Annual savings badge */}
                {isAnnual && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 mb-2"
                  >
                    <TrendingUp size={10} className="text-emerald-500" />
                    <span className="text-[8px] md:text-[10px] font-bold text-emerald-500">
                      Bayar Rp {formatRupiah((isAnnual ? plan.annualPrice : plan.monthlyPrice) * 12)}/tahun
                    </span>
                  </motion.div>
                )}

                {/* Savings highlight — BUSINESS, monthly mode (DESKTOP ONLY) */}
                {plan.isSocial && !isAnnual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="hidden md:flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15 mb-4"
                  >
                    <Sparkles size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-bold text-emerald-400 leading-snug">
                      Hemat Rp {formatRupiah(plan.annualLoss)}/tahun dengan beralih ke Plan Tahunan
                    </span>
                  </motion.div>
                )}

                {/* Subtitle / desc */}
                <p className="hidden md:block text-[#94A3B8] text-xs leading-relaxed mb-8">
                  {plan.description}
                </p>
              </div>

              {/* Feature list */}
              <div className="flex-1 space-y-1 md:space-y-3.5 mb-4 md:mb-8 min-h-[140px] md:min-h-0">
                {plan.features.slice(0, 5).map((feature, i) => (
                  <div key={i} className="flex items-center md:items-start gap-1 md:gap-3 group/feat">
                    <div className={cn(
                      'shrink-0 w-3 h-3 md:w-5 md:h-5 rounded-full flex items-center justify-center transition-colors',
                      feature.highlight ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'
                    )}>
                      <Check size={8} className="md:w-3 md:h-3" strokeWidth={4} />
                    </div>
                    <span className={cn(
                      'text-[7px] md:text-[14px] leading-tight md:leading-relaxed transition-colors line-clamp-1 md:line-clamp-none',
                      feature.highlight ? 'text-white font-bold' : 'text-[#94A3B8] font-medium group-hover/feat:text-white'
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
                {/* Mobile more hint */}
                <div className="md:hidden text-[6px] text-zinc-600 font-bold uppercase tracking-widest pl-4">
                  + {plan.features.length - 5} Fitur lainnya
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto space-y-2 md:space-y-4">
                <Button
                  asChild
                  className={cn(
                    'w-full py-2 md:py-6 h-auto font-display text-[8px] md:text-sm font-black uppercase tracking-widest rounded-lg md:rounded-2xl transition-all duration-300 active:scale-95',
                    plan.isPopular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  )}
                >
                  {plan.href.startsWith('http') ? (
                    <a href={plan.href} target="_blank" rel="noopener noreferrer">
                      {plan.buttonText}
                    </a>
                  ) : (
                    <Link to={plan.href}>{plan.buttonText}</Link>
                  )}
                </Button>

                {/* 30-Day Guarantee Label */}
                <div className="flex items-center justify-center gap-1 opacity-60 md:opacity-100">
                  <CheckCircle2 size={7} className="md:w-3 md:h-3 text-emerald-500" />
                  <span className="text-[6px] md:text-[11px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">
                    Garansi 30 Hari
                  </span>
                </div>
              </div>

              {/* Social proof bottom — BUSINESS (Desktop ONLY) */}
              {plan.isSocial && (
                <div className="hidden md:flex items-center justify-center gap-1.5 mt-4">
                  <Users size={11} className="text-[#4B6478]" />
                  <span className="text-[10px] font-bold text-[#4B6478]">
                    Dipercaya 500+ bisnis aktif
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-xl mx-auto mt-16">
          <div className="text-center mb-10">
            <h3 className="font-display text-lg font-black text-white uppercase tracking-[0.15em]">Pertanyaan Umum</h3>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-4 py-3.5 flex justify-between items-center bg-transparent group"
                >
                  <span className="font-display text-[13px] font-bold text-white uppercase tracking-wide group-hover:text-emerald-500 transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'text-[#4B6478] transition-transform duration-300 shrink-0',
                      openFaq === i && 'rotate-180 text-emerald-500'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-4 pb-4 text-[13px] font-medium text-[#94A3B8] leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
