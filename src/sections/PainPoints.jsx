import React, { useMemo } from 'react';
import { 
  Calculator, AlertCircle, Phone, 
  Activity, Calendar, Package,
  Wallet, TrendingUp, ClipboardList,
  TrendingDown, Truck, Scale,
  Users, FileText, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const PainPoints = ({ activeRole, setActiveRole }) => {

  const content = useMemo(() => ({
    broker: {
      title: "Kenapa Operasional Broker Sering Kebobolan?",
      points: [
        {
          icon: <Scale size={13} strokeWidth={2} />,
          label: "SELISIH TIMBANGAN",
          title: "Selisih HPP & Timbangan?",
          desc: "Margin per transaksi meleset dan tidak akurat karena perhitungan susut bobot pakan & jalan masih dilakukan manual."
        },
        {
          icon: <AlertCircle size={13} strokeWidth={2} />,
          label: "PIUTANG JATUH TEMPO",
          title: "Piutang RPA Terselip?",
          desc: "Hutang dari banyak RPA berbeda dengan jatuh tempo acak. Satu nota terlewat bisa mengacaukan modal putar Anda."
        },
        {
          icon: <Phone size={13} strokeWidth={2} />,
          label: "CEK KESIAPAN KANDANG",
          title: "Buta Kesiapan Kandang?",
          desc: "Harus telepon puluhan peternak satu per satu hanya untuk menanyakan umur panen dan perkiraan tonase livebird."
        },
        {
          icon: <TrendingDown size={13} strokeWidth={2} />,
          label: "CASH FLOW TERCAMPUR",
          title: "Kasir & Keuangan Tercampur?",
          desc: "Pemasukan operasional, uang jalan sopir, dan komisi harian bercampur dengan uang pribadi. Evaluasi profit bulanan jadi bias."
        },
        {
          icon: <Truck size={13} strokeWidth={2} />,
          label: "ONGKOS ARMADA",
          title: "Bocor Uang Solar & Portal?",
          desc: "Biaya operasional sopir, solar, dan portal tol tidak terekap rapi, mengikis margin bersih secara diam-diam."
        },
        {
          icon: <Scale size={13} strokeWidth={2} />,
          label: "SUSUT BOBOT JALAN",
          title: "Susut Bobot di Jalan?",
          desc: "Berat ayam tiba di RPA menyusut drastis dibanding saat muat di kandang, namun kerugian susut tidak terhitung detail."
        }
      ]
    },
    peternak: {
      title: "Kenapa Peternak Sering Rugi di Akhir Siklus?",
      points: [
        {
          icon: <Activity size={13} strokeWidth={2} />,
          label: "PERFORMA FCR & IP",
          title: "FCR & IP Dihitung Manual?",
          desc: "Konversi pakan dan Indeks Performan baru dihitung saat panen selesai. Terlambat mendeteksi pemborosan pakan harian."
        },
        {
          icon: <Calendar size={13} strokeWidth={2} />,
          label: "ESTIMASI PANEN",
          title: "Target Bobot Meleset?",
          desc: "Memprediksi waktu panen dan bobot optimal hanya pakai feeling, berisiko terkena penalti broker jika bobot meleset."
        },
        {
          icon: <Package size={13} strokeWidth={2} />,
          label: "MANAJEMEN PAKAN",
          title: "Stok Pakan Habis Dadakan?",
          desc: "Tidak ada alert sisa pakan di kandang. Tiba-tiba pakan habis di tengah program feeding, memaksa beli eceran dengan harga mahal."
        },
        {
          icon: <Users size={13} strokeWidth={2} />,
          label: "KETERBATASAN AKSES",
          title: "Tergantung Satu Tengkulak?",
          desc: "Kesulitan mencari alternatif pembeli livebird saat panen raya karena informasi pasar tertutup."
        },
        {
          icon: <FileText size={13} strokeWidth={2} />,
          label: "RECORDING KANDANG",
          title: "Buku Kandang Basah & Hilang?",
          desc: "Catatan harian pakan, obat, dan mortalitas masih di kertas kandang yang rawan basah, kotor, dan susah direkap."
        },
        {
          icon: <LayoutDashboard size={13} strokeWidth={2} />,
          label: "REKAP SIKLUS",
          title: "HPP Siklus Tidak Jelas?",
          desc: "Kesulitan menghitung harga pokok produksi per ekor/kg setelah dikurangi biaya DOC, pakan, OVK, dan operasional tim."
        }
      ]
    },
    rpa: {
      title: "Kenapa Operasional RPA Sering Selisih?",
      points: [
        {
          icon: <Wallet size={13} strokeWidth={2} />,
          label: "REKAP HUTANG",
          title: "Dispute Tagihan Broker?",
          desc: "Selisih pencatatan timbangan tim terima vs data kirim broker memicu perdebatan jumlah pembayaran."
        },
        {
          icon: <TrendingUp size={13} strokeWidth={2} />,
          label: "NEGOSIASI HARGA",
          title: "Beli Livebird Kemahalan?",
          desc: "Melakukan negosiasi harga beli dengan broker tanpa referensi harga real-time harian di wilayah sekitar."
        },
        {
          icon: <ClipboardList size={13} strokeWidth={2} />,
          label: "PELACAKAN ORDER",
          title: "Order Pelanggan Tercecer?",
          desc: "Pesanan karkas dari pasar atau restoran menumpuk di chat WA tanpa sistem pencatatan stok siap kirim."
        },
        {
          icon: <Truck size={13} strokeWidth={2} />,
          label: "STATUS PENGIRIMAN",
          title: "Buta Status Pengiriman?",
          desc: "Memantau jam keberangkatan dan estimasi kedatangan armada pengiriman ayam masih manual via telepon."
        },
        {
          icon: <TrendingUp size={13} strokeWidth={2} />,
          label: "HARGA LIVEBIRD",
          title: "Selisih Timbangan Tiba?",
          desc: "Berat susut pengiriman livebird tidak terdokumentasi rapi, membuat biaya pokok pembelian membengkak."
        },
        {
          icon: <Scale size={13} strokeWidth={2} />,
          label: "SUSUT KARKAS",
          title: "Susut Bobot Tidak Tercatat?",
          desc: "Rasio konversi dari berat ayam hidup menjadi karkas siap jual (yield karkas) tidak terpantau harian."
        }
      ]
    }
  }), []);

  const activeContent = content[activeRole];

  return (
    <section className="bg-bg-base py-20 px-5 border-t border-border-subtle">
      <div className="max-w-[1280px] mx-auto">
        
        <div className="text-center mb-[40px] md:mb-[56px]">
          <AnimatedContent direction="vertical" distance={30} delay={0}>
            <div className="badge-premium mb-4">
              <div className="w-[5px] h-[5px] rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-dot" />
              <span>KENDALA UTAMA INDUSTRI</span>
            </div>
          </AnimatedContent>

          {/* Role Toggle Switch (Attio style) */}
          <AnimatedContent direction="vertical" distance={20} delay={0.05} className="flex justify-center mb-8">
            <div className="inline-flex bg-bg-2 border border-border-default p-1 rounded-full shadow-sm">
              {['broker', 'peternak', 'rpa'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-5 py-2.5 rounded-full font-body text-[11px] font-bold tracking-wider uppercase transition-all duration-300 ${
                    activeRole === role
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-3/50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <h2 className="font-display text-2xl md:text-3xl font-normal text-text-primary mb-[12px]">
              {activeContent.title}
            </h2>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={30} delay={0.2}>
            <p className="text-text-secondary text-sm md:text-base max-w-[500px] mx-auto leading-relaxed">
              Bukan karena tidak mau. Karena belum ada tools yang cukup simpel dan relevan untuk pencatatan harian mereka.
            </p>
          </AnimatedContent>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeRole}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {activeContent.points.map((point, i) => (
                <div key={i} className="h-full">
                  <div className="bg-bg-1 border border-border-default rounded-2xl p-6 h-full relative transition-all duration-300 hover:border-border-strong shadow-card flex flex-col justify-between">
                    
                    <div>
                      {/* Badge pill */}
                      <div className="inline-flex items-center gap-1.5 bg-bg-2 border border-border-subtle rounded-full px-2.5 py-1 mb-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        {point.icon}
                        {point.label}
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-[15px] md:text-[17px] font-bold text-text-primary mb-2 leading-[1.3]">
                        {point.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-[13px] md:text-[14px] text-text-secondary leading-relaxed mt-2">
                      {point.desc}
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

export default PainPoints;
