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
        badge: "TRANSAKSI & MARGIN",
        title: "Transaksi Jual/Beli & Margin",
        desc: "Pencatatan timbangan kandang vs RPA secara real-time. Margin per kg, total profit bersih, serta biaya uang jalan armada dihitung otomatis tanpa kalkulator.",
        checklist: ['Kalkulator margin profit bersih otomatis', 'Rekap rute & biaya solar armada', 'Pencatatan timbangan kandang vs RPA'],
        mockup: {
          label: "Catat Penjualan Baru",
          items: ["Harga Jual: Rp 23.000/kg", "Total Berat: 2.100 kg"],
          profit: 5880000,
          stats: "Margin Bersih: Rp 2.800/kg · ROI: 14.3%",
          progress: "68%"
        }
      },
      block2: {
        badge: "TRACKER PIUTANG",
        title: "Lacak Piutang RPA",
        desc: "Tandai nota lunas, set pengingat jatuh tempo piutang RPA, dan pantau pengeluaran solar armada tanpa repot rekap manual.",
        checklist: ['Pelacakan piutang RPA otomatis', 'Notifikasi jatuh tempo nota tagihan', 'Pencatatan kas operasional & solar'],
        mockup: {
          label: "Piutang RPA Aktif",
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
        badge: "RECORDING KANDANG",
        title: "Recording & IP Score",
        desc: "Input pakan, mortalitas harian, dan timbangan sampling. FCR harian, Indeks Performan (IP), dan status deplesi terhitung otomatis.",
        checklist: ['Hitung FCR & IP harian otomatis', 'Pencatatan deplesi & pakan kandang', 'Dashboard performa per kandang'],
        mockup: {
          label: "STATUS KANDANG AKTIF",
          items: ["Kandang Blok A · Hari ke-28", "Recording Harian: 4/5 Kandang"],
          profit: 1.72,
          profitPrefix: "FCR: ",
          profitSuffix: "",
          stats: "IP Score: 345 (Sangat Baik)",
          progress: "80%",
          isFCR: true
        }
      },
      block2: {
        badge: "REKAP BIAYA & HPP",
        title: "Rekap HPP & Biaya OVK",
        desc: "Lacak setiap pengeluaran sapronak, biaya pakan starter/finisher, vitamin, hingga sewa kandang. HPP per kg terhitung sebelum panen dimulai.",
        checklist: ['Kalkulasi HPP per kg otomatis', 'Rekap pengeluaran pakan & OVK', 'Sistem validasi pengeluaran tim'],
        mockup: {
          label: "PENGELUARAN SIKLUS",
          badge: "Bulan Ini",
          items: [
            { name: 'Pakan Starter (Sak)', amount: 'Rp 14jt', date: 'Total 40 sak', avatar: 'PS', bg: 'bg-emerald-600', subBadge: 'LUNAS' },
            { name: 'Listrik & Air Kandang', amount: 'Rp 1.2jt', date: 'Beban Tetap', avatar: 'LA', bg: 'bg-[#0891B2]', subBadge: 'LUNAS' },
            { name: 'Vitamin & Vaksin OVK', amount: 'Rp 2.8jt', date: 'Vaksin ND', avatar: 'VO', bg: 'bg-amber-500', subBadge: 'LUNAS' }
          ]
        }
      }
    },
    rpa: {
      block1: {
        badge: "MANAJEMEN PRODUKSI",
        title: "Potong & Yield Karkas",
        desc: "Input berat livebird datang, hitung persentase konversi daging (yield karkas) otomatis harian, dan pantau hasil susut potong.",
        checklist: ['Manajemen potongan & karkas', 'Perhitungan yield karkas otomatis', 'Rekap susut berat livebird datang'],
        mockup: {
          label: "PRODUKSI POTONG HARI INI",
          items: ["Livebird Masuk: 3.500 kg", "Karkas Bersih: 2.450 kg"],
          profit: 70,
          profitPrefix: "Yield: ",
          profitSuffix: "%",
          stats: "Status: SELESAI POTONG",
          progress: "100%"
        }
      },
      block2: {
        badge: "STOK GUDANG & HUTANG",
        title: "Stok Cold Storage & Hutang",
        desc: "Pantau ketersediaan dada, paha, karkas di cold storage harian. Lacak sisa hutang dan riwayat pelunasan ke masing-masing broker.",
        checklist: ['Stok Cold Storage real-time', 'Pelacakan sisa hutang broker', 'Riwayat serah terima livebird'],
        mockup: {
          label: "COLD STORAGE & HUTANG",
          badge: "Aman",
          items: [
            { name: 'Broker Sentosa (Ayam)', amount: 'Rp 32jt', date: 'Jatuh tempo 15 Mar', avatar: 'BS', bg: 'bg-emerald-600' },
            { name: 'Dada Mentok (Stok)', amount: '1.200 kg', date: 'Gudang A', avatar: 'DM', bg: 'bg-[#0891B2]' },
            { name: 'Paha Bawah (Stok)', amount: '850 kg', date: 'Gudang B', avatar: 'PB', bg: 'bg-amber-500' }
          ]
        }
      }
    },
    sembako: {
      block1: {
        badge: "PEMBELIAN SUPPLIER",
        title: "Pembelian Supplier & PO",
        desc: "Input data pembelian barang dari supplier dengan mudah. Sistem memvalidasi metode pembayaran (tunai/hutang) untuk mencegah selisih uang kas.",
        checklist: ['Validasi Pembayaran Lunas', 'Rekap Hutang Supplier', 'Otomatis tambah stok gudang'],
        mockup: {
          label: "PO Terbaru",
          items: ["Supplier Makmur - 50 Karung Beras", "Status: Belum Lunas"],
          profit: 12500000,
          profitPrefix: "Hutang: Rp ",
          profitSuffix: "",
          stats: "Jatuh Tempo: 20 Mar",
          progress: "85%",
          isFCR: false
        }
      },
      block2: {
        badge: "KASIR PENJUALAN",
        title: "Kasir Penjualan",
        desc: "Proses transaksi kasir menjadi sangat mudah dengan Sales Wizard. Fitur retur, pelacakan pengiriman kurir, dan potong stok otomatis tanpa ribet.",
        checklist: ['Kasir Cepat (Sales Wizard)', 'Fitur Retur Barang', 'Laporan & Analytics Lengkap'],
        mockup: {
          label: "TRANSAKSI HARI INI",
          badge: "23 Selesai",
          items: [
            { name: 'Toko Sumber', amount: 'Rp 4.5jt', date: 'Dikirim: Kurir Anto', avatar: 'TS', bg: 'bg-emerald-600', subBadge: 'LUNAS' },
            { name: 'Ibu Ani', amount: 'Rp 850rb', date: 'Diambil di Toko', avatar: 'IA', bg: 'bg-[#0891B2]', subBadge: 'LUNAS' },
            { name: 'Warung Pojok', amount: 'Rp 2.1jt', date: 'Menunggu Kurir', avatar: 'WP', bg: 'bg-amber-500', subBadge: 'HUTANG' }
          ]
        }
      }
    }
  }), []);

  const active = content[activeRole] || content.broker;
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
        delay: 300
      });

      // Staggered list items entry
      anime({
        targets: '.feature-mockup-item',
        translateX: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(80, { start: 400 }),
        duration: 800,
        easing: 'easeOutExpo'
      });
    }
  }, [isInView, activeRole]);

  return (
    <section id="fitur" className="bg-bg-base py-20 px-5 border-t border-border-subtle" ref={sectionRef}>
      <div className="max-w-[1280px] mx-auto">
        
        {/* Title Block */}
        <div className="text-center mb-12">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#021a02] mb-3">
            EKSPLORASI FITUR
          </p>
          <h2 className="font-['Sora'] text-2xl md:text-3xl font-normal text-text-primary leading-tight">
            Alur Kerja Lebih Rapi, Pencatatan Lebih Valid
          </h2>
        </div>

        {/* Bento Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Bento Card 1: Core operations (Col Span 2) */}
            <div className="lg:col-span-2 bg-bg-1 border border-border-default rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between shadow-card hover:border-border-strong transition-all duration-300">
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="badge-premium mb-4 text-[9px] py-0.5 px-2.5">
                    {active.block1.badge}
                  </span>
                  <h3 className="font-display text-lg md:text-xl font-bold text-text-primary mb-3">
                    {active.block1.title}
                  </h3>
                  <p className="text-[13px] md:text-sm text-text-secondary leading-relaxed mb-6">
                    {active.block1.desc}
                  </p>
                </div>

                <div className="space-y-2">
                  {active.block1.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-[16px] h-[16px] flex items-center justify-center text-emerald-500 shrink-0 mt-[3px]">
                        <AnimatedCheckmark className="w-full h-full" />
                      </div>
                      <span className="text-[13px] text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mockup Preview Panel */}
              <div className="flex-1 bg-bg-2 border border-border-subtle rounded-2xl p-5 flex flex-col justify-between max-w-sm w-full mx-auto md:mx-0">
                <div>
                  <div className="flex gap-[6px] mb-[12px] opacity-40">
                    <div className="w-[6px] h-[6px] rounded-full bg-border-strong"></div>
                    <div className="w-[6px] h-[6px] rounded-full bg-border-strong"></div>
                    <div className="w-[6px] h-[6px] rounded-full bg-border-strong"></div>
                  </div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                    {active.block1.mockup.label}
                  </p>
                  <div className="flex flex-col gap-2">
                    {active.block1.mockup.items.map((item, idx) => (
                      <div key={idx} className="feature-mockup-item bg-bg-1 border border-border-subtle rounded-lg px-3 py-2" style={{ opacity: 0 }}>
                        <p className="text-[12px] font-medium text-text-secondary">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mt-4">
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
                    {active.block1.mockup.isFCR ? "DATA EVALUASI" : "JUMLAH TRANSAKSI"}
                  </p>
                  <p className="font-display text-lg font-black text-emerald-600 dark:text-emerald-400">
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
                  <p className="text-[10px] text-text-secondary mt-1 font-medium">{active.block1.mockup.stats}</p>
                  
                  <div className="h-1 bg-border-subtle rounded-full mt-3 overflow-hidden">
                    <div 
                      className="feature-progress-fill bg-emerald-500 h-full w-0" 
                      data-width={active.block1.mockup.progress}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Bento Card 2: Financial tracking (Col Span 1) */}
            <div className="bg-bg-1 border border-border-default rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-card hover:border-border-strong transition-all duration-300">
              
              <div>
                <span className="badge-premium mb-4 text-[9px] py-0.5 px-2.5">
                  {active.block2.badge}
                </span>
                <h3 className="font-display text-lg md:text-xl font-bold text-text-primary mb-3">
                  {active.block2.title}
                </h3>
                <p className="text-[13px] md:text-sm text-text-secondary leading-relaxed mb-6">
                  {active.block2.desc}
                </p>
              </div>

              {/* Rows List preview */}
              <div className="bg-bg-2 border border-border-subtle rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                  <span className="text-[10px] font-bold text-text-primary">{active.block2.mockup.label}</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/15">
                    {active.block2.mockup.badge}
                  </span>
                </div>

                <div className="flex flex-col">
                  {active.block2.mockup.items.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between py-2 border-b border-border-subtle/50 last:border-0`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full ${item.bg} text-white font-display font-bold text-[10px] flex items-center justify-center shrink-0`}>
                          {item.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-text-primary truncate">{item.name}</p>
                          <p className="text-[9px] text-text-secondary">{item.date}</p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[11px] font-bold text-text-primary tabular-nums">
                          {item.amount}
                        </span>
                        {item.subBadge && (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1 py-0.2 rounded border border-emerald-500/15">
                            {item.subBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bento Card 3: Live Market / Integrasi (Col Span 3) */}
            <div className="lg:col-span-3 bg-bg-2 border border-border-default rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between shadow-card hover:border-border-strong transition-all duration-300">
              <div className="flex-1 text-left">
                <span className="badge-premium text-[9px] py-0.5 px-2.5 mb-3">
                  KONEKTIVITAS SISTEM
                </span>
                <h3 className="font-display text-lg md:text-xl font-bold text-text-primary mb-3">
                  Terintegrasi Penuh Antara Timbangan, Gudang, dan Keuangan
                </h3>
                <p className="text-[13px] md:text-sm text-text-secondary leading-relaxed max-w-xl">
                  Satu input data di timbangan lapangan otomatis memotong stok pakan peternak, menambah saldo hutang broker, dan merapikan mutasi kas di keuangan. Tanpa double input, meminimalisir manipulasi timbangan di jalan.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-center md:self-end">
                <a
                  href="/register"
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-xs uppercase tracking-wider rounded-[99px] transition-all shadow-sm active:scale-95 text-center"
                >
                  Coba Gratis 14 Hari
                </a>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};

export default Features;
