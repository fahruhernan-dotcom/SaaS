import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import anime from '../lib/animation';

const Navbar = ({ authPage = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { scrollY } = useScroll();
  const backgroundColor = useTransform(scrollY, [0, 50], ["rgba(6,9,15,0)", "rgba(6,9,15,0.85)"]);
  const backdropFilter = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(24px)"]);
  const borderBottomColor = useTransform(scrollY, [0, 50], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);

  const navLinks = [
    { name: 'Fitur', href: '/fitur' },
    { name: 'Harga', href: '/harga' },
    { name: 'Tentang Kami', href: '/tentang-kami' },
    { name: 'Harga Pasar', href: '/harga-pasar' },
    { name: 'TernakOS Market', href: '/market' },
  ];

  useEffect(() => {
    // Initial reveal sequence is now handled by framer-motion components directly
    // to prevent invisibility on location-based re-renders.
  }, []);

  return (
    <>
      <motion.nav 
        style={authPage ? {
          backgroundColor: 'rgba(6,9,15,0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        } : {
          backgroundColor,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter, // For Safari support
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
            <motion.a
              href="/"
              className="nav-logo"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
              whileHover={{ opacity: 0.85 }}
            >
              <img src="/favicon.svg" alt="TernakOS Logo" className="w-[32px] h-[32px] rounded-lg" />
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '17px',
                fontWeight: 700,
                color: '#F1F5F9',
                letterSpacing: '-0.3px',
              }}>
                TernakOS
              </span>
            </motion.a>
  
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
                          color: isActive || isHovered ? '#F1F5F9' : '#64748B',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          letterSpacing: '0.01em',
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Spotlight background saat hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              layoutId="nav-spotlight"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)',
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
    
                        {/* Underline emerald tipis saat hover atau aktif */}
                        <motion.div
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '20px',
                            right: '20px',
                            height: '2px',
                            background: isActive 
                              ? '#10B981' 
                              : 'linear-gradient(90deg, transparent, #10B981, transparent)',
                            borderRadius: '99px',
                            originX: 0.5,
                          }}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{
                            scaleX: isActive || isHovered ? 1 : 0,
                            opacity: isActive ? 1 : (isHovered ? 0.7 : 0),
                          }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        />
                      </Link>
                    </motion.div>
                  )})}
                </nav>
              </motion.div>
            )}
  
            {/* Right Action Buttons */}
            <motion.div 
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex items-center gap-2"
            >
              {authPage ? (
                <motion.a
                  href="/"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#94A3B8',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none'
                  }}
                  whileHover={{
                    color: '#F1F5F9',
                    borderColor: 'rgba(255,255,255,0.20)',
                    background: 'rgba(255,255,255,0.04)',
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
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#94A3B8',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    whileHover={{
                      color: '#F1F5F9',
                      borderColor: 'rgba(255,255,255,0.20)',
                      background: 'rgba(255,255,255,0.04)',
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
                      padding: '9px 18px',
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#ffffff',
                      background: '#10B981',
                      border: 'none',
                      borderRadius: '9px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 0 0 1px rgba(16,185,129,0.25), 0 4px 16px rgba(16,185,129,0.18)',
                    }}
                    whileHover={{
                      background: '#059669',
                      boxShadow: '0 0 0 1px rgba(16,185,129,0.35), 0 6px 22px rgba(16,185,129,0.28)',
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
            className="fixed top-[64px] left-0 right-0 bg-[#06090F]/90 backdrop-blur-xl z-[90] md:hidden flex flex-col border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
             <div className="flex flex-col py-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-6 py-4 text-[15px] font-display font-bold text-white border-b border-white/[0.03] last:border-0 active:bg-white/5 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
             </div>
             
             <div className="px-6 py-5 flex flex-col gap-3 bg-white/[0.01]">
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl bg-white/[0.03] border border-white/10 text-tx-1 font-semibold text-sm transition-all active:scale-[0.98]"
                >
                  Masuk Akun
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl bg-em-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98]"
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
