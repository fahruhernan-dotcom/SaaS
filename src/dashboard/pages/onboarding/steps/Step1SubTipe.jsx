import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, X, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../../../lib/supabase'
import { RoleCard, primaryBtnStyle, backBtnStyle } from '../shared'

// ─── Card data ────────────────────────────────────────────────────────────────

const BROKER_CARDS = [
  { key: 'broker_ayam',        icon: '🐔', title: 'Broker Ayam',       desc: 'Beli ayam dari kandang, jual ke RPA atau pasar.',         pricing: 'mulai Rp 999rb/bln' },
  { key: 'broker_telur',       icon: '🥚', title: 'Broker Telur',      desc: 'Kelola stok telur, penjualan, dan piutang customer.',      pricing: 'mulai Rp 999rb/bln' },
  { key: 'distributor_daging', icon: '🚛', title: 'Distributor Daging', desc: 'Distribusi daging ke retailer, restoran, dan modern trade.', pricing: 'mulai Rp 999rb/bln' },
  { key: 'broker_sapi',        icon: '🐄', title: 'Broker Sapi',        desc: 'Segera hadir untuk manajemen ternak potong.',              disabled: true },
  { key: 'distributor_sembako', icon: '🛒', title: 'Broker Sembako',     desc: 'Distribusi bahan pokok dan komoditas pangan.',             pricing: 'mulai Rp 999rb/bln' },
]

const HEWAN_CARDS = [
  { key: 'ayam',   icon: '🐔', title: 'Ayam',   desc: 'Broiler, layer, atau kampung.' },
  { key: 'sapi',   icon: '🐄', title: 'Sapi',   desc: 'Sapi potong atau sapi perah.',      disabled: true },
  { key: 'kambing',icon: '🐐', title: 'Kambing',desc: 'Kambing potong dan penggemukan.',   disabled: true },
  { key: 'domba',  icon: '🐑', title: 'Domba',  desc: 'Domba garut dan domba pedaging.',   disabled: true },
  { key: 'babi',   icon: '🐷', title: 'Babi',   desc: 'Manajemen siklus dan pakan babi.',  disabled: true },
]

const AYAM_CARDS = [
  { key: 'peternak_broiler', icon: '🐔', title: 'Ayam Broiler', desc: 'Pemeliharaan pedaging. Pantau FCR, deplesi, dan IP Score.', pricing: 'mulai Rp 499rb/bln' },
  { key: 'peternak_layer',   icon: '🥚', title: 'Ayam Layer',   desc: 'Petelur produksi. Kelola produksi telur dan biaya pakan.',  pricing: 'mulai Rp 499rb/bln' },
  { key: 'peternak_kampung', icon: '🌿', title: 'Ayam Kampung', desc: 'Ayam kampung & pejantan.',                                  disabled: true },
]

const RPA_CARDS = [
  { key: 'rpa_ayam', icon: '🏭', title: 'RPA Ayam',              desc: 'Kelola order, hutang ke peternak, dan distribusi.',       pricing: 'mulai Rp 699rb/bln' },
  { key: 'rph',      icon: '🏬', title: 'RPH — Ternak Ruminansia', desc: 'Rumah potong hewan ruminansia. Segera hadir.', disabled: true },
]

const HEADING = {
  broker:   'Kamu broker jenis apa?',
  peternak: 'Kamu pelihara hewan apa?',
  rpa:      'Tipe bisnis RPA kamu?',
}

const slideIn  = { opacity: 0, x: 20 }
const slideOut = { opacity: 0, x: -20 }
const center   = { opacity: 1, x: 0 }

// ─── Waitlist Sheet ───────────────────────────────────────────────────────────

function WaitlistSheet({ card, onClose }) {
  const [email, setEmail] = useState('')
  const [name, setName]   = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setSending(true)
    try {
      await supabase.from('waitlist_signups').insert({ email, name: name || null, interest: card.title })
    } catch (_) { /* non-blocking */ }
    finally { setSending(false) }
    toast.success(`Kamu masuk daftar tunggu ${card.title}! Kami kabari segera. 🎉`)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ background: '#111C24', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '480px', padding: '24px 20px 32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9', fontFamily: 'Sora' }}>
              {card.icon} {card.title}
            </div>
            <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>Daftar waitlist — kami kabari saat siap</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#94A3B8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="waitlist-email" style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', display: 'block' }}>Email *</label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@kamu.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#F1F5F9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label htmlFor="waitlist-name" style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', display: 'block' }}>Nama (opsional)</label>
            <input
              id="waitlist-name"
              name="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama kamu"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#F1F5F9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !email}
            style={{ ...primaryBtnStyle, marginTop: '4px', opacity: (!email || sending) ? 0.5 : 1, cursor: (!email || sending) ? 'not-allowed' : 'pointer' }}
          >
            <Mail size={16} />
            {sending ? 'Mendaftar...' : 'Daftar Waitlist'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Step1SubTipe({ tipe, onNext, onBack }) {
  const [selectedSubType, setSelectedSubType] = useState(null)
  const [hewan, setHewan]                     = useState(null)
  const [waitlistCard, setWaitlistCard]        = useState(null)

  const handleCardClick = (card) => {
    if (card.disabled) {
      setWaitlistCard(card)
      return
    }
    if (tipe === 'peternak' && !hewan) {
      // Level 1 → select hewan
      setHewan(card.key)
      setSelectedSubType(null)
    } else {
      setSelectedSubType(card.key)
    }
  }

  const handleNext = () => {
    if (!selectedSubType) return
    onNext({ sub_type: selectedSubType })
  }

  // Peternak 2-level heading
  const heading = tipe === 'peternak' && hewan === 'ayam'
    ? 'Pilih jenis ayam kamu'
    : HEADING[tipe] || HEADING.broker

  // Cards to render
  const cards = tipe === 'broker'
    ? BROKER_CARDS
    : tipe === 'rpa'
      ? RPA_CARDS
      : hewan === 'ayam'
        ? AYAM_CARDS
        : HEWAN_CARDS

  // Which item is "selected" for highlight
  const activeKey = tipe === 'peternak' && !hewan ? null : selectedSubType

  // Animation key changes when level changes
  const panelKey = tipe === 'peternak' ? (hewan ?? 'level1') : tipe

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.h1
            key={heading}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}
          >
            {heading}
          </motion.h1>
        </AnimatePresence>
        <p style={{ fontSize: '14px', fontFamily: 'DM Sans', color: '#4B6478' }}>
          Pilih yang paling sesuai dengan bisnismu.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={panelKey}
          initial={slideIn}
          animate={center}
          exit={slideOut}
          transition={{ duration: 0.22 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
        >
          {cards.map((card) => (
            <RoleCard
              key={card.key}
              icon={card.icon}
              title={card.title}
              desc={card.desc}
              pricing={card.pricing}
              disabled={card.disabled}
              selected={activeKey === card.key}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Back to Level 1 (peternak only) */}
      {tipe === 'peternak' && hewan && (
        <button
          type="button"
          onClick={() => { setHewan(null); setSelectedSubType(null) }}
          style={{ ...backBtnStyle, alignSelf: 'flex-start' }}
        >
          <ChevronLeft size={16} /> Ganti hewan
        </button>
      )}

      {selectedSubType && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleNext}
          style={primaryBtnStyle}
        >
          Lanjut <ArrowRight size={18} />
        </motion.button>
      )}

      <button onClick={onBack} style={backBtnStyle}>
        <ChevronLeft size={16} /> Kembali
      </button>

      <AnimatePresence>
        {waitlistCard && (
          <WaitlistSheet card={waitlistCard} onClose={() => setWaitlistCard(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
