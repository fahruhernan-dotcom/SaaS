import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, Download, QrCode, AlertCircle } from 'lucide-react'
import QRCode from 'qrcode'

// ─── Constants ──────────────────────────────────────────────────────────────
// Future presets (e.g. 6cm, 10cm) can be added here.
const DEFAULT_LABEL_SIZE_CM = 8
// QR canvas target size in pixels for display (~5cm at 96dpi → ~188px)
const QR_CANVAS_PX = 220

// ─── QR content format — must stay compatible with QRScannerModal ───────────
// URL format: any scanner opens browser → ScanRedirect → correct animal page
// QRScannerModal also supports ?animalId= URL parsing natively.
function buildQRContent(animalId) {
  return `https://ternakos.my.id/scan?animalId=${animalId}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function sexLabel(sex) {
  if (sex === 'betina') return 'Betina'
  if (sex === 'jantan') return 'Jantan'
  return sex || '—'
}

// ─── Print styles injected once ──────────────────────────────────────────────
const PRINT_STYLE_ID = 'ternakos-qr-print-style'

function injectPrintStyle(labelSizeCm) {
  if (document.getElementById(PRINT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PRINT_STYLE_ID
  style.textContent = `
    @media print {
      /* Hide everything */
      body > * { visibility: hidden !important; }
      /* Reveal only the print area */
      #qr-print-area,
      #qr-print-area * { visibility: visible !important; }
      /* Position print area to fill the page */
      #qr-print-area {
        position: fixed !important;
        inset: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #ffffff !important;
      }
    }
    @page {
      size: ${labelSizeCm}cm ${labelSizeCm}cm;
      margin: 0;
    }
  `
  document.head.appendChild(style)
}

function removePrintStyle() {
  document.getElementById(PRINT_STYLE_ID)?.remove()
}

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * AnimalQRSheet
 *
 * Props:
 *   animal  — animal object (must have: id, ear_tag; optional: breed, sex, entry_date, entry_weight_kg)
 *   onClose — fn
 */
export function AnimalQRSheet({ animal, onClose }) {
  const canvasRef = useRef(null)
  const [qrError, setQrError] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const qrContent = buildQRContent(animal.id)

  // Generate QR onto canvas + data URL for download
  useEffect(() => {
    if (!canvasRef.current) return
    let cancelled = false

    QRCode.toCanvas(canvasRef.current, qrContent, {
      width: QR_CANVAS_PX,
      margin: 3,           // ISOP/IEC quiet zone minimum = 4 modules; margin:3 is safe for most scanners
      color: {
        dark:  '#000000',  // Black QR on white — required for scan reliability
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then(() => {
        if (cancelled) return
        setQrError(null)
        // Build data URL for optional download
        const url = canvasRef.current?.toDataURL('image/png')
        if (url) setDownloadUrl(url)
      })
      .catch((err) => {
        if (!cancelled) setQrError(err?.message || 'Gagal generate QR')
      })

    return () => { cancelled = true }
  }, [qrContent])

  // Inject print CSS when sheet mounts; clean up on unmount
  useEffect(() => {
    injectPrintStyle(DEFAULT_LABEL_SIZE_CM)
    return () => removePrintStyle()
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `qr-${animal.ear_tag || animal.id}.png`
    a.click()
  }, [downloadUrl, animal.ear_tag, animal.id])

  // Formatted display fields
  const entryDateStr = formatDate(animal.entry_date)

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="qr-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[4500]"
      />

      {/* Sheet */}
      <motion.div
        key="qr-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-[4600] bg-[#0A1015] border-t border-white/[0.08] rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.6)] flex flex-col"
        style={{ maxHeight: '100dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <QrCode size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-[13px] font-black text-white font-['Sora']">Cetak QR Name Tag</p>
              <p className="text-[10px] text-[#4B6478] font-bold">{animal.ear_tag}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* ── Print Area ── */}
          {/* id="qr-print-area" is the hook for print CSS; keep it */}
          <div
            id="qr-print-area"
            style={{
              width: `${DEFAULT_LABEL_SIZE_CM}cm`,
              minHeight: `${DEFAULT_LABEL_SIZE_CM}cm`,
            }}
            className="mx-auto bg-white rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-start p-3 shadow-[0_0_40px_rgba(0,0,0,0.5)] print:shadow-none print:rounded-none print:border-none"
          >
            {/* ── Ear tag label — printed prominently ABOVE the QR ── */}
            <div className="w-full text-center mb-2 pt-1">
              <p
                className="font-['Sora'] font-black text-black leading-tight print:text-black"
                style={{ fontSize: '1.15rem' }}
              >
                {animal.ear_tag}
              </p>
              {(animal.breed || animal.sex) && (
                <p
                  className="text-black/60 font-bold mt-0.5 print:text-black"
                  style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  {[animal.breed, sexLabel(animal.sex)].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* ── QR Canvas ── */}
            {qrError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <AlertCircle size={24} className="text-red-400" />
                <p className="text-[11px] text-red-400 font-bold text-center">{qrError}</p>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={QR_CANVAS_PX}
                height={QR_CANVAS_PX}
                className="block"
                style={{
                  width: '100%',
                  maxWidth: `${QR_CANVAS_PX}px`,
                  height: 'auto',
                  imageRendering: 'pixelated',
                }}
                aria-label={`QR code untuk hewan ${animal.ear_tag}`}
              />
            )}

            {/* ── Info below QR ── */}
            <div className="w-full mt-2 pb-1 space-y-0.5 text-center">
              {entryDateStr && (
                <p
                  className="text-black/50 font-medium print:text-black"
                  style={{ fontSize: '0.6rem' }}
                >
                  Masuk: {entryDateStr}
                </p>
              )}
              {/* TernakOS branding — below QR, not inside it */}
              <p
                className="font-['Sora'] font-black text-black/30 print:text-black/40"
                style={{ fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                TernakOS
              </p>
            </div>
          </div>

          {/* QR content hint for dev/QA */}
          <p className="text-center text-[9px] text-[#4B6478]/60 mt-3 font-mono select-all">
            {qrContent}
          </p>

          {/* Label size indicator */}
          <p className="text-center text-[10px] text-[#4B6478] mt-1 font-bold">
            Label {DEFAULT_LABEL_SIZE_CM}×{DEFAULT_LABEL_SIZE_CM} cm
          </p>
        </div>

        {/* ── Action buttons ── */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-3 shrink-0 bg-[#0C1319]">
          {/* Unduh PNG — only shown when data URL is ready */}
          {downloadUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 h-12 rounded-2xl bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
            >
              <Download size={14} />
              PNG
            </button>
          )}

          {/* Cetak */}
          <button
            onClick={handlePrint}
            disabled={!!qrError}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
          >
            <Printer size={16} />
            Cetak Name Tag
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
