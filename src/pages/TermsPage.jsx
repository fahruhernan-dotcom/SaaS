import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
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
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none">
              Syarat & <span className="text-emerald-500">Ketentuan</span>
            </h1>
            <p className="text-[#4B6478] text-lg max-w-2xl leading-relaxed">
              Terakhir diperbarui: 17 Maret 2026. Harap baca dokumen ini dengan seksama sebelum menggunakan layanan kami.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <main className="py-16 md:py-24 max-w-4xl mx-auto px-6">
        <div className="prose prose-invert prose-emerald max-w-none space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">01.</span> Penggunaan Layanan
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                TernakOS menyediakan platform Software-as-a-Service (SaaS) untuk membantu manajemen bisnis peternakan. Dengan mendaftar dan menggunakan layanan kami, Anda menyetujui untuk menggunakan platform ini sesuai dengan hukum yang berlaku di Republik Indonesia.
              </p>
              <p>
                Anda bertanggung jawab atas segala aktivitas yang terjadi di bawah akun Anda dan wajib menjaga kerahasiaan kata sandi Anda.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">02.</span> Ketentuan Akun & Data
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                Data yang Anda masukkan (seperti data transaksi, stok, dan pelanggan) adalah milik Anda sepenuhnya. Kami hanya bertindak sebagai penyedia infrastruktur untuk mengolah data tersebut.
              </p>
              <p>
                Kami berhak menonaktifkan akun yang melanggar kebijakan penggunaan, termasuk namun tidak terbatas pada upaya peretasan atau penyalahgunaan fitur sistem secara tidak wajar.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">03.</span> Pembayaran & Subscription
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                TernakOS menggunakan model berlangganan (Pro & Business). Pembayaran dilakukan di muka (prabayar) sesuai dengan paket yang dipilih.
              </p>
              <p>
                Kegagalan pembayaran dapat menyebabkan penghentian sementara akses ke fitur dashboard sampai pembayaran diselesaikan. Refund hanya diberikan sesuai dengan kebijakan garansi yang berlaku dalam 7 hari pertama aktivasi jika sistem tidak berfungsi sebagaimana mestinya.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">04.</span> Penghentian Layanan
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                Anda dapat berhenti menggunakan layanan kami kapan saja. Jika Anda memutuskan untuk berhenti berlangganan, Anda tetap memiliki akses hingga akhir periode pembayaran berjalan.
              </p>
              <p>
                Kami akan menghapus data Anda secara permanen setelah 90 hari masa langganan berakhir jika tidak ada aktivitas pembaruan paket.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-emerald-500 font-display">05.</span> Batasan Tanggung Jawab
            </h2>
            <div className="text-[#94A3B8] leading-relaxed space-y-4">
              <p>
                TernakOS berupaya memberikan akurasi data yang tinggi, namun kami tidak bertanggung jawab atas kerugian finansial atau keputusan bisnis yang diambil berdasarkan data dalam dashboard kami. Peternak/Broker disarankan untuk tetap melakukan validasi manual pada transaksi penting.
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-[#4B6478] text-sm">
        <p>© 2026 TernakOS Indonesia. All rights reserved.</p>
      </footer>
    </div>
  );
}
