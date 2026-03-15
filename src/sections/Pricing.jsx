import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import CountUp from '../components/reactbits/CountUp';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const Pricing = () => {
  const [openFaq, setOpenFaq] = useState(null);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const faqs = [
     { q: "Bisa cancel kapan saja?", a: "Tentu. Tidak ada kontrak panjang. Anda bisa berhenti berlangganan kapan saja." },
     { q: "Kalau HP rusak, data saya hilang?", a: "Tidak. Semua data tersimpan aman di cloud TernakOS. Cukup login di HP baru, semua data kembali seperti semula." },
     { q: "Komoditas apa yang didukung sekarang?", a: "Saat ini TernakOS berfokus pada ayam broiler dan pejantan. Kami akan terus menambah komoditas lain." },
     { q: "Apakah data saya aman?", a: "Sangat aman. Kami menggunakan enkripsi kelas bank untuk melindungi data transaksi dan harga pasar Anda. Data Anda tidak akan dibagikan ke pihak ketiga." }
  ];

  return (
    <section id="harga" className="bg-[#0A0F16] section-padding">
      <div className="max-w-[1280px] mx-auto">
         
         <div className="text-center mb-[48px] lg:mb-[64px]">
           <AnimatedContent direction="vertical" distance={30} delay={0}>
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
               <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
               <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                 HARGA
               </span>
             </div>
           </AnimatedContent>
           <AnimatedContent direction="vertical" distance={40} delay={0.1}>
             <h2 className="section-h2 mb-[12px]">
               Pilih Plan yang Sesuai Bisnismu
             </h2>
           </AnimatedContent>
           <AnimatedContent direction="vertical" distance={30} delay={0.2}>
             <p className="section-subtitle max-w-[480px] mx-auto">
               Mulai gratis, upgrade kapan saja. Tidak ada kontrak.
             </p>
           </AnimatedContent>
         </div>

         {/* Pricing Cards (Column flex for mobile, grid for md+) */}
         <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-[24px] relative">
            {/* Glow di belakang card Pro */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }}/>

            {/* Starter */}
            <AnimatedContent direction="vertical" distance={40} delay={0} className="bg-bg-2 border border-border-def rounded-[20px] p-[28px] flex flex-col pt-[36px]">
               <p className="font-body text-[11px] uppercase tracking-[1.5px] text-tx-3 font-bold mb-[10px]">STARTER</p>
                <div className="flex items-baseline mb-[12px]">
                  <CountUp 
                    from={0} 
                    to={299} 
                    duration={1.5}
                    prefix="Rp "
                    suffix="rb"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: '38px',
                      fontWeight: 800,
                      color: '#F1F5F9',
                      letterSpacing: '-1px'
                    }}
                  />
                  <span className="font-body text-[14px] text-tx-3 font-medium ml-1">/bln</span>
                </div>
               <p className="font-body text-[13px] text-tx-3 mb-[20px] h-[36px] leading-[1.6]">Cocok untuk mulai manajemen peternakan dasar.</p>
               
               <div className="w-full h-px bg-border-sub mb-[20px]"></div>
               
               <ul className="space-y-[9px] mb-[28px] flex-1">
                 {['1 pengguna', 'Data 6 bulan terakhir', 'Catat transaksi beli & jual', 'Manajemen kandang & RPA', 'Tracker piutang dasar'].map((f, i) => (
                   <li key={i} className="flex items-start gap-[12px]">
                     <div className="w-[16px] h-[16px] min-w-[16px] bg-[rgba(16,185,129,0.12)] rounded-[4px] flex items-center justify-center shrink-0 mt-[2px] text-em-400 font-bold text-[9px]">
                       ✓
                     </div>
                     <span className="font-body text-[13px] text-tx-2 leading-[1.5] mt-[-1px]">{f}</span>
                   </li>
                 ))}
               </ul>

               <button className="w-full py-[13px] bg-bg-3 border border-border-strong rounded-[10px] font-body text-[14px] font-bold text-tx-2 mt-[20px] active:scale-[0.98] transition-transform">
                 Mulai Starter
               </button>
            </AnimatedContent>

            {/* Pro (Featured) */}
            <AnimatedContent direction="vertical" distance={40} delay={0.1} className="order-first lg:order-none featured-card-border shadow-[0_20px_50px_rgba(16,185,129,0.10)] lg:-translate-y-4 z-10 animate-pulse-glow">
              <div className="bg-[linear-gradient(160deg,rgba(16,185,129,0.10)_0%,rgba(16,185,129,0.04)_100%)] rounded-[20px] p-[28px] lg:p-[36px_28px] relative flex flex-col h-full w-full">
                <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 bg-em-500 text-white font-display text-[11px] font-bold tracking-[0.5px] py-[5px] px-[18px] rounded-full shadow-[0_4px_14px_rgba(16,185,129,0.30)] whitespace-nowrap">
                  PALING POPULER
                </div>

                <p className="font-body text-[11px] uppercase tracking-[1.5px] text-em-400 font-bold mb-[10px]">PRO</p>
                <div className="flex items-baseline mb-[12px]">
                  <CountUp 
                    from={0} 
                    to={500} 
                    duration={1.5}
                    prefix="Rp "
                    suffix="rb"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: 'clamp(38px, 5vw, 44px)',
                      fontWeight: 800,
                      color: '#F1F5F9',
                      letterSpacing: '-1.5px'
                    }}
                  />
                  <span className="font-body text-[14px] text-tx-3 font-medium ml-1">/bln</span>
                </div>
                <p className="font-body text-[13px] text-tx-3 mb-[20px] h-[36px] leading-[1.6]">Fitur pro lengkap untuk memperlancar operasi broker.</p>
                
                <div className="w-full h-px bg-[rgba(16,185,129,0.20)] mb-[20px]"></div>
                
                <ul className="space-y-[9px] mb-[28px] flex-1">
                  {['3 pengguna', 'Data tidak terbatas', 'Semua fitur Starter +', 'Harga pasar real-time', 'Simulator margin', 'Laporan & export Excel', '14 hari coba gratis'].map((f, i) => (
                    <li key={i} className="flex items-start gap-[12px]">
                      <div className="w-[16px] h-[16px] min-w-[16px] bg-[rgba(16,185,129,0.12)] rounded-[4px] flex items-center justify-center shrink-0 mt-[2px] text-em-400 font-bold text-[9px]">
                        ✓
                      </div>
                      <span className={`font-body text-[13px] leading-[1.5] mt-[-1px] ${i === 2 ? 'font-semibold text-tx-1' : 'text-tx-2'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-[13px] bg-em-500 rounded-[10px] shadow-[0_4px_20px_rgba(16,185,129,0.25)] font-body text-[14px] font-bold text-white mt-[20px] active:scale-[0.98] transition-transform">
                  Coba 14 Hari Gratis
                </button>
              </div>
            </AnimatedContent>

            {/* Business */}
            <AnimatedContent direction="vertical" distance={40} delay={0.2} className="bg-bg-2 border border-border-def rounded-[20px] p-[28px] flex flex-col pt-[36px]">
               <p className="font-body text-[11px] uppercase tracking-[1.5px] text-gold font-bold mb-[10px]">BUSINESS</p>
                <div className="flex items-baseline mb-[12px]">
                  <CountUp 
                    from={0} 
                    to={999} 
                    duration={1.5}
                    prefix="Rp "
                    suffix="rb"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: '38px',
                      fontWeight: 800,
                      color: '#F1F5F9',
                      letterSpacing: '-1px'
                    }}
                  />
                  <span className="font-body text-[14px] text-tx-3 font-medium ml-1">/bln</span>
                </div>
               <p className="font-body text-[13px] text-tx-3 mb-[20px] h-[36px] leading-[1.6]">Skala besar dengan analytics dan laporan khusus.</p>
               
               <div className="w-full h-px bg-border-sub mb-[20px]"></div>
               
               <ul className="space-y-[9px] mb-[28px] flex-1">
                 {['Unlimited pengguna', 'Semua fitur Pro +', 'Analytics mendalam per RPA', 'Export PDF & Excel Custom', 'Laporan performa harian', 'Priority support WhatsApp'].map((f, i) => (
                   <li key={i} className="flex items-start gap-[12px]">
                     <div className={`w-[16px] h-[16px] min-w-[16px] bg-[rgba(16,185,129,0.12)] rounded-[4px] flex items-center justify-center shrink-0 mt-[2px] font-bold text-[9px] ${i === 1 ? 'text-gold' : 'text-em-400'}`}>
                       ✓
                     </div>
                     <span className={`font-body text-[13px] leading-[1.5] mt-[-1px] ${i === 1 ? 'font-semibold text-tx-1' : 'text-tx-2'}`}>{f}</span>
                   </li>
                 ))}
               </ul>

               <button className="w-full py-[13px] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.20)] rounded-[10px] font-body text-[14px] font-bold text-gold mt-[20px] active:scale-[0.98] transition-transform">
                 Hubungi Sales
               </button>
            </AnimatedContent>
         </div>

         {/* FAQ Accordion */}
         <div className="max-w-[480px] mx-auto mt-[40px] md:mt-[64px] border-t border-border-sub pt-[24px]">
            <AnimatedContent direction="vertical" distance={20} delay={0.1}>
              <h3 className="font-display text-[20px] font-bold text-tx-1 text-center mb-[24px]">Pertanyaan Umum</h3>
            </AnimatedContent>
            
            <div className="flex flex-col">
               {faqs.map((faq, i) => (
                 <AnimatedContent 
                   key={i} 
                   direction="vertical"
                   distance={20}
                   delay={0.2 + i * 0.05}
                   className="border-b border-border-sub py-[16px]"
                 >
                   <button 
                     onClick={() => setOpenFaq(openFaq === i ? null : i)}
                     className="w-full text-left flex justify-between items-center bg-transparent focus:outline-none group"
                   >
                     <p className="font-body font-semibold text-[15px] text-tx-1 transition-colors group-hover:text-em-400">{faq.q}</p>
                     <ChevronDown 
                       size={18} 
                       className={`text-tx-3 transition-transform duration-300 shrink-0 ${openFaq === i ? 'rotate-180 text-em-400' : ''}`} 
                     />
                   </button>
                   <AnimatePresence>
                     {openFaq === i && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.25, ease: "easeInOut" }}
                         className="overflow-hidden"
                       >
                         <p className="font-body text-[14px] text-tx-3 leading-[1.7] pt-[10px] md:pr-[24px]">
                           {faq.a}
                         </p>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </AnimatedContent>
               ))}
            </div>
         </div>

      </div>
    </section>
  );
};

export default Pricing;
