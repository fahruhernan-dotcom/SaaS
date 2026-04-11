import { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import CountUp from '../components/reactbits/CountUp';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import AnimatedCheckmark from '../components/ui/AnimatedCheckmark';
import anime from '../lib/animation';

const Features = ({ activeRole }) => {
  const content = useMemo(() => ({
    broker: {
      block1: {
        badge: "TRANSAKSI & PROFIT",
        title: "Profit Langsung Kelihatan Sebelum Deal.",
        desc: "Input pembelian dari kandang dan penjualan ke RPA. Margin per kg, total profit, semua dihitung otomatis. Ada simulator margin sebelum kamu deal.",
        checklist: ['Hitung margin per kg otomatis', 'Simulator profit akurat', 'Tanpa kalkulator atau Excel rawan error'],
        mockup: {
          label: "Catat Penjualan Baru",
          items: ["Harga Jual: Rp 23.000/kg", "Total Berat: 2.100 kg"],
          profit: 5880000,
          stats: "Margin: Rp 2.800/kg · ROI: 14.3%",
          progress: "68%"
        }
      },
      block2: {
        badge: "TRACKER PIUTANG",
        title: "Tidak Ada Lagi Hutang RPA yang Kelewat.",
        desc: "Semua piutang RPA tercatat dengan jatuh tempo. Satu ketukan untuk tandai lunas. Lihat siapa yang paling lama menunggak dari dashboard.",
        checklist: ['Notifikasi jatuh tempo pembayaran', 'Tandai lunas dengan satu klik', 'Riwayat piutang per RPA'],
        mockup: {
          label: "Piutang Aktif",
          badge: "3 belum lunas",
          items: [
            { name: 'RPA Prima Jaya', amount: 'Rp 44jt', date: 'Jatuh tempo 14 Mar', avatar: 'PJ', bg: 'bg-emerald-600' },
            { name: 'RPA Berkah', amount: 'Rp 28jt', date: 'Jatuh tempo 18 Mar', avatar: 'RB', bg: 'bg-[#0891B2]' },
            { name: 'RPA Makmur', amount: 'Rp 12jt', date: 'Jatuh tempo 22 Mar', avatar: 'RM', bg: 'bg-amber-500' }
          ]
        }
      }
    },
    peternak: {
      block1: {
        badge: "+ KELOLA SIKLUS",
        title: "Pantau Siklus Budidaya dari Awal sampai Panen.",
        desc: "Input harian pakan, mortalitas, dan bobot otomatis terhitung. FCR dan efisiensi pakan langsung kelihatan tanpa Excel.",
        checklist: ['FCR otomatis terhitung tiap hari', 'Grafik pertumbuhan bobot per siklus', 'Alert stok pakan menipis'],
        mockup: {
          label: "SIKLUS AKTIF",
          items: ["Kandang Makmur · Hari ke-28", "Populasi: 5.000 ekor"],
          profit: 1.72,
          profitPrefix: "FCR: ",
          profitSuffix: "",
          stats: "Target Panen: 14 hari lagi",
          progress: "75%",
          isFCR: true
        }
      },
      block2: {
        badge: "+ KONEKSI BROKER",
        title: "Listing Stok Ayam Siap Jual ke Broker.",
        desc: "Tidak perlu telepon satu-satu. Pasang listing stok, broker yang cocok langsung bisa hubungi kamu.",
        checklist: ['Listing stok terlihat oleh broker terdaftar', 'Notifikasi saat ada broker tertarik', 'Riwayat transaksi dengan broker'],
        mockup: {
          label: "STOK LISTING",
          badge: "3 listing aktif",
          items: [
            { name: 'Kandang Utama', amount: '4.500 ekor', date: 'Ready 20 Mar', avatar: 'KU', bg: 'bg-emerald-600', subBadge: 'AKTIF' },
            { name: 'Kandang Barat', amount: '5.200 ekor', date: 'Ready 25 Mar', avatar: 'KB', bg: 'bg-[#0891B2]', subBadge: 'AKTIF' },
            { name: 'Kandang Timur', amount: '3.800 ekor', date: 'Ready 28 Mar', avatar: 'KT', bg: 'bg-amber-500', subBadge: 'AKTIF' }
          ]
        }
      }
    },
    rpa: {
      block1: {
        badge: "+ KELOLA ORDER",
        title: "Semua Order Pembelian Ayam di Satu Tempat.",
        desc: "Buat purchase order ke broker, pantau status pengiriman, dan catat pembayaran dalam satu dashboard terintegrasi.",
        checklist: ['Purchase order ke banyak broker sekaligus', 'Status pengiriman real-time', 'Riwayat pembelian per broker'],
        mockup: {
          label: "ORDER AKTIF",
          items: ["PO #882 - Broker Sinar", "Total: 3.500 kg"],
          profit: 2450,
          profitPrefix: "Total: ",
          profitSuffix: " ekor",
          stats: "Status: DIKIRIM (On Route)",
          progress: "45%"
        }
      },
      block2: {
        badge: "+ TRACKER HUTANG",
        title: "Tidak Ada Lagi Hutang ke Broker yang Kelewat.",
        desc: "Semua hutang ke broker tercatat dengan jatuh tempo. Tandai lunas dengan satu ketukan. Lihat total hutang berjalan.",
        checklist: ['Jatuh tempo otomatis tercatat', 'Notifikasi H-3 sebelum jatuh tempo', 'Riwayat pembayaran per broker'],
        mockup: {
          label: "HUTANG BERJALAN",
          badge: "4 tagihan",
          items: [
            { name: 'Broker Sentosa', amount: 'Rp 32jt', date: 'Jatuh tempo 15 Mar', avatar: 'BS', bg: 'bg-emerald-600' },
            { name: 'Broker Jaya', amount: 'Rp 18jt', date: 'Jatuh tempo 20 Mar', avatar: 'BJ', bg: 'bg-[#0891B2]' },
            { name: 'Broker Abadi', amount: 'Rp 45jt', date: 'Jatuh tempo 25 Mar', avatar: 'BA', bg: 'bg-amber-500' }
          ]
        }
      }
    }
  }), []);

  const active = content[activeRole];
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });

  useEffect(() => {
    if (isInView) {
      // Animate progress bars
      anime({
        targets: '.feature-progress-fill',
        width: (el) => el.getAttribute('data-width'),
        duration: 1500,
        easing: 'easeOutElastic(1, .6)',
        delay: 500
      });

      // Staggered list items entry
      anime({
        targets: '.feature-mockup-item',
        translateX: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100, { start: 600 }),
        duration: 800,
        easing: 'easeOutExpo'
      });
    }
  }, [isInView, activeRole]);

  return (
    <section id="fitur" className="bg-[#0C1319]" ref={sectionRef}>
      <AnimatePresence mode="wait">
        <motion.div
           key={activeRole}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.3 }}
        >
          {/* Feature 1 */}
          <div className="section-padding relative overflow-hidden">
            <div className="max-w-[1280px] mx-auto">
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
                <div className="flex-1">
                  <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        {active.block1.badge}
                      </span>
                    </div>
                  </AnimatedContent>
                  <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0.1}>
                    <h3 className="section-h2 mb-[12px]">
                      {active.block1.title}
                    </h3>
                  </AnimatedContent>
                  <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0.2}>
                    <p className="section-subtitle mb-[20px]">
                      {active.block1.desc}
                    </p>
                  </AnimatedContent>
                  
                  <div className="space-y-[9px]">
                    {active.block1.checklist.map((item, i) => (
                      <AnimatedContent key={i} direction="vertical" distance={20} delay={0.3 + i * 0.07}>
                        <div className="flex items-start gap-[10px]">
                          <div className="w-[18px] h-[18px] min-w-[18px] flex items-center justify-center text-em-400 shrink-0 mt-[3px]">
                            <AnimatedCheckmark className="w-full h-full" />
                          </div>
                          <span className="font-body text-[14px] text-tx-2 leading-[1.55]">{item}</span>
                        </div>
                      </AnimatedContent>
                    ))}
                  </div>
                </div>

                <AnimatedContent direction="horizontal" distance={50} delay={0.2} className="flex-1 w-full mt-8 lg:mt-0">
                  <div className="bg-bg-2 border border-border-def rounded-[18px] p-[20px] relative overflow-hidden shadow-lg">
                    <div className="flex gap-[6px] mb-[16px]">
                      <div className="w-[8px] h-[8px] rounded-full bg-[#FF5F57]"></div>
                      <div className="w-[8px] h-[8px] rounded-full bg-[#FEBC2E]"></div>
                      <div className="w-[8px] h-[8px] rounded-full bg-[#28C840]"></div>
                    </div>

                    <p className="font-body text-[11px] text-tx-3 font-semibold mb-[12px] relative z-10">{active.block1.mockup.label}</p>
                    
                    <div className="flex flex-col gap-[8px]">
                       {active.block1.mockup.items.map((item, i) => (
                         <div key={i} className="feature-mockup-item bg-bg-3 rounded-lg px-[12px] py-[10px]" style={{ opacity: 0 }}>
                           <p className="font-body text-[13px] text-tx-2">{item}</p>
                         </div>
                       ))}
                    </div>

                    <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.20)] rounded-[12px] p-[16px] mt-[12px] relative z-10">
                      <p className="font-display text-[9px] text-em-400 uppercase tracking-widest font-bold mb-[4px]">
                        {active.block1.mockup.isFCR ? "DATA SIKLUS" : "PROFIT BERSIH"}
                      </p>
                      <p className="font-display text-[22px] font-extrabold text-em-400 mb-[4px]">
                        {active.block1.mockup.isFCR ? (
                          <>FCR: {active.block1.mockup.profit}</>
                        ) : (
                          <CountUp 
                            from={0} 
                            to={active.block1.mockup.profit} 
                            duration={1.5} 
                            separator="." 
                            prefix={active.block1.mockup.profitPrefix || "Rp "}
                            suffix={active.block1.mockup.profitSuffix || ""}
                          />
                        )}
                      </p>
                      <p className="font-body text-[11px] text-tx-3 font-medium">{active.block1.mockup.stats}</p>
                      
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', marginTop: '12px', overflow: 'hidden' }}>
                        <div 
                          className="feature-progress-fill" 
                          data-width={active.block1.mockup.progress}
                          style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '99px' }}
                        />
                      </div>
                    </div>
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="section-fade-bottom section-padding">
            <div className="max-w-[1280px] mx-auto">
              <div className="flex flex-col lg:flex-row-reverse gap-10 lg:gap-16 items-center">
                <div className="flex-1">
                  <AnimatedContent direction="horizontal" distance={50} delay={0}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        {active.block2.badge}
                      </span>
                    </div>
                  </AnimatedContent>
                  <AnimatedContent direction="horizontal" distance={50} delay={0.1}>
                    <h3 className="section-h2 mb-[12px]">
                      {active.block2.title}
                    </h3>
                  </AnimatedContent>
                  <AnimatedContent direction="horizontal" distance={50} delay={0.2}>
                    <p className="section-subtitle mb-[20px]">
                      {active.block2.desc}
                    </p>
                  </AnimatedContent>
                  
                  <div className="space-y-[9px]">
                    {active.block2.checklist.map((item, i) => (
                      <AnimatedContent key={i} direction="vertical" distance={20} delay={0.3 + i * 0.07}>
                        <div className="flex items-start gap-[10px]">
                          <div className="w-[18px] h-[18px] min-w-[18px] flex items-center justify-center text-em-400 shrink-0 mt-[3px]">
                            <AnimatedCheckmark className="w-full h-full" />
                          </div>
                          <span className="font-body text-[14px] text-tx-2 leading-[1.55]">{item}</span>
                        </div>
                      </AnimatedContent>
                    ))}
                  </div>
                </div>

                <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0.2} className="flex-1 w-full mt-8 lg:mt-0">
                  <div className="bg-bg-2 border border-border-def rounded-[18px] p-[20px] relative overflow-hidden shadow-lg">
                    <div className="flex gap-[6px] mb-[16px]">
                      <div className="w-[8px] h-[8px] rounded-full bg-[#FF5F57]"></div>
                      <div className="w-[8px] h-[8px] rounded-full bg-[#FEBC2E]"></div>
                      <div className="w-[8px] h-[8px] rounded-full bg-[#28C840]"></div>
                    </div>

                    <div className="flex justify-between items-center mb-[16px] relative z-10">
                       <p className="font-display text-[12px] text-tx-1 font-bold">{active.block2.mockup.label}</p>
                       <span className={`font-body text-[10px] ${activeRole === 'peternak' ? 'bg-em-glow text-em-400' : 'bg-red-bg text-red'} px-[8px] py-[2px] rounded-full font-bold`}>
                         {active.block2.mockup.badge}
                       </span>
                    </div>

                    <div className="flex flex-col">
                      {active.block2.mockup.items.map((item, i) => (
                        <div key={i} className={`flex items-center gap-[10px] pt-[12px] pb-[10px] ${i !== 2 ? 'border-b border-border-sub' : ''}`}>
                          <div className={`w-[32px] h-[32px] rounded-full ${item.bg} text-white font-display font-bold text-[11px] flex items-center justify-center shrink-0`}>
                            {item.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-[13px] text-tx-1 font-semibold leading-tight mb-0.5 truncate">{item.name}</p>
                            <p className="font-body text-[11px] text-tx-3">{item.date}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1.5 ml-2">
                            <div className="flex items-center gap-2">
                              <p className={`font-display text-[13px] font-bold ${activeRole === 'peternak' ? 'text-tx-1' : 'text-red'} tabular-nums whitespace-nowrap`}>
                                {item.amount}
                              </p>
                              {item.subBadge && (
                                <span className="text-[8px] font-black bg-em-500/10 text-em-400 px-1.5 py-0.5 rounded border border-em-500/20">
                                  {item.subBadge}
                                </span>
                              )}
                            </div>
                            <button className={`${activeRole === 'peternak' ? 'bg-secondary/10 text-tx-3' : 'bg-em-glow text-em-400'} text-[10px] font-bold py-[3px] px-[8px] rounded-full`}>
                              {activeRole === 'peternak' ? 'Detail' : 'Lunas'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Features;
