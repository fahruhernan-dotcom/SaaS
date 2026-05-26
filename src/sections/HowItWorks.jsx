import { motion, AnimatePresence } from 'framer-motion';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const HowItWorks = ({ activeRole }) => {
  const stepsConfig = {
    broker: [
      { num: "01", title: "Daftar Gratis", desc: "Buat akun dalam 30 detik. Pilih peran Broker atau Peternak." },
      { num: "02", title: "Setup Bisnis", desc: "Daftarkan kandang rekanan dan pelanggan RPA Anda. Cukup sekali setup." },
      { num: "03", title: "Catat & Pantau", desc: "Mulai catat transaksi secara digital. Pantau margin profit dan sisa piutang harian." }
    ],
    peternak: [
      { num: "01", title: "Daftar Gratis", desc: "Buat akun dalam 30 detik. Pilih peran Peternak." },
      { num: "02", title: "Setup Kandang", desc: "Tambahkan kandang dan mulai siklus budidaya perdana Anda." },
      { num: "03", title: "Catat Harian", desc: "Input pakan & mortalitas harian. Pantau perkembangan FCR dan prediksi panen." }
    ],
    rpa: [
      { num: "01", title: "Daftar Gratis", desc: "Buat akun dalam 30 detik. Pilih peran RPA." },
      { num: "02", title: "Tambah Broker", desc: "Daftarkan broker langganan Anda sebagai supplier livebird." },
      { num: "03", title: "Order & Yield", desc: "Buat order livebird, catat hasil potong karkas, dan pantau yield produksi." }
    ]
  };

  const steps = stepsConfig[activeRole] || stepsConfig.broker;

  return (
    <section id="cara-kerja" className="bg-bg-base section-fade-bottom section-padding">
      <div className="max-w-[1280px] mx-auto overflow-hidden">
        
        <div className="text-center mb-[40px] md:mb-[50px]">
          <AnimatedContent direction="vertical" distance={20} delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(2, 26, 2,0.06)', border: '1px solid rgba(2, 26, 2,0.14)', borderRadius: '99px', padding: '4px 12px', marginBottom: '12px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#021a02', animation: 'pulse-dot 2s infinite' }}/>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#021a02', letterSpacing: '2px', textTransform: 'uppercase' }}>
                MULAI DALAM MENIT
              </span>
            </div>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <h2 className="section-h2 mb-[8px]">
              3 Langkah Menuju Bisnis yang Lebih Rapi
            </h2>
          </AnimatedContent>
        </div>

        <div className="relative max-w-[1100px] mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeRole}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 relative z-10"
            >
              {steps.map((step, i) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center text-center relative"
                >
                  
                  {/* Connector Line (Desktop Only) */}
                  {i !== steps.length - 1 && (
                    <div className="hidden lg:block absolute top-[44px] left-[calc(50%+44px)] right-[calc(-50%+44px)] h-[2px] z-0">
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.2 }}
                        style={{ originX: 0 }}
                        className="w-full h-full bg-border-default border-t border-dashed border-border-default"
                      />
                    </div>
                  )}

                  {/* Step Circle Container */}
                  <div className="relative mb-4">
                    {/* Ring */}
                    <div className="w-[64px] h-[64px] md:w-[88px] md:h-[88px] rounded-full bg-bg-2 border border-border-default flex items-center justify-center relative z-10 group transition-all duration-300 hover:border-emerald-500 shadow-sm">
                      <span className="font-display text-[18px] md:text-[28px] font-black text-text-primary transition-colors duration-300 group-hover:text-emerald-500">
                        {step.num}
                      </span>
                    </div>
                  </div>
                  
                  <div className="max-w-xs mx-auto">
                    <p className="font-body text-[10px] font-bold text-emerald-500 tracking-[1.5px] uppercase mb-2">
                      Langkah {i + 1}
                    </p>
                    <h3 className="font-display text-[15px] md:text-[18px] font-bold text-text-primary mb-2 leading-tight uppercase tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-text-secondary text-[13px] md:text-sm leading-relaxed px-2 font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
