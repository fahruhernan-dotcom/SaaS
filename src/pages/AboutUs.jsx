import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Target, CheckCircle, Shield, Zap, ArrowRight, Heart, Rocket, Calendar,
  Handshake, Bird, Factory, FileX, BarChart2, TrendingDown, Wrench, Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SplineScene from '../components/SplineScene';
import ShinyText from '../components/reactbits/ShinyText';
import BlurText from '../components/reactbits/BlurText';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import Particles from '../components/reactbits/Particles';
import CountUp from '../components/reactbits/CountUp';
import '../components/reactbits/ShinyText.css';

// ─── Animation helper ─────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutUs() {
  React.useEffect(() => {
    document.title = 'Tentang Kami - TernakOS';
    return () => { document.title = 'TernakOS | Solusi Digital Peternakan Indonesia' };
  }, []);

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar />

      <main className="w-full">

        {/* ══════════════════════════════════════════════
            SECTION HERO — LOCKED: DO NOT MODIFY
        ══════════════════════════════════════════════ */}
        <section
          className="relative px-5 md:px-10 lg:px-20 h-[600px] md:h-[750px] lg:h-[800px] flex items-center overflow-hidden"
          style={{ background: '#06090F' }}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              quantity={40}
              color="#10B981"
              opacity={0.1}
              className="absolute inset-0"
            />

            {/* Spotlight Effect */}
            <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] pointer-events-none opacity-20">
              <svg
                viewBox="0 0 1000 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <circle cx="200" cy="200" r="400" fill="url(#hero-spotlight)" />
                <defs>
                  <radialGradient
                    id="hero-spotlight"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(200 200) rotate(90) scale(400)"
                  >
                    <stop stopColor="#10B981" />
                    <stop offset="1" stopColor="#10B981" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="relative z-10 max-w-[1280px] mx-auto w-full flex items-center pointer-events-none">
            {/* Kolom kiri — teks */}
            <div className="relative w-full md:w-1/2 py-24 pointer-events-auto">
              {/* Overlay KIRI */}
              <div
                className="absolute left-[-100vw] right-0 inset-y-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, #06090F 60%, transparent 100%)',
                  zIndex: 1
                }}
              />
              <div className="relative z-10 space-y-8 max-w-xl mx-auto md:mx-0">
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                  <ShinyText
                    text="🌱 Platform Peternakan #1 di Jawa"
                    disabled={false}
                    speed={3}
                    className="text-[#10B981] text-sm font-bold"
                  />
                </div>

                <div className="space-y-4">
                  <BlurText
                    text="Kami tahu bisnis peternakan — karena kami bagian dari industri ini."
                    delay={100}
                    animateBy="words"
                    direction="top"
                    className="font-display text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight"
                  />
                </div>

                <AnimatedContent distance={20} duration={0.6}>
                  <p className="text-[#94A3B8] text-base lg:text-lg max-w-xl leading-relaxed">
                    TernakOS lahir dari frustrasi nyata di lapangan, dibangun dengan teknologi terkini, untuk industri yang sudah waktunya bertransformasi.
                  </p>

                  <div className="pt-8 flex flex-wrap gap-4">
                    <Link
                      to="/register"
                      className="px-8 py-4 bg-[#10B981] hover:bg-[#34D399] text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Mulai Gratis Sekarang
                    </Link>
                    <a
                      href="#cerita"
                      className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
                    >
                      Pelajari Lebih Lanjut
                    </a>
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </div>

          {/* Kolom kanan — Spline FULLSCREEN */}
          <div className="absolute right-0 top-0 hidden md:block w-1/2 h-full" style={{ background: 'transparent' }}>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: STATS BAR
        ══════════════════════════════════════════════ */}
        <section className="bg-[#0C1319] border-y border-white/8 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { countTo: 500,   suffix: '+',  sep: '',  label: 'Pengguna Aktif' },
                { countTo: 10000, suffix: '+',  sep: '.', label: 'Transaksi Tercatat' },
                { raw: 'Rp 50M+',               label: 'Nilai Transaksi' },
                { raw: '3',                      label: 'Vertikal Bisnis' },
              ].map((stat, i) => (
                <FadeUp key={i} delay={i * 0.1} className={`text-center ${i < 3 ? 'md:border-r border-white/8' : ''}`}>
                  <div className="font-display text-3xl font-black text-white mb-1">
                    {stat.raw
                      ? stat.raw
                      : <CountUp to={stat.countTo} suffix={stat.suffix} duration={2} separator={stat.sep} />
                    }
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-[#4B6478] mt-1">{stat.label}</div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: DIBANGUN UNTUK SIAPA
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#06090F]">
          <div className="max-w-6xl mx-auto px-6">

            <FadeUp className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-5">
                UNTUK SIAPA
              </p>
              <h2 className="font-display text-4xl font-bold text-white leading-tight">
                Dibangun untuk pelaku industri nyata.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  Icon: Handshake,
                  iconCls: 'text-emerald-400',
                  iconBg: 'bg-emerald-500/10',
                  badge: 'BROKER',
                  badgeCls: 'bg-emerald-500/10 text-emerald-400',
                  hoverBorder: 'hover:border-emerald-500/30',
                  title: 'Broker Ayam',
                  pain: 'Beli dari kandang, jual ke RPA — semua tercatat rapi.',
                  features: [
                    'Piutang RPA dengan alert jatuh tempo',
                    'Margin per transaksi real-time',
                    'Laporan cashflow & susut otomatis',
                  ],
                },
                {
                  Icon: Bird,
                  iconCls: 'text-purple-400',
                  iconBg: 'bg-purple-500/10',
                  badge: 'PETERNAK',
                  badgeCls: 'bg-purple-500/10 text-purple-400',
                  hoverBorder: 'hover:border-purple-500/30',
                  title: 'Peternak',
                  pain: 'Pantau FCR, deplesi, siklus, dan panen dalam satu dashboard.',
                  features: [
                    'FCR & IP Score otomatis tiap input harian',
                    'Estimasi panen berbasis data pertumbuhan nyata',
                    'Breakdown biaya lengkap per siklus',
                  ],
                },
                {
                  Icon: Factory,
                  iconCls: 'text-amber-400',
                  iconBg: 'bg-amber-500/10',
                  badge: 'RPA / BUYER',
                  badgeCls: 'bg-amber-500/10 text-amber-400',
                  hoverBorder: 'hover:border-amber-500/30',
                  title: 'RPA & Distributor',
                  pain: 'Kelola order, hutang, dan distribusi produk jadi.',
                  features: [
                    'Hutang ke broker tercatat transparan kedua pihak',
                    'Laporan margin per produk & customer otomatis',
                    'Dashboard profitabilitas per SKU realtime',
                  ],
                },
              ].map(({ Icon, iconCls, iconBg, badge, badgeCls, hoverBorder, title, pain, features }, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className={`bg-[#0C1319] rounded-3xl p-8 border border-white/8 ${hoverBorder} transition-all duration-300 h-full flex flex-col`}>
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-5 shrink-0`}>
                      <Icon size={20} className={iconCls} />
                    </div>
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 self-start ${badgeCls}`}>
                      {badge}
                    </span>
                    <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
                    <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">{pain}</p>
                    <ul className="space-y-2 mt-auto">
                      {features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                          <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: ASAL USUL
        ══════════════════════════════════════════════ */}
        <section id="cerita" className="py-24 bg-[#080D13]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">

              {/* KIRI — Narasi */}
              <div className="md:col-span-3">
                <FadeUp>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-5">
                    ASAL USUL
                  </p>
                  <h2 className="font-display text-4xl font-bold text-white leading-tight mb-8">
                    Dibangun dari dua dunia.
                  </h2>
                </FadeUp>

                <div className="space-y-5 mb-10">
                  {[
                    'TernakOS lahir bukan dari rapat boardroom atau riset pasar. Lahir karena pendirinya — peternak sekaligus developer — capek melihat kawan-kawan peternak kehilangan margin karena sistem pencatatan yang tertinggal puluhan tahun.',
                    'Di industri dengan margin tipis, satu kesalahan pencatatan bisa mengubah untung menjadi rugi. Kami tahu persis rasanya — bukan dari statistik, tapi dari pengalaman kehilangan uang karena catatan yang tidak akurat.',
                    'Jadi kami membangun yang kami butuhkan sendiri. Lalu kami sadari ribuan peternak dan broker di Indonesia menghadapi masalah yang sama.',
                  ].map((p, i) => (
                    <FadeUp key={i} delay={0.1 + i * 0.1}>
                      <p className="text-[#94A3B8] leading-relaxed">{p}</p>
                    </FadeUp>
                  ))}
                </div>

                <div className="space-y-4">
                  {[
                    { Icon: FileX,        text: 'Catat di kertas, hilang besok' },
                    { Icon: BarChart2,    text: 'Excel berantakan, susah analisis' },
                    { Icon: TrendingDown, text: 'Margin tipis karena tidak terpantau' },
                  ].map(({ Icon, text }, i) => (
                    <FadeUp key={i} delay={0.4 + i * 0.08}>
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-[#10B981] shrink-0" />
                        <span className="text-[#94A3B8] text-sm">{text}</span>
                      </div>
                    </FadeUp>
                  ))}
                </div>
              </div>

              {/* KANAN — Quote card */}
              <FadeUp delay={0.25} className="md:col-span-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/3 rounded-3xl blur-xl pointer-events-none" />
                  <div className="relative bg-[#0C1319] rounded-3xl p-8 border border-white/8">
                    <p
                      className="font-display text-8xl text-emerald-500/15 leading-none select-none mb-2"
                      aria-hidden="true"
                    >
                      "
                    </p>
                    <p className="font-display text-lg font-medium text-white leading-relaxed">
                      Satu kesalahan pencatatan bisa mengubah untung menjadi rugi. Kami tahu persis rasanya.
                    </p>
                    <p className="text-sm text-[#4B6478] mt-4">— Fahrurosadi, Founder TernakOS</p>
                  </div>
                </div>
              </FadeUp>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION FOUNDER — LOCKED: DO NOT MODIFY
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#06090F] w-full">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
              {/* KOLOM KIRI — FOTO */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full md:w-[40%]"
              >
                <div className="relative overflow-hidden rounded-2xl min-h-[280px] md:min-h-[420px] bg-gradient-to-br from-[#0C1319] to-[#06090F] border border-white/8 group">
                  <img
                    src="/founder.jpg"
                    alt="Founder TernakOS"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.parentElement.querySelector('.founder-placeholder');
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div className="founder-placeholder hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0C1319] to-[#06090F]">
                    <span className="font-display text-6xl font-black text-[#10B981]">FH</span>
                  </div>

                  {/* Overlay gradient bawah */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#06090F] to-transparent pointer-events-none" />

                  {/* Floating badge */}
                  <div className="absolute bottom-5 left-5 bg-[#0C1319]/90 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-sm shadow-xl">
                    <div className="text-[#10B981] text-xs font-bold leading-tight">Peternak & Developer</div>
                    <div className="text-[#4B6478] text-[10px] mt-0.5">Surakarta, Jawa Tengah</div>
                  </div>
                </div>
              </motion.div>

              {/* KOLOM KANAN — INFO */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full md:w-[60%] md:pl-10 pt-8 md:pt-0"
              >
                <div className="inline-block text-[9px] font-bold tracking-widest uppercase text-[#10B981] bg-[#10B981]/8 border border-[#10B981]/20 rounded-full px-3 py-1 mb-4">
                  FOUNDER & CEO
                </div>

                <h3 className="font-display text-3xl font-bold text-[#F1F5F9] tracking-tight mb-1">
                  Fahrurosadi Hernan Sakti
                </h3>

                <p className="text-[#10B981] text-sm font-semibold mb-5">
                  Founder & CEO · TernakOS
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { text: 'Peternak Aktif', type: 'emerald' },
                    { text: 'Full-Stack Developer', type: 'emerald' },
                    { text: 'Automation Engineer', type: 'emerald' },
                    { text: 'Lulusan Peternakan UNS', type: 'grey' }
                  ].map((tag, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-medium rounded-md px-3 py-1.5 border ${tag.type === 'emerald'
                          ? 'bg-[#10B981]/8 border-[#10B981]/15 text-[#34D399]'
                          : 'bg-white/4 border-white/8 text-[#94A3B8]'
                        }`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>

                <div className="border-l-2 border-[#10B981]/40 pl-4 mb-6">
                  <p className="italic text-[#4B6478] text-sm leading-relaxed">
                    "Saya membangun TernakOS karena saya ada di industri ini — bukan sekadar mengamatinya dari luar. Dari kandang ke kode, semua berasal dari pengalaman nyata."
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#4B6478]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] opacity-60" />
                  Surakarta, Jawa Tengah — Jantung industri peternakan Indonesia
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: VISI & MISI
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#080D13]">
          <div className="max-w-6xl mx-auto px-6">

            <FadeUp className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-5">
                ARAH KAMI
              </p>
              <h2 className="font-display text-4xl font-bold text-white leading-tight">
                Visi &amp; Misi
              </h2>
            </FadeUp>

            <div className="grid md:grid-cols-2 gap-6">
              <FadeUp delay={0.1}>
                <div className="bg-[#0C1319] rounded-3xl p-8 border border-white/8 border-l-2 border-l-emerald-500 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 shrink-0">
                    <Eye size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-4">Visi</h3>
                  <p className="text-[#94A3B8] leading-relaxed">
                    Menjadi ekosistem digital peternakan terpercaya di Indonesia — tempat setiap peternak, broker, dan mitra bisnis terhubung, bertumbuh, dan bersaing secara adil berdasarkan data yang nyata.
                  </p>
                </div>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="bg-[#0C1319] rounded-3xl p-8 border border-white/8 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 shrink-0">
                    <Target size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-4">Misi</h3>
                  <ul className="space-y-4">
                    {[
                      'Mendigitalisasi seluruh rantai bisnis peternakan dalam satu platform yang mudah digunakan siapapun',
                      'Mewujudkan transparansi harga pasar dari transaksi nyata, bukan spekulasi atau monopoli',
                      'Membangun fondasi data agar setiap pelaku usaha bisa mengambil keputusan berdasarkan fakta',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[#94A3B8] text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: NILAI YANG KAMI PEGANG
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#06090F]">
          <div className="max-w-4xl mx-auto px-6">

            <FadeUp className="text-center mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-5">
                NILAI YANG KAMI PEGANG
              </p>
              <h2 className="font-display text-4xl font-bold text-white leading-tight">
                Prinsip yang membentuk produk kami.
              </h2>
            </FadeUp>

            <div>
              {[
                { num: '01', Icon: Eye,    title: 'Transparansi', body: 'Kami bangun fitur yang membuat semua angka terlihat jelas — bukan tersembunyi di balik rumus Excel.' },
                { num: '02', Icon: Wrench, title: 'Pragmatisme',  body: 'Fitur yang kami bangun berdasarkan kebutuhan nyata di lapangan, bukan asumsi dari ruang rapat.' },
                { num: '03', Icon: Zap,    title: 'Keberanian',   body: 'Industri ini sudah terlalu lama stagnan. Kami berani mendorong perubahan meski tidak populer.' },
                { num: '04', Icon: Shield, title: 'Kejujuran',    body: 'Termasuk jujur soal keterbatasan kami sendiri. Kami masih berkembang, dan kami tidak menyembunyikannya.' },
                { num: '05', Icon: Heart,  title: 'Keberpihakan', body: 'Berpihak pada peternak kecil dan broker independen — mereka yang selama ini tidak punya akses ke tools yang layak.' },
                { num: '06', Icon: Rocket, title: 'Inovasi',      body: 'Terus berkembang bersama industri. Setiap fitur baru lahir dari feedback pengguna nyata di lapangan.' },
              ].map(({ num, Icon, title, body }, i) => (
                <FadeUp key={i} delay={i * 0.06}>
                  <div className={`flex items-start gap-6 md:gap-10 py-10 ${i < 5 ? 'border-b border-white/5' : ''}`}>
                    <span
                      className="font-display text-6xl md:text-7xl font-black text-white/5 leading-none shrink-0 select-none w-16 text-right"
                      aria-hidden="true"
                    >
                      {num}
                    </span>
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-emerald-500/10 rounded-xl p-2 shrink-0 mt-0.5">
                        <Icon size={24} className="text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-[#94A3B8] leading-relaxed">{body}</p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: KEJUJURAN CALLOUT
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#080D13]">
          <div className="max-w-4xl mx-auto px-6">
            <FadeUp>
              <div className="bg-[#0C1319] rounded-3xl p-12 md:p-16 border border-white/8 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-6">
                  KEJUJURAN KAMI
                </p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-12">
                  Kami percaya pada kejujuran —<br />termasuk tentang diri kami sendiri.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  {[
                    'Harga pasar kami 100% dari transaksi nyata user, bukan scraping atau estimasi',
                    'Kami masih early-stage — tapi setiap fitur diuji langsung oleh peternak dan broker aktif',
                    'Dibangun solo oleh founder yang juga peternak — bukan tim besar dengan asumsi teoritis',
                    'Bootstrap & independent — tidak ada investor yang mendikte arah produk kami',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[#94A3B8] text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: ROADMAP
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#06090F]">
          <div className="max-w-5xl mx-auto px-6">

            <FadeUp className="text-center mb-20">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-5">
                ROADMAP
              </p>
              <h2 className="font-display text-4xl font-bold text-white leading-tight">
                Roadmap Pengembangan
              </h2>
            </FadeUp>

            <div className="space-y-0 relative border-l-2 border-white/5 ml-4 md:ml-0">
              {[
                {
                  time: '2026 Q1',
                  status: 'selesai',
                  title: 'Broker Dashboard',
                  desc: 'Landing page, auth, transaksi, RPA & piutang, pengiriman, cash flow, armada, simulator, harga pasar, tim & akses',
                },
                {
                  time: '2026 Q2',
                  status: 'ongoing',
                  title: 'Peternak Dashboard',
                  desc: 'Manajemen siklus budidaya, pencatatan harian, listing stok, performansi kandang realtime',
                },
                {
                  time: '2026 Q3',
                  status: 'planned',
                  title: 'RPA Dashboard',
                  desc: 'Order management, pembayaran antar tenant, koneksi broker-RPA, tracking supply chain permanen',
                },
                {
                  time: '2026 Q4',
                  status: 'planned',
                  title: 'TernakBot AI',
                  desc: 'Analisis profit otomatis, deteksi anomali budidaya, prediksi panen akurat, laporan bisnis otomatis',
                },
              ].map((item, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="relative pl-12 pb-14 last:pb-0">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
                      item.status === 'selesai' ? 'bg-emerald-500 border-emerald-500' :
                      item.status === 'ongoing' ? 'bg-[#F59E0B] border-[#F59E0B] animate-pulse' :
                      'bg-[#111C24] border-white/20'
                    }`} />

                    <div className={`bg-[#0C1319] border rounded-3xl p-8 transition-all duration-300 ${
                      item.status === 'selesai' ? 'border-emerald-500/20' :
                      item.status === 'ongoing' ? 'border-amber-500/20' :
                      'border-white/5'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                            item.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-400' :
                            item.status === 'ongoing' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-white/5 text-[#4B6478]'
                          }`}>{item.time}</span>
                          <h4 className="font-display text-xl font-bold text-white uppercase tracking-tight">{item.title}</h4>
                        </div>
                        <div>
                          {item.status === 'selesai' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
                              <CheckCircle size={10} /> Rilis
                            </span>
                          )}
                          {item.status === 'ongoing' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                              <Calendar size={10} /> In Progress
                            </span>
                          )}
                          {item.status === 'planned' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#4B6478] bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                              <Rocket size={10} /> Planned
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: CTA BOTTOM
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#080D13]">
          <div className="max-w-4xl mx-auto px-6">
            <FadeUp>
              <div className="relative rounded-3xl p-12 md:p-16 text-center border border-emerald-500/20 overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-3xl" />
                {/* Glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
                    Siap bergabung dengan ekosistem<br />peternakan modern?
                  </h2>
                  <p className="text-[#94A3B8] text-lg mb-10">
                    Daftar dan coba gratis. Trial 14 hari, tidak perlu kartu kredit.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.45)]"
                    >
                      Mulai Coba Sekarang
                      <ArrowRight size={18} />
                    </Link>
                    <a
                      href="/#fitur"
                      className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-bold rounded-xl transition-colors"
                    >
                      Lihat Fitur
                    </a>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
