import React, { useState, useMemo } from 'react';
import { 
  Calculator, AlertCircle, Phone, 
  Activity, Calendar, Package,
  Wallet, TrendingUp, ClipboardList,
  TrendingDown, Truck, Scale,
  Users, FileText, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import TiltedCard from '../components/reactbits/TiltedCard';

const PainPoints = ({ activeRole, setActiveRole }) => {

  const content = useMemo(() => ({
    broker: {
      title: "Kenapa Broker Masih Struggle di Era Digital?",
      points: [
        {
          icon: <Calculator size={13} strokeWidth={2} />,
          label: "CAPEK HITUNG MARGIN",
          title: "Capek hitung margin manual?",
          desc: "Setiap transaksi kamu hitung sendiri pakai kalkulator atau Excel. Kalau banyak transaksi, mudah salah dan makan waktu."
        },
        {
          icon: <AlertCircle size={13} strokeWidth={2} />,
          label: "LUPA RPA YANG BELUM BAYAR",
          title: "Lupa RPA yang belum bayar?",
          desc: "Hutang dari 5 RPA berbeda, jatuh tempo beda-beda. Satu kelewat bisa bikin cashflow kamu berantakan."
        },
        {
          icon: <Phone size={13} strokeWidth={2} />,
          label: "TELEPON SATU-SATU",
          title: "Telepon satu-satu cek stok kandang?",
          desc: "Mau tahu ayam mana yang siap panen, kamu harus hubungi peternak satu per satu. Buang waktu."
        },
        {
          icon: <TrendingDown size={13} strokeWidth={2} />,
          label: "CASH FLOW BERANTAKAN",
          title: "Tidak tahu arus kas bisnis minggu ini?",
          desc: "Pemasukan dan pengeluaran tercampur. Susah tahu kapan bisnis untung atau rugi."
        },
        {
          icon: <Truck size={13} strokeWidth={2} />,
          label: "ARMADA TIDAK TERPANTAU",
          title: "Biaya kirim membengkak tidak ketahuan?",
          desc: "Biaya solar, portal, dan uang jalan sopir tidak tercatat. Margin terkikis diam-diam."
        },
        {
          icon: <Scale size={13} strokeWidth={2} />,
          label: "SUSUT PENGIRIMAN",
          title: "Ayam susut di jalan, rugi tidak terhitung?",
          desc: "Berat tiba berbeda dari berat kirim. Kerugian susut tidak pernah dihitung dengan benar."
        }
      ]
    },
    peternak: {
      title: "Kenapa Peternak Masih Struggle di Era Digital?",
      points: [
        {
          icon: <Activity size={13} strokeWidth={2} />,
          label: "PANTAU FCR",
          title: "Susah pantau FCR & efisiensi pakan?",
          desc: "Hitung konversi pakan manual tiap hari. Mudah salah, buang waktu dan sulit ambil keputusan tepat."
        },
        {
          icon: <Calendar size={13} strokeWidth={2} />,
          label: "PREDIKSI PANEN",
          title: "Tidak tahu kapan ayam siap panen?",
          desc: "Estimasi panen masih pakai feeling. Sering meleset dari target bobot, bikin rugi operasional."
        },
        {
          icon: <Package size={13} strokeWidth={2} />,
          label: "STOK PAKAN",
          title: "Stok pakan habis tidak ketahuan?",
          desc: "Tidak ada sistem peringatan stok. Tiba-tiba kurang, panik beli dadakan dengan harga mahal."
        },
        {
          icon: <Users size={13} strokeWidth={2} />,
          label: "KONEKSI BROKER",
          title: "Susah cari broker yang mau beli ayammu?",
          desc: "Jual ayam masih andalkan kenalan. Tidak ada platform untuk listing stok ke broker."
        },
        {
          icon: <FileText size={13} strokeWidth={2} />,
          label: "INPUT HARIAN RIBET",
          title: "Catat pakan & mortalitas masih pakai buku?",
          desc: "Data harian tersebar di buku catatan berbeda. Susah rekap dan mudah hilang."
        },
        {
          icon: <LayoutDashboard size={13} strokeWidth={2} />,
          label: "TIDAK ADA LAPORAN",
          title: "Tidak tahu performa kandang per siklus?",
          desc: "Tidak ada laporan otomatis per siklus. Susah evaluasi dan bandingkan antar periode."
        }
      ]
    },
    rpa: {
      title: "Kenapa RPA Masih Struggle di Era Digital?",
      points: [
        {
          icon: <Wallet size={13} strokeWidth={2} />,
          label: "KELOLA HUTANG",
          title: "Susah pantau hutang ke banyak broker?",
          desc: "Hutang dari 10 broker berbeda dengan jatuh tempo berbeda. Satu saja kelewat bisa mengganggu operasional."
        },
        {
          icon: <TrendingUp size={13} strokeWidth={2} />,
          label: "HARGA PASAR",
          title: "Tidak tahu harga pasar hari ini?",
          desc: "Negosiasi harga masih pakai feeling. Seringkali kemahalan atau kehilangan supplier potensial."
        },
        {
          icon: <ClipboardList size={13} strokeWidth={2} />,
          label: "KELOLA ORDER",
          title: "Kewalahan kelola order mingguan?",
          desc: "Order dari banyak sumber tanpa sistem terpusat. Mudah terlewat dan mengecewakan pelanggan."
        },
        {
          icon: <Truck size={13} strokeWidth={2} />,
          label: "LACAK PENGIRIMAN",
          title: "Tidak tahu ayam sudah tiba atau belum?",
          desc: "Konfirmasi pengiriman masih lewat telepon. Tidak ada tracking real-time."
        },
        {
          icon: <TrendingUp size={13} strokeWidth={2} />,
          label: "NEGOSIASI HARGA",
          title: "Beli ayam kemahalan karena tidak tahu harga pasar?",
          desc: "Tidak ada referensi harga harian. Broker bisa minta harga seenaknya."
        },
        {
          icon: <Scale size={13} strokeWidth={2} />,
          label: "SUSUT TIDAK TERHITUNG",
          title: "Berat ayam tiba selalu berkurang?",
          desc: "Susut pengiriman tidak pernah dicatat resmi. Kerugian tidak terdokumentasi."
        }
      ]
    }
  }), []);

  const activeContent = content[activeRole];

  return (
    <section className="bg-[#06090F] section-fade-bottom section-padding">
      <div className="max-w-[1280px] mx-auto">
        
        <div className="text-center mb-[40px] md:mb-[60px]">
          <AnimatedContent direction="vertical" distance={30} delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                MASALAH YANG KAMI SELESAIKAN
              </span>
            </div>
          </AnimatedContent>

          {/* Role Toggle Pill */}
          <AnimatedContent direction="vertical" distance={20} delay={0.05} className="flex justify-center mb-8">
            <div className="inline-flex bg-[#111C24] border border-white/10 p-1.5 rounded-full relative z-20 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              {['broker', 'peternak', 'rpa'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-6 md:px-8 py-2 rounded-full font-body text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${
                    activeRole === role
                      ? 'bg-[rgba(16,185,129,0.15)] text-[#34D399] shadow-[0_2px_10px_rgba(16,185,129,0.2)]'
                      : 'text-[#4B6478] hover:text-[#F1F5F9] hover:bg-white/[0.02]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <h2 className="section-h2 mb-[12px] min-h-[80px] md:min-h-0">
              {activeContent.title}
            </h2>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={30} delay={0.2}>
            <p className="section-subtitle max-w-[300px] mx-auto md:max-w-[480px]">
              Bukan karena tidak mau. Karena belum ada tools yang cukup simpel dan relevan untuk mereka.
            </p>
          </AnimatedContent>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeRole}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
            >
              {activeContent.points.map((point, i) => (
                <TiltedCard
                  key={i}
                  rotateAmplitude={10}
                  scaleOnHover={1.04}
                  containerHeight="100%"
                >
                  <div style={{
                    background: '#111C24',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '20px',
                    padding: '28px',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transformStyle: 'preserve-3d',
                    cursor: 'default',
                  }}>

                    {/* Ghost number background */}
                    <span style={{
                      position: 'absolute',
                      top: '16px',
                      right: '20px',
                      fontSize: '80px',
                      fontWeight: 900,
                      fontFamily: 'Sora',
                      color: 'rgba(16,185,129,0.05)',
                      lineHeight: 1,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Top accent line (muncul saat hover via CSS) */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '20%',
                      right: '20%',
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    }} className="card-top-line" />

                    {/* Badge pill dengan icon */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.15)',
                      borderRadius: '99px',
                      padding: '4px 12px',
                      marginBottom: '18px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#34D399',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                    }}>
                      {point.icon}
                      {point.label}
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontFamily: 'Sora',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: '#F1F5F9',
                      marginBottom: '10px',
                      lineHeight: 1.35,
                    }}>
                      {point.title}
                    </h3>

                    {/* Description */}
                    <p style={{
                      fontSize: '14px',
                      color: '#64748B',
                      lineHeight: 1.65,
                      margin: 0,
                    }}>
                      {point.desc}
                    </p>

                  </div>
                </TiltedCard>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default PainPoints;
