// Additional tabs — Batch list, Health, Feed, Sales, Profile
// Full mobile screens drawn from the codebase context.

const { useState: useTS } = React;

// ─── Mock data extending the base set ─────────────────────────
const ANIMALS_PER_BATCH = 8; // sample
const SAMPLE_ANIMALS = [
  { id: 'a1', tag: 'D-001', batch: 'B-2604', sex: 'jantan', breed: 'Garut', entryWeight: 14.5, currentWeight: 29.4, days: 79, adg: 188, status: 'aktif' },
  { id: 'a2', tag: 'D-002', batch: 'B-2604', sex: 'jantan', breed: 'Merino', entryWeight: 13.8, currentWeight: 27.1, days: 79, adg: 168, status: 'aktif' },
  { id: 'a3', tag: 'D-003', batch: 'B-2604', sex: 'jantan', breed: 'Garut',  entryWeight: 14.2, currentWeight: 28.6, days: 79, adg: 182, status: 'aktif' },
  { id: 'a4', tag: 'D-004', batch: 'B-2604', sex: 'jantan', breed: 'Garut',  entryWeight: 15.0, currentWeight: 26.8, days: 79, adg: 149, status: 'sakit' },
  { id: 'a5', tag: 'D-005', batch: 'B-2702', sex: 'jantan', breed: 'Domba Ekor Tipis', entryWeight: 13.5, currentWeight: 21.8, days: 55, adg: 151, status: 'aktif' },
  { id: 'a6', tag: 'D-006', batch: 'B-2702', sex: 'betina', breed: 'Garut',  entryWeight: 14.0, currentWeight: 22.4, days: 55, adg: 153, status: 'aktif' },
];

const HEALTH_LOGS = [
  { id: 'h1', date: '2026-04-26', animal: 'D-004', batch: 'B-2604', symptoms: 'Lemas, nafsu makan turun', diagnosis: 'Cacingan', medication: 'Albendazole 5ml', status: 'monitoring' },
  { id: 'h2', date: '2026-04-22', animal: 'D-012', batch: 'B-2604', symptoms: 'Diare cair', diagnosis: 'Enteritis', medication: 'Sulfa-Trim', status: 'sembuh' },
  { id: 'h3', date: '2026-04-15', animal: 'Massal', batch: 'B-2702', symptoms: '—', diagnosis: 'Vaksin SE rutin', medication: 'Vaksin SE', status: 'sembuh' },
];

const FEED_LOGS = [
  { id: 'f1', date: '2026-04-28', batch: 'B-2604', concentrate: 48, forage: 120, leftover: 'sedikit', cost: 312_000 },
  { id: 'f2', date: '2026-04-27', batch: 'B-2604', concentrate: 48, forage: 120, leftover: 'banyak',  cost: 312_000 },
  { id: 'f3', date: '2026-04-27', batch: 'B-2702', concentrate: 36, forage: 95,  leftover: 'sedikit', cost: 234_000 },
  { id: 'f4', date: '2026-04-26', batch: 'B-2604', concentrate: 48, forage: 120, leftover: 'banyak',  cost: 312_000 },
  { id: 'f5', date: '2026-04-26', batch: 'B-2702', concentrate: 36, forage: 95,  leftover: 'habis',   cost: 234_000 },
];

const SALES = [
  { id: 's1', date: '2026-04-15', batch: 'B-2503', buyer: 'Pak Hidayat',     animals: 12, weight: 348.5, revenue: 33_107_500, paid: true },
  { id: 's2', date: '2026-04-08', batch: 'B-2503', buyer: 'Aqiqah Berkah',   animals: 8,  weight: 218.2, revenue: 20_729_000, paid: true },
  { id: 's3', date: '2026-03-22', batch: 'B-2502', buyer: 'Toko Daging Anwar', animals: 15, weight: 412.8, revenue: 39_216_000, paid: true },
];

// ─── BATCH TAB ────────────────────────────────────────────────
function BatchTab({ T, onOpen }) {
  const [filter, setFilter] = useTS('aktif');
  const closedCount = 4;
  return (
    <div style={{ paddingBottom: 120 }}>
      <SubHeader T={T} title="Batch" sub={`${BATCHES.length} aktif · ${closedCount} selesai`} />

      {/* Segmented filter */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: T.surfaceAlt, border: `1px solid ${T.hairline}`,
          borderRadius: 12,
        }}>
          {[{ k: 'aktif', l: 'Berjalan' }, { k: 'panen', l: 'Siap panen' }, { k: 'closed', l: 'Selesai' }].map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 9,
              background: filter === t.k ? T.surface : 'transparent',
              color: filter === t.k ? T.text : T.textDim,
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: filter === t.k ? T.shadow : 'none',
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {BATCHES.map(b => <BatchRowFull key={b.id} T={T} batch={b} onClick={() => onOpen(b)} />)}
      </div>
    </div>
  );
}

