// Reusable mobile UI primitives

const { useState: useStateUI } = React;

// Section header
function SectionHeader({ T, label, action, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 20px', marginBottom: 12,
    }}>
      <h2 style={{
        margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: 0.4,
        textTransform: 'uppercase', color: T.textDim,
      }}>{label}</h2>
      {action && (
        <button onClick={onAction} style={{
          background: 'none', border: 'none', padding: 0,
          color: T.accent.base, fontSize: 14, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>{action}</button>
      )}
    </div>
  );
}

// Card surface
function Card({ T, children, style = {}, onClick, padded = true }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface,
      border: `1px solid ${T.hairline}`,
      borderRadius: 20,
      padding: padded ? 20 : 0,
      boxShadow: T.shadow,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 120ms ease',
      ...style,
    }}>
      {children}
    </div>
  );
}

// Pill / status chip
function Pill({ T, tone = 'neutral', children, size = 'sm' }) {
  const tones = {
    neutral: { bg: T.hairline, fg: T.textDim },
    accent:  { bg: T.accent.soft, fg: T.accent.base },
    danger:  { bg: T.isDark ? 'oklch(0.7 0.18 25 / 0.14)' : 'oklch(0.62 0.18 25 / 0.1)', fg: T.danger },
    warn:    { bg: T.isDark ? 'oklch(0.78 0.14 70 / 0.14)' : 'oklch(0.7 0.16 65 / 0.1)',  fg: T.warn },
    ok:      { bg: T.isDark ? 'oklch(0.72 0.15 155 / 0.14)' : 'oklch(0.62 0.13 155 / 0.1)', fg: T.ok },
  };
  const { bg, fg } = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, color: fg,
      padding: size === 'sm' ? '3px 9px' : '6px 12px',
      borderRadius: 999,
      fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 600, letterSpacing: 0.1,
      lineHeight: 1.4,
    }}>{children}</span>
  );
}

// Press feedback wrapper
function Pressable({ children, onPress, style = {} }) {
  const [active, setActive] = useStateUI(false);
  return (
    <div
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      onClick={onPress}
      style={{
        cursor: 'pointer',
        transform: active ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease',
        ...style,
      }}
    >{children}</div>
  );
}

// Big number
function BigNumber({ T, value, unit, sub, color }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
          fontSize: 36, fontWeight: 600, lineHeight: 1, letterSpacing: -0.8,
          color: color || T.text,
          fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
        {unit && (
          <span style={{ fontSize: 14, fontWeight: 500, color: T.textDim }}>{unit}</span>
        )}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 13, color: T.textDim, fontWeight: 500 }}>{sub}</div>
      )}
    </div>
  );
}

// Progress bar
function ProgressBar({ T, value, max = 100, tone = 'accent' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fillColor = tone === 'danger' ? T.danger : tone === 'warn' ? T.warn : T.accent.base;
  return (
    <div style={{
      height: 6, borderRadius: 999,
      background: T.hairline, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: fillColor,
        borderRadius: 999,
        transition: 'width 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }} />
    </div>
  );
}

// Donut ring (SVG)
function DonutRing({ T, value, max, size = 64, stroke = 6, color, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const dash = c * pct;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
          stroke={T.hairlineStrong} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r}
          stroke={color || T.accent.base} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{children}</div>
    </div>
  );
}

// Sparkline
function Sparkline({ T, data, color, height = 36, width = 100 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.9 - height * 0.05;
    return [x, y];
  });
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  const cl = color || T.accent.base;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={area} fill={cl} fillOpacity="0.12" />
      <path d={d} stroke={cl} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="2.5" fill={cl} />
    </svg>
  );
}

window.SectionHeader = SectionHeader;
window.Card = Card;
window.Pill = Pill;
window.Pressable = Pressable;
window.BigNumber = BigNumber;
window.ProgressBar = ProgressBar;
window.DonutRing = DonutRing;
window.Sparkline = Sparkline;
