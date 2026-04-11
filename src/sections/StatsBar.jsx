import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import CountUp from '../components/reactbits/CountUp';
import ShinyText from '../components/reactbits/ShinyText';
import anime from '../lib/animation';

const StatsBar = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const stats = [
    { value: 500, suffix: "+", label: "Broker & Peternak", duration: 1.5 },
    { value: 50, suffix: "rb+", label: "Transaksi Tercatat", duration: 1.8 },
    { value: "Rp 250M+", isShiny: true, label: "Volume Transaksi", duration: 2 },
    { value: 14, suffix: " Hari", label: "Coba Gratis", duration: 1.2 }
  ];

  useEffect(() => {
    if (isInView) {
      anime({
        targets: '.stat-card',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(150, { from: 'center' }),
        duration: 800,
        easing: 'easeOutExpo'
      });
    }
  }, [isInView]);

  return (
    <section className="bg-[#0A0F16] py-4 md:py-8 px-4 md:px-[80px]" ref={ref}>
      <motion.div 
        className="max-w-[1280px] mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-4 lg:grid-cols-4 gap-1">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card bg-[#0A0F16] text-center p-2 md:p-[20px_12px] flex flex-col justify-center" style={{ opacity: 0 }}>
              <div>
                <div style={{display:'flex', alignItems:'baseline', gap:'1px', justifyContent:'center'}}>
                  <span className="font-display font-extrabold text-[#F1F5F9] tracking-tighter leading-none text-[12px] md:text-[32px] lg:text-[42px]">
                    {stat.isShiny ? (
                      <ShinyText text={stat.value} speed={5} style={{ fontFamily:'Sora', fontSize:'inherit', fontWeight:800 }} />
                    ) : (
                      <CountUp 
                        from={0}
                        to={stat.value} 
                        suffix={stat.suffix}
                        duration={stat.duration} 
                      />
                    )}
                  </span>
                </div>
                <div className={`mt-1 md:mt-2 font-bold tracking-tight md:tracking-widest text-[7px] md:text-[11px] ${stat.isShiny ? 'text-emerald-400' : 'text-[#4B6478]'}`}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Methodology disclaimer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.4 } : { opacity: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center text-[7px] md:text-[10px] text-[#4B6478] mt-4 md:mt-8 uppercase tracking-[0.2em] font-bold"
        >
          *Berdasarkan rata-rata data 500+ pengguna aktif sepanjang 2024
        </motion.p>
      </motion.div>
    </section>
  );
};

export default StatsBar;
