import { motion } from 'framer-motion';
import CountUp from '../components/reactbits/CountUp';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const Features = () => {


  return (
    <section id="fitur">
      {/* Feature 1 */}
      <div className="bg-[#0A0F16] section-padding">
        <div className="max-w-[1280px] mx-auto">
          
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
            
            {/* Content Top (Mobile) / Left (Desktop) */}
            <div className="flex-1">
              <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    TRANSAKSI & PROFIT
                  </span>
                </div>
              </AnimatedContent>
              <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0.1}>
                <h3 className="section-h2 mb-[12px]">
                  Profit Langsung Kelihatan Sebelum Deal.
                </h3>
              </AnimatedContent>
              <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0.2}>
                <p className="section-subtitle mb-[20px]">
                  Input pembelian dari kandang dan penjualan ke RPA. Margin per kg, total profit, semua dihitung otomatis. Ada simulator margin sebelum kamu deal.
                </p>
              </AnimatedContent>
              
              <div className="space-y-[9px]">
                {['Hitung margin per kg otomatis', 'Simulator profit akurat', 'Tanpa kalkulator atau Excel rawan error'].map((item, i) => (
                  <AnimatedContent key={i} direction="vertical" distance={20} delay={0.3 + i * 0.07}>
                    <div className="flex items-start gap-[10px]">
                      <div className="w-[18px] h-[18px] min-min-w-[18px] bg-[rgba(16,185,129,0.12)] rounded-[5px] flex items-center justify-center text-em-400 text-[10px] shrink-0 mt-[3px]">
                        ✓
                      </div>
                      <span className="font-body text-[14px] text-tx-2 leading-[1.55]">{item}</span>
                    </div>
                  </AnimatedContent>
                ))}
              </div>
            </div>

            <AnimatedContent direction="horizontal" distance={50} delay={0.2} className="flex-1 w-full mt-8 lg:mt-0">
              <div className="bg-bg-2 border border-border-def rounded-[18px] p-[20px] relative overflow-hidden shadow-lg">
                {/* Decorative Window Controls */}
                <div className="flex gap-[6px] mb-[16px]">
                  <div className="w-[8px] h-[8px] rounded-full bg-[#FF5F57]"></div>
                  <div className="w-[8px] h-[8px] rounded-full bg-[#FEBC2E]"></div>
                  <div className="w-[8px] h-[8px] rounded-full bg-[#28C840]"></div>
                </div>

                <p className="font-body text-[11px] text-tx-3 font-semibold mb-[12px] relative z-10">Catat Penjualan Baru</p>
                
                <div className="flex flex-col gap-[8px]">
                   <div className="bg-bg-3 rounded-lg px-[12px] py-[10px]">
                     <p className="font-body text-[13px] text-tx-2">Harga Jual: Rp 23.000/kg</p>
                   </div>
                   <div className="bg-bg-3 rounded-lg px-[12px] py-[10px]">
                     <p className="font-body text-[13px] text-tx-2">Total Berat: 2.100 kg</p>
                   </div>
                </div>

                <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.20)] rounded-[12px] p-[16px] mt-[12px] relative z-10">
                  <p className="font-display text-[9px] text-em-400 uppercase tracking-widest font-bold mb-[4px]">PROFIT BERSIH</p>
                  <p className="font-display text-[22px] font-extrabold text-em-400 mb-[4px]">
                    <CountUp from={0} to={5880000} duration={1.5} separator="." />
                  </p>
                  <p className="font-body text-[11px] text-tx-3 font-medium">Margin: Rp 2.800/kg · ROI: 14.3%</p>
                  
                  {/* Progress Bar */}
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', marginTop: '12px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '68%', background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '99px' }}/>
                  </div>
                </div>

                {/* Code-like Background Text */}
                <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontFamily: 'monospace', fontSize: '10px', color: 'rgba(16,185,129,0.08)', userSelect: 'none', pointerEvents: 'none', lineHeight: 1.6, zIndex: 0 }}>
                  profit = revenue<br/>
                  &nbsp;&nbsp;&nbsp;- modal<br/>
                  &nbsp;&nbsp;&nbsp;- biaya
                </div>
              </div>
            </AnimatedContent>
          </div>
        </div>
      </div>

      {/* Feature 2 */}
      <div className="bg-[#06090F] section-fade-bottom section-padding">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col lg:flex-row-reverse gap-10 lg:gap-16 items-center">
            
            <div className="flex-1">
              <AnimatedContent direction="horizontal" distance={50} delay={0}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: '99px', padding: '5px 14px', marginBottom: '16px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s infinite' }}/>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    TRACKER PIUTANG
                  </span>
                </div>
              </AnimatedContent>
              <AnimatedContent direction="horizontal" distance={50} delay={0.1}>
                <h3 className="section-h2 mb-[12px]">
                  Tidak Ada Lagi Hutang RPA yang Kelewat.
                </h3>
              </AnimatedContent>
              <AnimatedContent direction="horizontal" distance={50} delay={0.2}>
                <p className="section-subtitle mb-[20px]">
                  Semua piutang RPA tercatat dengan jatuh tempo. Satu ketukan untuk tandai lunas. Lihat siapa yang paling lama menunggak dari dashboard.
                </p>
              </AnimatedContent>
              
              <div className="space-y-[9px]">
                {['Notifikasi jatuh tempo pembayaran', 'Tandai lunas dengan satu klik', 'Riwayat piutang per RPA'].map((item, i) => (
                  <AnimatedContent key={i} direction="vertical" distance={20} delay={0.3 + i * 0.07}>
                    <div className="flex items-start gap-[10px]">
                      <div className="w-[18px] h-[18px] min-w-[18px] bg-[rgba(16,185,129,0.12)] rounded-[5px] flex items-center justify-center text-em-400 text-[10px] shrink-0 mt-[3px]">
                        ✓
                      </div>
                      <span className="font-body text-[14px] text-tx-2 leading-[1.55]">{item}</span>
                    </div>
                  </AnimatedContent>
                ))}
              </div>
            </div>

            {/* Visual 2 */}
            <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0.2} className="flex-1 w-full mt-8 lg:mt-0">
              <div className="bg-bg-2 border border-border-def rounded-[18px] p-[20px] relative overflow-hidden shadow-lg">
                {/* Decorative Window Controls */}
                <div className="flex gap-[6px] mb-[16px]">
                  <div className="w-[8px] h-[8px] rounded-full bg-[#FF5F57]"></div>
                  <div className="w-[8px] h-[8px] rounded-full bg-[#FEBC2E]"></div>
                  <div className="w-[8px] h-[8px] rounded-full bg-[#28C840]"></div>
                </div>

                <div className="flex justify-between items-center mb-[16px] relative z-10">
                   <p className="font-display text-[12px] text-tx-1 font-bold">Piutang Aktif</p>
                   <span className="font-body text-[10px] bg-red-bg text-red px-[8px] py-[2px] rounded-full font-bold">3 belum lunas</span>
                </div>

                <div className="flex flex-col">
                  {[
                    { name: 'RPA Prima Jaya', amount: 'Rp 44jt', date: 'Jatuh tempo 14 Mar', avatar: 'PJ', bg: 'bg-emerald-600' },
                    { name: 'RPA Berkah', amount: 'Rp 28jt', date: 'Jatuh tempo 18 Mar', avatar: 'RB', bg: 'bg-[#0891B2]' },
                    { name: 'RPA Makmur', amount: 'Rp 12jt', date: 'Jatuh tempo 22 Mar', avatar: 'RM', bg: 'bg-amber-500' }
                  ].map((rpa, i) => (
                    <div key={i} className={`flex items-center gap-[10px] pt-[12px] pb-[10px] ${i !== 2 ? 'border-b border-border-sub' : ''}`}>
                      <div className={`w-[32px] h-[32px] rounded-full ${rpa.bg} text-white font-display font-bold text-[11px] flex items-center justify-center shrink-0`}>
                        {rpa.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-[13px] text-tx-1 font-semibold leading-tight mb-0.5">{rpa.name}</p>
                        <p className="font-body text-[11px] text-tx-3">{rpa.date}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5 ml-2">
                        <p className="font-display text-[13px] font-bold text-red tabular-nums">{rpa.amount}</p>
                        <button className="bg-em-glow text-em-400 text-[10px] font-bold py-[3px] px-[8px] rounded-full">
                          Lunas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedContent>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
