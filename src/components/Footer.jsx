import React from 'react';
import { Instagram, Smartphone, Disc as TiktokIcon } from 'lucide-react';

import { WA_URL } from '@/lib/constants/contact';

const Footer = () => {
  return (
    <footer className="bg-[#030508] relative overflow-hidden" style={{ padding: '40px clamp(20px, 5vw, 80px) 32px' }}>
      {/* Large Watermark */}
      <div style={{
        position: 'absolute',
        bottom: '-20px', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Sora',
        fontSize: 'clamp(80px, 15vw, 140px)',
        fontWeight: 900,
        color: 'rgba(255,255,255,0.02)',
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        letterSpacing: '-4px',
        zIndex: 0
      }}>
        TERNAKOS
      </div>

      <div className="max-w-[1280px] mx-auto relative z-10">
        
        {/* Brand (Centered on mobile) */}
        <div className="text-center md:text-left mb-8 md:mb-[48px]">
          <div className="flex items-center justify-center md:justify-start gap-[10px] mb-[10px]">
            <img src="/favicon.svg" alt="TernakOS Logo" className="w-[28px] h-[28px] rounded-[6px]" />
            <span className="font-display text-sm font-bold text-tx-1 tracking-tight">TernakOS</span>
          </div>
          <p className="font-body text-[13px] text-tx-3 leading-[1.6] max-w-[280px] mx-auto md:mx-0">
            Platform manajemen bisnis peternakan terlengkap di Indonesia.
          </p>
        </div>

        {/* Links Grid 2x2 Mobile, 4 Cols Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-[40px] mb-[36px] lg:mb-[56px]">
          
          {/* Produk */}
          <div>
            <h4 className="font-body text-[11px] font-bold tracking-wide text-tx-1 mb-[12px]">PRODUK</h4>
            <ul className="space-y-[6px]">
              {[
                { name: 'Fitur', href: '/fitur' },
                { name: 'Harga', href: '/harga' },
                { name: 'Harga Pasar', href: '/harga-pasar' },
                { name: 'FAQ', href: '/faq' },
                { name: 'Blog', href: '/blog' }
              ].map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="font-body text-[13px] text-tx-3 hover:text-tx-1 block transition-colors duration-150">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="font-body text-[11px] font-bold tracking-wide text-tx-1 mb-[12px]">PERUSAHAAN</h4>
            <ul className="space-y-[6px]">
              {[
                { name: 'Tentang Kami', href: '/tentang-kami' },
                { name: 'Hubungi Kami', href: '/hubungi-kami' },
                { name: 'Karir', href: '#' }
              ].map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="font-body text-[13px] text-tx-3 hover:text-tx-1 block transition-colors duration-150">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-body text-[12px] font-bold tracking-wide text-tx-1 mb-[14px]">IKUTI KAMI</h4>
            <div className="flex gap-[12px] flex-wrap">
              {[Instagram, Smartphone, TiktokIcon].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-[32px] h-[32px] border border-border-def rounded-[8px] flex items-center justify-center text-tx-3 hover:border-em-400 hover:text-em-400 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-body text-[10px] font-bold tracking-wide text-tx-1 mb-[12px]">SUPPORT</h4>
            <ul className="space-y-[6px]">
              {[
                { name: 'WhatsApp Admin', href: WA_URL },
                { name: 'Pusat Bantuan', href: '#' },
                { name: 'Status Sistem', href: '#' }
              ].map((link, i) => (
                <li key={i}>
                  <a 
                    href={link.href} 
                    target={link.name === 'WhatsApp Admin' ? '_blank' : undefined}
                    rel={link.name === 'WhatsApp Admin' ? 'noopener noreferrer' : undefined}
                    className="font-body text-[12px] text-tx-3 hover:text-tx-1 block transition-colors duration-150"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border-sub pt-[24px] flex flex-col md:flex-row justify-center md:justify-between items-center gap-[8px] md:gap-[16px] text-center">
           <p className="font-body text-[11px] text-tx-3">© {new Date().getFullYear()} TernakOS. All rights reserved.</p>
           <div className="flex items-center gap-[12px] text-[11px] text-tx-3">
             <a href="/privacy" className="hover:text-tx-1 transition-colors">Kebijakan Privasi</a>
             <span>·</span>
             <a href="/terms" className="hover:text-tx-1 transition-colors">Syarat & Ketentuan</a>
           </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
