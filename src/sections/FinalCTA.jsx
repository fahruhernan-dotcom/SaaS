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
    <section className="bg-[#0A0F16] section-padding text-center relative overflow-hidden">
      
      {/* Background Particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Particles
          particleColors={['#10B981', '#34D399']}
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
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            color: '#F1F5F9',
            marginBottom: '16px'
          }}>
            Siap Kelola Bisnis Ternak<br/>
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,var(--em-400)_0%,#6EE7B7_30%,var(--em-500)_50%,var(--em-400)_100%)] animate-shimmer-text" style={{ backgroundSize: '200% auto' }}>Lebih Rapi?</span>
          </h2>
        </AnimatedContent>
        
        <AnimatedContent direction="vertical" distance={30} delay={0.1}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px',
            color: '#4B6478',
            maxWidth: '520px',
            margin: '0 auto 32px',
            lineHeight: 1.7
          }}>
            Bergabung dengan ratusan broker dan peternak yang sudah merasakan manfaatnya.
          </p>
        </AnimatedContent>

        <AnimatedContent direction="vertical" distance={30} delay={0.2}>
          <ClickSpark sparkColor="#10B981" sparkCount={10} sparkRadius={20}>
            <Magnet padding={40} magnetStrength={0.3} disabled={isTouchDevice()}>
              <a
                href="#daftar"
                className="inline-block w-full max-w-sm mx-auto px-[24px] py-[16px] font-display text-[16px] font-bold bg-em-500 text-white rounded-[14px] shadow-[0_12px_36px_rgba(16,185,129,0.22)] md:w-auto active:scale-[0.96] transition-transform"
              >
                Daftar Gratis Sekarang
              </a>
            </Magnet>
          </ClickSpark>
        </AnimatedContent>

        <AnimatedContent direction="vertical" distance={20} delay={0.3}>
          <p className="font-body text-[13px] text-tx-3 mt-[14px] opacity-80">
            Gratis selamanya · Tidak perlu kartu kredit
          </p>
        </AnimatedContent>
      </div>

    </section>
  );
};

export default FinalCTA;
