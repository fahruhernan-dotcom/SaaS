import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import AnimatedPrice from '../components/AnimatedPrice';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AnimatedContent from '../components/reactbits/AnimatedContent';

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
    switch (role) {
      case 'peternak':
        return {
          pro: 499000, biz: 999000,
          proAnnual: 399000, bizAnnual: 799000,
          proAnchor: 799000, bizAnchor: 1599000,
          proSaving: 300000, bizSaving: 200000,
          bizAnnualLoss: 2400000,
        };
      case 'rpa':
        return {
          pro: 699000, biz: 1499000,
          proAnnual: 559000, bizAnnual: 1199000,
          proAnchor: 1099000, bizAnchor: 2099000,
          proSaving: 400000, bizSaving: 300000,
          bizAnnualLoss: 3600000,
        };
      case 'broker':
      default:
        return {
          pro: 999000, biz: 1499000,
          proAnnual: 799000, bizAnnual: 1199000,
          proAnchor: 1499000, bizAnchor: 2499000,
          proSaving: 500000, bizSaving: 300000,
          bizAnnualLoss: 3600000,
        };
    }
  };

  const currentPrices = useMemo(() => getPrices(activeRole), [activeRole]);

  const formatRupiah = (n) =>
    new Intl.NumberFormat('id-ID').format(n);

  const plans = useMemo(() => [
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
      buttonText: 'Mulai 14 Hari Gratis',
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
      buttonText: 'Mulai 14 Hari Gratis',
      href: '/register',
      isPopular: true,
      isSocial: true,
    },
    {
      name: 'ENTERPRISE',
      subtitle: 'Custom',
      price: 'Custom',
      description: 'Skalabilitas penuh dan dukungan prioritas untuk korporasi besar.',
      features: [
        { text: 'Semua fitur BUSINESS', highlight: false },
        { text: 'Multi-tenant management', highlight: false },
        { text: 'Dedicated onboarding', highlight: false },
        { text: 'SLA & support prioritas', highlight: false },
        { text: 'Integrasi custom', highlight: false },
        { text: 'Kontrak fleksibel', highlight: false },
      ],
      buttonText: 'Hubungi Kami',
      href: 'https://wa.me/628123456789',
      isPopular: false,
      isSocial: false,
    },
  ], [activeRole, currentPrices]);

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
        <div className="text-center mb-16">
          <AnimatedContent direction="vertical" distance={30}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Sparkles size={14} className="text-emerald-500" />
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">PRICING PLANS</span>
            </div>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">
              PILIH PLAN <span className="text-emerald-500">TERBAIKMU</span>
            </h2>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={30} delay={0.2}>
            <p className="text-[#94A3B8] max-w-xl mx-auto mb-12 font-medium">
              Mulai dengan 14 hari gratis tanpa kartu kredit. Upgrade atau downgrade kapan saja sesuai kebutuhan bisnis Anda.
            </p>
          </AnimatedContent>

          {/* Role Toggle Tabs */}
          <AnimatedContent direction="vertical" distance={20} delay={0.25} className="flex justify-center mb-10">
            <div className="inline-flex bg-[#111C24] border border-white/10 p-1.5 rounded-full relative z-20 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              {['broker', 'peternak', 'rpa'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-6 md:px-8 py-2.5 rounded-full font-display text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${
                    activeRole === role
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
                  Hemat 20%
                </span>
              </div>
            </div>
          </AnimatedContent>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={
                plan.isPopular
                  ? { opacity: 1, y: -16, scale: 1 }
                  : { opacity: 1, y: 0, scale: 0.96 }
              }
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={cn(
                'relative p-8 rounded-[32px] border flex flex-col h-full transition-all duration-300',
                plan.isPopular
                  ? 'bg-[#0C1319] border-emerald-500 border-2 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.2)] z-10'
                  : 'bg-[#0C1319] border-white/8 hover:border-white/20'
              )}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                  Paling Populer
                </div>
              )}

              {/* Card header */}
              <div className="mb-8">
                <div className="flex items-start justify-between gap-2 mb-6">
                  <div className="flex flex-col gap-1">
                    <span className={cn('text-[10px] font-black uppercase tracking-[0.2em]', plan.isPopular ? 'text-emerald-500' : 'text-[#4B6478]')}>
                      {plan.subtitle}
                    </span>
                    <h3 className="font-display text-2xl font-black text-white uppercase">{plan.name}</h3>
                  </div>

                  {/* Social proof avatars — BUSINESS only */}
                  {plan.isSocial && (
                    <div className="flex flex-col items-end gap-1">
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
                <div className="mb-4">
                  {plan.price === 'Custom' ? (
                    <div className="h-12 flex items-center">
                      <span className="text-4xl font-black text-white uppercase tracking-tight">CUSTOM</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* Anchoring: strikethrough original price */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#4B6478] line-through">
                          Rp {formatRupiah(plan.anchorPrice)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                          Hemat Rp {formatRupiah(plan.savingAmount)}/bln
                        </span>
                      </div>

                      {/* Actual price with animated number */}
                      <div className="flex items-baseline gap-1 h-10">
                        <span className="text-lg font-black text-white tracking-tight mr-0.5">Rp</span>
                        <AnimatedPrice
                          value={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                          className="text-4xl font-black text-white tabular-nums tracking-tighter"
                        />
                        <span className="text-[#4B6478] text-[10px] font-black uppercase tracking-widest ml-1">/Bln</span>
                      </div>

                      {/* Annual savings badge */}
                      {isAnnual && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5"
                        >
                          <TrendingUp size={10} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-500">
                            Bayar Rp {formatRupiah((isAnnual ? plan.annualPrice : plan.monthlyPrice) * 12)}/tahun
                          </span>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                {/* Loss aversion warning — BUSINESS, monthly mode */}
                {plan.isSocial && !isAnnual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 mb-4"
                  >
                    <span className="text-red-400 text-xs shrink-0 mt-px">⚠</span>
                    <span className="text-[11px] font-bold text-red-400 leading-snug">
                      Bayar bulanan = rugi Rp {formatRupiah(plan.annualLoss)}/tahun dibanding tahunan
                    </span>
                  </motion.div>
                )}

                <p className="text-[#94A3B8] text-sm font-medium leading-relaxed">{plan.description}</p>
              </div>

              {/* Feature list */}
              <div className="space-y-3.5 mb-10 flex-grow">
                {plan.features.map((feature, fidx) => (
                  <div key={fidx} className="flex items-start gap-3">
                    <div className={cn(
                      'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                      feature.highlight
                        ? 'bg-amber-500/10'
                        : 'bg-emerald-500/10'
                    )}>
                      {feature.highlight ? (
                        <Sparkles size={10} className="text-amber-400" />
                      ) : (
                        <Check size={11} className="text-emerald-500" strokeWidth={3} />
                      )}
                    </div>
                    <span className={cn(
                      'text-sm font-medium leading-snug',
                      feature.highlight ? 'text-amber-200/90' : 'text-white/90'
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                asChild
                className={cn(
                  'w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95',
                  plan.isPopular
                    ? 'bg-emerald-500 hover:bg-[#34D399] text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:border-emerald-500'
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

              {/* Social proof bottom — BUSINESS */}
              {plan.isSocial && (
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  <Users size={11} className="text-[#4B6478]" />
                  <span className="text-[10px] font-bold text-[#4B6478]">
                    Dipercaya 500+ peternak & broker aktif
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-24">
          <div className="text-center mb-12">
            <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">Pertanyaan Umum</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center bg-transparent group"
                >
                  <span className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-emerald-500 transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
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
                      <div className="px-6 pb-6 text-sm font-medium text-[#94A3B8] leading-relaxed">
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
