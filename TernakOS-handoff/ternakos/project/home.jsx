// Home screen — Beranda

const { useState: useS, useMemo: useM } = React;

function HomeScreen({ T, density, showFinancePeek, onOpenBatch, onOpenTask, onOpenAlerts, onAdd, onOpenMenu, onOpenProfile }) {
  const kpi = getKpi();
  const tightPad = density === 'compact';
  const gap = tightPad ? 12 : 16;
  const sectionGap = tightPad ? 20 : 28;

  // Today's task progress
  const tasksDone = TASKS.filter(t => t.status === 'done').length;
  const tasksTotal = TASKS.length;
  const tasksDoing = TASKS.filter(t => t.status === 'doing').length;

  // 7-day weight sparkline (synthetic)
  const sparkData = [22.8, 23.1, 23.4, 23.6, 24.1, 24.3, 24.5];
  const adgSpark = [142, 148, 151, 155, 162, 165, 168];

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Header */}
      <header style={{
        padding: '68px 20px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, color: T.textDim, fontWeight: 500, marginBottom: 2 }}>
            {greeting(TODAY)}, Pak Budi
          </div>
          <div style={{
            fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: -0.4,
          }}>Beranda peternakan</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onOpenAlerts} style={{
            position: 'relative',
            width: 40, height: 40, borderRadius: 999,
            background: T.surface, border: `1px solid ${T.hairline}`,
            color: T.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <I.bell size={18} />
            {ALERTS.length > 0 && (
              <span style={{
                position: 'absolute', top: 8, right: 9,
                width: 8, height: 8, borderRadius: 999,
                background: T.danger,
                border: `2px solid ${T.surface}`,
              }} />
            )}
          </button>
          <button onClick={onOpenProfile} style={{
            width: 40, height: 40, borderRadius: 999,
            background: T.accent.base,
            color: T.isDark ? '#0A0E0C' : '#fff',
            border: `1px solid ${T.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: '"Geist", system-ui',
            fontSize: 14, fontWeight: 600, letterSpacing: -0.2,
          }}>BS</button>
        </div>
      </header>

      {/* HERO KPI — Population first */}
      <div style={{ padding: `${tightPad ? 12 : 16}px 20px 0` }}>
        <Card T={T} padded={false} style={{ overflow: 'hidden' }}>
          <div style={{ padding: tightPad ? '20px 22px 16px' : '24px 24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
                  textTransform: 'uppercase', color: T.textDim,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 999, background: T.accent.base,
                    boxShadow: `0 0 10px ${T.accent.base}`,
                  }} />
                  Total populasi aktif
                </div>
              </div>
              <Pill T={T} tone="ok">
                <I.arrowUp size={11} stroke={2.5} />
                +12 minggu ini
              </Pill>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <span style={{
                fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
                fontSize: 64, fontWeight: 600, lineHeight: 0.95, letterSpacing: -2,
                color: T.text, fontVariantNumeric: 'tabular-nums',
              }}>{kpi.total}</span>
              <span style={{ fontSize: 16, color: T.textDim, fontWeight: 500 }}>ekor</span>
            </div>
            <div style={{ fontSize: 14, color: T.textDim, fontWeight: 500 }}>
              {BATCHES.length} batch berjalan · {kpi.harvestSoon} ekor siap panen ≤30 hari
            </div>
          </div>

          {/* Inline metrics row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            borderTop: `1px solid ${T.hairline}`,
          }}>
            <MetricCell T={T} label="ADG hari" value={kpi.adg} unit="g" tone="ok" sparkData={adgSpark} accent={T.accent.base} />
            <MetricCell T={T} label="Mortalitas" value={kpi.mortPct.toFixed(1)} unit="%" tone={kpi.mortPct > 3 ? 'danger' : kpi.mortPct > 1.5 ? 'warn' : 'ok'} divider="left" />
            <MetricCell T={T} label="Bobot rata-rata" value={(BATCHES.reduce((s,b)=>s+b.avgWeight*b.active,0)/kpi.total).toFixed(1)} unit="kg" divider="left" sparkData={sparkData} accent={T.accent.base} />
          </div>
        </Card>
      </div>

      {/* TODAY'S TASKS — single, scannable progress */}
      <div style={{ marginTop: sectionGap }}>
        <SectionHeader T={T} label={`Tugas hari ini · ${fmtDate(TODAY, { weekday: 'long', day: 'numeric', month: 'long' })}`} action="Semua" onAction={onOpenTask} />
        <div style={{ padding: '0 20px' }}>
          <Card T={T} onClick={onOpenTask}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <DonutRing T={T} value={tasksDone} max={tasksTotal} size={72} stroke={7} color={T.accent.base}>
                <div style={{ textAlign: 'center', lineHeight: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{tasksDone}/{tasksTotal}</div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2, fontWeight: 500 }}>selesai</div>
                </div>
              </DonutRing>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6, letterSpacing: -0.2 }}>
                  {tasksDoing > 0 ? `${tasksDoing} sedang berjalan` : 'Tepat jadwal'}
                </div>
                <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.4 }}>
                  Berikutnya: <span style={{ color: T.text, fontWeight: 500 }}>{TASKS.find(t => t.status !== 'done')?.label}</span> · {TASKS.find(t => t.status !== 'done')?.time}
                </div>
              </div>
              <I.chevron size={18} style={{ color: T.textMute }} />
            </div>

            {/* Mini task strip */}
            <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
              {TASKS.map(t => (
                <div key={t.id} style={{
                  flex: 1, height: 5, borderRadius: 999,
                  background: t.status === 'done' ? T.accent.base
                    : t.status === 'doing' ? T.warn
                    : T.hairlineStrong,
                  opacity: t.status === 'pending' ? 0.6 : 1,
                }} title={`${t.label} — ${t.status}`} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ALERTS — only if present */}
      {ALERTS.length > 0 && (
        <div style={{ marginTop: sectionGap }}>
          <SectionHeader T={T} label="Perlu perhatian" action={`${ALERTS.length} item`} onAction={onOpenAlerts} />
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ALERTS.map(a => (
              <AlertRow key={a.id} T={T} alert={a} />
            ))}
          </div>
        </div>
      )}

      {/* BATCHES */}
      <div style={{ marginTop: sectionGap }}>
        <SectionHeader T={T} label="Batch aktif" action="Semua" onAction={() => onOpenBatch(BATCHES[0])} />
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {BATCHES.map(b => (
            <BatchRow key={b.id} T={T} batch={b} onClick={() => onOpenBatch(b)} />
          ))}
        </div>
      </div>

      {/* DENAH KANDANG — real-time monitoring */}
      <div style={{ marginTop: sectionGap }}>
        <SectionHeader T={T} label="Denah kandang" action="Buka penuh" />
        <div style={{ padding: '0 20px' }}>
          <KandangMap T={T} />
        </div>
      </div>

      {/* FINANCE PEEK */}
      {showFinancePeek && (
        <div style={{ marginTop: sectionGap }}>
          <SectionHeader T={T} label="Proyeksi keuangan" action="Detail" />
          <div style={{ padding: '0 20px' }}>
            <FinancePeek T={T} kpi={kpi} />
          </div>
        </div>
      )}

      {/* QUICK ACTIONS — quiet shortcuts at the bottom */}
      <div style={{ marginTop: sectionGap }}>
        <SectionHeader T={T} label="Aksi cepat" />
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <QuickAction T={T} icon={<I.scale size={18} />} label="Timbang" sub="Catat bobot" />
          <QuickAction T={T} icon={<I.feed size={18} />} label="Pakan" sub="Log pemberian" />
          <QuickAction T={T} icon={<I.heart size={18} />} label="Kesehatan" sub="Vaksin · obat" />
          <QuickAction T={T} icon={<I.notes size={18} />} label="Catatan" sub="Insiden harian" />
        </div>
      </div>
    </div>
  );
}

function MetricCell({ T, label, value, unit, tone, divider, sparkData, accent }) {
  const toneColor = tone === 'danger' ? T.danger : tone === 'warn' ? T.warn : tone === 'ok' ? T.ok : T.text;
  return (
    <div style={{
      padding: '14px 16px',
      borderLeft: divider === 'left' ? `1px solid ${T.hairline}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{
            fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
            fontSize: 22, fontWeight: 600, color: toneColor, letterSpacing: -0.4,
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>{value}</span>
          <span style={{ fontSize: 11, color: T.textDim, fontWeight: 500 }}>{unit}</span>
        </div>
        {sparkData && <Sparkline T={T} data={sparkData} color={accent || T.accent.base} width={42} height={20} />}
      </div>
    </div>
  );
}

function AlertRow({ T, alert }) {
  const isDanger = alert.level === 'danger';
  return (
    <Pressable onPress={() => {}}>
      <div style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '14px 16px',
        background: T.surface,
        border: `1px solid ${T.hairline}`,
        borderLeft: `3px solid ${isDanger ? T.danger : T.warn}`,
        borderRadius: 16,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 999,
          background: isDanger
            ? (T.isDark ? 'oklch(0.7 0.18 25 / 0.14)' : 'oklch(0.62 0.18 25 / 0.1)')
            : (T.isDark ? 'oklch(0.78 0.14 70 / 0.14)' : 'oklch(0.7 0.16 65 / 0.1)'),
          color: isDanger ? T.danger : T.warn,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <I.alert size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>
              {alert.batch} · {alert.title}
            </div>
            <div style={{ fontSize: 11, color: T.textMute, fontWeight: 500, flexShrink: 0 }}>{alert.at}</div>
          </div>
          <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.4 }}>{alert.body}</div>
        </div>
      </div>
    </Pressable>
  );
}

function BatchRow({ T, batch, onClick }) {
  const days = daysSince(batch.startDate);
  const remaining = Math.max(0, TARGET_DAYS - days);
  const progress = Math.min(100, (days / TARGET_DAYS) * 100);
  const overdue = days > TARGET_DAYS;
  const nearHarvest = remaining <= 14 && !overdue;
  const adgTone = batch.adg >= 150 ? 'ok' : batch.adg >= 100 ? 'warn' : 'danger';
  const adgColor = adgTone === 'ok' ? T.ok : adgTone === 'warn' ? T.warn : T.danger;

  return (
    <Pressable onPress={onClick}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.hairline}`,
        borderRadius: 20,
        padding: 18,
        boxShadow: T.shadow,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
                fontSize: 17, fontWeight: 600, color: T.text, letterSpacing: -0.3,
              }}>{batch.code}</span>
              {nearHarvest && <Pill T={T} tone="warn">Siap panen</Pill>}
              {overdue && <Pill T={T} tone="danger">Overdue</Pill>}
            </div>
            <div style={{ fontSize: 13, color: T.textDim, fontWeight: 500 }}>{batch.kandang}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
              fontSize: 22, fontWeight: 600, color: T.text, lineHeight: 1, letterSpacing: -0.4,
              fontVariantNumeric: 'tabular-nums',
            }}>{batch.active}</div>
            <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4 }}>ekor</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textDim, marginBottom: 8 }}>
          <span>Hari ke-<span style={{ color: T.text, fontWeight: 600 }}>{days}</span> dari {TARGET_DAYS}</span>
          <span style={{ color: nearHarvest ? T.warn : T.textDim, fontWeight: 500 }}>
            {overdue ? `+${days - TARGET_DAYS} hari overdue` : `Sisa ${remaining} hari`}
          </span>
        </div>
        <ProgressBar T={T} value={days} max={TARGET_DAYS} tone={overdue ? 'danger' : nearHarvest ? 'warn' : 'accent'} />

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
          marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.hairline}`,
        }}>
          <BatchMini T={T} label="ADG" value={`${batch.adg}g`} color={adgColor} />
          <BatchMini T={T} label="Bobot" value={`${batch.avgWeight} kg`} />
          <BatchMini T={T} label="Mortalitas" value={`${batch.mortality}/${batch.total}`} color={batch.mortality > 0 ? T.warn : T.text} />
        </div>
      </div>
    </Pressable>
  );
}

