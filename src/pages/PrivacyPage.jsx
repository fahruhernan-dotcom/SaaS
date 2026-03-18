import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30">
      {/* Navbar Area */}
      <header className="border-b border-white/5 bg-[#0C1319]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              🐔
            </div>
            <span className="font-display font-black text-xl tracking-tight">TernakOS</span>
          </Link>
          <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            <ChevronLeft size={16} />
            Kembali ke Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none">
              Kebijakan <span className="text-emerald-500">Privasi</span>
            </h1>
            <p className="text-[#4B6478] text-lg max-w-2xl leading-relaxed">
              Privasi Anda adalah prioritas kami. Kami berkomitmen untuk melindungi data bisnis Anda dengan standar keamanan terkini.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <main className="py-16 md:py-24 max-w-4xl mx-auto px-6">
        <div className="prose prose-invert prose-emerald max-w-none space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">01.</span> Data yang Dikumpulkan
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                Produk kami mengumpulkan informasi yang terbatas untuk fungsionalitas aplikasi, antara lain:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Informasi Akun: Nama lengkap, alamat email, dan nomor telepon.</li>
                <li>Data Bisnis: Catatan transaksi beli/jual, daftar pelanggan (RPA), dan data kandang.</li>
                <li>Data Teknis: Alamat IP dan log aktivitas untuk keperluan keamanan dan debugging.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">02.</span> Penggunaan Data
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                Kami menggunakan data Anda hanya untuk tujuan operasional platform, yaitu:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Menghasilkan laporan keuangan dan profitabilitas bisnis Anda.</li>
                <li>Mengirimkan notifikasi penting terkait transaksi dan keamanan akun.</li>
                <li>Meningkatkan kualitas layanan berdasarkan analisis anonim penggunaan fitur.</li>
              </ul>
              <p className="font-semibold text-emerald-400">
                Kami tidak pernah menjual data bisnis Anda kepada pihak ketiga manapun untuk tujuan periklanan atau data mining.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">03.</span> Keamanan Data (Supabase)
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                TernakOS menggunakan infrastruktur <strong>Supabase</strong> (didukung oleh AWS/GCP) untuk penyimpanan database dan otentikasi. Semua data dienkripsi saat transit (SSL/TLS) dan saat istirahat (Encrypted at Rest).
              </p>
              <p>
                Kami menerapkan Row Level Security (RLS) yang ketat, memastikan bahwa data Bisnis A tidak akan pernah bisa dilihat oleh Bisnis B meskipun berada dalam database yang sama.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">04.</span> Hak Pengguna
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                Sesuai regulasi pelindungan data pribadi, Anda memiliki hak untuk:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Mengakses data Anda kapan saja melalui fitur ekspor.</li>
                <li>Memperbarui atau memperbaiki informasi yang salah.</li>
                <li>Meminta penghapusan permanen akun dan seluruh data bisnis terkait.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">05.</span> Kontak Kami
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                Jika Anda memiliki pertanyaan tentang kebijakan privasi ini atau keamanan data Anda, silakan hubungi tim support kami melalui email di <strong>support@ternakos.id</strong>.
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-[#4B6478] text-sm">
        <p>© 2026 TernakOS Indonesia. Perlindungan Data Prioritas Utama Kami.</p>
      </footer>
    </div>
  );
}
