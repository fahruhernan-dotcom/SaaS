import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Target,
  CheckCircle,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Home,
  Building2,
  ShieldCheck,
  Users,
  Code,
  Banknote,
  Heart,
  MapPin,
  Calendar,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SplineScene from '../components/SplineScene';

// Reactbits Components
import ShinyText from '../components/reactbits/ShinyText';
import BlurText from '../components/reactbits/BlurText';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import Particles from '../components/reactbits/Particles';
import CountUp from '../components/reactbits/CountUp';
import TiltedCard from '../components/reactbits/TiltedCard';

// Styles
import '../components/reactbits/ShinyText.css';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar />

      <main className="w-full">
        {/* SECTION HERO */}
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

        {/* SECTION STATISTIK */}
        <section className="py-24 border-white/5 bg-[#080D13] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <AnimatedContent stagger staggerDelay={0.15} distance={15}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { val: <CountUp to={500} suffix="+" duration={2} />, label: 'Pengguna Aktif', sub: 'broker & peternak se-Indonesia' },
                  { val: <CountUp to={10000} suffix="+" duration={2.5} separator="." />, label: 'Transaksi Tercatat', sub: 'senilai miliaran rupiah' },
                  { val: 'Rp 50M+', label: 'Nilai Bisnis Dikelola', sub: 'per bulan rata-rata' },
                  { val: '3', label: 'Role Bisnis', sub: 'Broker, Peternak, RPA' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-[#0C1319] border border-white/8 rounded-3xl p-8 text-center hover:border-emerald-500/30 transition-all duration-500 group"
                  >
                    <div className="font-display text-4xl font-bold text-[#10B981] mb-2 group-hover:scale-110 transition-transform duration-300">
                      {stat.val}
                    </div>
                    <div className="text-[#F1F5F9] font-bold text-lg mb-2">{stat.label}</div>
                    <div className="text-[#4B6478] text-sm leading-relaxed">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* SECTION A — Dibangun untuk Siapa */}
        <section className="py-24 bg-[#06090F] w-full">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">PERSONA KAMI</h2>
              <h3 className="text-3xl md:text-5xl font-black text-white mb-6 font-display">Dibangun untuk Siapa?</h3>
              <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">Satu platform, tiga peran — masing-masing dengan kebutuhan yang kami pahami dari dalam.</p>
            </div>

            <AnimatedContent stagger staggerDelay={0.1} distance={20}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <TrendingUp />,
                    title: 'Broker Ayam',
                    badge: 'Fase 1 — Aktif',
                    badgeStyle: 'bg-[#10B981]/10 text-[#10B981]',
                    color: 'text-[#10B981]',
                    pains: [
                      'Transaksi beli-jual masih dicatat manual di buku atau WhatsApp',
                      'Tidak tahu persis berapa profit bersih setelah susut dan biaya kirim',
                      'Piutang RPA menumpuk tanpa reminder otomatis',
                      'Harga pasar bergantung info dari mulut ke mulut',
                    ],
                    solution: 'TernakOS mencatat semua transaksi, menghitung profit real, dan memberi visibilitas penuh atas bisnis kamu.'
                  },
                  {
                    icon: <Home />,
                    title: 'Peternak',
                    badge: 'Fase 2 — Segera',
                    badgeStyle: 'bg-purple-500/10 text-purple-400',
                    color: 'text-[#7C3AED]',
                    pains: [
                      'Pencatatan pertumbuhan ayam masih manual atau tidak dicatat sama sekali',
                      'Tidak ada data historis untuk prediksi panen berikutnya',
                      'Sulit menunjukkan performa kandang kepada calon pembeli',
                      'Harga jual ditentukan broker — peternak tidak punya leverage',
                    ],
                    solution: 'TernakOS memberi peternak data pertumbuhan, prediksi panen, dan akses langsung ke harga pasar yang transparan.'
                  },
                  {
                    icon: <Building2 />,
                    title: 'RPA / Rumah Potong',
                    badge: 'Fase 3 — Direncanakan',
                    badgeStyle: 'bg-[#F59E0B]/10 text-[#F59E0B]',
                    color: 'text-[#F59E0B]',
                    pains: [
                      'Sulit tracking hutang ke banyak broker sekaligus',
                      'Tidak ada sistem purchase order yang terintegrasi',
                      'Harga beli bergantung negosiasi manual tiap transaksi',
                    ],
                    solution: 'TernakOS menghubungkan RPA langsung ke ekosistem broker dengan transparansi harga dan manajemen pembayaran terintegrasi.'
                  }
                ].map((card, i) => (
                  <div
                    key={i}
                    className="bg-[#0C1319] border border-white/8 rounded-3xl p-8 space-y-6 hover:border-white/20 transition-all group h-full flex flex-col"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center ${card.color}`}>
                      {React.cloneElement(card.icon, { size: 28 })}
                    </div>
                    <div className="space-y-2">
                      <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${card.badgeStyle}`}>
                        {card.badge}
                      </div>
                      <h4 className="text-2xl font-black text-white font-display">{card.title}</h4>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {card.pains.map((pain, j) => (
                        <li key={j} className="flex gap-3 text-sm text-[#4B6478] leading-relaxed italic">
                          <span className="text-red-400 opacity-50">•</span> "{pain}"
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 mt-auto border-t border-white/5">
                      <p className="text-[#94A3B8] text-sm leading-relaxed font-medium">
                        {card.solution}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* SECTION CERITA */}
        <section className="py-24 bg-[#080D13] w-full">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm">KENAPA TERNAKOS ADA</h2>
                  <h3 className="text-3xl md:text-4xl font-black text-white leading-tight font-display">
                    Dibangun dari Dua Dunia
                  </h3>
                </div>

                <div className="text-[#94A3B8] space-y-6 leading-relaxed text-lg">
                  <p>
                    "Saya bukan sekadar developer yang membuat aplikasi untuk industri yang tidak saya kenal. Saya adalah peternak — yang juga keebetulan bisa coding."
                  </p>
                  <p>
                    Setelah lulus dari Fakultas Peternakan Universitas Sebelas Maret, saya melihat satu masalah yang terus berulang: pelaku bisnis peternakan Indonesia bekerja keras setiap hari, tapi dengan sistem yang tidak berkembang selama puluhan tahun.
                  </p>
                  <p>
                    Dengan latar belakang di peternakan sekaligus pengalaman sebagai Automation Engineer dan Full-Stack Developer, saya tahu persis bedanya bobot kirim dan bobot tiba, kenapa susut berat itu penting, dan bagaimana alur uang bergerak dari kandang ke meja potong.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl opacity-20 -z-10" />
                <div className="bg-[#0C1319] border border-[#10B981]/20 rounded-3xl p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:translate-x-0 group-hover:-translate-y-0 transition-transform">
                    <div className="text-8xl font-serif">“</div>
                  </div>
                  <p className="italic text-xl md:text-2xl text-[#F1F5F9] leading-relaxed mb-8 relative z-10">
                    "Saya melihat peternak menyepelekan pendataan — padahal itu aset terpenting untuk scaling bisnis. Kesalahan kecil yang dibiarkan akan tumbuh menjadi kerugian besar di kemudian hari."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-1 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-[#F1F5F9] font-bold">Fahrurosadi Hernan Sakti</div>
                      <div className="text-emerald-500 text-sm font-semibold uppercase tracking-wider">Founder TernakOS</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION FOUNDER */}
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

        {/* SECTION VISI MISI */}
        <section className="py-24 bg-[#080D13] w-full">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#0C1319] border border-white/8 rounded-3xl p-10 space-y-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Eye size={28} />
                </div>
                <h3 className="text-2xl font-black text-white font-display">Visi</h3>
                <p className="text-lg text-[#94A3B8] leading-relaxed">
                  Menjadi ekosistem digital peternakan terpercaya di Indonesia — tempat setiap peternak, broker, dan mitra bisnis terhubung, bertumbuh, dan bersaing secara adil berdasarkan data yang nyata.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#0C1319] border border-white/8 rounded-3xl p-10 space-y-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Target size={28} />
                </div>
                <h3 className="text-2xl font-black text-white font-display">Misi</h3>
                <ul className="space-y-4">
                  {[
                    "Mendigitalisasi seluruh rantai bisnis peternakan dalam satu platform yang mudah digunakan siapapun",
                    "Mewujudkan transparansi harga pasar dari transaksi nyata, bukan spekulasi atau monopoli",
                    "Membangun fondasi data agar setiap pelaku usaha bisa mengambil keputusan berdasarkan fakta",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <CheckCircle className="text-emerald-500 shrink-0 mt-1" size={18} />
                      <span className="text-[#94A3B8] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION NILAI-NILAI */}
        <section className="py-24 bg-[#06090F] w-full">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">PRINSIP KAMI</h2>
            <h3 className="text-3xl md:text-5xl font-black text-white mb-16 font-display">Nilai yang Kami Pegang</h3>

            <AnimatedContent stagger staggerDelay={0.1} distance={20}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { icon: <Eye />, title: 'Transparansi', desc: 'Harga pasar bersumber dari transaksi nyata, terbuka untuk semua.' },
                  { icon: <Shield />, title: 'Kepercayaan', desc: 'Data bisnis kamu aman, terisolasi penuh, dan tidak pernah dijual.' },
                  { icon: <Zap />, title: 'Efisiensi', desc: 'Otomatisasi proses yang selama ini memakan waktu dan energi.' },
                  { icon: <Target />, title: 'Efektivitas', desc: 'Fitur dirancang dari pengalaman lapangan nyata, bukan asumsi.' },
                  { icon: <Lock />, title: 'Keamanan', desc: 'Enkripsi end-to-end dengan Row Level Security ketat.' },
                  { icon: <Rocket />, title: 'Inovasi', desc: 'Terus berkembang mengikuti kebutuhan nyata industri peternakan.' },
                ].map((val, i) => (
                  <TiltedCard
                    key={i}
                    imageSrc="" // Component supports text-only via children
                    altText={val.title}
                    captionText=""
                    containerClassName="h-full"
                    showTooltip={false}
                    rotateAmplitude={8}
                    scaleOnHover={1.03}
                  >
                    <div className="bg-[#0C1319] border border-white/8 rounded-3xl p-8 space-y-4 h-full flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        {React.cloneElement(val.icon, { size: 24 })}
                      </div>
                      <h4 className="text-lg font-bold text-white font-display text-center">{val.title}</h4>
                      <p className="text-sm text-[#4B6478] leading-relaxed text-center flex-1">{val.desc}</p>
                    </div>
                  </TiltedCard>
                ))}
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* SECTION B — Transparansi Kami */}
        <section className="py-24 bg-[#080D13] w-full">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">KEJUJURAN KAMI</h2>
              <h3 className="text-3xl md:text-5xl font-black text-white font-display">Kami percaya pada kejujuran — termasuk tentang diri kami sendiri.</h3>
            </div>

            <div className="bg-[#0C1319] border border-white/8 rounded-3xl p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[
                  { icon: <ShieldCheck />, text: 'Harga pasar kami 100% dari transaksi nyata user, bukan scraping atau estimasi' },
                  { icon: <Users />, text: 'Kami masih early-stage — tapi setiap fitur diuji langsung oleh peternak dan broker aktif' },
                  { icon: <Code />, text: 'Dibangun solo oleh founder yang juga peternak — bukan tim besar dengan asumsi teoritis' },
                  { icon: <Banknote />, text: 'Bootstrap & independent — tidak ada investor yang mendikte arah produk kami' },
                  { icon: <Lock />, text: 'Data bisnis kamu tidak pernah dan tidak akan pernah dijual ke pihak manapun' },
                  { icon: <Heart />, text: 'Kami membangun ini karena kami bagian dari industri ini — bukan sekadar bisnis' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="text-emerald-500 w-5 h-5 shrink-0 mt-1">
                      {React.cloneElement(item.icon, { size: 20 })}
                    </div>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION ROADMAP */}
        <section className="pt-24 pb-12 bg-[#06090F] w-full mb-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">MASA DEPAN</h2>
              <h3 className="text-3xl md:text-5xl font-black text-white font-display tracking-tight">Roadmap Pengembangan</h3>
            </div>

            <AnimatedContent stagger staggerDelay={0.2} distance={20}>
              <div className="space-y-0 relative border-l-2 border-white/5 ml-4 md:ml-0 md:pl-0">
                {[
                  {
                    time: '2026 Q1',
                    status: 'selesai',
                    title: 'Broker Dashboard',
                    desc: 'Landing page, auth, transaksi, RPA & piutang, pengiriman, cash flow, armada, simulator, harga pasar, tim & akses'
                  },
                  {
                    time: '2026 Q2',
                    status: 'ongoing',
                    title: 'Peternak Dashboard',
                    desc: 'Manajemen siklus budidaya, pencatatan harian, listing stok, performansi kandang realtime'
                  },
                  {
                    time: '2026 Q3',
                    status: 'planned',
                    title: 'RPA Dashboard',
                    desc: 'Order management, pembayaran antar tenant, koneksi broker-RPA, tracking supply chain permanen'
                  },
                  {
                    time: '2026 Q4',
                    status: 'planned',
                    title: 'TernakBot AI',
                    desc: 'Analisis profit otomatis, deteksi anomali budidaya, prediksi panen akurat, laporan bisnis otomatis'
                  },
                ].map((item, i) => (
                  <div key={i} className="relative pl-12 pb-16 last:pb-0">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 z-10 ${item.status === 'selesai' ? 'bg-emerald-500 border-emerald-500' :
                        item.status === 'ongoing' ? 'bg-[#F59E0B] border-[#F59E0B] animate-pulse' :
                          'bg-[#111C24] border-white/20'
                      }`} />

                    <div className={`bg-[#0C1319] border rounded-3xl p-8 hover:bg-white/[0.02] transition-all duration-500 group ${item.status === 'selesai' ? 'border-emerald-500/20' :
                        item.status === 'ongoing' ? 'border-[#F59E0B]/20' :
                          'border-white/5'
                      }`}>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${item.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-500' :
                              item.status === 'ongoing' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                                'bg-white/5 text-[#4B6478]'
                            }`}>{item.time}</span>
                          <h4 className="text-xl font-black text-white font-display group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{item.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'selesai' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full uppercase tracking-widest">
                              <CheckCircle size={10} /> Rilis
                            </span>
                          )}
                          {item.status === 'ongoing' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                              <Calendar size={10} /> In Progress
                            </span>
                          )}
                          {item.status === 'planned' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-[#4B6478] bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                              <Rocket size={10} /> Planned
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[#94A3B8] text-sm md:text-base leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* SECTION CTA */}
        <section className="py-12 relative overflow-hidden w-full bg-[#06090F]">
          <div className="max-w-5xl mx-auto px-6 relative z-10 py-12 md:py-20">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-10">
                <div className="flex justify-center">
                  <ShinyText
                    text="Siap bergabung dengan ekosistem peternakan modern?"
                    disabled={false}
                    speed={3}
                    className="text-3xl font-black text-white font-display leading-tight text-wrap-balance"
                  />
                </div>

                <p className="text-white/60 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                  Digitalisasi bisnis kamu sekarang. Trial 14 hari gratis tanpa perlu kartu kredit.
                </p>

                <div className="pt-4 flex justify-center">
                  <Link
                    to="/register"
                    className="group relative inline-flex items-center gap-3 px-12 py-6 bg-[#10B981] text-white font-black rounded-2xl transition-all duration-300 transform hover:scale-105 hover:bg-[#34D399] shadow-[0_8px_32px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.5)] text-lg"
                  >
                    Mulai Gratis Sekarang
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