function BatchRowFull({ T, batch, onClick }) {
  const days = daysSince(batch.startDate);
  const remaining = Math.max(0, TARGET_DAYS - days);
  return (
    <Pressable onPress={onClick}>
      <div style={{
        background: T.surface, border: `1px solid ${T.hairline}`,
        borderRadius: 20, padding: 18, boxShadow: T.shadow,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: '"Geist", system-ui', fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: -0.3 }}>{batch.code}</div>
            <div style={{ fontSize: 13, color: T.textDim, marginTop: 2 }}>{batch.kandang}</div>
          </div>
          <Pill T={T} tone={remaining <= 14 ? 'warn' : 'accent'}>{remaining <= 14 ? 'Siap panen' : `${days}/${TARGET_DAYS} hari`}</Pill>
        </div>
        <ProgressBar T={T} value={days} max={TARGET_DAYS} tone={remaining <= 14 ? 'warn' : 'accent'} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
          <Mini T={T} label="Ekor" value={batch.active} />
          <Mini T={T} label="Bobot" value={`${batch.avgWeight}`} unit="kg" />
          <Mini T={T} label="ADG" value={batch.adg} unit="g" />
          <Mini T={T} label="Mort." value={`${batch.mortality}/${batch.total}`} />
        </div>
      </div>
    </Pressable>
  );
}

