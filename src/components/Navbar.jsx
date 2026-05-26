import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  ChevronDown, 
  BookOpen, 
  Wallet, 
  FileCheck, 
  Box, 
  LineChart, 
  ShoppingBag, 
  Compass, 
  PhoneCall, 
  PlayCircle 
} from 'lucide-react';

const DropdownItem = ({ to, icon: Icon, title, desc, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group/item flex items-start gap-3.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer text-left"
    >
      {/* Icon with Blueprint Grid */}
      <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 group-hover/item:border-emerald-500/20 group-hover/item:bg-emerald-500/[0.01] transition-all duration-200">
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 group-hover/item:opacity-75 transition-opacity"
          style={{
            backgroundImage: `linear-gradient(rgba(2, 26, 2, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2, 26, 2, 0.04) 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
          }}
        />
        <Icon className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400 group-hover/item:text-emerald-500 transition-colors relative z-10" />
      </div>
      
      {/* Texts */}
      <div className="flex flex-col">
        <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">
          {title}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
          {desc}
        </span>
      </div>
    </Link>
  );
};

const QuickLink = ({ to, icon: Icon, title, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group/quick flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all text-left"
    >
      <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover/quick:text-emerald-500 group-hover/quick:border-emerald-500/20 transition-all">
        <Icon className="w-[14px] h-[14px]" />
      </div>
      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 group-hover/quick:text-slate-800 dark:group-hover/quick:text-slate-200 transition-colors">
        {title}
      </span>
    </Link>
  );
};

const Navbar = ({ authPage = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('ternakos_theme_mode') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('ternakos_theme_mode', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    [
      theme === 'dark' ? "rgba(6,9,15,0)" : "rgba(241,245,249,0)",
      theme === 'dark' ? "rgba(6,9,15,0.85)" : "rgba(255,255,255,0.85)"
    ]
  );
  const backdropFilter = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(24px)"]);
  const borderBottomColor = useTransform(
    scrollY,
    [0, 50],
    [
      theme === 'dark' ? "rgba(255,255,255,0)" : "rgba(15,23,42,0)",
      theme === 'dark' ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"
    ]
  );

  const navLinks = [
    { name: 'Fitur', href: '/fitur' },
    { name: 'Harga', href: '/harga' },
    { name: 'Tentang Kami', href: '/tentang-kami' },
    { name: 'Harga Pasar', href: '/harga-pasar' },
    { name: 'TernakOS Market', href: '/market' },
  ];

  return (
    <>
      <motion.nav 
        style={authPage ? {
          backgroundColor: theme === 'dark' ? 'rgba(6,9,15,0.90)' : 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`
        } : {
          backgroundColor,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          borderBottomColor,
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px'
        }}
        className="fixed top-0 left-0 right-0 z-[100] h-[64px] flex items-center px-5 md:px-10 lg:px-20"
      >
        <div className="w-full max-w-[1280px] mx-auto">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="group cursor-pointer flex items-center gap-[10px]"
              onClick={() => navigate('/')}
            >
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-[10px] bg-emerald-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <img
                  src="/logo.png"
                  alt="TernakOS"
                  style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', display: 'block', border: '1px solid rgba(255,255,255,0.07)' }}
                  className="group-hover:scale-105 transition-transform duration-200 relative z-10"
                />
              </div>
              <span className="font-['Sora'] font-black text-xl text-text-primary tracking-tight leading-normal">
                Ternak<span className="text-emerald-500">OS</span>
              </span>
            </motion.div>

            {/* Desktop Links (Hidden on Mobile) */}
            {!authPage && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="hidden md:flex items-center"
              >
                <nav style={{ display: 'flex', alignItems: 'center', gap: '0px', position: 'relative' }}>
                  {navLinks.map((link, i) => {
                    const isActive = location.pathname === link.href;
                    const isHovered = hoveredIndex === i;
                    const isFitur = link.name === 'Fitur';
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: 0.15 + (i * 0.1),
                          ease: "easeOut" 
                        }}
                        className={isFitur ? "relative" : ""}
                        onMouseEnter={isFitur ? () => setIsDropdownOpen(true) : undefined}
                        onMouseLeave={isFitur ? () => setIsDropdownOpen(false) : undefined}
                      >
                        <Link
                          to={link.href}
                          className="nav-link-item"
                          style={{
                            position: 'relative',
                            padding: '8px 20px',
                            fontSize: '14px',
                            fontWeight: isActive ? 600 : 500,
                            fontFamily: "'DM Sans', sans-serif",
                            color: isActive || isHovered || (isFitur && isDropdownOpen) ? 'var(--text-primary-val)' : 'var(--text-secondary-val)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            letterSpacing: '0.01em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={() => setHoveredIndex(i)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          {/* Spotlight background saat hover */}
                          <AnimatePresence>
                            {(isHovered || (isFitur && isDropdownOpen)) && (
                              <motion.div
                                layoutId="nav-spotlight"
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  borderRadius: '8px',
                                  background: 'var(--border-sub-val)',
                                  zIndex: -1,
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 35,
                                }}
                              />
                            )}
                          </AnimatePresence>
      
                          {/* Teks */}
                          <span style={{ position: 'relative', zIndex: 1 }}>
                            {link.name}
                          </span>

                          {isFitur && (
                            <ChevronDown 
                              size={12} 
                              className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-500' : 'text-text-secondary'}`} 
                              style={{ position: 'relative', zIndex: 1 }}
                            />
                          )}
      
                          {/* Underline emerald tipis saat hover atau aktif */}
                          <motion.div
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '20px',
                              right: '20px',
                              height: '2px',
                              background: isActive 
                                ? '#021a02' 
                                : 'linear-gradient(90deg, transparent, #021a02, transparent)',
                              borderRadius: '99px',
                              originX: 0.5,
                            }}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{
                              scaleX: isActive || isHovered || (isFitur && isDropdownOpen) ? 1 : 0,
                              opacity: isActive ? 1 : (isHovered || (isFitur && isDropdownOpen) ? 0.7 : 0),
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          />
                        </Link>

                        {/* Dropdown Menu Portal */}
                        {isFitur && (
                          <AnimatePresence>
                            {isDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="absolute top-[38px] left-[-120px] w-[760px] bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl flex z-[150] overflow-hidden"
                              >
                                {/* Left Area (Features Grid) */}
                                <div className="flex-1 p-6 grid grid-cols-2 gap-x-8 gap-y-6">
                                  
                                  {/* Column 1: Platform Operasional */}
                                  <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">
                                      Platform Operasional
                                    </span>
                                    <div className="flex flex-col gap-1">
                                      <DropdownItem
                                        to="/fitur?section=catatan"
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={BookOpen}
                                        title="Catatan Harian"
                                        desc="Input FCR, mortalitas, & bobot harian kandang."
                                      />
                                      <DropdownItem
                                        to="/fitur?section=keuangan"
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={Wallet}
                                        title="Rekap Keuangan"
                                        desc="Kelola HPP, kas/bank, & uang jalan sopir."
                                      />
                                    </div>
                                  </div>

                                  {/* Column 2: Integrasi & RPA */}
                                  <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">
                                      Integrasi & RPA
                                    </span>
                                    <div className="flex flex-col gap-1">
                                      <DropdownItem
                                        to="/fitur?section=rpa"
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={FileCheck}
                                        title="Penagihan RPA"
                                        desc="Invoice digital & monitoring piutang RPA."
                                      />
                                      <DropdownItem
                                        to="/fitur?section=stok"
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={Box}
                                        title="Stok & Gudang"
                                        desc="Kontrol pakan, obat, & yield karkas."
                                      />
                                    </div>
                                  </div>

                                  {/* Column 3: Ekosistem (spanning full width) */}
                                  <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 flex flex-col gap-3">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">
                                      Ekosistem
                                    </span>
                                    <div className="grid grid-cols-2 gap-4">
                                      <DropdownItem
                                        to="/harga-pasar"
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={LineChart}
                                        title="Harga Pasar Live"
                                        desc="Pantau update harga komoditas nasional live."
                                      />
                                      <DropdownItem
                                        to="/market"
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={ShoppingBag}
                                        title="TernakOS Market"
                                        desc="Toko penyediaan sapronak, bibit & pakan."
                                      />
                                    </div>
                                  </div>

                                </div>

                                {/* Right Area (Get Started / Mulai Cepat) */}
                                <div 
                                  className="w-[260px] bg-slate-50/50 dark:bg-slate-900/20 border-l border-slate-100 dark:border-slate-800/60 p-6 flex flex-col justify-between"
                                >
                                  <div className="flex flex-col gap-4">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                                      Mulai Cepat
                                    </span>
                                    
                                    <div className="flex flex-col gap-1">
                                      <QuickLink 
                                        to="/tentang-kami" 
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={Compass} 
                                        title="Tentang TernakOS" 
                                      />
                                      <QuickLink 
                                        to="/hubungi-kami" 
                                        onClick={() => setIsDropdownOpen(false)}
                                        icon={PhoneCall} 
                                        title="Hubungi Sales" 
                                      />
                                    </div>
                                  </div>

                                  {/* Bottom banner card */}
                                  <div 
                                    className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-3.5 rounded-2xl flex flex-col gap-2 mt-4 cursor-pointer hover:border-emerald-500/20 transition-colors group/banner"
                                    onClick={() => {
                                      setIsDropdownOpen(false);
                                      navigate('/register');
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <PlayCircle size={14} />
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover/banner:text-emerald-500 transition-colors">
                                        Coba Demo
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                      Rasakan kemudahan mencatat & memantau profit peternakan Anda sekarang.
                                    </p>
                                  </div>
                                </div>

                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </motion.div>
                    )
                  })}
                </nav>
              </motion.div>
            )}
  
            {/* Right Action Buttons */}
            <motion.div 
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Theme Toggle Button */}
              <motion.button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-border-default bg-bg-2/30 hover:bg-bg-3/20 transition-all focus:outline-none shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle Theme"
                style={{ color: 'var(--text-primary-val)', borderColor: 'var(--border-def-val)' }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.button>

              {authPage ? (
                <motion.a
                  href="/"
                  style={{
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'var(--text-secondary-val)',
                    background: 'transparent',
                    border: '1px solid var(--border-def-val)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none'
                  }}
                  whileHover={{
                    color: 'var(--text-primary-val)',
                    borderColor: 'var(--border-strong-val)',
                    background: 'var(--border-sub-val)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Beranda
                </motion.a>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <motion.button
                    onClick={() => navigate('/login')}
                    className="nav-action-btn hidden md:block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    style={{
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      color: 'var(--text-secondary-val)',
                      background: 'transparent',
                      border: '1px solid var(--border-def-val)',
                      borderRadius: '99px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    whileHover={{
                      color: 'var(--text-primary-val)',
                      borderColor: 'var(--border-strong-val)',
                      background: 'var(--border-sub-val)',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Masuk
                  </motion.button>
  
                  <motion.button
                    onClick={() => navigate('/register')}
                    className="nav-action-btn hidden md:block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.6 } }}
                    style={{
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 18px',
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#ffffff',
                      background: '#021a02',
                      border: 'none',
                      borderRadius: '99px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 0 0 1px rgba(2, 26, 2,0.25), 0 4px 16px rgba(2, 26, 2,0.18)',
                    }}
                    whileHover={{
                      background: '#021a02',
                      boxShadow: '0 0 0 1px rgba(2, 26, 2,0.35), 0 6px 22px rgba(2, 26, 2,0.28)',
                      y: -1,
                    }}
                    whileTap={{ scale: 0.97, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Shimmer sweep */}
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: 0, left: '-100%',
                        width: '60%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        transform: 'skewX(-20deg)',
                      }}
                      whileHover={{ left: '160%' }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                    Coba Gratis
                  </motion.button>
                </div>
              )}
              
              {!authPage && (
                <button 
                  className="md:hidden text-tx-2 p-1 flex flex-col justify-center items-center gap-1.5 w-8 h-8 focus:outline-none z-[110] relative"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <motion.div animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 8 : 0 }} className="w-5 h-0.5 bg-tx-2 rounded-full transition-transform"></motion.div>
                  <motion.div animate={{ opacity: isMobileMenuOpen ? 0 : 1 }} className="w-5 h-0.5 bg-tx-2 rounded-full transition-opacity"></motion.div>
                  <motion.div animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -8 : 0 }} className="w-5 h-0.5 bg-tx-2 rounded-full transition-transform"></motion.div>
                </button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.nav>
  
      {/* Glassmorphic Dropdown Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-[64px] left-0 right-0 bg-bg-base/90 backdrop-blur-xl z-[90] md:hidden flex flex-col border-b border-border-sub shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
          >
            <div className="flex flex-col py-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-4 text-[15px] font-display font-bold text-text-primary border-b border-border-sub last:border-0 active:bg-bg-3/20 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
             
            <div className="px-6 py-5 flex flex-col gap-3 bg-white/[0.01]">
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center rounded-[99px] bg-bg-2 border border-border-default text-text-primary font-semibold text-sm transition-all active:scale-[0.98]"
              >
                Masuk Akun
              </Link>
              <Link 
                to="/register" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center rounded-[99px] bg-em-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(2, 26, 2,0.2)] transition-all active:scale-[0.98]"
              >
                Coba Gratis Sekarang
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
