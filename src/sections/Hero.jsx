import React from 'react';
import { motion } from 'framer-motion';
import BlurText from '../components/reactbits/BlurText';
import ShinyText from '../components/reactbits/ShinyText';
import Magnet from '../components/reactbits/Magnet';
import ClickSpark from '../components/reactbits/ClickSpark';
import Particles from '../components/reactbits/Particles';

const Hero = () => {
  const isTouchDevice = () => 
    typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return (
    <section className="relative px-5 py-20 md:px-10 lg:px-20 lg:py-24 bg-bg-base overflow-hidden text-center lg:text-left">
      
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
          <motion.div 
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0 }}
            className="inline-flex items-center gap-[7px] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.18)] rounded-full py-[5px] pl-[9px] pr-[13px] text-[12px] font-semibold text-em-400 mb-6"
          >
            <div className="w-[7px] h-[7px] bg-em-400 rounded-full animate-pulse-dot"></div>
            Platform Peternakan #1 di Jawa
          </motion.div>

          {/* Headline */}
          <div style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 'clamp(44px, 10vw, 76px)',
            fontWeight: 800,
            letterSpacing: '-2.5px',
            lineHeight: 1.08,
            marginBottom: '24px',
          }}>
            {/* Baris 1-2: BlurText */}
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

            {/* Baris 3: Lebih Cepat. — shimmer */}
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              lineHeight: 'inherit',
              display: 'block',
              marginTop: 0,
              position: 'relative',
              color: '#34D399',
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
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              lineHeight: 'inherit',
              color: '#F1F5F9',
              display: 'block',
              marginTop: 0,
            }}>
              Lebih Rapi.
            </span>
          </div>
          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
            className="text-base md:text-lg text-tx-3 leading-relaxed max-w-[500px] mb-8 text-center lg:text-left font-medium"
          >
            Mulai Rp 499rb/bulan — <span className="text-em-400">kurang dari Rp 17.000/hari</span>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.08, delayChildren: 0.5 }
              }
            }}
            className="flex flex-col w-full md:flex-row md:w-auto gap-[10px]"
          >
            <ClickSpark sparkColor="#10B981" sparkCount={10} sparkRadius={20}>
              <Magnet padding={40} magnetStrength={0.3} disabled={isTouchDevice()}>
                <motion.a
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                  }}
                  href="#daftar"
                  whileTap={{ scale: 0.96 }}
                  className="w-full inline-block text-center px-[24px] py-[15px] font-display text-[15px] font-bold bg-em-500 text-white rounded-[12px] shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_8px_28px_rgba(16,185,129,0.22)] md:w-auto"
                >
                  Mulai Gratis Sekarang
                </motion.a>
              </Magnet>
            </ClickSpark>
            <motion.a
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
              href="#cara-kerja"
              whileTap={{ scale: 0.97 }}
              className="w-full text-center px-[24px] py-[13px] font-body text-[15px] font-semibold bg-[rgba(255,255,255,0.04)] text-tx-2 border border-border-def rounded-[12px] md:w-auto hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            >
              Lihat Demo →
            </motion.a>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.65 }}
            className="flex items-center justify-center lg:justify-start gap-[10px] mt-6 text-[13px] text-tx-3"
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
          </motion.div>
        </div>

        {/* Mockup Card (Visual Side) */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          className="flex-1 w-full max-w-[900px] mt-10 lg:mt-0 text-left relative"
        >
          {/* Card mengambang kiri */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="hidden lg:block hidden" style={{
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
            className="hidden lg:block hidden" style={{
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
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
