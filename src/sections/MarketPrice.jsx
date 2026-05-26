import { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useMarketTrends } from '@/lib/hooks/useMarketTrends';
import CountUp from '../components/reactbits/CountUp';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import anime from '../lib/animation';

const MarketPrice = ({ activeRole }) => {
  const content = useMemo(() => ({
    broker: {
      title: <>Data Harga Pasar yang <br/><span className="text-emerald-500">Selalu Up-to-Date</span></>,
      desc: "Setiap kali broker mencatat transaksi, harga secara otomatis masuk to sistem. Kamu tahu rata-rata harga pasar hari ini — bahkan sebelum mulai negosiasi.",
      checklist: [
        'Data dari transaksi nyata — bukan rumor WA',
        '3 Sumber Data: Scraper Nasional, Admin Regional, & Transaksi User',
        'Analisis per Provinsi untuk akurasi maksimal'
      ]
    },
    peternak: {
      title: <>Tahu Harga Beli Broker <br/><span className="text-emerald-500">Sebelum Negosiasi</span></>,
      desc: "Lihat rata-rata harga yang broker bayar ke kandang di daerahmu. Tidak perlu tanya satu-satu lagi ke teman peternak lain.",
      checklist: [
        'Harga beli broker real dari transaksi',
        'Update otomatis setiap ada transaksi baru',
        'Tahu kapan harga sedang tinggi untuk jual'
      ]
    },
    rpa: {
      title: <>Beli Ayam di <br/><span className="text-emerald-500">Harga yang Tepat</span></>,
      desc: "Referensi harga jual broker hari ini dari data transaksi nyata. Negosiasi dengan data, bukan feeling.",
      checklist: [
        'Harga jual broker rata-rata per wilayah',
        'Tren harga 14 hari terakhir',
        'Deteksi harga anomali dari broker'
      ]
    }
  }), []);

  const active = content[activeRole] || content.broker;
  
  const chartRef = useRef(null);
  const pathRef = useRef(null);
  const areaRef = useRef(null);
  const buyPathRef = useRef(null);
  const dotRef = useRef(null);
  
  const isInView = useInView(chartRef, { once: true, margin: "-10%" });

  // Calculate 7 days date range (6 days ago to today)
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return {
      endDate: end.toISOString().split('T')[0],
      startDate: start.toISOString().split('T')[0]
    };
  }, []);

  // Fetch real market trend data for Jawa Tengah
  const { data: trendData = [] } = useMarketTrends('Jawa Tengah', startDate, endDate);

  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Latest day with valid data
  const latestData = useMemo(() => {
    if (!trendData || trendData.length === 0) return null;
    for (let i = trendData.length - 1; i >= 0; i--) {
      if (trendData[i].buyPrice && trendData[i].sellPrice) {
        return trendData[i];
      }
    }
    return trendData[trendData.length - 1];
  }, [trendData]);



  const formatRupiah = (val) => {
    if (val === null || val === undefined) return '-';
    return 'Rp ' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Generate seeded realistic fallback data when no real RPC data exists
  const simulatedData = useMemo(() => {
    const baseDate = new Date();
    // Use week number as seed so it's consistent within a week but changes weekly
    const weekSeed = Math.floor(baseDate.getTime() / (7 * 24 * 60 * 60 * 1000));
    const pseudo = (i) => {
      const x = Math.sin(weekSeed * 127 + i * 31.7) * 10000;
      return x - Math.floor(x);
    };
    const days = 7;
    let buy = 19200 + Math.round(pseudo(0) * 1200);
    let sell = buy + 3000 + Math.round(pseudo(1) * 800);
    return Array.from({ length: days }, (_, i) => {
      const dBuy  = Math.round((pseudo(i * 2 + 2) - 0.45) * 600);
      const dSell = Math.round((pseudo(i * 2 + 3) - 0.45) * 500);
      buy  = Math.max(17500, Math.min(22000, buy  + dBuy));
      sell = Math.max(buy + 2500, Math.min(26000, sell + dSell));
      return { buyPrice: buy, sellPrice: sell };
    });
  }, []);

  // Use real trendData if available, otherwise simulated
  const hasRealData = useMemo(() =>
    trendData && trendData.length > 0 && trendData.some(d => d.buyPrice !== null)
  , [trendData]);

  const effectiveData = hasRealData ? trendData : simulatedData;

  // Display prices — use last point of effective data
  const displayBuyPrice  = effectiveData[effectiveData.length - 1]?.buyPrice  ?? 19800;
  const displaySellPrice = effectiveData[effectiveData.length - 1]?.sellPrice ?? 23200;
  const displayMargin    = displaySellPrice - displayBuyPrice;

  // Delta vs previous day
  const buyPriceDelta = useMemo(() => {
    const src = effectiveData;
    if (src.length < 2) return 300;
    const last = src[src.length - 1]?.buyPrice ?? 0;
    const prev = src[src.length - 2]?.buyPrice ?? 0;
    return last - prev;
  }, [effectiveData]);

  const sellPriceDelta = useMemo(() => {
    const src = effectiveData;
    if (src.length < 2) return 200;
    const last = src[src.length - 1]?.sellPrice ?? 0;
    const prev = src[src.length - 2]?.sellPrice ?? 0;
    return last - prev;
  }, [effectiveData]);

  const chartPoints = useMemo(() => {
    const points = effectiveData.map((d) => ({
      buy:  d.buyPrice  ?? 19800,
      sell: d.sellPrice ?? 23200
    }));

    const allPrices = points.flatMap(p => [p.buy, p.sell]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const range = maxPrice - minPrice || 1000;

    const padding = range * 0.15;
    const chartMin = minPrice - padding;
    const chartMax = maxPrice + padding;
    const chartRange = chartMax - chartMin;

    const total = points.length;
    const mapped = points.map((p, i) => {
      const x    = total > 1 ? (i / (total - 1)) * 100 : 50;
      const buyY  = 90 - ((p.buy  - chartMin) / chartRange) * 80;
      const sellY = 90 - ((p.sell - chartMin) / chartRange) * 80;
      return { x, buyY, sellY, buy: p.buy, sell: p.sell, margin: p.sell - p.buy };
    });

    const buyPath  = 'M' + mapped.map(p => `${p.x.toFixed(1)},${p.buyY.toFixed(1)}`).join(' L');
    const sellPath = 'M' + mapped.map(p => `${p.x.toFixed(1)},${p.sellY.toFixed(1)}`).join(' L');
    const sellArea = sellPath + ' L100,100 L0,100 Z';

    return { buyPath, sellPath, sellArea, mapped };
  }, [effectiveData]);


  const handleMouseMove = (e) => {
    if (!chartRef.current || !chartPoints.mapped) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentX = (x / rect.width) * 100;
    
    let closestIdx = 0;
    let minDiff = Infinity;
    chartPoints.mapped.forEach((p, idx) => {
      const diff = Math.abs(p.x - percentX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  useEffect(() => {
    if (isInView) {
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength();
        pathRef.current.style.strokeDasharray = length;
        pathRef.current.style.strokeDashoffset = length;
        
        anime({
          targets: pathRef.current,
          strokeDashoffset: [length, 0],
          duration: 2000,
          easing: 'easeOutQuart',
          delay: 500
        });
      }

      if (areaRef.current) {
        anime({
          targets: areaRef.current,
          opacity: [0, 1],
          duration: 1000,
          easing: 'linear',
          delay: 800
        });
      }

      if (buyPathRef.current) {
        anime({
          targets: buyPathRef.current,
          strokeDashoffset: [20, 0],
          duration: 3000,
          easing: 'linear',
          loop: true
        });
      }
      
      if (dotRef.current) {
        anime({
          targets: dotRef.current,
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
          duration: 2000,
          easing: 'easeInOutQuad',
          loop: true
        });
      }
    }
  }, [isInView, chartPoints]);

  return (
    <section id="harga-pasar" className="bg-bg-base py-20 px-5 border-t border-border-subtle overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          
          {/* Content Left */}
          <div className="flex-1">
            <AnimatedContent direction="horizontal" reverse={true} distance={50} delay={0}>
              <div className="inline-flex items-center gap-[6px] bg-emerald-500/5 border border-emerald-500/15 rounded-full py-[5px] px-[12px] mb-4">
                <div className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-pulse-dot" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  FITUR EKSKLUSIF
                </span>
              </div>
            </AnimatedContent>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.22 }}
              >
                <AnimatedContent direction="none">
                  <h2 className="font-display text-2xl md:text-3xl font-normal text-text-primary leading-tight mb-5">
                    {active.title}
                  </h2>
                </AnimatedContent>
                
                <AnimatedContent direction="none">
                  <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-8 max-w-[480px]">
                    {active.desc}
                  </p>
                </AnimatedContent>

                <ul className="space-y-4 mb-8">
                  {active.checklist.map((item, i) => (
                    <AnimatedContent key={i} direction="none">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                          ✓
                        </div>
                        <span className="text-[13px] md:text-sm text-text-secondary font-medium">{item}</span>
                      </li>
                    </AnimatedContent>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            <AnimatedContent direction="vertical" distance={20} delay={0.4}>
              <a href="/harga-pasar" className="inline-flex items-center gap-2 text-[13px] font-bold text-emerald-500 hover:text-emerald-600 transition-all group">
                Lihat Demo Harga Pasar 
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </AnimatedContent>
          </div>

          {/* Visual Right */}
          <AnimatedContent
            direction="horizontal"
            distance={50}
            delay={0.2}
            className="w-full flex-1 bg-bg-1 border border-border-default rounded-[24px] p-6 md:p-8 relative overflow-hidden shadow-sm hover:border-border-strong transition-all duration-300"
          >
             <div className="relative z-10 flex justify-between items-center mb-6 border-b border-border-subtle pb-4">
                <p className="text-[11px] md:text-xs font-bold text-text-primary uppercase tracking-wider">Data Harga Pasar — Regional & Nasional</p>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/15">
                  <span ref={dotRef} className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-6 relative z-10">
                <div>
                   <p className="text-[10px] md:text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Beli Kandang</p>
                   <div className="flex items-end gap-1.5">
                      <p className="font-display text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                        <CountUp from={0} to={displayBuyPrice} duration={1.2} separator="." />
                      </p>
                      <motion.div 
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`flex items-center text-[10px] md:text-[12px] font-bold mb-0.5 ${
                          buyPriceDelta >= 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {buyPriceDelta >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />} 
                        {Math.abs(buyPriceDelta)}
                      </motion.div>
                   </div>
                   <p className="text-[10px] md:text-xs text-text-secondary mt-1">per kg / hari ini</p>
                </div>
                <div>
                   <p className="text-[10px] md:text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Jual RPA</p>
                   <div className="flex items-end gap-1.5">
                      <p className="font-display text-xl md:text-2xl font-black text-text-primary leading-none">
                        <CountUp from={0} to={displaySellPrice} duration={1.2} separator="." />
                      </p>
                      <motion.div 
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`flex items-center text-[10px] md:text-[12px] font-bold mb-0.5 ${
                          sellPriceDelta >= 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {sellPriceDelta >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />} 
                        {Math.abs(sellPriceDelta)}
                      </motion.div>
                   </div>
                   <p className="text-[10px] md:text-xs text-[#F59E0B] font-bold mt-1">
                      Margin: {formatRupiah(displayMargin)}
                   </p>
                </div>
             </div>

             {/* Chart Mockup */}
             <div 
               className="h-[100px] md:h-[120px] relative w-full border-t border-border-subtle pt-4 flex items-end justify-between z-10 cursor-crosshair select-none" 
               ref={chartRef}
               onMouseMove={handleMouseMove}
               onMouseLeave={handleMouseLeave}
             >
                <svg className="absolute inset-0 top-4 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                   {/* Gradient Fill */}
                   <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(78, 115, 78, 0.2)" />
                        <stop offset="100%" stopColor="rgba(78, 115, 78, 0)" />
                      </linearGradient>
                   </defs>
                   <path 
                     ref={buyPathRef}
                     d={chartPoints.buyPath} 
                     fill="none" 
                     stroke="var(--emerald-400)" 
                     strokeOpacity="0.35"
                     strokeWidth="1.5" 
                     strokeDasharray="4 4" 
                   />
                   {/* Sell Line (bright) area */}
                   <path 
                     ref={areaRef}
                     style={{ opacity: 0 }}
                     d={chartPoints.sellArea} 
                     fill="url(#chartGradient)" 
                   />
                   <path 
                     ref={pathRef}
                     d={chartPoints.sellPath} 
                     fill="none" 
                     stroke="var(--emerald-500)" 
                     strokeWidth="2" 
                     strokeLinecap="round" 
                   />
                </svg>

                {/* Tooltip & Indicators Overlay */}
                {hoveredIndex !== null && chartPoints.mapped && chartPoints.mapped[hoveredIndex] && (
                  <>
                    {/* Vertical Indicator Line */}
                    <div 
                      className="absolute top-4 bottom-0 border-l border-dashed border-emerald-500/30 pointer-events-none z-20"
                      style={{ left: `${chartPoints.mapped[hoveredIndex].x}%` }}
                    />
                    {/* Dots on the lines */}
                    <div 
                      className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-bg-1 shadow-sm pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        left: `${chartPoints.mapped[hoveredIndex].x}%`,
                        top: `calc(${chartPoints.mapped[hoveredIndex].sellY}% + 16px)`
                      }}
                    />
                    <div 
                      className="absolute w-2 h-2 rounded-full bg-emerald-500/50 border-2 border-bg-1 shadow-sm pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        left: `${chartPoints.mapped[hoveredIndex].x}%`,
                        top: `calc(${chartPoints.mapped[hoveredIndex].buyY}% + 16px)`
                      }}
                    />
                    {/* Tooltip Card */}
                    <div 
                      className="absolute bg-bg-2 border border-border-strong rounded-xl p-3 shadow-md z-40 pointer-events-none text-left flex flex-col gap-1 min-w-[150px]"
                      style={{
                        left: `${chartPoints.mapped[hoveredIndex].x}%`,
                        top: '-20px',
                        transform: `translateX(${chartPoints.mapped[hoveredIndex].x > 60 ? '-105%' : '5%'})`
                      }}
                    >
                      <p className="text-[9px] font-bold text-text-primary">
                        {trendData[hoveredIndex]?.date ? format(parseISO(trendData[hoveredIndex].date), 'EEEE, d MMM yyyy', { locale: idLocale }) : ''}
                      </p>
                      <div className="flex justify-between items-center gap-4 text-[9px] font-bold text-text-secondary mt-1">
                        <span>Beli Kandang:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(chartPoints.mapped[hoveredIndex]?.buy)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-4 text-[9px] font-bold text-text-secondary">
                        <span>Jual RPA:</span>
                        <span className="text-text-primary">
                          {formatRupiah(chartPoints.mapped[hoveredIndex]?.sell)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-4 text-[9px] font-black border-t border-border-subtle pt-1 mt-1">
                        <span className="text-emerald-600 dark:text-emerald-400">Margin:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(chartPoints.mapped[hoveredIndex]?.margin)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
             </div>

          </AnimatedContent>
        </div>
      </div>
    </section>
  );
};

export default MarketPrice;
