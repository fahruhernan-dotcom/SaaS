import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import CountUp from '../components/reactbits/CountUp';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const MarketPrice = ({ activeRole }) => {
  const content = useMemo(() => ({
    broker: {
      title: <>Data Harga Pasar yang <br/><span className="text-emerald-400">Selalu Up-to-Date</span></>,
      desc: "Setiap kali broker mencatat transaksi, harga secara otomatis masuk ke sistem. Kamu tahu rata-rata harga pasar hari ini — bahkan sebelum mulai negosiasi.",
      checklist: [
        'Data dari transaksi nyata — bukan rumor WA',
        'Update otomatis setiap transaksi',
        'Semua broker lihat rata-rata (anonim)'
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
            className="w-full flex-1 bg-bg-2 border border-border-default rounded-[20px] p-6 lg:p-8 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(245,158,11,0.05)_0%,transparent_60%)] pointer-events-none"></div>

             <div className="relative z-10 flex justify-between items-center mb-8 border-b border-border-subtle pb-4">
                <p className="font-semibold text-text-primary">Harga Broiler — Jawa Tengah</p>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
               <div>
                  <p className="text-[12px] text-text-muted mb-1 font-medium">Rata-rata Beli Kandang</p>
                  <div className="flex items-end gap-3">
                     <p className="font-display text-[28px] font-extrabold text-emerald-400">
                       <CountUp from={0} to={19800} duration={1.2} separator="." />
                     </p>
                     <motion.div 
                       initial={{ opacity: 0, x: -8 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: 0.8 }}
                       className="flex items-center text-[12px] text-emerald-400 font-bold mb-1.5 gap-0.5"
                     >
                       <TrendingUp size={14} /> +300
                     </motion.div>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">per kg / hari ini</p>
               </div>
               <div>
                  <p className="text-[12px] text-text-muted mb-1 font-medium">Rata-rata Jual RPA</p>
                  <div className="flex items-end gap-3">
                     <p className="font-display text-[28px] font-extrabold text-text-primary">
                       <CountUp from={0} to={23200} duration={1.2} separator="." />
                     </p>
                     <motion.div 
                       initial={{ opacity: 0, x: -8 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: 0.8 }}
                       className="flex items-center text-[12px] text-emerald-400 font-bold mb-1.5 gap-0.5"
                     >
                       <TrendingUp size={14} /> +200
                     </motion.div>
                  </div>
                  <p className="text-[11px] text-gold-400 font-semibold mt-1 flex items-center gap-1">
                    Margin: Rp 3.400/kg
                  </p>
               </div>
             </div>

             {/* Chart Mockup */}
             <div className="h-[120px] relative w-full border-t border-border-subtle pt-6 flex items-end justify-between z-10">
                <svg className="absolute inset-0 top-6 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                   {/* Gradient Fill */}
                   <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                        <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                      </linearGradient>
                   </defs>
                   {/* Buy Line (muted) */}
                   <path d="M0,80 Q10,75 20,80 T40,70 T60,65 T80,55 T100,50" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
                   {/* Sell Line (bright) area */}
                   <motion.path 
                     initial={{ opacity: 0 }}
                     whileInView={{ opacity: 1 }}
                     viewport={{ once: true, amount: 0.3 }}
                     transition={{ duration: 1.5, delay: 0.3 }}
                     d="M0,45 Q15,40 30,30 T50,35 T75,20 T100,10 L100,100 L0,100 Z" fill="url(#chartGradient)" 
                   />
                   <motion.path 
                     initial={{ pathLength: 0, opacity: 0 }}
                     whileInView={{ pathLength: 1, opacity: 1 }}
                     viewport={{ once: true, amount: 0.3 }}
                     transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
                     d="M0,45 Q15,40 30,30 T50,35 T75,20 T100,10" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" 
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
