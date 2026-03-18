import { motion, AnimatePresence } from 'framer-motion';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const HowItWorks = ({ activeRole }) => {
  const stepsConfig = {
    broker: [
      { num: "01", title: "Daftar Gratis", desc: "Buat akun 30 detik. Pilih role Broker atau Peternak." },
      { num: "02", title: "Setup Bisnis", desc: "Tambah kandang rekanan dan daftar RPA pembeli. Sekali setup." },
      { num: "03", title: "Catat & Pantau", desc: "Mulai catat transaksi secara digital. Pantau profit dan stok secara real-time." }
    ],
    peternak: [
      { num: "01", title: "Daftar Gratis", desc: "Buat akun 30 detik. Pilih role Peternak." },
      { num: "02", title: "Input Kandang", desc: "Tambah kandang dan mulai siklus budidaya pertama." },
      { num: "03", title: "Catat & Analisis", desc: "Input harian otomatis hitung FCR dan prediksi waktu panen." }
    ],
    rpa: [
      { num: "01", title: "Daftar Gratis", desc: "Buat akun 30 detik. Pilih role RPA." },
      { num: "02", title: "Tambah Broker", desc: "Daftarkan broker langganan sebagai supplier." },
      { num: "03", title: "Order & Pantau", desc: "Buat order, pantau pengiriman, catat pembayaran — semua dalam satu dashboard." }
    ]
  };

  const steps = stepsConfig[activeRole] || stepsConfig.broker;

  return (
    <section id="cara-kerja" className="bg-[#06090F] section-fade-bottom section-padding">
      <div className="max-w-[1280px] mx-auto overflow-hidden">
        
        <div className="text-center mb-[60px] lg:mb-[80px]">
          <AnimatedContent direction="vertical" distance={30} delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                MULAI DALAM MENIT
              </span>
            </div>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <h2 className="section-h2 mb-[12px]">
              3 Langkah Menuju Bisnis yang Lebih Rapi
            </h2>
          </AnimatedContent>
        </div>

        <div className="relative max-w-[1100px] mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeRole}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-[40px] lg:gap-[0px] relative z-10"
            >
              {steps.map((step, i) => (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col items-center text-center relative"
                >
                  
                  {/* Connector Line (Desktop Only) */}
                  {i !== steps.length - 1 && (
                    <div className="hidden lg:block absolute top-[44px] left-[calc(50%+44px)] right-[calc(-50%+44px)] h-[2px] z-0">
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeInOut', delay: 0.6 + i * 0.2 }}
                        style={{ originX: 0 }}
                        className="w-full h-full bg-gradient-to-r from-em-500/40 via-em-500/20 to-transparent border-t border-dashed border-em-500/30"
                      />
                    </div>
                  )}

                  {/* Step Circle Container */}
                  <div className="relative mb-6">
                    {/* Outer Glow Ring */}
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-[-8px] rounded-full bg-em-500/10 blur-md"
                    />
                    
                    {/* Circle */}
                    <div className="w-[88px] h-[88px] rounded-full bg-[#111C24] border border-border-acc flex items-center justify-center relative z-10 group transition-all duration-300 hover:border-em-500/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <span className="font-display text-[28px] font-black text-[#F1F5F9] transition-colors duration-300 group-hover:text-em-400">
                        {step.num}
                      </span>
                    </div>
                  </div>
                  
                  <div className="max-w-[280px]">
                    <p className="font-body text-[11px] font-bold text-em-400 tracking-[1.5px] uppercase mb-[8px]">
                      Langkah {i + 1}
                    </p>
                    <h3 className="font-display text-[18px] md:text-[20px] font-bold text-[#F1F5F9] mb-[12px]">
                      {step.title}
                    </h3>
                    <p className="text-[#64748B] text-[14px] leading-[1.6] px-2">
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
