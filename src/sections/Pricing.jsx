import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import NumberFlow from '@number-flow/react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const Pricing = ({ activeRole, setActiveRole }) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const switchRef = useRef(null);

  const handleToggle = (checked) => {
    setIsAnnual(checked);
    if (checked) {
      const rect = switchRef.current?.getBoundingClientRect();
      if (rect) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { 
            x: (rect.left + rect.width / 2) / window.innerWidth, 
            y: (rect.top + rect.height / 2) / window.innerHeight 
          },
          colors: ['#10B981', '#34D399', '#F59E0B']
        });
      }
    }
  };

  const getPrices = (role) => {
    switch (role) {
      case 'peternak':
        return { pro: 499000, biz: 999000, proAnnual: 399000, bizAnnual: 799000 };
      case 'rpa':
        return { pro: 699000, biz: 1499000, proAnnual: 559000, bizAnnual: 1199000 };
      case 'broker':
      default:
        return { pro: 999000, biz: 1499000, proAnnual: 799000, bizAnnual: 1199000 };
    }
  };

  const currentPrices = getPrices(activeRole);

  const plans = [
    {
      name: 'PRO',
      subtitle: activeRole === 'broker' ? 'Broker' : activeRole === 'peternak' ? 'Peternak' : 'RPA',
      monthlyPrice: currentPrices.pro,
      annualPrice: currentPrices.proAnnual,
      description: 'Solusi lengkap untuk manajemen operasional harian.',
      features: [
        activeRole === 'peternak' ? 'Manajemen kandang & populasi' : 'Manajemen transaksi & operasional',
        activeRole === 'peternak' ? 'Tracking pakan & mortalitas' : 'Tracking pengiriman & loss report',
        activeRole === 'peternak' ? 'Prediksi panen & bobot' : 'RPA & piutang management',
        'Cash flow & laporan keuangan',
        activeRole === 'broker' ? 'Armada & tim (maks 3 anggota)' : 'Manajemen tim & akses',
        'Harga pasar realtime'
      ],
      buttonText: 'Mulai 14 Hari Gratis',
      href: '/register',
      isPopular: false
    },
    {
      name: 'BUSINESS',
      subtitle: activeRole === 'broker' ? 'Broker' : activeRole === 'peternak' ? 'Peternak' : 'RPA',
      monthlyPrice: currentPrices.biz,
      annualPrice: currentPrices.bizAnnual,
      description: 'Optimalkan profit dengan kecerdasan buatan dan analitik mendalam.',
      features: [
        'Semua fitur PRO',
        'TernakBot AI (Grok 4.1 Fast)',
        'Analisis profit otomatis',
        'Deteksi anomali transaksi',
        activeRole === 'peternak' ? 'AI Health Monitor (Beta)' : 'Prediksi panen AI',
        'Laporan PDF/Excel otomatis',
        'Tim unlimited'
      ],
      buttonText: 'Mulai 14 Hari Gratis',
      href: '/register',
      isPopular: true
    },
    {
      name: 'ENTERPRISE',
      subtitle: 'Custom',
      price: 'Custom',
      description: 'Skalabilitas penuh dan dukungan prioritas untuk korporasi besar.',
      features: [
        'Semua fitur BUSINESS',
        'Multi-tenant management',
        'Dedicated onboarding',
        'SLA & support prioritas',
        'Integrasi custom',
        'Kontrak fleksibel'
      ],
      buttonText: 'Hubungi Kami',
      href: 'https://wa.me/628123456789',
      isPopular: false
    }
  ];

  const faqs = [
    { q: "Bisa cancel kapan saja?", a: "Tentu. Tidak ada kontrak panjang. Anda bisa berhenti berlangganan kapan saja." },
    { q: "Kalau HP rusak, data saya hilang?", a: "Tidak. Semua data tersimpan aman di cloud TernakOS. Cukup login di HP baru, semua data kembali seperti semula." },
    { q: "Komoditas apa yang didukung sekarang?", a: "Saat ini TernakOS berfokus pada ayam broiler dan pejantan. Kami akan terus menambah komoditas lain." },
    { q: "Apakah data saya aman?", a: "Sangat aman. Kami menggunakan enkripsi kelas bank untuk melindungi data transaksi dan harga pasar Anda. Data Anda tidak akan dibagikan ke pihak ketiga." }
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
              <span className={`text-[11px] font-black uppercase tracking-widest ${!isAnnual ? 'text-white' : 'text-[#4B6478]'}`}>Bulanan</span>
              <div ref={switchRef}>
                <Switch 
                  checked={isAnnual} 
                  onCheckedChange={handleToggle}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-widest ${isAnnual ? 'text-white' : 'text-[#4B6478]'}`}>Tahunan</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Hemat 20%</span>
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
              whileInView={plan.isPopular ? { opacity: 1, y: -16, scale: 1 } : { opacity: 1, y: 0, scale: 0.96 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={cn(
                "relative p-8 rounded-[32px] border flex flex-col h-full transition-all duration-300",
                plan.isPopular 
                  ? "bg-[#0C1319] border-emerald-500 border-2 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.2)] z-10" 
                  : "bg-[#0C1319] border-white/8 hover:border-white/20"
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  Paling Populer
                </div>
              )}

              <div className="mb-8">
                <div className="flex flex-col gap-1 mb-6">
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", plan.isPopular ? "text-emerald-500" : "text-[#4B6478]")}>
                    {plan.subtitle}
                  </span>
                  <h3 className="font-display text-2xl font-black text-white uppercase">{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-4 h-12">
                  {plan.price === 'Custom' ? (
                    <span className="text-4xl font-black text-white uppercase tracking-tight">CUSTOM</span>
                  ) : (
                    <>
                      <span className="text-xl font-black text-white tracking-tight mr-1">Rp</span>
                      <NumberFlow
                        value={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                        format={{ 
                          style: 'decimal',
                          useGrouping: true,
                        }}
                        className="text-4xl font-black text-white tabular-nums tracking-tighter"
                      />
                      <span className="text-[#4B6478] text-[10px] font-black uppercase tracking-widest ml-1">/Bln</span>
                    </>
                  )}
                </div>
                <p className="text-[#94A3B8] text-sm font-medium leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, fidx) => (
                  <div key={fidx} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-emerald-500" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-white/90 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95",
                  plan.isPopular
                    ? "bg-emerald-500 hover:bg-[#34D399] text-white shadow-lg shadow-emerald-500/20"
                    : "bg-white/5 border border-white/10 text-white hover:bg-emerald-500 hover:border-emerald-500"
                )}
              >
                {plan.href.startsWith('http') ? (
                  <a href={plan.href} target="_blank" rel="noopener noreferrer">{plan.buttonText}</a>
                ) : (
                  <Link to={plan.href}>{plan.buttonText}</Link>
                )}
              </Button>
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
                      "text-[#4B6478] transition-transform duration-300 shrink-0",
                      openFaq === i && "rotate-180 text-emerald-500"
                    )} 
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
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
