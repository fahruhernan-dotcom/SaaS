// Side drawer — full menu like the screenshot
const { useState: useDS } = React;

const DRAWER_GROUPS = [
  {
    label: 'Utama',
    items: [
      { id: 'home',    icon: 'home',     label: 'Beranda' },
      { id: 'batch',   icon: 'grid',     label: 'Batch Aktif' },
      { id: 'ternak',  icon: 'sheep',    label: 'Data Ternak' },
      { id: 'sales',   icon: 'wallet',   label: 'Penjualan' },
      { id: 'kandang', icon: 'map',      label: 'Denah Kandang' },
    ],
  },
  {
    label: 'Tugas',
    items: [
      { id: 'tasks',   icon: 'notes',    label: 'Tugas Harian' },
      { id: 'assign',  icon: 'user',     label: 'Penugasan' },
      { id: 'taskset', icon: 'list',     label: 'Pengaturan Tugas' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { id: 'health',  icon: 'heart',    label: 'Kesehatan' },
      { id: 'feed',    icon: 'feed',     label: 'Pakan' },
      { id: 'finance', icon: 'trend',    label: 'Keuangan' },
      { id: 'reports', icon: 'target',   label: 'Laporan' },
    ],
  },
  {
    label: 'Akun',
    items: [
      { id: 'profile', icon: 'user',     label: 'Profil Saya' },
      { id: 'team',    icon: 'user',     label: 'Tim & Akses' },
      { id: 'settings', icon: 'list',    label: 'Pengaturan' },
    ],
  },
];

function SideDrawer({ T, open, onClose, tab, onTab }) {
  if (!open) return null;
  const Icon = (name, size = 20) => I[name] ? I[name]({ size }) : <I.list size={size} />;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90,
      pointerEvents: 'auto',
    }}>
      {/* Scrim */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        animation: 'drawerFade 200ms ease',
      }} />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '82%', maxWidth: 320,
        background: T.isDark ? '#0A0F0E' : '#FFFEFB',
        borderRight: `1px solid ${T.hairline}`,
        boxShadow: '8px 0 32px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        animation: 'drawerSlide 240ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <style>{`
          @keyframes drawerFade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes drawerSlide { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        `}</style>

        {/* Header — branding */}
        <div style={{
          padding: '64px 22px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Geist", system-ui',
              fontSize: 17, fontWeight: 700, letterSpacing: -0.5,
            }}>T</div>
            <div>
              <div style={{ fontFamily: '"Geist", system-ui', fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: -0.3, lineHeight: 1.1 }}>TernakOS</div>
              <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Fattening Domba</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 999,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: T.textDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><I.x size={18} /></button>
        </div>

        {/* Farm switcher */}
        <div style={{ padding: '0 18px 12px' }}>
          <button style={{
            width: '100%', textAlign: 'left',
            background: T.surfaceAlt, border: `1px solid ${T.hairline}`,
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: T.accent.soft, color: T.accent.base,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><I.sheep size={18} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>Hero Farm Breeding</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>Fattening Domba</div>
            </div>
            <I.chevronDown size={14} style={{ color: T.textMute }} />
          </button>
        </div>

        {/* Menu groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 24px' }}>
          {DRAWER_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                color: T.textMute, textTransform: 'uppercase',
                padding: '10px 10px 6px',
              }}>{group.label}</div>
              {group.items.map(it => {
                const active = tab === it.id;
                return (
                  <button key={it.id} onClick={() => { onTab(it.id); onClose(); }} style={{
                    width: '100%', textAlign: 'left',
                    background: active ? T.accent.soft : 'transparent',
                    border: active ? `1px solid ${T.accent.base}40` : '1px solid transparent',
                    borderRadius: 999,
                    padding: '11px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer',
                    color: active ? T.accent.base : T.text,
                    marginBottom: 2,
                    fontSize: 14, fontWeight: active ? 600 : 500,
                    letterSpacing: -0.1,
                  }}>
                    <span style={{ display: 'flex', color: active ? T.accent.base : T.textDim }}>{Icon(it.icon, 18)}</span>
                    {it.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer profile */}
        <div style={{
          padding: '12px 18px 32px',
          borderTop: `1px solid ${T.hairline}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Geist", system-ui', fontSize: 13, fontWeight: 600,
          }}>BS</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Pak Budi Santoso</div>
            <div style={{ fontSize: 11, color: T.textDim }}>Pemilik</div>
          </div>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: T.textDim, padding: 6,
          }}><I.chevron size={16} /></button>
        </div>
      </div>
    </div>
  );
}

window.SideDrawer = SideDrawer;
