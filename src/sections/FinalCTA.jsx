import { motion } from 'framer-motion';
import Magnet from '../components/reactbits/Magnet';
import ClickSpark from '../components/reactbits/ClickSpark';
import Particles from '../components/reactbits/Particles';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const FinalCTA = () => {
  const isTouchDevice = () => 
    typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return (
    <section className="bg-bg-base section-padding text-center relative overflow-hidden">
      
      {/* Background Particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Particles
          particleColors={['#021a02', '#021a02']}
          particleCount={typeof window !== 'undefined' && window.innerWidth < 768 ? 15 : 30}
          speed={0.2}
          particleBaseSize={1.5}
        />
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto">
        <AnimatedContent direction="vertical" distance={40} delay={0}>
          <h2 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 'clamp(32px, 8vw, 52px)',
            fontWeight: 400,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            color: 'var(--text-primary-val)',
            marginBottom: '16px',
            userSelect: 'none',
          }}>
            Siap Kelola Bisnis Ternak<br/>
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,var(--em-400)_0%,#021a02_30%,var(--em-500)_50%,var(--em-400)_100%)] animate-shimmer-text" style={{ backgroundSize: '200% auto' }}>Lebih Rapi?</span>
          </h2>
        </AnimatedContent>
        
        <AnimatedContent direction="vertical" distance={30} delay={0.1}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: 'var(--text-secondary-val)',
            maxWidth: '520px',
            margin: '0 auto 32px',
            lineHeight: 1.7
          }}>
            Bergabung dengan ratusan broker dan peternak yang sudah merasakan manfaatnya.
          </p>
        </AnimatedContent>

        <AnimatedContent direction="vertical" distance={30} delay={0.2}>
          <ClickSpark sparkColor="#021a02" sparkCount={10} sparkRadius={20}>
            <Magnet padding={40} magnetStrength={0.3} disabled={isTouchDevice()}>
              <a
                href="/register"
                className="inline-block w-full max-w-sm mx-auto px-[24px] py-[16px] font-display text-[16px] font-bold bg-em-500 text-white rounded-[99px] shadow-[0_12px_36px_rgba(2, 26, 2,0.22)] md:w-auto active:scale-[0.96] transition-transform"
              >
                Daftar Gratis Sekarang
              </a>
            </Magnet>
          </ClickSpark>
        </AnimatedContent>

        <AnimatedContent direction="vertical" distance={20} delay={0.3}>
          <p className="font-body text-[13px] text-text-muted mt-[14px] opacity-80">
            Gratis selamanya · Tidak perlu kartu kredit
          </p>
        </AnimatedContent>
      </div>

    </section>
  );
};

export default FinalCTA;
