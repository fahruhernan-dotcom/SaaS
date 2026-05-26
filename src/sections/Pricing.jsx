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
import { usePlatformStats, formatCompactNumber } from '@/lib/hooks/usePlatformStats';
import { useAuth } from '@/lib/hooks/useAuth';

// Social proof avatars for BUSINESS card
const AVATARS = [
  { bg: '#021a02', initials: 'BP' },
  { bg: '#7C3AED', initials: 'SA' },
  { bg: '#F59E0B', initials: 'RK' },
  { bg: '#3B82F6', initials: 'DW' },
  { bg: '#EC4899', initials: 'NF' },
];

const Pricing = ({ activeRole, setActiveRole }) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobilePlanIdx, setMobilePlanIdx] = useState(1); // default PRO
  const switchRef = useRef(null);

  const { user } = useAuth();
  const isLoggedIn = !!user;

  const { data: dbPricing } = usePricingConfig();
  const { data: dbConfigs } = usePlanConfigs();

  const { stats, loading: statsLoading } = usePlatformStats();
  const activeBizLabel = statsLoading
    ? '—'
    : `${formatCompactNumber(stats.active_businesses)}+ bisnis aktif`;

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
          colors: ['#021a02', '#021a02', '#F59E0B'],
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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- React Compiler skip; manual useMemo must remain for pricing calculation
  const currentPrices = useMemo(() => getPrices(activeRole), [activeRole, dbPricing, dbConfigs]); // eslint-disable-line react-hooks/preserve-manual-memoization
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
        { text: 'Pencatatan pakan & operasional', highlight: false },
        { text: 'FCR & IP Score dasar', highlight: false },
        { text: 'Akses Mobile Kandang Map', highlight: false },
      ],
      broker: [
        { text: 'Input transaksi Ayam & Sembako', highlight: false },
        { text: 'Manajemen 1 armada / gudang', highlight: false },
        { text: 'Pelacakan piutang & hutang', highlight: false },
        { text: 'Kasir & Sales Wizard dasar', highlight: false },
      ],
      rpa: [
        { text: 'Input produksi potong', highlight: false },
        { text: 'Manajemen 1 unit RPA', highlight: false },
        { text: 'Laporan stok gudang dasar', highlight: false },
        { text: 'Pelacakan hutang broker', highlight: false },
      ]
    };

    const getSubtitle = (role) => {
      switch (role) {
        case 'broker': return 'Broker Ayam & Sembako';
        case 'peternak': return 'Peternak';
        case 'rpa': return 'Rumah Potong';
        default: return 'User';
      }
    };

    const getProFeatures = (role) => {
      switch (role) {
        case 'peternak': return [
          { text: 'Manajemen Kandang Interaktif', highlight: false },
          { text: 'Pencatatan biaya operasional detail', highlight: false },
          { text: 'Penugasan Tim (Daily Task)', highlight: false },
          { text: 'Kalkulasi FCR & IP Score Otomatis', highlight: true },
          { text: 'Prediksi panen & bobot', highlight: false },
          { text: 'Harga pasar realtime', highlight: false },
        ];
        case 'broker': return [
          { text: 'Transaksi Real-time (Ayam & Sembako)', highlight: false },
          { text: 'Kasir Sales Wizard & Retur Barang', highlight: true },
          { text: 'Pelacakan Piutang & Hutang Otomatis', highlight: true },
          { text: 'Manajemen Armada & Stok Gudang', highlight: false },
          { text: 'Profit Margin Calculator', highlight: false },
          { text: 'Tim & Multi-Cabang (maks 5 anggota)', highlight: false },
        ];
        case 'rpa': return [
          { text: 'Manajemen Produksi & Potong', highlight: false },
          { text: 'Integrasi pembelian dari Broker', highlight: false },
          { text: 'Pelacakan Hutang ke Broker detail', highlight: true },
          { text: 'Manajemen Stok Gudang realtime', highlight: false },
          { text: 'Manajemen tim (maks 5 anggota)', highlight: false },
          { text: 'Laporan yield karkas otomatis', highlight: false },
        ];
        default: return [];
      }
    };

    return [
      {
        name: 'STARTER',
        subtitle: getSubtitle(activeRole),
        price: 'Gratis',
        description: 'Langkah awal digitalisasi bisnismu secara gratis selamanya.',
        features: starterFeatures[activeRole] || starterFeatures.peternak,
        buttonText: 'Mulai Gratis',
        href: isLoggedIn ? '/' : '/register',
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
        features: getProFeatures(activeRole),
        buttonText: `Mulai ${trialPro} Hari Gratis`,
        href: isLoggedIn ? '/upgrade?plan=pro' : '/register',
        isPopular: false,
        isSocial: false,
      },
      {
        name: 'BUSINESS',
        subtitle: getSubtitle(activeRole),
        monthlyPrice: currentPrices.biz,
        annualPrice: currentPrices.bizAnnual,
        anchorPrice: currentPrices.bizAnchor,
        savingAmount: currentPrices.bizSaving,
        annualLoss: currentPrices.bizAnnualLoss,
        description: 'Optimalkan profit dengan kecerdasan buatan dan analitik mendalam.',
        features: [
          { text: 'Semua fitur PRO', highlight: false },
          { text: 'TernakBot AI (Grok 4.1 Fast)', highlight: true },
          { text: 'Analisis profit & efisiensi AI', highlight: false },
          { text: 'Deteksi anomali operasional', highlight: false },
          { text: activeRole === 'peternak' ? 'AI Health Monitor (Beta)' : activeRole === 'broker' ? 'Prediksi Harga & Stok AI' : 'Prediksi panen & harga AI', highlight: true },
          { text: 'Laporan PDF/Excel otomatis', highlight: false },
          { text: 'Tim unlimited', highlight: false },
        ],
        buttonText: `Mulai ${trialBiz} Hari Gratis`,
        href: isLoggedIn ? '/upgrade?plan=business' : '/register',
        isPopular: true,
        isSocial: true,
      },
    ];
  }, [activeRole, currentPrices, dbConfigs, isLoggedIn]);

  const faqs = [
    { q: 'Bisa cancel kapan saja?', a: 'Tentu. Tidak ada kontrak panjang. Anda bisa berhenti berlangganan kapan saja.' },
    { q: 'Kalau HP rusak, data saya hilang?', a: 'Tidak. Semua data tersimpan aman di cloud TernakOS. Cukup login di HP baru, semua data kembali seperti semula.' },
    { q: 'Komoditas apa yang didukung sekarang?', a: 'Saat ini TernakOS berfokus pada sapi potong, domba, kambing, ayam broiler dan pejantan. Kami akan terus menambah komoditas lain.' },
    { q: 'Apakah data saya aman?', a: 'Sangat aman. Kami menggunakan enkripsi kelas bank untuk melindungi data transaksi dan harga pasar Anda. Data Anda tidak akan dibagikan ke pihak ketiga.' },
  ];

  return (
    <section id="harga" className="bg-bg-base py-20 px-5 border-t border-border-subtle relative overflow-hidden">

      <div className="max-w-[1280px] mx-auto px-5 relative z-10">
        <div className="text-center mb-10">
          <AnimatedContent direction="vertical" distance={20}>
            <div className="badge-premium mb-3.5">
              <Sparkles size={12} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">PRICING PLANS</span>
            </div>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={30} delay={0.1}>
            <h2 className="font-display text-2xl md:text-3xl font-normal text-text-primary mb-3.5 uppercase tracking-tight">
              PILIH PLAN <span className="text-emerald-500">TERBAIKMU</span>
            </h2>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={20} delay={0.2}>
            <p className="text-text-secondary max-w-lg mx-auto mb-8 text-sm md:text-base font-medium leading-relaxed">
              Mulai gratis selamanya dengan paket Starter, atau pilih plan Pro/Business untuk fitur yang lebih powerful.
            </p>
          </AnimatedContent>

          {/* Role Toggle Tabs */}
          <AnimatedContent direction="vertical" distance={20} delay={0.25} className="flex justify-center mb-8">
            <div className="inline-flex bg-bg-2 border border-border-default p-1 rounded-full shadow-sm">
              {['broker', 'peternak', 'rpa'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-5 py-2.5 rounded-full font-body text-[11px] font-bold tracking-wider uppercase transition-all duration-300 ${activeRole === role
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-3/50'
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
              <span className={`text-[11px] font-black uppercase tracking-widest ${!isAnnual ? 'text-text-primary' : 'text-text-muted'}`}>
                Bulanan
              </span>
              <div ref={switchRef}>
                <Switch checked={isAnnual} onCheckedChange={handleToggle} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-widest ${isAnnual ? 'text-text-primary' : 'text-text-muted'}`}>
                  Tahunan
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                  Hemat {discountPctDisplay}%
                </span>
              </div>
            </div>
          </AnimatedContent>
        </div>

        {/* Mobile Plan Tabs */}
        <div className="md:hidden flex justify-center mb-6">
          <div className="inline-flex bg-bg-2 border border-border-default p-1 rounded-full">
            {plans.map((plan, idx) => (
              <button
                key={plan.name}
                onClick={() => setMobilePlanIdx(idx)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200',
                  mobilePlanIdx === idx
                    ? plan.isPopular ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-bg-3 text-text-primary'
                    : 'text-text-muted hover:text-text-primary/70'
                )}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards — Mobile: single card, Desktop: 3-col grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
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
                'relative p-6 md:p-8 rounded-[24px] border flex flex-col h-full transition-all duration-300',
                plan.isPopular
                  ? 'bg-bg-1 border-emerald-500 border-2 shadow-card z-10'
                  : 'bg-bg-2/50 border-border-default hover:border-border-strong shadow-card'
              )}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap z-20">
                  Paling Populer
                </div>
              )}

              {/* Card header */}
              <div className="mb-3 md:mb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-1 md:gap-2 mb-2 md:mb-6">
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className={cn('text-[9px] font-black uppercase tracking-wider', plan.isPopular ? 'text-emerald-500' : 'text-text-muted')}>
                      {plan.name === 'ENTERPRISE' ? '' : plan.subtitle}
                    </span>
                    <h3 className="font-display text-[11px] md:text-2xl font-black text-text-primary uppercase leading-none md:leading-normal">{plan.name}</h3>
                  </div>

                  {/* Social proof avatars — BUSINESS only */}
                  {plan.isSocial && (
                    <div className="hidden md:flex flex-col items-end gap-1">
                      <div className="flex -space-x-2">
                        {AVATARS.map((av, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full border-2 border-bg-1 flex items-center justify-center text-[8px] font-black text-white shrink-0"
                            style={{ backgroundColor: av.bg }}
                          >
                            {av.initials}
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-text-secondary">
                        {activeBizLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing block */}
                <div className="mb-2 md:mb-4">
                  {plan.price === 'Gratis' ? (
                    <div className="h-6 md:h-12 flex items-center">
                      <span className="text-xs md:text-4xl font-black text-text-primary uppercase tracking-tight">GRATIS</span>
                    </div>
                  ) : plan.price === 'Custom' ? (
                    <div className="h-6 md:h-12 flex items-center">
                      <span className="text-xs md:text-4xl font-black text-text-primary uppercase tracking-tight">CUSTOM</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5 md:space-y-1">
                      {/* Anchoring: strikethrough original price */}
                      <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2">
                        <span className="text-[8px] md:text-sm font-bold text-text-muted line-through">
                          {formatRupiah(plan.anchorPrice)}
                        </span>
                        <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest">
                          Hemat Rp {formatRupiah(plan.savingAmount)}/bln
                        </span>
                      </div>

                      {/* Actual price with animated number */}
                      <div className="flex items-baseline gap-0.5 md:gap-1 h-6 md:h-10">
                        <span className="text-[10px] md:text-lg font-black text-text-primary tracking-tight mr-0.5">Rp</span>
                        <AnimatedPrice
                          value={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                          className="text-[13px] md:text-4xl font-black text-text-primary tabular-nums tracking-tighter"
                        />
                        <span className="text-text-muted text-[7px] md:text-[10px] font-black uppercase tracking-widest ml-0.5">/Bln</span>
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
                    <Sparkles size={12} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 leading-snug">
                      Hemat Rp {formatRupiah(plan.annualLoss)}/tahun dengan beralih ke Plan Tahunan
                    </span>
                  </motion.div>
                )}

                {/* Subtitle / desc */}
                <p className="hidden md:block text-text-secondary text-xs leading-relaxed mb-8">
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
                      feature.highlight ? 'text-text-primary font-bold' : 'text-text-secondary font-medium group-hover/feat:text-text-primary'
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
                    'w-full py-2 md:py-6 h-auto font-display text-[8px] md:text-sm font-black uppercase tracking-widest rounded-full transition-all duration-300 active:scale-95 border',
                    plan.isPopular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-transparent shadow-lg shadow-emerald-500/25'
                      : 'bg-bg-3/20 hover:bg-bg-3/50 text-text-primary border-border-default'
                  )}
                >
                  {plan.href.startsWith('http') ? (
                    <a href={plan.href} target="_blank" rel="noopener noreferrer">
                      {plan.buttonText}
                    </a>
                  ) : (
                    <Link
                      to={plan.href}
                      onClick={() => {
                        if (!isLoggedIn && (plan.name === 'PRO' || plan.name === 'BUSINESS')) {
                          sessionStorage.setItem('intended_trial_plan', plan.name.toLowerCase());
                        }
                      }}
                    >
                      {plan.buttonText}
                    </Link>
                  )}
                </Button>

                {/* 30-Day Guarantee Label */}
                <div className="flex items-center justify-center gap-1 opacity-60 md:opacity-100">
                  <CheckCircle2 size={7} className="md:w-3 md:h-3 text-emerald-500" />
                  <span className="text-[6px] md:text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none">
                    Garansi 30 Hari
                  </span>
                </div>
              </div>

              {/* Social proof bottom — BUSINESS (Desktop ONLY) */}
              {plan.isSocial && (
                <div className="hidden md:flex items-center justify-center gap-1.5 mt-4">
                  <Users size={11} className="text-text-muted" />
                  <span className="text-[10px] font-bold text-text-muted">
                    Dipercaya {activeBizLabel}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mobile: Single card display */}
        <div className="md:hidden max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={plans[mobilePlanIdx].name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'relative p-6 rounded-2xl border flex flex-col transition-all shadow-card',
                plans[mobilePlanIdx].isPopular
                  ? 'bg-bg-1 border-emerald-500 border-2'
                  : 'bg-bg-2 border-border-subtle'
              )}
            >
              {plans[mobilePlanIdx].isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 whitespace-nowrap z-20">
                  Paling Populer
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={cn('text-[10px] font-black uppercase tracking-[0.15em]', plans[mobilePlanIdx].isPopular ? 'text-emerald-500' : 'text-text-muted')}>
                      {plans[mobilePlanIdx].subtitle}
                    </span>
                    <h3 className="font-display text-xl font-black text-text-primary uppercase">{plans[mobilePlanIdx].name}</h3>
                  </div>
                  {plans[mobilePlanIdx].isSocial && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex -space-x-2">
                        {AVATARS.slice(0, 3).map((av, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-1 flex items-center justify-center text-[7px] font-black text-white shrink-0" style={{ backgroundColor: av.bg }}>
                            {av.initials}
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-text-secondary">
                        {activeBizLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="mb-3">
                  {plans[mobilePlanIdx].price === 'Gratis' ? (
                    <span className="text-3xl font-black text-text-primary uppercase">GRATIS</span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-muted line-through">
                          Rp {formatRupiah(plans[mobilePlanIdx].anchorPrice)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase">
                          Hemat {Math.round((1 - (isAnnual ? plans[mobilePlanIdx].annualPrice : plans[mobilePlanIdx].monthlyPrice) / plans[mobilePlanIdx].anchorPrice) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-text-primary">Rp</span>
                        <AnimatedPrice
                          value={isAnnual ? plans[mobilePlanIdx].annualPrice : plans[mobilePlanIdx].monthlyPrice}
                          className="text-3xl font-black text-text-primary tabular-nums tracking-tighter"
                        />
                        <span className="text-text-muted text-xs font-black uppercase">/Bln</span>
                      </div>
                    </div>
                  )}
                </div>

                {isAnnual && plans[mobilePlanIdx].annualPrice > 0 && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500">
                      Bayar Rp {formatRupiah(plans[mobilePlanIdx].annualPrice * 12)}/tahun
                    </span>
                  </div>
                )}

                <p className="text-text-secondary text-sm leading-relaxed">{plans[mobilePlanIdx].description}</p>
              </div>

              {/* Features — ALL shown */}
              <div className="flex-1 space-y-3 mb-6">
                {plans[mobilePlanIdx].features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      'shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                      feature.highlight ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'
                    )}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={cn(
                      'text-sm leading-relaxed',
                      feature.highlight ? 'text-text-primary font-bold' : 'text-text-secondary font-medium'
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Button
                  asChild
                  className={cn(
                    'w-full py-4 h-auto font-display text-sm font-black uppercase tracking-widest rounded-full transition-all duration-300 active:scale-95 border',
                    plans[mobilePlanIdx].isPopular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-transparent shadow-lg shadow-emerald-500/25'
                      : 'bg-bg-3/20 hover:bg-bg-3/55 text-text-primary border-border-default'
                  )}
                >
                  <Link
                    to={plans[mobilePlanIdx].href}
                    onClick={() => {
                      const selectedPlanName = plans[mobilePlanIdx].name;
                      if (!isLoggedIn && (selectedPlanName === 'PRO' || selectedPlanName === 'BUSINESS')) {
                        sessionStorage.setItem('intended_trial_plan', selectedPlanName.toLowerCase());
                      }
                    }}
                  >
                    {plans[mobilePlanIdx].buttonText}
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Garansi 30 Hari</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FAQ Section */}
        <div className="max-w-xl mx-auto mt-16">
          <div className="text-center mb-10">
            <h3 className="font-display text-lg font-normal text-text-primary uppercase tracking-[0.15em]">Pertanyaan Umum</h3>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-subtle bg-bg-2 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-4 py-3.5 flex justify-between items-center bg-transparent group"
                >
                  <span className="font-display text-[13px] font-bold text-text-primary uppercase tracking-wide group-hover:text-emerald-500 transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'text-text-muted transition-transform duration-300 shrink-0',
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
                      <div className="px-4 pb-4 text-[13px] font-medium text-text-secondary leading-relaxed">
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
