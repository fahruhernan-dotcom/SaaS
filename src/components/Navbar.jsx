import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = ({ authPage = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const { scrollY } = useScroll();
  const backgroundColor = useTransform(scrollY, [0, 50], ["rgba(6,9,15,0)", "rgba(6,9,15,0.85)"]);
  const backdropFilter = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(24px)"]);
  const borderBottomColor = useTransform(scrollY, [0, 50], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);

  const navLinks = [
    { name: 'Fitur', href: '/fitur' },
    { name: 'Harga', href: '/harga' },
    { name: 'Tentang Kami', href: '/tentang-kami' },
  ];

  return (
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            whileHover={{ opacity: 0.85 }}
            transition={{ duration: 0.15 }}
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
                {navLinks.map((link, i) => (
                  <Link
                    key={i}
                    to={link.href}
                    style={{
                      position: 'relative',
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif",
                      color: hoveredIndex === i ? '#F1F5F9' : '#64748B',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease',
                      letterSpacing: '0.01em',
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Spotlight background saat hover */}
                    <AnimatePresence>
                      {hoveredIndex === i && (
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

                    {/* Underline emerald tipis saat hover */}
                    <motion.div
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '20px',
                        right: '20px',
                        height: '1.5px',
                        background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
                        borderRadius: '99px',
                        originX: 0.5,
                      }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{
                        scaleX: hoveredIndex === i ? 1 : 0,
                        opacity: hoveredIndex === i ? 1 : 0,
                      }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  </Link>
                ))}
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
                  onClick={() => window.location.href = '/login'}
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
                  className="hidden md:block"
                >
                  Masuk
                </motion.button>

                <motion.button
                  onClick={() => window.location.href = '/register'}
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
                className="md:hidden text-tx-2 p-1 flex flex-col justify-center items-center gap-1.5 w-8 h-8 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                 <div className="w-5 h-0.5 bg-tx-2 rounded-full"></div>
                 <div className="w-5 h-0.5 bg-tx-2 rounded-full"></div>
                 <div className="w-5 h-0.5 bg-tx-2 rounded-full"></div>
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Full Screen Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[64px] bg-bg-base z-[100] md:hidden flex flex-col px-5 py-6"
          >
             <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[24px] font-display font-bold text-tx-1"
                  >
                    {link.name}
                  </Link>
                ))}
             </div>
             
             <div className="mt-12 pt-6 border-t border-border-sub flex flex-col gap-4">
               <a 
                  href="/login" 
                  className="w-full py-4 text-center rounded-xl bg-bg-2 border border-border-def text-tx-1 font-semibold text-[16px]"
                >
                  Masuk Akun
                </a>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
