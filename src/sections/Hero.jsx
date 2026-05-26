import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import anime from '../lib/animation';
import { useState, useEffect } from 'react';
import BlurText from '../components/reactbits/BlurText';
import ShinyText from '../components/reactbits/ShinyText';
import Magnet from '../components/reactbits/Magnet';
import ClickSpark from '../components/reactbits/ClickSpark';
import Particles from '../components/reactbits/Particles';
import { usePricingConfig } from '@/lib/hooks/useAdminData';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { usePlatformStats } from '@/lib/hooks/usePlatformStats';

const VIDEO_CATEGORIES = {
  peternak: [
    { key: 'peternak_broiler', label: '🐔 Ayam Broiler' },
    { key: 'peternak_sapi', label: '🐂 Sapi Penggemukan' },
    { key: 'peternak_kambing', label: '🐐 Kambing / Domba' }
  ],
  broker: [
    { key: 'broker_ayam', label: '🚚 Broker Ayam' },
    { key: 'broker_telur', label: '🥚 Broker Telur' },
    { key: 'broker_sembako', label: '🌾 Distributor Sembako' }
  ],
  rpa: []
};

const Hero = () => {
  const isTouchDevice = () =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeVideoTab, setActiveVideoTab] = useState('peternak');
  const [activeVideoSubTab, setActiveVideoSubTab] = useState('peternak_broiler');
  const [mockupTab, setMockupTab] = useState('overview');
  const [isHovered, setIsHovered] = useState(false);
  const [mockClick, setMockClick] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const tabsList = ['overview', 'batches', 'cards', 'feed', 'breeding', 'finance'];
    const interval = setInterval(() => {
      setMockClick(true);
      setTimeout(() => {
        setMockClick(false);
      }, 300);

      setTimeout(() => {
        setMockupTab((prev) => {
          const nextIdx = (tabsList.indexOf(prev) + 1) % tabsList.length;
          return tabsList[nextIdx];
        });
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered]);

  const { data: dbPricing } = usePricingConfig();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { stats: platformStats, loading: statsLoading } = usePlatformStats();

  const handleMainTabChange = (key) => {
    setActiveVideoTab(key);
    if (key === 'peternak') {
      setActiveVideoSubTab('peternak_broiler');
    } else if (key === 'broker') {
      setActiveVideoSubTab('broker_ayam');
    } else {
      setActiveVideoSubTab('rpa');
    }
  };

  // eslint-disable-next-line no-unused-vars -- dynamic pricing from DB for hero display; not yet wired to JSX
  const peternakPrice = dbPricing?.peternak?.pro?.price || 499000;
  // eslint-disable-next-line no-unused-vars -- dynamic pricing from DB for hero display; not yet wired to JSX
  const brokerPrice = dbPricing?.broker?.pro?.price || 999000;

  // eslint-disable-next-line no-unused-vars -- price formatter paired with peternakPrice/brokerPrice above
  const formatShort = (num) => {
    if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1).replace('.0', '')}jt`;
    if (num >= 1000) return `Rp ${num / 1000}rb`;
    return `Rp ${num}`;
  };

  useEffect(() => {
    const tl = anime.timeline({
      easing: 'easeOutExpo'
    });

    tl
      .add('.hero-headline-row', {
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(150),
        duration: 1000,
      })
      .add('.hero-subheadline', {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 800,
      }, '-=700')
      .add('.hero-cta-item', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
      }, '-=600')
      .add('.hero-social-proof', {
        opacity: [0, 1],
        duration: 600,
      }, '-=400')
      .add('.hero-mockup', {
        translateY: [60, 0],
        scale: [0.95, 1],
        opacity: [0, 1],
        duration: 1200,
        easing: 'easeOutElastic(1, .8)'
      }, '-=1000');
  }, []);

  return (
    <section className="relative px-5 pt-28 pb-10 md:px-10 md:pt-32 md:pb-12 lg:px-20 lg:pt-36 lg:pb-16 bg-bg-base overflow-hidden text-center">

      {/* Background Grid Pattern (Attio style: subtle grid, clean slate contrast) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(var(--grid-color-val) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color-val) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at center, black 40%, transparent 95%)',
          maskImage: 'radial-gradient(ellipse 70% 70% at center, black 40%, transparent 95%)'
        }}
      ></div>

      <div className="relative z-10 max-w-[1280px] mx-auto flex flex-col items-center gap-8">

        {/* Content Side */}
        <div className="w-full max-w-[800px] mx-auto flex flex-col items-center">

          {/* Headline */}
          <h1
            className="hero-headline-row text-center"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isDesktop ? 'clamp(42px, 6vw, 72px)' : 'clamp(34px, 10vw, 50px)',
              fontWeight: 400,
              letterSpacing: isDesktop ? '-1.5px' : '-0.5px',
              lineHeight: 1.05,
              color: 'var(--text-primary-val)',
              marginBottom: '20px',
              opacity: 0,
            }}
          >
            Satu Platform untuk<br />
            Seluruh Bisnis Ternak
          </h1>

          {/* Subheadline */}
          <p
            className="hero-subheadline text-[14px] md:text-[16px] text-text-secondary leading-relaxed max-w-[520px] mb-6 text-center mx-auto"
            style={{ opacity: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
          >
            Platform pencatatan mandiri & kemitraan untuk peternak ayam, sapi, domba, dan broker. FCR, HPP, mortalitas, hingga penagihan piutang — semua dalam satu dasbor.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-[12px] justify-center items-center mb-6">
            <div className="hero-cta-item" style={{ opacity: 0 }}>
              <ClickSpark sparkColor="#021a02" sparkCount={10} sparkRadius={20}>
                <Magnet padding={40} magnetStrength={0.3} disabled={isTouchDevice()}>
                  <motion.a
                    href="/register"
                    whileTap={{ scale: 0.96 }}
                    style={{ backgroundColor: '#021a02' }}
                    className="w-full inline-flex items-center justify-center text-center px-[28px] py-[15px] text-[14px] font-semibold text-white rounded-[99px] shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] hover:shadow-[0_6px_28px_rgba(2, 26, 2,0.45)] hover:brightness-110 transition-all md:w-auto"
                  >
                    <span className="leading-none">Mulai Uji Coba Gratis</span>
                  </motion.a>
                </Magnet>
              </ClickSpark>
            </div>
            <div className="hero-cta-item" style={{ opacity: 0 }}>
              <motion.button
                onClick={() => setIsModalOpen(true)}
                whileTap={{ scale: 0.97 }}
                className="w-full text-center px-[28px] py-[15px] text-[14px] font-semibold bg-white dark:bg-bg-1 text-text-primary border border-border-default rounded-[99px] md:w-auto hover:bg-bg-2 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Play size={14} fill="currentColor" />
                <span className="leading-none">Video Demo 1 Menit</span>
              </motion.button>
            </div>
          </div>

          {/* Social Proof */}
          <div
            className="hero-social-proof flex items-center justify-center gap-[12px] text-[13px] text-text-secondary"
            style={{ opacity: 0 }}
          >
            <div className="flex text-white font-bold text-[10px]">
              {[
                { bg: 'bg-emerald-500', text: 'BS', z: 4 },
                { bg: 'bg-[#0891B2]', text: 'RH', z: 3 },
                { bg: 'bg-[#7C3AED]', text: 'SW', z: 2 },
                { bg: 'bg-amber-500', text: 'AN', z: 1 }
              ].map((av, i) => (
                <div key={i} className={`w-[28px] h-[28px] rounded-full border-2 border-bg-base ${av.bg} flex items-center justify-center ml-[-8px] first:ml-0 relative z-[${av.z}]`}>
                  {av.text}
                </div>
              ))}
            </div>
            <div className="flex flex-col text-left text-[11px] leading-tight">
              <span className="text-gold font-bold">★★★★★</span>
              <span className="font-semibold">
                {statsLoading
                  ? 'Ratusan broker & peternak aktif'
                  : `${platformStats.active_users_text} broker & peternak aktif`}
              </span>
            </div>
          </div>
        </div>

        {/* Mockup Card (Visual Side - Attio CRM Style browser mockup) */}
        <div
          className="hero-mockup w-full max-w-[1320px] text-left relative mx-auto"
          style={{ opacity: 0 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Simulated Cursor (Auto Tour pointer) */}
          {!isHovered && (
            <div
              className="hidden sm:block absolute pointer-events-none z-50 transition-all duration-700 ease-out"
              style={{
                left: `${{
                  overview: 80,
                  batches: 80,
                  cards: 80,
                  feed: 80,
                  breeding: 80,
                  finance: 80
                }[mockupTab] ?? 80}px`,
                top: `${{
                  overview: 120,
                  batches: 154,
                  cards: 188,
                  feed: 222,
                  breeding: 256,
                  finance: 290
                }[mockupTab] ?? 120}px`,
                transform: `translate(-7.5px, -7.5px) scale(${mockClick ? 0.8 : 1})`,
              }}
            >
              {/* Click pulse effect */}
              <div 
                 className={`absolute w-10 h-10 rounded-full border border-emerald-500/50 bg-emerald-500/10 transition-all duration-300 ${mockClick ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} 
                 style={{ left: '-12.5px', top: '-12.5px' }}
               />
              
              {/* Pointer Arrow */}
              <svg
                className="w-8 h-8 text-emerald-600 dark:text-emerald-400 drop-shadow-md"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="white"
                strokeWidth="1.5"
              >
                <path d="M5.636 5.636l12.728 4.243-5.657 1.414-1.414 5.657-4.243-12.728z" />
              </svg>
            </div>
          )}

          <div className="bg-bg-2/50 border border-border-strong rounded-[24px] p-[2px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative z-10">
            <div className="bg-bg-1 rounded-[22px] overflow-hidden border border-border-subtle">

              {/* Chrome/Browser Top Bar */}
              <div className="bg-bg-2 px-[16px] py-[12px] border-b border-border-subtle flex items-center gap-[8px]">
                <div className="w-[8px] h-[8px] rounded-full bg-border-strong opacity-40"></div>
                <div className="w-[8px] h-[8px] rounded-full bg-border-strong opacity-40"></div>
                <div className="w-[8px] h-[8px] rounded-full bg-border-strong opacity-40"></div>
                <div className="mx-auto bg-bg-base border border-border-subtle rounded-[6px] px-[12px] py-[4px] font-body text-[11px] text-text-secondary flex-1 text-center max-w-[180px] shadow-sm">
                  app.ternakos.id
                </div>
              </div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] h-[600px] overflow-hidden">

                {/* Sidebar */}
                <div className="hidden sm:block bg-bg-2/30 border-r border-border-subtle p-[16px_12px]">
                  <div className="flex items-center gap-[8px] mb-[20px]">
                    <img src="/favicon.svg" alt="Logo" className="w-[18px] h-[18px] rounded-[4px]" />
                    <span className="font-display font-black text-[12px] text-text-primary tracking-wide">TernakOS</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: "overview", l: "Ringkasan" },
                      { id: "batches", l: "Batch Koloni" },
                      { id: "cards", l: "Kartu Ternak (RFID)" },
                      { id: "feed", l: "Pakan & Nutrisi" },
                      { id: "breeding", l: "Siklus Reproduksi" },
                      { id: "finance", l: "Analisis Finansial" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setMockupTab(item.id)}
                        className={`text-[10px] text-left rounded-[6px] p-2 px-2.5 transition-colors cursor-pointer ${mockupTab === item.id ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-text-secondary hover:bg-bg-2'}`}
                      >
                        {item.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Dashboard Area */}
                <div className="bg-bg-1 p-[16px] flex flex-col justify-between overflow-y-auto sm:overflow-hidden">
                  
                  {/* Mobile Tabs Switcher */}
                  <div className="flex sm:hidden overflow-x-auto gap-1 pb-2 mb-3 border-b border-border-subtle scrollbar-none">
                    {[
                      { id: 'overview', l: 'Ringkasan' },
                      { id: 'batches', l: 'Batch' },
                      { id: 'cards', l: 'Detail' },
                      { id: 'feed', l: 'Pakan' },
                      { id: 'breeding', l: 'Breeding' },
                      { id: 'finance', l: 'Finansial' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setMockupTab(item.id)}
                        className={`text-[9px] whitespace-nowrap px-2.5 py-1 rounded-[6px] font-bold transition-all ${mockupTab === item.id ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-text-secondary bg-bg-2/50'}`}
                      >
                        {item.l}
                      </button>
                    ))}
                  </div>

                  <div>
                    {/* Walkthrough Explanation Banner */}
                    <div className="mb-3 px-3 py-2 bg-emerald-500/5 dark:bg-emerald-400/[0.03] border border-emerald-500/20 rounded-[10px] flex items-center justify-between gap-3 transition-all shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-[#94A3B8]' : 'bg-emerald-500 animate-pulse-dot'}`}></div>
                        <p className="text-[9px] font-medium text-text-primary leading-tight text-left">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {mockupTab === 'overview' && "Ringkasan Dasbor: "}
                            {mockupTab === 'batches' && "Batch Koloni: "}
                            {mockupTab === 'cards' && "Kartu RFID: "}
                            {mockupTab === 'feed' && "Pakan & Nutrisi: "}
                            {mockupTab === 'breeding' && "Reproduksi: "}
                            {mockupTab === 'finance' && "Keuangan HPP: "}
                          </span>
                          {mockupTab === 'overview' && "Memantau performa makro bisnis penggemukan & breeding domba bapak secara real-time."}
                          {mockupTab === 'batches' && "Mempermudah tracking populasi domba masuk, umur pemeliharaan, serta ADG (pertambahan bobot harian) per koloni."}
                          {mockupTab === 'cards' && "Pencatatan riwayat bobot badan individual secara digital terintegrasi microchip/eartag RFID."}
                          {mockupTab === 'feed' && "Memberi peringatan otomatis saat stok konsentrat pakan menipis untuk menghindari kekosongan pakan."}
                          {mockupTab === 'breeding' && "Lacak masa konsepsi kawin alam/IB, kehamilan indukan, hingga tingkat kelahiran cempe sehat."}
                          {mockupTab === 'finance' && "Kalkulasi HPP biaya pakan/sapronak, rekap operasional, dan BEP otomatis untuk margin profit optimal."}
                        </p>
                      </div>
                      <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-bg-2 border border-border-subtle text-text-muted shrink-0">
                        {isHovered ? "Manual (Klik)" : "Tur Aktif ↺"}
                      </span>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-[12px]">
                      <h2 className="text-[11px] font-bold text-text-primary">
                        {mockupTab === 'overview' && "Dasbor Ternak Domba — CV Indo Domba Jaya"}
                        {mockupTab === 'batches' && "Daftar Batch Koloni Aktif"}
                        {mockupTab === 'cards' && "Pencarian Kartu Identitas Ternak (RFID)"}
                        {mockupTab === 'feed' && "Manajemen Stok & Nutrisi Pakan"}
                        {mockupTab === 'breeding' && "Manajemen Kebuntingan & Kelahiran"}
                        {mockupTab === 'finance' && "Proyeksi Keuangan & Laba Rugi"}
                      </h2>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {mockupTab === 'overview' && "Siklus Aktif"}
                        {mockupTab === 'batches' && "3 Siklus Berjalan"}
                        {mockupTab === 'cards' && "RFID Scanner Aktif"}
                        {mockupTab === 'feed' && "Level Stok Terpantau"}
                        {mockupTab === 'breeding' && "Kelahiran Bulan Ini"}
                        {mockupTab === 'finance' && "Finansial Terintegrasi"}
                      </span>
                    </div>

                    {/* Tab content */}
                    {mockupTab === 'overview' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-[8px]">
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[10px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">BATCH AKTIF</p>
                          <p className="font-display text-[13px] font-black text-text-primary">3 Batch Koloni</p>
                          <p className="text-[7px] text-text-muted truncate">Texel, Dorper & Garut</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[10px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">TOTAL POPULASI</p>
                          <p className="font-display text-[13px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">450 ekor</p>
                          <p className="text-[7px] text-text-muted">Fattening & Breeding</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[10px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">ADG RATA-RATA</p>
                          <p className="font-display text-[13px] font-black text-text-primary">+210 g/hari</p>
                          <p className="text-[7px] text-text-muted">Sangat Optimal</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[10px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">DEPLESI / KEMATIAN</p>
                          <p className="font-display text-[13px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">0.44% <span className="text-[7px] font-bold px-1 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">Aman</span></p>
                          <p className="text-[7px] text-text-muted">Akumulasi: 2 ekor</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[10px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">STOK PAKAN UTAMA</p>
                          <p className="font-display text-[13px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">9.650 kg</p>
                          <p className="text-[7px] text-text-muted">Silase & Konsentrat</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[10px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">MODAL BERJALAN (HPP)</p>
                          <p className="font-display text-[13px] font-black text-text-primary tabular-nums">Rp 284,5jt</p>
                          <p className="text-[7px] text-text-muted truncate">Sapronak & Operasional</p>
                        </div>
                      </div>
                    )}

                    {mockupTab === 'batches' && (
                      <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-2 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-display text-[11px] font-bold text-text-primary">Batch Texel Fattening A</p>
                            <p className="text-[8px] text-text-secondary">Populasi: 150 ekor • Umur: Hari ke-45 • ADG: 210 g/hari</p>
                          </div>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">Rata-rata: 32.4 kg</span>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-2 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-display text-[11px] font-bold text-text-primary">Batch Dorper Cross B</p>
                            <p className="text-[8px] text-text-secondary">Populasi: 200 ekor • Umur: Hari ke-30 • ADG: 188 g/hari</p>
                          </div>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">Rata-rata: 26.8 kg</span>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-2 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-display text-[11px] font-bold text-text-primary">Batch Merino Breeding C</p>
                            <p className="text-[8px] text-text-secondary">Populasi: 100 ekor • Status: Kawin Koloni • Indukan: 85 ekor</p>
                          </div>
                          <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded">Kebuntingan: 42%</span>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-2 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-display text-[11px] font-bold text-text-primary">Batch Garut Fattening D</p>
                            <p className="text-[8px] text-text-secondary">Populasi: 120 ekor • Umur: Hari ke-20 • ADG: 196 g/hari</p>
                          </div>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">Rata-rata: 22.1 kg</span>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-2 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-display text-[11px] font-bold text-text-primary">Batch Sapudi Breeding E</p>
                            <p className="text-[8px] text-text-secondary">Populasi: 75 ekor • Status: Bunting • Indukan: 60 ekor</p>
                          </div>
                          <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded">Kebuntingan: 68%</span>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-2 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-display text-[11px] font-bold text-text-primary">Batch Peranakan Etawa F</p>
                            <p className="text-[8px] text-text-secondary">Populasi: 90 ekor • Produksi Susu: 1.8 L/ekor/hari</p>
                          </div>
                          <span className="text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-1.5 py-0.5 rounded">Total: 162 L/hari</span>
                        </div>
                      </div>
                    )}

                    {mockupTab === 'cards' && (
                      <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-3 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="font-mono text-[9px] font-bold text-text-primary">TAG RFID: 360.082910482</p>
                          </div>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">Dorper F4</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[7px] text-text-muted">JENIS KELAMIN</p>
                            <p className="text-[10px] font-bold text-text-primary">Jantan</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-text-muted">BOBOT MASUK</p>
                            <p className="text-[10px] font-bold text-text-primary">18.2 Kg</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-text-muted">BOBOT TERKINI</p>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">42.5 Kg</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-text-muted">ADG RATIO</p>
                            <p className="text-[10px] font-bold text-text-primary">+264 g/hari</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-text-muted">VAKSIN & MEDIK</p>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Lengkap (PMK)</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-text-muted">LOKASI KANDANG</p>
                            <p className="text-[10px] font-bold text-text-primary">Koloni Kandang B</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {mockupTab === 'feed' && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="flex justify-between text-[8px] font-bold mb-1">
                            <span className="text-text-primary">Pakan Silase Jagung Komplit</span>
                            <span className="text-text-secondary">8.450 kg / 10.000 kg (84.5%)</span>
                          </div>
                          <div className="h-2.5 bg-bg-2 border border-border-subtle rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84.5%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[8px] font-bold mb-1">
                            <span className="text-amber-600 dark:text-amber-400">Konsentrat Domba Pro (22% Protein)</span>
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold animate-pulse">1.200 kg / 5.000 kg (24% - Sisa 4 Hari!)</span>
                          </div>
                          <div className="h-2.5 bg-bg-2 border border-border-subtle rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '24%' }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {mockupTab === 'breeding' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-[8px]">
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[8px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">CONCEPTION RATE</p>
                          <p className="font-display text-[13px] font-black text-emerald-600 dark:text-emerald-400">88.4%</p>
                          <p className="text-[6px] text-text-muted truncate">Target Industri: 80%</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[8px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">LAMBING INTERVAL</p>
                          <p className="font-display text-[13px] font-black text-text-primary">7.8 Bulan</p>
                          <p className="text-[6px] text-text-muted truncate">Optimal (&lt;8 bln)</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[8px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">USG POSITIF (BUNTING)</p>
                          <p className="font-display text-[13px] font-black text-text-primary">45 indukan</p>
                          <p className="text-[6px] text-text-muted truncate">Estimasi: Juni–Juli</p>
                        </div>
                        <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-[8px] shadow-sm">
                          <p className="text-[7px] uppercase tracking-wider text-text-muted font-bold mb-0.5">KELAHIRAN SEHAT</p>
                          <p className="font-display text-[13px] font-black text-emerald-600 dark:text-emerald-400">18 Cempe</p>
                          <p className="text-[6px] text-text-muted truncate">Tingkat Hidup: 100%</p>
                        </div>
                      </div>
                    )}

                    {mockupTab === 'finance' && (
                      <div className="bg-bg-2 border border-border-subtle rounded-[10px] p-2.5 flex flex-col gap-1.5 shadow-sm">
                        <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                          <span>Investasi Bibit & Bakalan</span>
                          <span className="text-text-primary font-mono">Rp 180.000.000</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                          <span>Biaya Pakan & Nutrisi Hijauan</span>
                          <span className="text-text-primary font-mono">Rp 82.400.000</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary pb-1.5 border-b border-border-subtle">
                          <span>Kesehatan & Biaya Operasional</span>
                          <span className="text-text-primary font-mono">Rp 22.100.000</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className="text-emerald-600 dark:text-emerald-400">Estimasi Margin Keuntungan</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">+Rp 158.300.000 (35.7%)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clean Sparkline Chart */}
                  <div className="flex flex-col gap-1 border-t border-border-subtle pt-2 mt-2">
                    <div className="flex items-center justify-between text-[7px] text-text-muted font-bold uppercase tracking-wider">
                      <span>
                        {mockupTab === 'overview' && "Grafik Pertumbuhan Bobot Harian Texel A (Hari ke-1 s.d 45)"}
                        {mockupTab === 'batches' && "Distribusi Populasi per Kandang Koloni"}
                        {mockupTab === 'cards' && "Riwayat Timbangan RFID-DM-0842"}
                        {mockupTab === 'feed' && "Efisiensi Pakan (FCR Harian)"}
                        {mockupTab === 'breeding' && "Rasio Kelahiran Kembar (Litter Size)"}
                        {mockupTab === 'finance' && "Perkembangan Nilai Aset Ternak (Equity)"}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {mockupTab === 'overview' && "+245g/hari"}
                        {mockupTab === 'batches' && "Texas & Dorper Ready"}
                        {mockupTab === 'cards' && "ADG +264g"}
                        {mockupTab === 'feed' && "FCR 3.92 (Sangat Baik)"}
                        {mockupTab === 'breeding' && "Litter Size 1.8"}
                        {mockupTab === 'finance' && "Aset Aktif"}
                      </span>
                    </div>
                    <div className="h-[36px] flex items-end gap-[3px]">
                      {mockupTab === 'overview' && [25, 32, 45, 55, 68, 82, 98].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-[2px_2px_0_0] transition-all duration-300 ${i === 6 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} style={{ height: `${h}%` }}></div>
                      ))}
                      {mockupTab === 'batches' && [80, 60, 40, 75, 90, 85, 95].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-[2px_2px_0_0] transition-all duration-300 ${i === 6 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} style={{ height: `${h}%` }}></div>
                      ))}
                      {mockupTab === 'cards' && [20, 25, 35, 48, 62, 78, 98].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-[2px_2px_0_0] transition-all duration-300 ${i === 6 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} style={{ height: `${h}%` }}></div>
                      ))}
                      {mockupTab === 'feed' && [95, 88, 82, 75, 68, 55, 42].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-[2px_2px_0_0] transition-all duration-300 ${i === 6 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} style={{ height: `${h}%` }}></div>
                      ))}
                      {mockupTab === 'breeding' && [15, 30, 45, 30, 60, 75, 90].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-[2px_2px_0_0] transition-all duration-300 ${i === 6 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} style={{ height: `${h}%` }}></div>
                      ))}
                      {mockupTab === 'finance' && [30, 40, 50, 65, 75, 85, 98].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-[2px_2px_0_0] transition-all duration-300 ${i === 6 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-[#111C24] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header / Tabs Switcher */}
              <div className="px-6 py-4 border-b border-white/5 bg-[#0C1319]/80 backdrop-blur-md flex flex-col gap-4 z-10">
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col text-left">
                    <h3 className="text-base font-display font-bold text-white">Video Demo Dashboard</h3>
                    <p className="text-[11px] text-[#4B6478]">Pilih kategori bisnis bapak untuk melihat demo</p>
                  </div>
                  
                  {/* Main Tabs Switcher Pill */}
                  <div className="flex bg-white/5 border border-white/10 p-1 rounded-full shadow-inner gap-1">
                    {[
                      { key: 'peternak', label: 'Peternak' },
                      { key: 'broker', label: 'Broker' },
                      { key: 'rpa', label: 'RPA / Rumah Potong' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => handleMainTabChange(tab.key)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                          activeVideoTab === tab.key
                            ? 'bg-em-500 text-white shadow-lg'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors border border-white/5"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Sub-Tabs Switcher (Rendered conditionally if options exist) */}
                {VIDEO_CATEGORIES[activeVideoTab]?.length > 0 && (
                  <div className="flex flex-wrap justify-center bg-white/[0.02] border border-white/5 p-1 rounded-2xl gap-1.5 self-center sm:self-start">
                    {VIDEO_CATEGORIES[activeVideoTab].map((subTab) => (
                      <button
                        key={subTab.key}
                        onClick={() => setActiveVideoSubTab(subTab.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          activeVideoSubTab === subTab.key
                            ? 'bg-white/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {subTab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Area (Strict aspect-video) */}
              <div className="w-full aspect-video relative bg-black">
                {activeVideoSubTab === 'peternak_broiler' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                    <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Video Demo Dashboard Peternak Broiler (Ayam)</h3>
                    <p className="text-xs text-tx-3 max-w-md mx-auto mb-8">Lihat bagaimana peternak menginput data harian kandang ayam, memantau FCR, mortalitas harian, dan memproyeksikan panen secara real-time.</p>
                    <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-em-500" />
                    </div>
                    {/* uncomment to use mp4 file: <video src="/videos/peternak-broiler-demo.mp4" controls autoPlay className="w-full h-full object-cover absolute inset-0 z-20" /> */}
                  </div>
                )}
                {activeVideoSubTab === 'peternak_sapi' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                    <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Video Demo Dashboard Peternak Sapi</h3>
                    <p className="text-xs text-tx-3 max-w-md mx-auto mb-8">Lihat bagaimana peternak sapi mengelola feedlot, mencatat berat timbangan rata-rata, memantau pakan harian, dan memprediksi target berat harian (ADG).</p>
                    <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-em-500" />
                    </div>
                    {/* uncomment to use mp4 file: <video src="/videos/peternak-sapi-demo.mp4" controls autoPlay className="w-full h-full object-cover absolute inset-0 z-20" /> */}
                  </div>
                )}
                {activeVideoSubTab === 'peternak_kambing' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                    <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Video Demo Dashboard Peternak Kambing / Domba</h3>
                    <p className="text-xs text-tx-3 max-w-md mx-auto mb-8">Lihat pencatatan siklus penggemukan kambing/domba, pembagian kandang koloni, tracking riwayat kesehatan, dan manajemen pakan hijauan.</p>
                    <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-em-500" />
                    </div>
                    {/* uncomment to use mp4 file: <video src="/videos/peternak-kambing-demo.mp4" controls autoPlay className="w-full h-full object-cover absolute inset-0 z-20" /> */}
                  </div>
                )}
                {activeVideoSubTab === 'broker_ayam' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                    <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Video Demo Dashboard Broker Ayam</h3>
                    <p className="text-xs text-tx-3 max-w-md mx-auto mb-8">Lihat pencatatan order penjualan ayam hidup, penjadwalan armada/sopir pengiriman, dan tracking timbangan muatan saat panen.</p>
                    <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-em-500" />
                    </div>
                    {/* uncomment to use mp4 file: <video src="/videos/broker-ayam-demo.mp4" controls autoPlay className="w-full h-full object-cover absolute inset-0 z-20" /> */}
                  </div>
                )}
                {activeVideoSubTab === 'broker_telur' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                    <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Video Demo Dashboard Broker Telur</h3>
                    <p className="text-xs text-tx-3 max-w-md mx-auto mb-8">Lihat bagaimana mengelola stok telur per peti/kilogram, mencatat transaksi masuk dari peternak petelur, and merekap piutang toko langganan.</p>
                    <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-em-500" />
                    </div>
                    {/* uncomment to use mp4 file: <video src="/videos/broker-telur-demo.mp4" controls autoPlay className="w-full h-full object-cover absolute inset-0 z-20" /> */}
                  </div>
                )}
                {activeVideoSubTab === 'broker_sembako' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                    <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Video Demo Dashboard Distributor Sembako</h3>
                    <p className="text-xs text-tx-3 max-w-md mx-auto mb-8">Lihat manajemen multi-gudang stok beras, minyak, gula, pelacakan HPP (COGS) dengan metode FIFO, dan modul pencatatan gaji karyawan.</p>
                    <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-em-500" />
                    </div>
                    {/* uncomment to use mp4 file: <video src="/videos/broker-sembako-demo.mp4" controls autoPlay className="w-full h-full object-cover absolute inset-0 z-20" /> */}
                  </div>
                )}
                {activeVideoSubTab === 'rpa' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 p-12 text-center">
                    <div className="w-20 h-20 bg-em-500/20 rounded-full flex items-center justify-center mb-6 text-em-400">
                      <Play size={32} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Video Demo Dashboard RPA (Rumah Potong Ayam)</h3>
                    <p className="text-xs text-tx-3 max-w-md mx-auto mb-8">Lihat bagaimana Rumah Potong Ayam mengelola order masuk, memotong ayam, menyeimbangkan stok karkas, dan melacak piutang langganan.</p>
                    <div className="w-full max-w-lg h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-em-500" />
                    </div>
                    {/* uncomment to use mp4 file: <video src="/videos/rpa-demo.mp4" controls autoPlay className="w-full h-full object-cover absolute inset-0 z-20" /> */}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
