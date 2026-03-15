import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import CountUp from '../components/reactbits/CountUp';
import ShinyText from '../components/reactbits/ShinyText';

const StatsBar = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const stats = [
    { value: 500, suffix: "+", label: "Broker & Peternak", duration: 1.8 },
    { value: 50, suffix: "rb+", label: "Transaksi Tercatat", duration: 2 },
    { value: "Rp 2M+", isShiny: true, label: "Profit Terpantau" },
    { value: 14, suffix: " hari", label: "Coba Gratis", duration: 1.5 }
  ];

  return (
    <section className="bg-[#0A0F16]" style={{ padding: '28px clamp(20px, 5vw, 80px)' }} ref={ref}>
      <motion.div 
        className="max-w-[1280px] mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px]">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#0A0F16] text-center p-[20px_12px] flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div style={{display:'flex', alignItems:'baseline', gap:'2px', justifyContent:'center'}}>
                  <span style={{fontFamily:'Sora', fontSize:'42px', fontWeight:800, color:'#F1F5F9', letterSpacing:'-2px', lineHeight:1}}>
                    {stat.isShiny ? (
                      <ShinyText text={stat.value} speed={5} style={{ fontFamily:'Sora', fontSize:'42px', fontWeight:800 }} />
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
                <div style={{fontSize:'12px', color:'#4B6478', marginTop:'6px', letterSpacing:'0.5px'}}>
                  {stat.label}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default StatsBar;
