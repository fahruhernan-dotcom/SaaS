import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import anime from '../lib/animation';
import { useState, useEffect } from 'react';
import BlurText from '../components/reactbits/BlurText';
import ShinyText from '../components/reactbits/ShinyText';
import Magnet from '../components/reactbits/Magnet';
import ClickSpark from '../components/reactbits/ClickSpark';
import Particles from '../components/reactbits/Particles';
import { usePricingConfig } from '@/lib/hooks/useAdminData';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

const Hero = () => {
  const isTouchDevice = () => 
    typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: dbPricing } = usePricingConfig();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const peternakPrice = dbPricing?.peternak?.pro?.price || 499000;
  const brokerPrice = dbPricing?.broker?.pro?.price || 999000;

  const formatShort = (num) => {
    if (num >= 1000000) return `Rp ${(num/1000000).toFixed(1).replace('.0', '')}jt`;
    if (num >= 1000) return `Rp ${num/1000}rb`;
    return `Rp ${num}`;
  };

  useEffect(() => {
    const tl = anime.timeline({
      easing: 'easeOutExpo'
    });

    tl
    .add('.hero-badge', {
      translateY: [-20, 0],
      opacity: [0, 1],
      duration: 800,
      delay: 500
    })
    .add('.hero-headline-row', {
      translateY: [30, 0],
      opacity: [0, 1],
      delay: anime.stagger(150),
      duration: 1000,
    }, '-=600')
    .add('.hero-subheadline', {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 800,
    }, '-=700')
    .add('.hero-cta-item', {
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 800,
    }, '-=600')
    .add('.hero-social-proof', {
      opacity: [0, 1],
      duration: 600,
    }, '-=400')
    .add('.hero-mockup', {
      translateY: [60, 0],
      scale: [0.95, 1],
      opacity: [0, 1],
      duration: 1200,
      easing: 'easeOutElastic(1, .8)'
    }, '-=1000');
  }, []);

  return (
    <section className="relative px-5 pt-32 pb-16 md:px-10 md:py-20 lg:px-20 lg:py-24 bg-bg-base overflow-hidden text-center lg:text-left">
      
      {/* Background Particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Particles
          particleColors={['#10B981', '#34D399', '#059669']}
          particleCount={typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 40}
          speed={0.3}
          particleBaseSize={1.2}
        />
      </div>
      
      {/* Background Effects */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[320px] h-[320px] bg-[radial-gradient(circle,rgba(16,185,129,0.14),transparent_70%)] animate-glow-breathe z-0 pointer-events-none md:w-[600px] md:h-[600px]"
      ></motion.div>
      
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at center, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 80% 60% at center, black 30%, transparent 80%)'
        }}
      ></div>

      <div className="relative z-10 max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Content Side */}
        <div className="flex-1 w-full max-w-[640px] mx-auto lg:mx-0 flex flex-col items-center lg:items-start">
          
          {/* Badge */}
          <div 
            className="hero-badge inline-flex items-center gap-[7px] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.18)] rounded-full py-[5px] pl-[9px] pr-[13px] text-[11px] font-semibold text-em-400 mb-4"
            style={{ opacity: 0 }}
          >
            <div className="w-[7px] h-[7px] bg-em-400 rounded-full animate-pulse-dot"></div>
            Solusi Digital Terpadu untuk Broker & Peternak
          </div>

          {/* Headline */}
          <div style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: isDesktop ? 'clamp(32px, 8vw, 60px)' : 'clamp(28px, 9vw, 42px)',
            fontWeight: 800,
            letterSpacing: isDesktop ? '-2.2px' : '-1.2px',
            lineHeight: isDesktop ? 1.05 : 1.2,
            marginBottom: isDesktop ? '16px' : '20px',
          }}>
            {/* Baris 1-2: BlurText */}
            <div className="hero-headline-row" style={{ opacity: 0 }}>
              <BlurText
                text="Kelola Bisnis Ternak"
                animateBy="words"
                direction="top"
                delay={100}
                stepDuration={0.4}
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  letterSpacing: 'inherit',
                  lineHeight: 'inherit',
                  color: '#F1F5F9',
                  display: 'block',
                  marginBottom: 0,
                  paddingBottom: 0,
                }}
              />
            </div>

            {/* Baris 3: Lebih Cepat. — shimmer */}
            <span className="hero-headline-row" style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              lineHeight: 'inherit',
              display: 'block',
              marginTop: 0,
              position: 'relative',
              color: '#34D399',
              opacity: 0
            }}>
              Lebih Cepat.
              <span aria-hidden="true" style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.9) 45%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.9) 55%, transparent 75%)',
                backgroundSize: '250% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer-pass 2.5s linear infinite',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                letterSpacing: 'inherit',
                lineHeight: 'inherit',
                pointerEvents: 'none',
                display: 'block',
              }}>
                Lebih Cepat.
              </span>
            </span>

            {/* Baris 4: Lebih Rapi. */}
            <span className="hero-headline-row" style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              lineHeight: 'inherit',
              color: '#F1F5F9',
              display: 'block',
              marginTop: 0,
              opacity: 0
            }}>
              Lebih Rapi.
            </span>
          </div>
          {/* Subheadline */}
          <p 
            className="hero-subheadline text-sm md:text-base text-tx-3 leading-relaxed max-w-[500px] mb-6 text-center lg:text-left font-medium"
            style={{ opacity: 0 }}
          >
            Mulai {formatShort(peternakPrice)}/bulan untuk <span className="text-em-400 font-bold">Peternak</span> — atau {formatShort(brokerPrice)}/bulan untuk <span className="text-em-400 font-bold">Broker</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col w-full md:flex-row md:w-auto gap-[12px]">
            <div className="hero-cta-item" style={{ opacity: 0 }}>
              <ClickSpark sparkColor="#10B981" sparkCount={10} sparkRadius={20}>
                <Magnet padding={40} magnetStrength={0.3} disabled={isTouchDevice()}>
                  <motion.a
                    href="/register"
                    whileTap={{ scale: 0.96 }}
                    className="w-full inline-block text-center px-[28px] py-[16px] font-display text-[15px] font-bold bg-em-500 text-white rounded-[12px] shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_8px_28px_rgba(16,185,129,0.22)] md:w-auto"
                  >
                    Coba Gratis Sekarang
                  </motion.a>
                </Magnet>
              </ClickSpark>
            </div>
            <div className="hero-cta-item" style={{ opacity: 0 }}>
              <motion.button
                onClick={() => setIsModalOpen(true)}
                whileTap={{ scale: 0.97 }}
                className="w-full text-center px-[28px] py-[15px] font-body text-[15px] font-bold bg-white/[0.05] text-white border border-white/20 rounded-[12px] md:w-auto hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Play size={16} fill="currentColor" />
                Video Demo 1 Menit
              </motion.button>
            </div>
          </div>

          {/* Social Proof */}
          <div 
            className="hero-social-proof flex items-center justify-center lg:justify-start gap-[10px] mt-6 text-[13px] text-tx-3"
            style={{ opacity: 0 }}
          >
            <div className="flex text-white font-bold text-[10px]">
              {[
                { bg: 'bg-emerald-500', text: 'BS', z: 4 },
                { bg: 'bg-[#0891B2]', text: 'RH', z: 3 },
                { bg: 'bg-[#7C3AED]', text: 'SW', z: 2 },
                { bg: 'bg-amber-500', text: 'AN', z: 1 }
              ].map((av, i) => (
                <div key={i} className={`w-[28px] h-[28px] rounded-full border-2 border-bg-base ${av.bg} flex items-center justify-center ml-[-8px] first:ml-0 relative z-[${av.z}]`}>
                  {av.text}
                </div>
              ))}
            </div>
            <div className="flex flex-col text-left text-[11px] leading-tight">
              <span className="text-gold">★★★★★</span>
              <span>500+ broker & peternak</span>
            </div>
          </div>
        </div>

        {/* Mockup Card (Visual Side) */}
        <div 
          className="hero-mockup flex-1 w-full max-w-[900px] mt-10 lg:mt-0 text-left relative"
          style={{ opacity: 0 }}
        >
          {/* Card mengambang kiri */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="hidden lg:block" style={{
            position: 'absolute',
            left: '-40px',
            top: '30%',
            background: 'rgba(17,28,36,0.95)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '16px',
            padding: '14px 18px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            animation: 'float 4s ease-in-out infinite 0.8s',
            zIndex: 20
          }}>
            <div style={{fontSize:'10px', color:'#4B6478', 
                         fontWeight:600, textTransform:'uppercase',
                         letterSpacing:'1px', marginBottom:'4px'}}>
              Profit Hari Ini
            </div>
            <div style={{fontSize:'22px', fontWeight:800, 
                         color:'#34D399', fontFamily:'Sora',
                         fontVariantNumeric:'tabular-nums'}}>
              +Rp 5,8jt
            </div>
            <div style={{fontSize:'10px', color:'#4B6478', marginTop:'2px'}}>
              ▲ 12% vs kemarin
            </div>
          </motion.div>

          {/* Card mengambang kanan bawah */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="hidden lg:block" style={{
            position: 'absolute',
            right: '-36px',
            bottom: '20%',
            background: 'rgba(17,28,36,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '12px 16px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            animation: 'float 5s ease-in-out infinite 1.5s',
            zIndex: 20
          }}>
            <div style={{fontSize:'10px', color:'#4B6478', 
                         fontWeight:600, textTransform:'uppercase',
                         letterSpacing:'1px', marginBottom:'6px'}}>
              Piutang Lunas
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <div style={{width:'8px', height:'8px', borderRadius:'50%',
                           background:'#10B981'}}/>
              <span style={{fontSize:'13px', color:'#F1F5F9', fontWeight:600}}>
                RPA Prima Jaya
              </span>
            </div>
            <div style={{fontSize:'12px', color:'#34D399', 
                         fontWeight:700, marginTop:'4px',
                         fontVariantNumeric:'tabular-nums'}}>
              Rp 44.160.000 ✓
            </div>
          </motion.div>

          <div className="bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] border border-border-def rounded-[20px] p-[2px] animate-float shadow-[0_24px_56px_rgba(0,0,0,0.5),0_0_60px_rgba(16,185,129,0.07)] relative z-10">
            <div className="bg-bg-1 rounded-[18px] overflow-hidden">
               
               {/* Chrome */}
               <div className="bg-bg-2 px-[14px] py-[10px] border-b border-border-sub flex items-center gap-[6px]">
                  <div className="w-[6px] h-[6px] rounded-full bg-[#FF5F57]"></div>
                  <div className="w-[6px] h-[6px] rounded-full bg-[#FEBC2E]"></div>
                  <div className="w-[6px] h-[6px] rounded-full bg-[#28C840]"></div>
                  <div className="mx-auto bg-bg-3 rounded-[5px] px-[10px] py-[3px] font-body text-[11px] text-tx-3 flex-1 text-center max-w-[150px]">
                    app.ternakos.id
                  </div>
               </div>

               {/* Dashboard Mini */}
               <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] h-[220px] overflow-hidden">
                  
                  {/* Sidebar Desktop (Hidden < 640px via sm:block) */}
                  <div className="hidden sm:block bg-bg-2 border-r border-border-sub p-[12px_10px]">
                    <div className="flex items-center gap-[6px] mb-[16px]">
                      <img src="/favicon.svg" alt="Logo" className="w-[16px] h-[16px] rounded-[4px]" />
                      <span className="font-display font-bold text-[12px] text-tx-1 tracking-wider">TernakOS</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {[
                        { l: "Beranda", a: true },
                        { l: "Transaksi" },
                        { l: "RPA" },
                        { l: "Kandang" },
                        { l: "Harga Pasar" }
                      ].map((item, i) => (
                        <div key={i} className={`text-[10px] rounded-[6px] p-1.5 px-2 ${item.a ? 'bg-[rgba(16,185,129,0.12)] text-em-400 font-semibold' : 'text-tx-3'}`}>
                          {item.l}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main */}
                  <div className="bg-bg-1 p-[14px] flex flex-col justify-between">
                    <div>
                      <h2 className="text-[11px] font-semibold text-tx-1 mb-[10px]">Selamat pagi, Pak Budi! 👋</h2>
                      <div className="grid grid-cols-2 gap-[6px]">
                         <div className="bg-bg-2 border border-border-sub rounded-[8px] p-[10px]">
                           <p className="text-[8px] uppercase tracking-wide text-tx-3 mb-1">PROFIT HARI INI</p>
                           <p className="font-display text-[14px] font-bold text-em-400 tabular-nums">+Rp 5,8jt</p>
                         </div>
                         <div className="bg-bg-2 border border-border-sub rounded-[8px] p-[10px]">
                           <p className="text-[8px] uppercase tracking-wide text-tx-3 mb-1">PIUTANG</p>
                           <p className="font-display text-[14px] font-bold text-red tabular-nums">Rp 44jt</p>
                         </div>
                         <div className="bg-bg-2 border border-border-sub rounded-[8px] p-[10px]">
                           <p className="text-[8px] uppercase tracking-wide text-tx-3 mb-1">TRANSAKSI</p>
                           <p className="font-display text-[14px] font-bold text-tx-1 tabular-nums">8 txn</p>
                         </div>
                         <div className="bg-bg-2 border border-border-sub rounded-[8px] p-[10px]">
                           <p className="text-[8px] uppercase tracking-wide text-tx-3 mb-1">KANDANG READY</p>
                           <p className="font-display text-[14px] font-bold text-em-400 tabular-nums">3 ready</p>
                         </div>
                      </div>
                    </div>
                    
                    {/* Chart Bars */}
                    <div className="h-[44px] mt-[8px] flex items-end gap-[3px]">
                       {[30, 45, 40, 60, 50, 75, 90].map((h, i) => (
                         <div key={i} className={`flex-1 rounded-[2px_2px_0_0] ${i === 6 ? 'bg-em-500' : 'bg-[rgba(16,185,129,0.25)]'}`} style={{ height: `${h}%` }}></div>
                       ))}
                    </div>
                  </div>

               </div>
            </div>
          </div>
        </div>

      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl aspect-video bg-[#111C24] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
              
              {/* Placeholder for Video */}
              <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                  <Play size={32} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">Video Demo TernakOS</h3>
                <p className="text-tx-3 max-w-md mx-auto mb-8">Lihat bagaimana dashboard kami membantu broker & peternak mengelola bisnis lebih efisien.</p>
                <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-full bg-em-500"
                  />
                </div>
                <p className="mt-4 text-[10px] text-tx-3 uppercase tracking-widest">Video Stream Simulator</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
