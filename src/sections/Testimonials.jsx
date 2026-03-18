import { motion } from 'framer-motion';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Semenjak pakai TernakOS, hitung margin jadi gampang banget. Piutang RPA juga nggak ada yang kelewat mati karena semuanya dicatat rapi.",
      name: "Budi Santoso",
      role: "Broker Jawa Tengah",
      avatar: "BS",
      bg: "bg-emerald-600"
    },
    {
      quote: "Platformnya gampang dimengerti bahkan untuk saya yang gaptek. Notifikasi jatuh tempo sangat membantu mengingatkan RPA bayar hutang tepat waktu.",
      name: "Rahmat Hidayat",
      role: "Broker Jawa Timur",
      avatar: "RH",
      bg: "bg-[#0891B2]"
    },
    {
      quote: "Fitur harga pasar eksklusif itu game-changer. Saya jadi nggak buta harga pas mau deal jual broiler ke bakulan. Semuanya fair dan untung maksimal.",
      name: "Siti Wahyuni",
      role: "Peternak Kemitraan",
      avatar: "SW",
      bg: "bg-[#7C3AED]"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };
  return (
    <section id="testimoni" className="bg-[#0C1319] section-fade-bottom section-padding">
      <div className="max-w-[1280px] mx-auto">
        
        <div className="text-center mb-[40px] md:mb-[60px]">
          <AnimatedContent direction="vertical" distance={30} delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                TESTIMONI
              </span>
            </div>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <h2 className="section-h2 mb-[12px]">
              Kata Mereka yang Sudah Pakai
            </h2>
          </AnimatedContent>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((testi, i) => {
            const direction = i === 0 ? "horizontal" : (i === 1 ? "vertical" : "horizontal");
            const reverse = i === 0;
            return (
              <AnimatedContent
                key={i}
                direction={direction}
                reverse={reverse}
                distance={40}
                delay={i * 0.12}
              >
                <div className="bg-bg-2 border border-border-def rounded-[20px] p-[26px] md:p-[28px] relative hover:y-[-6] transition-transform duration-200">
                  <div className="text-gold font-body text-[14px] mb-[14px] md:mb-[16px] flex gap-[2px]">
                    <div className="flex gap-[2px]">
                      {[...Array(5)].map((_, idx) => (
                        <span key={idx} style={{ animation: `scale-in 0.3s ease-out ${0.3 + idx * 0.1}s both` }}>★</span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="font-body text-[14px] text-tx-2 leading-[1.7] italic mb-[18px]">
                    "{testi.quote}"
                  </p>
                  
                  <div className="w-full h-px bg-border-sub mb-[16px]"></div>
                  
                  <div className="flex items-center gap-[10px]">
                    <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-display font-extrabold text-[14px] text-white shrink-0 ${testi.bg}`}>
                      {testi.avatar}
                    </div>
                    <div className="flex flex-col">
                      <p className="font-body text-[14px] font-bold text-tx-1 leading-snug">{testi.name}</p>
                      <p className="font-body text-[12px] text-tx-3 mt-0.5">{testi.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedContent>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