function Mini({ T, label, value, unit }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: '"Geist", system-ui', fontSize: 14, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
        {value}{unit && <span style={{ fontSize: 11, color: T.textDim, fontWeight: 500, marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ─── HEALTH TAB ───────────────────────────────────────────────
function HealthTab({ T }) {
  const sick = HEALTH_LOGS.filter(l => l.status === 'monitoring').length;
  const recovered = HEALTH_LOGS.filter(l => l.status === 'sembuh').length;
  return (
    <div style={{ paddingBottom: 120 }}>
      <SubHeader T={T} title="Kesehatan" sub={`${sick} dalam pemantauan · ${recovered} sembuh`} />

      <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <KPIBox T={T} icon={<I.heart size={16} />} label="Sakit aktif" value={sick} tone="warn" />
        <KPIBox T={T} icon={<I.spark size={16} />} label="Vaksinasi" value="92%" sub="Coverage" tone="ok" />
      </div>

      <SectionHeader T={T} label="Riwayat penanganan" action="+ Catat" />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {HEALTH_LOGS.map(log => (
          <div key={log.id} style={{
            background: T.surface, border: `1px solid ${T.hairline}`,
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: log.status === 'sembuh' ? T.accent.soft : 'oklch(0.78 0.14 70 / 0.14)',
                  color: log.status === 'sembuh' ? T.ok : T.warn,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <I.syringe size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{log.animal} · {log.batch}</div>
                  <div style={{ fontSize: 11, color: T.textMute }}>{log.date}</div>
                </div>
              </div>
              <Pill T={T} tone={log.status === 'sembuh' ? 'ok' : 'warn'}>{log.status}</Pill>
            </div>
            {log.symptoms !== '—' && (
              <div style={{ fontSize: 13, color: T.textDim, marginBottom: 4 }}>
                <span style={{ color: T.textMute, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginRight: 6 }}>Gejala</span>
                {log.symptoms}
              </div>
            )}
            <div style={{ fontSize: 13, color: T.text, marginBottom: 4 }}>
              <span style={{ color: T.textMute, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginRight: 6 }}>Diagnosis</span>
              {log.diagnosis}
            </div>
            <div style={{ fontSize: 13, color: T.accent.base, fontWeight: 500 }}>
              <span style={{ color: T.textMute, fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginRight: 6 }}>Obat</span>
              {log.medication}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPIBox({ T, icon, label, value, sub, tone }) {
  const c = tone === 'ok' ? T.ok : tone === 'warn' ? T.warn : tone === 'danger' ? T.danger : T.text;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.hairline}`,
      borderRadius: 16, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textDim, marginBottom: 8 }}>
        {icon}<span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontFamily: '"Geist", system-ui', fontSize: 22, fontWeight: 600, color: c, letterSpacing: -0.4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── PROFILE TAB ──────────────────────────────────────────────
function ProfileTab({ T }) {
  return (
    <div style={{ paddingBottom: 120 }}>
      <SubHeader T={T} title="Profil" />
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.hairline}`,
          borderRadius: 20, padding: 20,
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Geist", system-ui', fontSize: 22, fontWeight: 600,
          }}>BS</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>Pak Budi Santoso</div>
            <div style={{ fontSize: 13, color: T.textDim }}>Pemilik · Peternakan Berkah</div>
          </div>
        </div>

        <SectionHeader T={T} label="Pengaturan" />
        {[
          { icon: <I.user size={18} />, label: 'Pekerja & peran', sub: '4 pekerja aktif' },
          { icon: <I.map size={18} />, label: 'Kandang', sub: '3 lokasi' },
          { icon: <I.calendar size={18} />, label: 'Template tugas harian', sub: '8 template' },
          { icon: <I.target size={18} />, label: 'Target & ambang', sub: 'ADG, mortalitas, hari panen' },
          { icon: <I.notes size={18} />, label: 'Laporan & ekspor', sub: 'PDF, Excel' },
        ].map((it, i) => (
          <Pressable key={i} onPress={() => {}}>
            <div style={{
              background: T.surface, border: `1px solid ${T.hairline}`,
              borderRadius: 14, padding: 14, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accent.soft, color: T.accent.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{it.label}</div>
                <div style={{ fontSize: 12, color: T.textDim, marginTop: 1 }}>{it.sub}</div>
              </div>
              <I.chevron size={16} style={{ color: T.textMute }} />
            </div>
          </Pressable>
        ))}
      </div>
    </div>
  );
}

function SubHeader({ T, title, sub }) {
  return (
    <div style={{ padding: '68px 20px 20px' }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

window.BatchTab = BatchTab;
window.HealthTab = HealthTab;
window.ProfileTab = ProfileTab;

// ─── TASKS TAB ────────────────────────────────────────────────
function TasksTab({ T, onOpenTask }) {
  const [filter, setFilter] = useTS('today');
  const done = TASKS.filter(t => t.status === 'done').length;
  const total = TASKS.length;
  const pct = Math.round((done / total) * 100);

  const groupedByTime = {
    'Pagi': TASKS.filter(t => parseInt(t.time) < 11),
    'Siang': TASKS.filter(t => { const h = parseInt(t.time); return h >= 11 && h < 15 }),
    'Sore': TASKS.filter(t => parseInt(t.time) >= 15),
  };

  const typeIcon = (type) => ({
    pakan: <I.feed size={16} />,
    timbang: <I.scale size={16} />,
    kesehatan: <I.heart size={16} />,
    bersih: <I.broom size={16} />,
  }[type] || <I.notes size={16} />);

  return (
    <div style={{ paddingBottom: 120 }}>
      <SubHeader T={T} title="Tugas Harian" sub={`${done}/${total} selesai · ${pct}% capaian`} />

      {/* Progress hero */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.hairline}`,
          borderRadius: 20, padding: 20, boxShadow: T.shadow,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim }}>Hari ini · 28 April</div>
              <div style={{ fontFamily: '"Geist", system-ui', fontSize: 32, fontWeight: 600, color: T.text, letterSpacing: -0.6, marginTop: 4 }}>
                {done}<span style={{ color: T.textMute, fontSize: 22 }}>/{total}</span>
              </div>
            </div>
            <Pill T={T} tone={pct >= 80 ? 'ok' : pct >= 50 ? 'accent' : 'warn'}>{pct}%</Pill>
          </div>
          <ProgressBar T={T} value={done} max={total} tone={pct >= 80 ? 'ok' : 'accent'} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
            <Mini T={T} label="Selesai" value={done} />
            <Mini T={T} label="Berjalan" value={TASKS.filter(t => t.status === 'doing').length} />
            <Mini T={T} label="Pending" value={TASKS.filter(t => t.status === 'todo').length} />
          </div>
        </div>
      </div>

      {/* Time grouped tasks */}
      <div style={{ padding: '0 20px' }}>
        {Object.entries(groupedByTime).map(([period, list]) => list.length > 0 && (
          <div key={period} style={{ marginBottom: 22 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 4px 10px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.textMute, textTransform: 'uppercase' }}>{period}</div>
              <div style={{ fontSize: 11, color: T.textMute }}>
                {list.filter(t => t.status === 'done').length}/{list.length}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(task => {
                const isDone = task.status === 'done';
                const isDoing = task.status === 'doing';
                return (
                  <Pressable key={task.id} onPress={onOpenTask}>
                    <div style={{
                      background: T.surface, border: `1px solid ${T.hairline}`,
                      borderRadius: 16, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      opacity: isDone ? 0.65 : 1,
                    }}>
                      <button style={{
                        width: 26, height: 26, borderRadius: 999,
                        border: `1.5px solid ${isDone ? T.accent.base : T.hairlineStrong}`,
                        background: isDone ? T.accent.base : 'transparent',
                        color: T.isDark ? '#0A0E0C' : '#fff',
                        cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }} onClick={(e) => e.stopPropagation()}>
                        {isDone && <I.check size={14} stroke={3} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600, color: T.text,
                          textDecoration: isDone ? 'line-through' : 'none',
                          textDecorationColor: T.textMute,
                        }}>{task.label}</div>
                        <div style={{ fontSize: 12, color: T.textDim, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <I.clock size={11} />{task.time}
                          </span>
                          <span style={{ width: 2, height: 2, borderRadius: 999, background: T.textMute }} />
                          <span>{task.worker}</span>
                        </div>
                      </div>
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: T.accent.soft, color: T.accent.base,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{typeIcon(task.type)}</span>
                      {isDoing && (
                        <span style={{
                          position: 'absolute', top: 12, right: 12,
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                          color: T.warn, textTransform: 'uppercase',
                        }}>● Berjalan</span>
                      )}
                    </div>
                  </Pressable>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FEED TAB ─────────────────────────────────────────────────
function FeedTab({ T }) {
  const [period, setPeriod] = useTS('today');
  const today = FEED_LOGS.filter(l => l.date === '2026-04-28');
  const totalConc = today.reduce((s, l) => s + l.concentrate, 0);
  const totalForage = today.reduce((s, l) => s + l.forage, 0);
  const totalCost = FEED_LOGS.reduce((s, l) => s + l.cost, 0);
  const fcr = 4.2;

  return (
    <div style={{ paddingBottom: 120 }}>
      <SubHeader T={T} title="Pakan" sub="Catat dan pantau konsumsi harian" />

      {/* Today summary */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.hairline}`,
          borderRadius: 20, padding: 18, boxShadow: T.shadow,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim }}>Hari ini · semua batch</div>
            <Pill T={T} tone="ok">FCR {fcr}</Pill>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>Konsentrat</div>
              <div style={{ fontFamily: '"Geist", system-ui', fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: -0.4 }}>
                {totalConc}<span style={{ fontSize: 13, color: T.textDim, fontWeight: 500, marginLeft: 4 }}>kg</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>Hijauan</div>
              <div style={{ fontFamily: '"Geist", system-ui', fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: -0.4 }}>
                {totalForage}<span style={{ fontSize: 13, color: T.textDim, fontWeight: 500, marginLeft: 4 }}>kg</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: T.textDim }}>Total biaya pakan minggu ini</div>
            <div style={{ fontFamily: '"Geist", system-ui', fontSize: 14, fontWeight: 600, color: T.accent.base, fontVariantNumeric: 'tabular-nums' }}>
              Rp {(totalCost / 1_000_000).toFixed(2)}jt
            </div>
          </div>
        </div>
      </div>

      {/* Quick log button */}
      <div style={{ padding: '0 20px 20px' }}>
        <button style={{
          width: '100%', padding: '14px 16px',
          background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
          border: 'none', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
          fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
          boxShadow: `0 4px 14px ${T.accent.base}30`,
        }}>
          <I.plus size={18} stroke={2.5} />
          Catat Pakan
        </button>
      </div>

      <SectionHeader T={T} label="Log Pakan Terbaru" action="Lihat semua" />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FEED_LOGS.map(log => {
          const tone = log.leftover === 'habis' ? T.ok : log.leftover === 'sedikit' ? T.accent.base : T.warn;
          const sisaLabel = log.leftover === 'habis' ? '👍 Habis' : log.leftover === 'sedikit' ? 'Sisa sedikit' : '⚠ Sisa banyak';
          return (
            <div key={log.id} style={{
              background: T.surface, border: `1px solid ${T.hairline}`,
              borderRadius: 14, padding: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: T.accent.soft, color: T.accent.base,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><I.feed size={16} /></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{log.batch}</div>
                    <div style={{ fontSize: 11, color: T.textMute }}>{log.date}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: tone }}>{sisaLabel}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                <Mini T={T} label="Konsentrat" value={log.concentrate} unit="kg" />
                <Mini T={T} label="Hijauan" value={log.forage} unit="kg" />
                <Mini T={T} label="Biaya" value={`Rp${(log.cost / 1000).toFixed(0)}k`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.TasksTab = TasksTab;
window.FeedTab = FeedTab;
