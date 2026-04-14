import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, X, ChevronLeft } from 'lucide-react'
import { FAQ_DATA, FAQ_CATEGORIES, getAllFAQForSchema } from '../lib/faqData'
import Footer from '../components/Footer'

// ── FAQ Accordion Item ─────────────────────────────────────────────────────────
function FAQItem({ item, accentColor = 'emerald' }) {
  const [open, setOpen] = useState(false)

  const borderColor = accentColor === 'amber'
    ? 'border-amber-500/20 hover:border-amber-500/40'
    : 'border-emerald-500/10 hover:border-emerald-500/25'
  const iconColor = accentColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div
      className={`border rounded-xl transition-colors duration-200 overflow-hidden ${open ? 'border-white/10 bg-white/[0.03]' : `${borderColor} bg-transparent`}`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-start justify-between gap-4 px-5 py-4 group"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[#CBD5E1] leading-snug group-hover:text-white transition-colors">
          {item.q}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 mt-0.5 transition-transform duration-200 ${iconColor} ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-4 text-sm text-[#64748B] leading-relaxed">
              {item.a}
              {item.link && (
                <Link
                  to={item.link}
                  className={`ml-2 text-xs font-semibold ${accentColor === 'amber' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'} transition-colors`}
                >
                  Pelajari lebih →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Category accent map ────────────────────────────────────────────────────────
const ACCENT = {
  umum: 'emerald',
  broker_ayam: 'emerald',
  sembako: 'amber',
  peternak: 'emerald',
  teknis: 'emerald',
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FAQPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const sectionRefs = useRef({})

  // Inject JSON-LD FAQ schema
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: getAllFAQForSchema(),
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'faq-schema'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => {
      const el = document.getElementById('faq-schema')
      if (el) el.remove()
    }
  }, [])

  // Page title
  useEffect(() => {
    document.title = 'FAQ & Help Center - TernakOS'
    return () => { document.title = 'TernakOS' }
  }, [])

  // Filtered results across all categories
  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed
    ? FAQ_CATEGORIES.flatMap(cat => {
      const items = (FAQ_DATA[cat.id] || []).filter(
        item =>
          item.q.toLowerCase().includes(trimmed) ||
          item.a.toLowerCase().includes(trimmed)
      )
      return items.length ? [{ ...cat, items }] : []
    })
    : FAQ_CATEGORIES.map(cat => ({ ...cat, items: FAQ_DATA[cat.id] || [] }))

  const totalVisible = filtered.reduce((n, c) => n + c.items.length, 0)

  function scrollTo(id) {
    setActiveCategory(id)
    const el = sectionRefs.current[id]
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30">

      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-[#0C1319]/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/favicon.svg" alt="TernakOS" className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" />
            <span className="font-display font-black text-lg tracking-tight">TernakOS</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-white transition-colors"
          >
            <ChevronLeft size={15} />
            Beranda
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-16 pb-12 px-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-4">
              Pusat Bantuan & FAQ
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">
              Pertanyaan yang <span className="text-emerald-400">Sering Ditanya</span>
            </h1>
            <p className="text-[#4B6478] text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
              {totalVisible} pertanyaan tersedia — temukan jawaban seputar fitur, keamanan, harga, dan cara kerja TernakOS.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari pertanyaan... (misal: FIFO, FCR, RLS)"
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B6478] hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Category Nav Pills ── */}
      {!trimmed && (
        <nav className="sticky top-16 z-40 bg-[#06090F]/90 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none">
            {FAQ_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeCategory === cat.id
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/[0.03] text-[#64748B] hover:text-white hover:border-white/20'
                  }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-60">({cat.count})</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-16">

        {/* Search result header */}
        {trimmed && (
          <div className="text-sm text-[#4B6478]">
            <span className="text-white font-semibold">{totalVisible}</span> hasil untuk{' '}
            <span className="text-emerald-400">"{query}"</span>
          </div>
        )}

        {totalVisible === 0 && (
          <div className="text-center py-20 text-[#4B6478]">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-semibold text-white mb-2">Tidak ada hasil ditemukan</p>
            <p className="text-sm">Coba kata kunci lain, atau{' '}
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                tanya langsung via WhatsApp
              </a>.
            </p>
          </div>
        )}

        {filtered.map(cat => (
          <section
            key={cat.id}
            ref={el => { sectionRefs.current[cat.id] = el }}
            id={`faq-${cat.id}`}
          >
            {/* Category heading */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{cat.emoji}</span>
              <div>
                <h2 className="font-display text-lg font-bold text-white leading-none">
                  {cat.label}
                </h2>
                <p className="text-xs text-[#4B6478] mt-0.5">{cat.items.length} pertanyaan</p>
              </div>
            </div>

            <div className="space-y-2">
              {cat.items.map((item, i) => (
                <FAQItem key={i} item={item} accentColor={ACCENT[cat.id]} />
              ))}
            </div>
          </section>
        ))}

        {/* CTA bottom */}
        {!trimmed && (
          <div className="text-center border-t border-white/5 pt-14">
            <p className="text-[#4B6478] text-sm mb-4">
              Tidak menemukan jawaban yang kamu cari?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
              >
                💬 Hubungi Support via WhatsApp
              </a>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                Coba Gratis 14 Hari →
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
