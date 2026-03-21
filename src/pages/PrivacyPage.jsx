import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Shield, 
  Lock, 
  FileText, 
  Users, 
  Scale, 
  MessageCircle, 
  AlertTriangle,
  ArrowLeft,
  Home
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30">
      {/* Navbar Area */}
      <header className="border-b border-white/5 bg-[#0C1319]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              🐔
            </div>
            <span className="font-display font-black text-xl tracking-tight">TernakOS</span>
          </Link>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-semibold text-[#94A3B8] hover:text-emerald-400 transition-colors"
          >
            <ChevronLeft size={16} />
            Kembali
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none text-white">
              Kebijakan <span className="text-emerald-500">Privasi</span>
            </h1>
            <p className="text-[#4B6478] text-lg max-w-2xl mx-auto leading-relaxed">
              Privasi Anda adalah prioritas kami. Kami berkomitmen untuk melindungi data bisnis Anda dengan standar keamanan terkini.
            </p>
            <p className="text-[#4B6478] text-sm mt-4 font-medium uppercase tracking-widest">
              Terakhir Diperbarui: 1 Januari 2026 • Versi 1.2
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <main className="py-12 md:py-20 max-w-5xl mx-auto px-6">
        <Tabs defaultValue="umum" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-[#0C1319] border border-white/10 p-1 rounded-2xl h-auto flex flex-wrap justify-center gap-1">
              <TabsTrigger 
                value="umum" 
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#10B981] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                UMUM
              </TabsTrigger>
              <TabsTrigger 
                value="broker" 
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#10B981] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                BROKER
              </TabsTrigger>
              <TabsTrigger 
                value="peternak" 
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#10B981] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                PETERNAK
              </TabsTrigger>
              <TabsTrigger 
                value="rpa" 
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#10B981] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                RPA
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-[#0C1319] border border-white/8 rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* TAB UMUM */}
            <TabsContent value="umum" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PolicySection 
                  number="01" 
                  title="Data yang Dikumpulkan" 
                  icon={<FileText className="text-emerald-500" size={24} />}
                >
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Informasi Akun:</strong>
                        <p className="text-[#94A3B8]">Nama lengkap, alamat email, dan nomor telepon untuk keperluan identitas dan komunikasi.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Bisnis:</strong>
                        <p className="text-[#94A3B8]">Data transaksi, inventaris, dan rekanan sesuai dengan role bisnis masing-masing.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Teknis:</strong>
                        <p className="text-[#94A3B8]">Alamat IP, log aktivitas aplikasi, dan informasi perangkat untuk menunjang keamanan dan debugging.</p>
                      </div>
                    </li>
                  </ul>
                </PolicySection>

                <PolicySection 
                  number="02" 
                  title="Penggunaan Data" 
                  icon={<Shield className="text-emerald-500" size={24} />}
                >
                  <p className="text-[#94A3B8] leading-relaxed mb-6">Kami menggunakan data Anda hanya untuk tujuan operasional platform:</p>
                  <ul className="space-y-4 mb-6">
                    <li className="flex items-center gap-4 text-[#94A3B8]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Otentikasi pengguna dan keamanan akses akun.
                    </li>
                    <li className="flex items-center gap-4 text-[#94A3B8]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Pembuatan laporan keuangan, margin, dan cash flow otomatis.
                    </li>
                    <li className="flex items-center gap-4 text-[#94A3B8]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Notifikasi transaksi penting dan pembaruan sistem.
                    </li>
                  </ul>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-emerald-400 font-bold text-sm">
                      PENTING: Kami TIDAK menjual data bisnis Anda ke pihak ketiga untuk keperluan iklan atau data mining. Data hanya digunakan untuk kepentingan operasional Anda di dalam platform.
                    </p>
                  </div>
                </PolicySection>

                <PolicySection 
                  number="03" 
                  title="Keamanan Data" 
                  icon={<Lock className="text-emerald-500" size={24} />}
                >
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Shield size={18} className="text-emerald-500" /> Infrastruktur Supabase
                      </h4>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Data disimpan di infrastruktur Supabase (AWS/GCP) dengan enkripsi SSL/TLS saat transit dan Encrypted at Rest.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Lock size={18} className="text-emerald-500" /> Row Level Security (RLS)
                      </h4>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Kebijakan RLS memastikan data Bisnis A tidak bisa diakses oleh Bisnis B meskipun berada di database yang sama.
                      </p>
                    </div>
                  </div>
                  <p className="text-[#94A3B8] text-sm mt-6">Backup otomatis dilakukan setiap hari untuk menjamin ketersediaan data Anda.</p>
                </PolicySection>

                <PolicySection 
                  number="04" 
                  title="Hak Pengguna" 
                  icon={<Users className="text-emerald-500" size={24} />}
                >
                  <div className="space-y-4 text-[#94A3B8]">
                    <p>Sesuai regulasi pelindungan data pribadi, Anda memiliki hak penuh atas:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        'Akses & Ekspor data kapan saja',
                        'Koreksi data yang tidak akurat',
                        'Penghapusan permanen akun (30 hari)',
                        'Pencabutan persetujuan sewaktu-waktu'
                      ].map(item => (
                        <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03]">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PolicySection>

                <PolicySection 
                  number="05" 
                  title="Perubahan Kebijakan" 
                  icon={<Scale className="text-emerald-500" size={24} />}
                >
                  <p className="text-[#94A3B8] leading-relaxed">
                    Kami dapat mengubah kebijakan ini sewaktu-waktu. Kami akan memberikan notifikasi melalui email minimal 7 hari sebelum perubahan berlaku efektif.
                  </p>
                </PolicySection>

                <PolicySection 
                  number="06" 
                  title="Hubungi Kami" 
                  icon={<MessageCircle className="text-emerald-500" size={24} />}
                >
                  <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 gap-6 text-center md:text-left">
                    <div>
                      <h4 className="text-emerald-500 font-bold mb-1">Butuh bantuan terkait privasi?</h4>
                      <p className="text-[#94A3B8] text-sm">Tim support kami siap membantu menjawab pertanyaan Anda.</p>
                    </div>
                    <a href="mailto:support@ternakos.id" className="px-6 py-3 bg-[#10B981] hover:bg-[#34D399] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                      support@ternakos.id
                    </a>
                  </div>
                </PolicySection>
              </div>
            </TabsContent>

            {/* TAB BROKER */}
            <TabsContent value="broker" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PolicySection number="01" title="Data Bisnis yang Dikumpulkan">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <p className="text-[#94A3B8]">Data transaksi detail (Beli, Jual, Retur, Biaya Operasional).</p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <p className="text-[#94A3B8]">Profil Kandang Rekanan (Nama, Lokasi, Riwayat Performansi).</p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <p className="text-[#94A3B8]">Data Pengiriman & Armada (Kendaraan, Sopir, Rute).</p>
                    </li>
                  </ul>
                </PolicySection>

                <div className="p-8 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                    <AlertTriangle size={80} className="text-emerald-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                      PENTING
                    </div>
                    <h3 className="text-white text-2xl font-black mb-6 tracking-tight">
                      ⚠️ PERSETUJUAN KHUSUS — Kontribusi Harga Pasar
                    </h3>
                    <p className="text-emerald-100/80 mb-6 leading-relaxed text-lg">
                      Dengan menggunakan TernakOS, Broker menyetujui poin-poin berikut:
                    </p>
                    <ul className="space-y-4 text-emerald-100/90 font-medium">
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        Data harga transaksi (beli & jual per kg) akan dikontribusikan secara <span className="text-white font-bold">ANONIM</span> ke sistem Harga Pasar.
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        Data yang dibagikan hanya: harga per kg, wilayah umum, dan tanggal transaksi.
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        <span className="text-white font-bold">TIDAK ADA NAMA BISNIS</span>, nama kandang, atau nilai total yang dibagikan.
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        Tujuan utama adalah membentuk referensi harga yang akurat bagi ekosistem peternakan Indonesia.
                      </li>
                    </ul>
                    <p className="mt-8 text-emerald-200/60 text-sm italic">
                      Persetujuan ini dapat dicabut dengan menghubungi support, namun data historis akan tetap digunakan dalam bentuk agregat anonim.
                    </p>
                  </div>
                </div>

                <PolicySection number="03" title="Penggunaan Data Broker">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Data digunakan untuk kalkulasi profit otomatis, pelacakan piutang RPA yang jatuh tempo, dan analisis performa tiap kandang mitra untuk keputusan bisnis yang lebih baik.
                  </p>
                </PolicySection>
                
                <PolicySection number="04" title="Retensi Data">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Data transaksi disimpan minimal selama akun aktif plus 5 tahun untuk keperluan administrasi dan pajak. Data di Recycle Bin akan dihapus otomatis setelah 30 hari.
                  </p>
                </PolicySection>
              </div>
            </TabsContent>

            {/* TAB PETERNAK */}
            <TabsContent value="peternak" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PolicySection number="01" title="Data Bisnis yang Dikumpulkan">
                  <ul className="space-y-4 text-[#94A3B8]">
                    <li className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Data Kandang: kapasitas, lokasi detail, dan jenis ayam.
                    </li>
                    <li className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Data Siklus: tanggal DOC masuk, deplesi harian, dan mortalitas.
                    </li>
                    <li className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Listing Stok: estimasi panen dan harga penawaran ke broker.
                    </li>
                  </ul>
                </PolicySection>

                <PolicySection number="02" title="Kontrol Visibilitas">
                  <p className="text-[#94A3B8] leading-relaxed mb-6">
                    Peternak memiliki kontrol penuh atas siapa yang bisa melihat data masing-masing kandang:
                  </p>
                  <div className="p-6 rounded-2xl bg-[#10B981]/5 border border-[#10B981]/20">
                    <p className="text-emerald-400 font-bold mb-2">Listing Stok Terbatas:</p>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">
                      Hanya broker yang terhubung (connected) secara eksplisit yang bisa melihat stok tersedia. Data budidaya harian (FCR, Mortalitas) TIDAK dibagikan ke broker tanpa izin tambahan.
                    </p>
                  </div>
                </PolicySection>

                <PolicySection number="03" title="Koneksi dengan Broker">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Peternak harus menyetujui permintaan koneksi dari broker. Setelah terhubung, broker hanya melihat info yang diperlukan untuk transaksi panen. Anda dapat memutus koneksi kapan saja.
                  </p>
                </PolicySection>
              </div>
            </TabsContent>

            {/* TAB RPA */}
            <TabsContent value="rpa" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PolicySection number="01" title="Data Bisnis yang Dikumpulkan">
                  <ul className="space-y-4 text-[#94A3B8]">
                    <li className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Riwayat Pembelian: volume, harga, dan broker asal.
                    </li>
                    <li className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Riwayat Pembayaran & Termin (Piutang Usaha).
                    </li>
                    <li className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Profil Buyer: lokasi operasional dan syarat pembayaran.
                    </li>
                  </ul>
                </PolicySection>

                <PolicySection number="02" title="Data Hutang & Transaksi">
                  <p className="text-[#94A3B8] mb-6 leading-relaxed">
                    Data saldo piutang dihitung di sisi Broker. RPA dapat melihat riwayat transaksi yang sama sebagai bukti pembayaran yang sah dan permanen.
                  </p>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <p className="text-orange-400 text-sm font-medium">
                      Data transaksi pembelian yang sudah diverifikasi tersimpan sebagai bukti hukum untuk audit akuntansi kedua belah pihak.
                    </p>
                  </div>
                </PolicySection>

                <PolicySection number="03" title="Visibilitas ke Broker">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Nama RPA, payment terms, dan reliability score mungkin terlihat oleh broker yang sedang atau pernah bertransaksi dengan Anda untuk mempermudah operasional.
                  </p>
                </PolicySection>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Consent Footer */}
        <div className="mt-16 text-center space-y-8">
          <p className="text-[#4B6478] text-sm max-w-xl mx-auto leading-relaxed">
            Dengan mendaftar dan menggunakan platform TernakOS, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam Kebijakan Privasi ini.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Kembali ke Login
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> Beranda
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-[#4B6478] text-sm">
        <p>© 2026 TernakOS Indonesia. Kepercayaan Anda, Keamanan Kami.</p>
      </footer>
    </div>
  );
}

function PolicySection({ number, title, children, icon }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            {icon}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-display font-black">
            {number}
          </div>
        )}
        <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
      </div>
      <div className="pl-0 md:pl-16">
        {children}
      </div>
    </section>
  );
}
