import { Calculator, AlertCircle, Phone } from 'lucide-react';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import TiltedCard from '../components/reactbits/TiltedCard';

const PainPoints = () => {
  const painPoints = [
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
    }
  ];

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
          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <h2 className="section-h2 mb-[12px]">
              Kenapa Broker Masih Struggle<br className="hidden md:block" /> di Era Digital?
            </h2>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={30} delay={0.2}>
            <p className="section-subtitle max-w-[300px] mx-auto md:max-w-[480px]">
              Bukan karena tidak mau. Karena belum ada tools yang cukup simpel dan relevan untuk mereka.
            </p>
          </AnimatedContent>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {painPoints.map((point, i) => (
            <AnimatedContent
              key={i}
              direction="vertical"
              distance={40}
              delay={i * 0.1}
            >
              <TiltedCard
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
                  /* PENTING: transform-style untuk 3D */
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
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPoints;
