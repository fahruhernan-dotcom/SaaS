// Minimal stroked icon set — Lucide-flavoured but inline SVG so we don't pull
// the whole 1MB lib for a mockup. All 24×24, currentColor, stroke 1.75.

const Icon = ({ children, size = 20, stroke = 1.75, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
    {children}
  </svg>
);

// Generic
const I = {
  plus:    (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  bell:    (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>,
  search:  (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>,
  chevron: (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  chevronDown: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  arrowUp: (p) => <Icon {...p}><path d="M7 17 17 7M7 7h10v10"/></Icon>,
  arrowDown: (p) => <Icon {...p}><path d="M17 7 7 17M17 17H7V7"/></Icon>,
  check:   (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  x:       (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  more:    (p) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>,

  // Domain
  sheep:   (p) => <Icon {...p}>
    <path d="M5 13c0-2 1.3-3 3-3 .7-1.5 2-2.5 4-2.5s3.3 1 4 2.5c1.7 0 3 1 3 3v1.5c0 1-.7 1.5-1.5 1.5h-11C5.7 16 5 15.5 5 14.5z"/>
    <circle cx="9" cy="11.5" r=".7" fill="currentColor"/>
    <circle cx="14" cy="11.5" r=".7" fill="currentColor"/>
    <path d="M7.5 16v2M16.5 16v2M10 16v2M14 16v2"/>
  </Icon>,
  scale:   (p) => <Icon {...p}><path d="M5 21h14"/><path d="M12 3v18"/><path d="M5 7h14l-3 8H8z"/></Icon>,
  feed:    (p) => <Icon {...p}><path d="M3 10c2-3 5-3 9-3s7 0 9 3"/><path d="M21 10v4c0 4-4 7-9 7s-9-3-9-7v-4"/><path d="M9 14h.01M15 14h.01"/></Icon>,
  heart:   (p) => <Icon {...p}><path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5c0 5.5 8.5 11.5 10 11.5"/><path d="M3.5 12h3l1.5-3 3 6 1.5-3h3"/></Icon>,
  trend:   (p) => <Icon {...p}><path d="M3 17 9 11l4 4 8-8"/><path d="M14 7h7v7"/></Icon>,
  alert:   (p) => <Icon {...p}><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></Icon>,
  calendar:(p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Icon>,
  map:     (p) => <Icon {...p}><path d="M3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></Icon>,
  wallet:  (p) => <Icon {...p}><path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z"/><path d="M16 14h.01"/><path d="M5 7V5a2 2 0 0 1 2-2h10"/></Icon>,
  broom:   (p) => <Icon {...p}><path d="m19 4-7 7"/><path d="M14 6 18 10"/><path d="M11 9 4 16c-1 1-1 2 0 3l1 1c1 1 2 1 3 0l7-7"/></Icon>,
  clock:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  spark:   (p) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></Icon>,
  target:  (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></Icon>,
  list:    (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>,
  grid:    (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>,
  user:    (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Icon>,
  home:    (p) => <Icon {...p}><path d="M3 12 12 3l9 9"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/></Icon>,
  menu:    (p) => <Icon {...p}><path d="M4 12h16M4 6h16M4 18h16"/></Icon>,
  notes:   (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></Icon>,
  syringe: (p) => <Icon {...p}><path d="m18 2 4 4M21 5l-9 9M11 14l-2 2 4 4 2-2M9 16l-3 3-3-3 3-3"/></Icon>,
  drop:    (p) => <Icon {...p}><path d="M12 2.5S5 10 5 14a7 7 0 0 0 14 0c0-4-7-11.5-7-11.5z"/></Icon>,
};

window.I = I;
window.Icon = Icon;
