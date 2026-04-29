// Detail / overlay screens — Tasks list, Batch detail, Alerts, Quick add sheet

const { useState: useSx } = React;

// ─── Task list overlay ────────────────────────────────────────
function TaskScreen({ T, onBack }) {
  return (
    <Overlay T={T} title="Tugas hari ini" onBack={onBack}>
      <div style={{ padding: '8px 20px 100px' }}>
        {TASKS.map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 0',
            borderBottom: i < TASKS.length - 1 ? `1px solid ${T.hairline}` : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 999, flexShrink: 0,
              background: t.status === 'done' ? T.accent.base
                : t.status === 'doing' ? T.warn
                : 'transparent',
              border: t.status === 'pending' ? `1.5px solid ${T.hairlineStrong}` : 'none',
              color: t.status === 'done' ? (T.isDark ? '#0A0E0C' : '#fff') : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {t.status === 'done' && <I.check size={14} stroke={3} />}
              {t.status === 'doing' && <div style={{ width: 8, height: 8, borderRadius: 999, background: '#fff' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
                {t.time} · {t.worker}{t.note ? ` · ${t.note}` : ''}
              </div>
            </div>
            <I.chevron size={16} style={{ color: T.textMute }} />
          </div>
        ))}
      </div>
    </Overlay>
  );
}

// ─── Alerts list overlay ──────────────────────────────────────
function AlertsScreen({ T, onBack }) {
  return (
    <Overlay T={T} title="Perlu perhatian" onBack={onBack}>
      <div style={{ padding: '12px 20px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ALERTS.map(a => <AlertRowFull key={a.id} T={T} alert={a} />)}
        <div style={{
          marginTop: 24,
          padding: 24, borderRadius: 20,
          background: T.surface, border: `1px dashed ${T.hairlineStrong}`,
          textAlign: 'center', color: T.textDim, fontSize: 13,
        }}>
          Riwayat 7 hari sebelumnya tidak ada peringatan.
        </div>
      </div>
    </Overlay>
  );
}

function AlertRowFull({ T, alert }) {
  const isDanger = alert.level === 'danger';
  return (
    <div style={{
      padding: 16,
      background: T.surface,
      border: `1px solid ${T.hairline}`,
      borderLeft: `3px solid ${isDanger ? T.danger : T.warn}`,
      borderRadius: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: isDanger ? T.danger : T.warn, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {isDanger ? 'Kritis' : 'Pantau'}
        </span>
        <span style={{ fontSize: 12, color: T.textMute }}>{alert.at}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>
        {alert.batch} · {alert.title}
      </div>
      <div style={{ fontSize: 13, color: T.textDim, marginTop: 4, lineHeight: 1.5 }}>{alert.body}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button style={{
          flex: 1, padding: '8px 12px', borderRadius: 10,
          background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Tindak lanjut</button>
        <button style={{
          padding: '8px 14px', borderRadius: 10,
          background: 'transparent', color: T.textDim,
          border: `1px solid ${T.hairlineStrong}`,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Tunda</button>
      </div>
    </div>
  );
}

// ─── Batch detail overlay ─────────────────────────────────────
function BatchDetail({ T, batch, onBack }) {
  if (!batch) return null;
  const days = daysSince(batch.startDate);
  const remaining = Math.max(0, TARGET_DAYS - days);
  const projectedRevenue = batch.active * batch.avgWeight * batch.nextSalePrice;
  const projectedCost = batch.feedCost + batch.opCost + batch.purchaseCost;
  const projectedProfit = projectedRevenue - projectedCost;

  // Synthetic weight history
  const history = Array.from({ length: 12 }, (_, i) => {
    const d = i / 11;
    return batch.avgEntryWeight + (batch.avgWeight - batch.avgEntryWeight) * d + (Math.sin(i * 1.2) * 0.4);
  });

  return (
    <Overlay T={T} title={batch.code} subtitle={batch.kandang} onBack={onBack}>
      <div style={{ padding: '8px 20px 100px' }}>
        {/* Hero */}
        <Card T={T} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <BigNumber T={T} value={batch.active} unit="ekor aktif" sub={`${batch.total - batch.active} keluar dari batch awal ${batch.total}`} />
            <Pill T={T} tone={remaining <= 14 ? 'warn' : 'accent'}>
              {remaining <= 14 ? 'Siap panen' : `Hari ${days}/${TARGET_DAYS}`}
            </Pill>
          </div>
          <ProgressBar T={T} value={days} max={TARGET_DAYS} tone={remaining <= 14 ? 'warn' : 'accent'} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: T.textDim }}>
            <span>Mulai {fmtDate(new Date(batch.startDate))}</span>
            <span>Target panen {fmtDate(new Date(new Date(batch.startDate).getTime() + TARGET_DAYS * 86400000))}</span>
          </div>
        </Card>

        {/* Growth chart */}
        <Card T={T} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>Bobot rata-rata</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: '"Geist", system-ui', fontSize: 32, fontWeight: 600, color: T.text, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{batch.avgWeight}</span>
                <span style={{ fontSize: 14, color: T.textDim, fontWeight: 500 }}>kg</span>
                <Pill T={T} tone="ok" size="sm">+{(batch.avgWeight - batch.avgEntryWeight).toFixed(1)} kg sejak masuk</Pill>
              </div>
            </div>
          </div>
          <div style={{ marginLeft: -8, marginRight: -8 }}>
            <BigChart T={T} data={history} accent={T.accent.base} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: T.textMute, paddingLeft: 4, paddingRight: 4 }}>
            <span>Hari 0</span><span>30</span><span>60</span><span>{days}</span>
          </div>
        </Card>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <StatCard T={T} icon={<I.trend size={16} />} label="ADG hari" value={`${batch.adg}g`} tone={batch.adg >= 150 ? 'ok' : 'warn'} />
          <StatCard T={T} icon={<I.heart size={16} />} label="Mortalitas" value={`${batch.mortality}/${batch.total}`} tone={batch.mortality > 0 ? 'warn' : 'ok'} />
          <StatCard T={T} icon={<I.feed size={16} />} label="FCR estimasi" value="4.2" />
          <StatCard T={T} icon={<I.calendar size={16} />} label="Sisa hari" value={remaining} unit="hari" />
        </div>

        {/* Finance */}
        <SectionHeader T={T} label="Proyeksi keuangan" />
        <Card T={T} style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14, columnGap: 16 }}>
            <FinanceLine T={T} label="Pembelian bibit" value={batch.purchaseCost} />
            <FinanceLine T={T} label="Pakan ke hari ini" value={batch.feedCost} />
            <FinanceLine T={T} label="Operasional" value={batch.opCost} />
            <FinanceLine T={T} label="Total biaya" value={projectedCost} bold />
            <div style={{ gridColumn: '1 / -1', height: 1, background: T.hairline }} />
            <FinanceLine T={T} label="Proyeksi pendapatan" value={projectedRevenue} />
            <FinanceLine T={T} label="Estimasi laba" value={projectedProfit} bold tone={projectedProfit > 0 ? 'ok' : 'danger'} />
          </div>
        </Card>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button style={{
            padding: '14px', borderRadius: 14,
            background: T.accent.base, color: T.isDark ? '#0A0E0C' : '#fff',
            border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}><I.scale size={16} stroke={2} /> Timbang batch ini</button>
          <button style={{
            padding: '14px', borderRadius: 14,
            background: T.surface, color: T.text,
            border: `1px solid ${T.hairlineStrong}`,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}><I.list size={16} stroke={2} /> Lihat ternak</button>
        </div>
      </div>
    </Overlay>
  );
}

function StatCard({ T, icon, label, value, unit, tone }) {
  const toneColor = tone === 'ok' ? T.ok : tone === 'warn' ? T.warn : tone === 'danger' ? T.danger : T.text;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.hairline}`,
      borderRadius: 16, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: T.textDim }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: '"Geist", system-ui', fontSize: 24, fontWeight: 600,
          color: toneColor, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: T.textDim, fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  );
}

function FinanceLine({ T, label, value, bold, tone }) {
  const color = tone === 'ok' ? T.ok : tone === 'danger' ? T.danger : T.text;
  return (
    <div>
      <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{
        fontFamily: '"Geist", system-ui',
        fontSize: bold ? 17 : 15, fontWeight: 600,
        color, letterSpacing: -0.2, fontVariantNumeric: 'tabular-nums',
      }}>{fmtRp(value)}</div>
    </div>
  );
}

function BigChart({ T, data, accent }) {
  const w = 320, h = 140, pad = 12;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const area = `${d} L${pts.at(-1)[0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* Gridlines */}
      {[0, 0.5, 1].map((p, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)} stroke={T.hairline} strokeWidth="1" />
      ))}
      <defs>
        <linearGradient id="bcg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.25" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#bcg)" />
      <path d={d} stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => i === pts.length - 1 && (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill={accent} fillOpacity="0.15" />
          <circle cx={x} cy={y} r="3" fill={accent} />
        </g>
      ))}
    </svg>
  );
}

