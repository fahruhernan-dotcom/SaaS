// App shell — wires everything together with iOS frame, nav, tweaks

const { useState: useAS, useEffect: useAE } = React;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const T = getTokens(tweaks.theme, tweaks.accent);
  const [editing, setEditing] = useAS(false);
  const [tab, setTab] = useAS('home');
  const [overlay, setOverlay] = useAS(null); // 'tasks' | 'alerts' | { type: 'batch', batch }
  const [sheet, setSheet] = useAS(false);
  const [drawer, setDrawer] = useAS(false);

  useAE(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode')   setEditing(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditing(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.isDark ? '#000' : '#E8E5E0',
      padding: '20px',
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: T.text,
    }}>
      <IOSDevice dark={T.isDark} width={402} height={874}>
        <div style={{
          position: 'relative', height: '100%', width: '100%',
          background: T.bg, color: T.text, overflow: 'hidden',
        }}>
          {/* Main scrollable area */}
          <div style={{
            position: 'absolute', inset: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: 100,
          }}>
            {tab === 'home' && (
              <HomeScreen
                T={T} density={tweaks.density} showFinancePeek={tweaks.showFinancePeek}
                onOpenBatch={(b) => setOverlay({ type: 'batch', batch: b })}
                onOpenTask={() => setOverlay('tasks')}
                onOpenAlerts={() => setOverlay('alerts')}
                onOpenMenu={() => setDrawer(true)}
                onOpenProfile={() => setTab('profile')}
              />
            )}
            {tab !== 'home' && tab !== 'batch' && tab !== 'health' && tab !== 'profile' && tab !== 'tasks' && tab !== 'feed' && <PlaceholderTab T={T} tab={tab} />}
            {tab === 'batch' && <BatchTab T={T} onOpen={(b) => setOverlay({ type: 'batch', batch: b })} />}
            {tab === 'health' && <HealthTab T={T} />}
            {tab === 'profile' && <ProfileTab T={T} />}
            {tab === 'tasks' && <TasksTab T={T} onOpenTask={() => setOverlay('tasks')} />}
            {tab === 'feed' && <FeedTab T={T} />}
          </div>

          {/* Overlays */}
          {overlay === 'tasks'  && <TaskScreen   T={T} onBack={() => setOverlay(null)} />}
          {overlay === 'alerts' && <AlertsScreen T={T} onBack={() => setOverlay(null)} />}
          {overlay?.type === 'batch' && <BatchDetail T={T} batch={overlay.batch} onBack={() => setOverlay(null)} />}

          {/* Quick add sheet */}
          <QuickAddSheet T={T} open={sheet} onClose={() => setSheet(false)} />

          {/* Side drawer */}
          <SideDrawer T={T} open={drawer} onClose={() => setDrawer(false)} tab={tab} onTab={setTab} />

          {/* Bottom nav */}
          <BottomNav T={T} tab={tab} onTab={setTab} onAdd={() => setSheet(true)} onMenu={() => setDrawer(true)} style={tweaks.navStyle} />
        </div>
      </IOSDevice>

      {/* Tweaks panel */}
      {editing && (
        <TweaksPanel onClose={() => { setEditing(false); window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); }}>
          <TweakSection title="Tampilan">
            <TweakRadio label="Tema" value={tweaks.theme} onChange={(v) => setTweak('theme', v)}
              options={[{ value: 'dark', label: 'Gelap' }, { value: 'light', label: 'Terang' }]} />
            <TweakRadio label="Aksen" value={tweaks.accent} onChange={(v) => setTweak('accent', v)}
              options={Object.entries(ACCENTS).map(([k, v]) => ({ value: k, label: v.name }))} />
            <TweakRadio label="Kerapatan" value={tweaks.density} onChange={(v) => setTweak('density', v)}
              options={[{ value: 'comfortable', label: 'Lega' }, { value: 'compact', label: 'Padat' }]} />
            <TweakRadio label="Gaya nav" value={tweaks.navStyle} onChange={(v) => setTweak('navStyle', v)}
              options={[{ value: 'tab', label: 'Tab bar' }, { value: 'dock', label: 'Dock' }]} />
          </TweakSection>
          <TweakSection title="Konten">
            <TweakToggle label="Tampilkan proyeksi keuangan" value={tweaks.showFinancePeek} onChange={(v) => setTweak('showFinancePeek', v)} />
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

function PlaceholderTab({ T, tab }) {
  const labels = {
    batch: 'Batch',
    health: 'Kesehatan',
    finance: 'Keuangan',
    profile: 'Profil',
  };
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: T.textDim }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 8 }}>{labels[tab]}</div>
      <div style={{ fontSize: 13 }}>Halaman ini adalah placeholder pada mockup.</div>
    </div>
  );
}

// ─── Bottom Nav (tab bar OR floating dock) ────────────────────
function BottomNav({ T, tab, onTab, onAdd, onMenu, style }) {
  const items = [
    { id: 'home',    icon: <I.home size={22} />,     label: 'Beranda' },
    { id: 'tasks',   icon: <I.notes size={22} />,    label: 'Tugas' },
    { id: 'add',     icon: <I.plus size={24} />,     label: '', isAdd: true },
    { id: 'feed',    icon: <I.feed size={22} />,     label: 'Pakan' },
    { id: 'menu',    icon: <I.menu size={22} />,     label: 'Menu', isMenu: true },
  ];

  if (style === 'dock') {
    return (
      <div style={{
        position: 'absolute', bottom: 24, left: 16, right: 16,
        display: 'flex', justifyContent: 'center', zIndex: 50,
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: T.isDark ? 'rgba(19, 25, 26, 0.85)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${T.hairlineStrong}`,
          borderRadius: 999,
          padding: 6,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          pointerEvents: 'auto',
        }}>
          {items.map(it => {
            const active = tab === it.id;
            if (it.isAdd) {
              return (
                <button key={it.id} onClick={onAdd} style={{
                  width: 44, height: 44, borderRadius: 999,
                  background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 4px',
                }}>{it.icon}</button>
              );
            }
            if (it.isMenu) {
              return (
                <button key={it.id} onClick={onMenu} style={{
                  width: 44, height: 44, borderRadius: 999,
                  background: 'transparent', color: T.textDim,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{it.icon}</button>
              );
            }
            return (
              <button key={it.id} onClick={() => onTab(it.id)} style={{
                width: 44, height: 44, borderRadius: 999,
                background: active ? T.accent.soft : 'transparent',
                color: active ? T.accent.base : T.textDim,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{it.icon}</button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: T.isDark ? 'rgba(10, 14, 12, 0.85)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `1px solid ${T.hairline}`,
      paddingBottom: 24,
      zIndex: 50,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '8px 8px 4px',
      }}>
        {items.map(it => {
          const active = tab === it.id;
          if (it.isAdd) {
            return (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button onClick={onAdd} style={{
                  width: 48, height: 48, borderRadius: 999,
                  background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 14px ${T.accent.base}40`,
                  transform: 'translateY(-8px)',
                }}>{it.icon}</button>
              </div>
            );
          }
          if (it.isMenu) {
            return (
              <button key={it.id} onClick={onMenu} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                color: T.textDim,
              }}>
                {it.icon}
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.1 }}>{it.label}</span>
              </button>
            );
          }
          return (
            <button key={it.id} onClick={() => onTab(it.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: active ? T.accent.base : T.textDim,
            }}>
              {it.icon}
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.1 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
