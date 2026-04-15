import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'

// Top 7 FAQs — high-volume search queries, no imports from faqData to keep bundle light
const TOP_FAQS = [
  {
    q: 'Apakah TernakOS gratis?',
    a: 'TernakOS menyediakan paket Starter gratis selamanya. Untuk fitur yang lebih lengkap, tersedia trial gratis paket Pro atau Business tanpa kartu kredit. Selama trial, semua fitur utama tersedia.',
  },
  {
    q: 'Apa perbedaan TernakOS dengan Excel atau buku catatan biasa?',
    a: 'Catatan manual rawan hilang, salah hitung, dan tidak bisa diakses tim secara bersamaan. TernakOS menghitung margin, piutang, FCR, dan laporan keuangan otomatis — langsung dari HP, tanpa rumus manual.',
  },
  {
    q: 'Apakah data bisnis saya aman di TernakOS?',
    a: 'Ya. TernakOS menggunakan Row Level Security (RLS) PostgreSQL — standar keamanan setara perbankan. Data setiap bisnis terisolasi penuh, tidak bisa diakses bisnis lain meskipun menggunakan ekosistem yang sama.',
  },
  {
    q: 'Apakah broker ayam bisa mencatat hutang dan piutang di TernakOS?',
    a: 'Bisa. Setiap transaksi pembelian dari peternak dan penjualan ke RPA otomatis mencatat hutang/piutang. Dashboard menampilkan total piutang per rekanan beserta riwayat pelunasan secara real-time.',
  },
  {
    q: 'Apakah TernakOS bisa dipakai untuk peternak broiler mandiri?',
    a: 'Ya. Modul Peternak Mandiri mendukung recording harian DOC (chick-in), pakan, mortalitas, berat panen, dan otomatis menghitung FCR, IP Score, serta laba/rugi per siklus.',
  },
  {
    q: 'Bisakah lebih dari satu karyawan menggunakan akun yang sama?',
    a: 'TernakOS mendukung multi-user per bisnis dengan kontrol peran (owner, manajer, staff, sopir). Setiap role punya akses berbeda — misalnya sopir hanya bisa lihat jadwal pengiriman, bukan data keuangan.',
  },
  {
    q: 'Berapa harga ayam broiler hidup hari ini?',
    a: 'Harga ayam broiler hidup hari ini diperbarui secara otomatis di TernakOS. Data kami unik karena menggabungkan harga referensi pasar dengan rata-rata transaksi nyata dari ratusan broker aktif di seluruh Indonesia.',
    link: '/harga-pasar',
  },
  {
    q: 'Apa bedanya data harga TernakOS dengan portal harga ayam lain?',
    a: 'Portal lain biasanya hanya menampilkan scraper atau estimasi manual. TernakOS adalah satu-satunya platform yang menampilkan rata-rata harga beli (kandang) dan harga jual (pasar) dari transaksi nyata TernakOS.',
    link: '/harga-pasar',
  },
]

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
            Lihat semua 200+ FAQ
            <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </section>
  )
}
