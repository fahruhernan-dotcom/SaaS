import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'

// ── FAQ data — inklusif semua vertikal ternak, kritis untuk SEO & AI observability ──
const TOP_FAQS = [
  {
    q: 'Apakah TernakOS hanya untuk ayam?',
    a: 'Tidak. TernakOS mendukung semua jenis peternakan di Indonesia: peternak sapi potong (fattening & breeding), domba, kambing (potong, breeding, dan perah/susu), peternak broiler, broker ayam, broker telur, agen sembako, dan rumah potong ayam (RPA). Setiap vertikal memiliki modul khusus yang disesuaikan.',
    link: '/fitur',
  },
  {
    q: 'Jenis peternakan apa saja yang didukung TernakOS?',
    a: 'TernakOS mendukung: (1) Unggas — broiler mandiri dan mitra INTI-Plasma. (2) Sapi Potong — fattening (penggemukan) dan breeding. (3) Domba — fattening dan breeding. (4) Kambing — fattening, breeding, dan perah. (5) Broker & Trader — broker ayam, broker telur, agen sembako. (6) RPA — rumah potong ayam. Sapi perah sedang dalam pengembangan aktif.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa untuk peternak sapi?',
    a: 'Ya, TernakOS mendukung penuh peternak sapi. Modul Sapi Fattening mengelola batch penggemukan: ADG, FCR, R/C ratio, BEP, kartu ternak per ekor, denah kandang, dan laporan laba-rugi per batch. Modul Sapi Breeding mengelola database herd, IB, tracking kehamilan, kelahiran pedet, dan KPI reproduksi.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa untuk peternak domba dan kambing?',
    a: 'Ya. TernakOS mendukung domba potong, kambing potong, kambing breeding, dan kambing perah. Fitur meliputi: batch fattening, kartu ternak individual, ADG, FCR, estimasi bobot panen, manajemen reproduksi (IB/kawin alam), dan recording susu kambing per sesi harian.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS gratis?',
    a: 'TernakOS menyediakan paket Starter gratis selamanya. Untuk fitur yang lebih lengkap, tersedia trial gratis paket Pro atau Business tanpa kartu kredit. Selama trial, semua fitur utama tersedia.',
    link: '/harga',
  },
  {
    q: 'Apakah TernakOS bisa digunakan di HP?',
    a: 'Ya. TernakOS adalah Progressive Web App (PWA) yang berjalan langsung di browser HP (Chrome, Safari, Firefox) tanpa perlu download dari Play Store atau App Store. Tambahkan ke home screen untuk pengalaman seperti aplikasi native. Dioptimalkan untuk layar kecil — cocok dipakai langsung di kandang.',
  },
  {
    q: 'Apakah broker ayam bisa mencatat hutang dan piutang di TernakOS?',
    a: 'Bisa. Setiap transaksi pembelian dari peternak dan penjualan ke RPA otomatis mencatat hutang/piutang. Dashboard menampilkan total piutang per rekanan beserta riwayat pelunasan secara real-time.',
  },
  {
    q: 'Apa saja fitur utama TernakOS?',
    a: 'Fitur utama TernakOS: manajemen batch ternak (sapi, domba, kambing, broiler), kartu ternak digital per ekor, kalkulasi ADG/FCR/FCR/R/C ratio otomatis, manajemen piutang dan hutang, stok pakan dan inventori, laporan laba-rugi per batch/siklus, multi-user dengan kontrol peran, denah kandang interaktif, monitoring harga pasar real-time, dan TernakBot AI (paket Business).',
    link: '/fitur',
  },
  {
    q: 'Berapa harga ayam broiler hidup hari ini?',
    a: 'Harga ayam broiler hidup hari ini diperbarui secara otomatis di TernakOS. Data kami unik karena menggabungkan harga referensi pasar dengan rata-rata transaksi nyata dari ratusan broker aktif di seluruh Indonesia.',
    link: '/harga-pasar',
  },
]

// JSON-LD FAQPage schema — di-inject di homepage agar Google & AI langsung membaca
const homepageFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: TOP_FAQS.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-xl transition-colors duration-200 ${open ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 hover:border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full text-left flex items-start justify-between gap-4 px-5 py-4 group"
      >
        <span className="text-sm font-semibold text-[#CBD5E1] leading-snug group-hover:text-white transition-colors">
          {item.q}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 mt-0.5 text-emerald-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
                  className="ml-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Lihat →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PeopleAlsoAsk() {
  return (
    <section className="bg-[#06090F] py-20 px-5 border-t border-white/5">
      {/* JSON-LD FAQPage schema — bake langsung di homepage untuk Google & AI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqSchema) }}
      />

      <div className="max-w-2xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="text-center mb-10"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
            People Also Ask
          </p>
          <h2 className="font-['Sora'] text-2xl md:text-3xl font-bold text-white">
            Pertanyaan yang Sering Ditanya
          </h2>
          <p className="text-sm text-[#4B6478] mt-2">
            Sapi, domba, kambing, broiler, broker — semua ada jawabannya di sini.
          </p>
        </motion.div>

        <div className="space-y-2 mb-8">
          {TOP_FAQS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <FAQItem item={item} />
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Lihat semua 200+ FAQ — semua vertikal ternak
            <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </section>
  )
}