// ─── Quick add bottom sheet ────────────────────────────────────
function QuickAddSheet({ T, open, onClose }) {
  const [closing, setClosing] = useSx(false);
  const handleClose = () => { setClosing(true); setTimeout(() => { setClosing(false); onClose(); }, 200); };
  if (!open) return null;
  const items = [
    { icon: <I.scale size={20} />,   label: 'Timbang ternak',    sub: 'Catat bobot per ekor' },
    { icon: <I.feed size={20} />,    label: 'Log pakan',         sub: 'Pemberian + sisa' },
    { icon: <I.heart size={20} />,   label: 'Catat kesehatan',   sub: 'Vaksin · obat · gejala' },
    { icon: <I.broom size={20} />,   label: 'Bersih kandang',    sub: 'Tandai selesai' },
    { icon: <I.notes size={20} />,   label: 'Catatan harian',    sub: 'Bebas teks · foto' },
    { icon: <I.plus size={20} />,    label: 'Batch baru',        sub: 'Mulai siklus baru' },
  ];
  return (
    <div onClick={handleClose} style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      animation: closing ? 'fadeOut 200ms forwards' : 'fadeIn 200ms forwards',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        background: T.surface,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingBottom: 32,
        animation: closing ? 'slideDown 200ms forwards' : 'slideUp 240ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: T.hairlineStrong,
          margin: '10px auto 18px',
        }} />
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: -0.3 }}>Catat aktivitas</div>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 2 }}>Pilih jenis kegiatan untuk dicatat</div>
        </div>
        <div style={{ padding: '0 12px' }}>
          {items.map((it, i) => (
            <Pressable key={i} onPress={handleClose}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 8px', borderRadius: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: T.accent.soft, color: T.accent.base,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{it.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{it.label}</div>
                  <div style={{ fontSize: 12, color: T.textDim, marginTop: 1 }}>{it.sub}</div>
                </div>
                <I.chevron size={16} style={{ color: T.textMute }} />
              </div>
            </Pressable>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Overlay shell ────────────────────────────────────────────
function Overlay({ T, title, subtitle, onBack, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: T.bg,
      animation: 'slideInRight 260ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards',
      overflowY: 'auto',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '68px 16px 12px',
        position: 'sticky', top: 0, zIndex: 1,
        background: T.bg,
        borderBottom: `1px solid ${T.hairline}`,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 999,
          background: T.surface, border: `1px solid ${T.hairline}`,
          color: T.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <I.chevron size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.textDim }}>{subtitle}</div>}
        </div>
      </header>
      {children}
    </div>
  );
}

window.TaskScreen = TaskScreen;
window.AlertsScreen = AlertsScreen;
window.BatchDetail = BatchDetail;
window.QuickAddSheet = QuickAddSheet;