function BatchMini({ T, label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
        fontSize: 15, fontWeight: 600, color: color || T.text, letterSpacing: -0.2,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

function FinancePeek({ T, kpi }) {
  const profitOk = kpi.profit > 0;
  const margin = ((kpi.profit / kpi.revenue) * 100).toFixed(1);
  return (
    <Card T={T}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>
            Estimasi laba
          </div>
          <div style={{
            fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
            fontSize: 28, fontWeight: 600, color: profitOk ? T.ok : T.danger,
            letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums',
          }}>{fmtRp(kpi.profit)}</div>
        </div>
        <Pill T={T} tone={profitOk ? 'ok' : 'danger'}>
          {profitOk ? <I.arrowUp size={11} stroke={2.5} /> : <I.arrowDown size={11} stroke={2.5} />}
          {margin}% margin
        </Pill>
      </div>

      {/* Bar */}
      <FinanceBar T={T} cost={kpi.cost} revenue={kpi.revenue} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
        <div>
          <div style={{ color: T.textMute, marginBottom: 2 }}>Biaya</div>
          <div style={{ color: T.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtRp(kpi.cost)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: T.textMute, marginBottom: 2 }}>Proyeksi pendapatan</div>
          <div style={{ color: T.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtRp(kpi.revenue)}</div>
        </div>
      </div>
    </Card>
  );
}

function FinanceBar({ T, cost, revenue }) {
  const total = cost + revenue;
  const costPct = (cost / total) * 100;
  return (
    <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: T.hairline }}>
      <div style={{
        width: `${costPct}%`,
        background: T.isDark ? 'oklch(0.7 0.18 25 / 0.85)' : 'oklch(0.62 0.18 25)',
      }} />
      <div style={{
        flex: 1,
        background: T.accent.base,
      }} />
    </div>
  );
}

function QuickAction({ T, icon, label, sub }) {
  return (
    <Pressable onPress={() => {}}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.hairline}`,
        borderRadius: 16,
        padding: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: T.accent.soft, color: T.accent.base,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{label}</div>
          <div style={{ fontSize: 12, color: T.textDim, fontWeight: 500 }}>{sub}</div>
        </div>
      </div>
    </Pressable>
  );
}

window.HomeScreen = HomeScreen;

// ─── KANDANG MAP (real-time top-down view) ────────────────────
function KandangMap({ T }) {
  const pens = [
    { id: 'A1', name: 'Utara A', batch: 'B-2604', count: 47, capacity: 50, status: 'ok',    x: 0,    y: 0, w: 48, h: 38 },
    { id: 'A2', name: 'Utara B', batch: 'B-2702', count: 38, capacity: 40, status: 'ok',    x: 52,   y: 0, w: 48, h: 38 },
    { id: 'B1', name: 'Selatan A', batch: 'B-2604', count: 22, capacity: 30, status: 'warn', x: 0,  y: 42, w: 48, h: 28 },
    { id: 'B2', name: 'Karantina', batch: '—',    count: 3,  capacity: 12, status: 'alert', x: 52, y: 42, w: 48, h: 28 },
  ];
  const totalAnimals = pens.reduce((s, p) => s + p.count, 0);
  const totalCap = pens.reduce((s, p) => s + p.capacity, 0);
  const utilization = Math.round((totalAnimals / totalCap) * 100);

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.hairline}`,
      borderRadius: 20, overflow: 'hidden', boxShadow: T.shadow,
    }}>
      {/* Header strip */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.hairline}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999,
            background: T.ok,
            boxShadow: `0 0 0 4px ${T.ok}22`,
            animation: 'mapPulse 2s ease-in-out infinite',
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>4 kandang aktif</div>
            <div style={{ fontSize: 11, color: T.textMute }}>Live · diperbarui 2 menit lalu</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: '"Geist", system-ui', fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.3 }}>{utilization}%</div>
          <div style={{ fontSize: 10, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>okupansi</div>
        </div>
      </div>
      <style>{`
        @keyframes mapPulse {
          0%, 100% { box-shadow: 0 0 0 4px ${T.ok}22 }
          50% { box-shadow: 0 0 0 8px ${T.ok}11 }
        }
      `}</style>

      {/* Map area */}
      <div style={{
        position: 'relative',
        background: T.isDark
          ? 'linear-gradient(135deg, #07100D 0%, #0B1814 100%)'
          : 'linear-gradient(135deg, #F4F2EE 0%, #EBE7E0 100%)',
        padding: 16,
      }}>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 16,
          backgroundImage: T.isDark
            ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative',
          aspectRatio: '1.6',
          width: '100%',
        }}>
          {pens.map(pen => {
            const fillPct = pen.count / pen.capacity;
            const tone = pen.status === 'ok' ? T.ok : pen.status === 'warn' ? T.warn : T.danger;
            return (
              <div key={pen.id} style={{
                position: 'absolute',
                left: `${pen.x}%`, top: `${pen.y}%`,
                width: `${pen.w}%`, height: `${pen.h}%`,
                background: T.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${tone}66`,
                borderRadius: 8,
                padding: 8,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 120ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                {/* Fill background indicating utilization */}
                <div style={{
                  position: 'absolute', left: 0, bottom: 0, right: 0,
                  height: `${fillPct * 100}%`,
                  background: `linear-gradient(to top, ${tone}22, transparent)`,
                  pointerEvents: 'none',
                }} />

                {/* Sheep dots */}
                <div style={{
                  position: 'absolute', inset: 6,
                  display: 'flex', flexWrap: 'wrap', gap: 2,
                  alignContent: 'flex-end', justifyContent: 'center',
                  opacity: 0.85,
                }}>
                  {Array.from({ length: Math.min(pen.count, 24) }).map((_, i) => (
                    <div key={i} style={{
                      width: 4, height: 4, borderRadius: 999,
                      background: tone,
                      opacity: 0.6 + (i % 3) * 0.15,
                    }} />
                  ))}
                </div>

                {/* Header label */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: '"Geist", system-ui',
                    fontSize: 10, fontWeight: 700,
                    color: T.text, letterSpacing: 0.3,
                    background: T.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)',
                    padding: '2px 5px', borderRadius: 4,
                  }}>{pen.id}</span>
                  {pen.status !== 'ok' && (
                    <span style={{
                      width: 6, height: 6, borderRadius: 999,
                      background: tone,
                      boxShadow: `0 0 6px ${tone}`,
                    }} />
                  )}
                </div>

                {/* Footer count */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: '"Geist", system-ui',
                    fontSize: 13, fontWeight: 600,
                    color: T.text, letterSpacing: -0.3,
                  }}>{pen.count}<span style={{ fontSize: 9, color: T.textMute, fontWeight: 500 }}>/{pen.capacity}</span></span>
                  <span style={{
                    fontSize: 8, fontWeight: 600, color: T.textDim,
                    letterSpacing: 0.3, textTransform: 'uppercase',
                  }}>{pen.batch}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${T.hairline}`,
        background: T.surfaceAlt,
      }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <LegendDot T={T} color={T.ok} label="Normal" />
          <LegendDot T={T} color={T.warn} label="Pantau" />
          <LegendDot T={T} color={T.danger} label="Karantina" />
        </div>
        <button style={{
          fontSize: 11, fontWeight: 600, color: T.accent.base,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, letterSpacing: -0.1,
        }}>Detail →</button>
      </div>
    </div>
  );
}

function LegendDot({ T, color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      <span style={{ fontSize: 10, color: T.textDim, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

window.KandangMap = KandangMap;
