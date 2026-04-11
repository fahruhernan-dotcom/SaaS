import { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import CountUp from '../components/reactbits/CountUp';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import anime from '../lib/animation';

const MarketPrice = ({ activeRole }) => {
  const content = useMemo(() => ({
    broker: {
      title: <>Data Harga Pasar yang <br/><span className="text-emerald-400">Selalu Up-to-Date</span></>,
      desc: "Setiap kali broker mencatat transaksi, harga secara otomatis masuk ke sistem. Kamu tahu rata-rata harga pasar hari ini — bahkan sebelum mulai negosiasi.",
      checklist: [
        'Data dari transaksi nyata — bukan rumor WA',
        '3 Sumber Data: Scraper Nasional, Admin Regional, & Transaksi User',
        'Analisis per Provinsi untuk akurasi maksimal'
      ]
    },
    peternak: {
      title: <>Tahu Harga Beli Broker <br/><span className="text-emerald-400">Sebelum Negosiasi</span></>,
      desc: "Lihat rata-rata harga yang broker bayar ke kandang di daerahmu. Tidak perlu tanya satu-satu lagi ke teman peternak lain.",
      checklist: [
        'Harga beli broker real dari transaksi',
        'Update otomatis setiap ada transaksi baru',
        'Tahu kapan harga sedang tinggi untuk jual'
      ]
    },
    rpa: {
      title: <>Beli Ayam di <br/><span className="text-emerald-400">Harga yang Tepat</span></>,
      desc: "Referensi harga jual broker hari ini dari data transaksi nyata. Negosiasi dengan data, bukan feeling.",
      checklist: [
        'Harga jual broker rata-rata per wilayah',
        'Tren harga 14 hari terakhir',
        'Deteksi harga anomali dari broker'
      ]
    }
  }), []);

  const active = content[activeRole] || content.broker;
  
  const chartRef = useRef(null);
  const pathRef = useRef(null);
  const areaRef = useRef(null);
  const buyPathRef = useRef(null);
  const dotRef = useRef(null);
  
  const isInView = useInView(chartRef, { once: true, margin: "-10%" });

  useEffect(() => {
    if (isInView) {
      // Draw the main price line
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength();
        pathRef.current.style.strokeDasharray = length;
        pathRef.current.style.strokeDashoffset = length;
        
        anime({
          targets: pathRef.current,
          strokeDashoffset: [length, 0],
          duration: 2000,
          easing: 'easeOutQuart',
          delay: 500
        });
      }

      // Fade in the gradient area
      if (areaRef.current) {
        anime({
          targets: areaRef.current,
          opacity: [0, 1],
          duration: 1000,
          easing: 'linear',
          delay: 800
        });
      }

      // Animate buy line (dashed)
      if (buyPathRef.current) {
        anime({
          targets: buyPathRef.current,
          strokeDashoffset: [20, 0],
          duration: 3000,
          easing: 'linear',
          loop: true
        });
      }
      
      // Pulse the live dot
      if (dotRef.current) {
        anime({
          targets: dotRef.current,
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
          duration: 2000,
          easing: 'easeInOutQuad',
          loop: true
        });
      }
    }
  }, [isInView]);

  return (
    <section id="harga-pasar" className="bg-[#0C1319] section-padding overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          
          {/* Content Left */}
          <div className="flex-1">
            <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F59E0B', animation: 'pulse-dot 2s infinite' }}/>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#FCD34D', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  FITUR EKSKLUSIF
                </span>
              </div>
            </AnimatedContent>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedContent direction="none">
                  <h2 className="section-h2 mb-5">
                    {active.title}
                  </h2>
                </AnimatedContent>
                
                <AnimatedContent direction="none">
                  <p className="section-subtitle mb-8 max-w-[480px]">
                    {active.desc}
                  </p>
                </AnimatedContent>

                <ul className="space-y-4 mb-8">
                  {active.checklist.map((item, i) => (
                    <AnimatedContent key={i} direction="none">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 text-[12px]">
                          ✓
                        </div>
                        <span className="text-[15px] text-text-secondary">{item}</span>
                      </li>
                    </AnimatedContent>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            <AnimatedContent direction="vertical" distance={20} delay={0.6}>
              <a href="#demo" className="inline-flex items-center gap-2 text-[14px] font-semibold text-emerald-400 hover:text-emerald-300 group transition-all">
                Lihat Demo Harga Pasar 
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </AnimatedContent>
          </div>

          {/* Visual Right */}
          <AnimatedContent
            direction="horizontal"
            distance={50}
            delay={0.2}
            className="w-full flex-1 bg-bg-2 border border-border-default rounded-[20px] p-4 md:p-8 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(245,158,11,0.05)_0%,transparent_60%)] pointer-events-none"></div>

             <div className="relative z-10 flex justify-between items-center mb-4 md:mb-8 border-b border-border-subtle pb-3 md:pb-4">
                <p className="text-[10px] md:text-sm font-semibold text-text-primary uppercase tracking-tight">Data Harga Pasar — Regional & Nasional</p>
                <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <span ref={dotRef} className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Live</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8 relative z-10">
               <div>
                  <p className="text-[9px] md:text-[12px] text-text-muted mb-0.5 font-medium">Beli Kandang</p>
                  <div className="flex items-end gap-1.5 md:gap-3">
                     <p className="font-display text-[18px] md:text-[28px] font-extrabold text-emerald-400 leading-none">
                       <CountUp from={0} to={19800} duration={1.2} separator="." />
                     </p>
                     <motion.div 
                       initial={{ opacity: 0, x: -8 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       className="flex items-center text-[9px] md:text-[12px] text-emerald-400 font-bold mb-0.5 gap-0.1"
                     >
                       <TrendingUp size={10} /> 300
                     </motion.div>
                  </div>
                  <p className="text-[8px] md:text-[11px] text-text-secondary mt-0.5">per kg / hari ini</p>
               </div>
               <div>
                  <p className="text-[9px] md:text-[12px] text-text-muted mb-0.5 font-medium">Jual RPA</p>
                  <div className="flex items-end gap-1.5 md:gap-3">
                     <p className="font-display text-[18px] md:text-[28px] font-extrabold text-text-primary leading-none">
                       <CountUp from={0} to={23200} duration={1.2} separator="." />
                     </p>
                     <motion.div 
                       initial={{ opacity: 0, x: -8 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       className="flex items-center text-[9px] md:text-[12px] text-emerald-400 font-bold mb-0.5 gap-0.1"
                     >
                       <TrendingUp size={10} /> 200
                     </motion.div>
                  </div>
                  <p className="text-[8px] md:text-[11px] text-gold-400 font-semibold mt-0.5 whitespace-nowrap">
                    Margin: Rp 3.400
                  </p>
               </div>
             </div>

             {/* Chart Mockup */}
              <div className="h-[80px] md:h-[120px] relative w-full border-t border-border-subtle pt-4 md:pt-6 flex items-end justify-between z-10" ref={chartRef}>
                <svg className="absolute inset-0 top-6 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                   {/* Gradient Fill */}
                   <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                        <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                      </linearGradient>
                   </defs>
                   {/* Buy Line (muted) */}
                   <path 
                     ref={buyPathRef}
                     d="M0,80 Q10,75 20,80 T40,70 T60,65 T80,55 T100,50" 
                     fill="none" 
                     stroke="rgba(16,185,129,0.3)" 
                     strokeWidth="1.5" 
                     strokeDasharray="4 4" 
                   />
                   {/* Sell Line (bright) area */}
                   <path 
                     ref={areaRef}
                     style={{ opacity: 0 }}
                     d="M0,45 Q15,40 30,30 T50,35 T75,20 T100,10 L100,100 L0,100 Z" 
                     fill="url(#chartGradient)" 
                   />
                   <path 
                     ref={pathRef}
                     d="M0,45 Q15,40 30,30 T50,35 T75,20 T100,10" 
                     fill="none" 
                     stroke="#10B981" 
                     strokeWidth="2" 
                     strokeLinecap="round" 
                   />
                </svg>
             </div>

          </AnimatedContent>
        </div>
      </div>
    </section>
  );
};

export default MarketPrice;
