import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30">
      <SEO
        title="Syarat & Ketentuan Penggunaan TernakOS | Platform SaaS Peternakan"
        description="Baca syarat dan ketentuan penggunaan platform TernakOS. Ketentuan layanan, privasi, pembayaran, dan hak pengguna platform manajemen bisnis peternakan Indonesia."
        path="/terms"
        type="article"
      />
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
              Terakhir diperbarui: 3 April 2026 • Versi 2.0
            </p>
            <p className="text-[#4B6478] text-sm mt-2 leading-relaxed">
              Harap baca dokumen ini dengan seksama sebelum mendaftar atau menggunakan layanan TernakOS. Dengan mengakses platform ini, Anda menyatakan telah membaca, memahami, dan terikat secara hukum oleh ketentuan berikut.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <main className="py-16 md:py-24 max-w-4xl mx-auto px-6">
        <div className="space-y-14">

          {/* 01 */}
          <TermSection number="01" title="Definisi & Ruang Lingkup">
            <p>Dalam Syarat & Ketentuan ini, istilah berikut memiliki arti sebagai berikut:</p>
            <ul className="list-none space-y-3 mt-4">
              <DefItem term="&quot;TernakOS&quot; / &quot;Kami&quot;">Platform Software-as-a-Service (SaaS) yang dioperasikan dan disediakan oleh tim TernakOS Indonesia untuk sektor peternakan.</DefItem>
              <DefItem term="&quot;Pengguna&quot; / &quot;Anda&quot;">Setiap individu atau entitas bisnis yang mendaftar, mengakses, atau menggunakan layanan TernakOS, termasuk namun tidak terbatas pada Broker Ayam, Broker Telur, Peternak, dan Rumah Potong Ayam (RPA).</DefItem>
              <DefItem term="&quot;Akun&quot;">Profil unik yang dibuat Pengguna untuk mengakses fitur platform TernakOS.</DefItem>
              <DefItem term="&quot;Tenant&quot;">Satu unit bisnis yang terdaftar dalam platform, yang dapat memiliki satu atau lebih Pengguna di bawahnya.</DefItem>
              <DefItem term="&quot;Data Bisnis&quot;">Seluruh data operasional yang dimasukkan Pengguna ke dalam platform, termasuk data transaksi, inventaris, dan data rekanan.</DefItem>
              <DefItem term="&quot;Layanan&quot;">Seluruh fitur, fungsi, dan konten yang tersedia melalui platform TernakOS, termasuk dashboard, laporan otomatis, dan sistem manajemen.</DefItem>
              <DefItem term="&quot;Paket Berlangganan&quot;">Tier layanan berbayar (Pro atau Business) yang memberikan akses ke fitur premium sesuai paket yang dipilih.</DefItem>
            </ul>
            <p className="mt-4">Ketentuan ini berlaku untuk seluruh layanan TernakOS yang diakses melalui aplikasi web maupun antarmuka lainnya yang kami sediakan.</p>
          </TermSection>

          {/* 02 */}
          <TermSection number="02" title="Penerimaan Ketentuan">
            <p>
              Dengan mendaftar, masuk, atau menggunakan platform TernakOS — baik melalui email/password maupun melalui Akun Google (Google Sign-In) — Anda secara tegas menyetujui Syarat & Ketentuan ini serta Kebijakan Privasi kami yang berlaku secara bersamaan.
            </p>
            <p className="mt-4">
              Jika Anda menggunakan platform atas nama entitas bisnis atau perusahaan, Anda menyatakan bahwa Anda memiliki kewenangan hukum untuk mengikat entitas tersebut pada ketentuan ini.
            </p>
            <p className="mt-4">
              Jika Anda <strong className="text-white">tidak menyetujui</strong> ketentuan ini, Anda tidak diperkenankan untuk mendaftar atau menggunakan layanan TernakOS.
            </p>
          </TermSection>

          {/* 03 */}
          <TermSection number="03" title="Deskripsi Layanan">
            <p>TernakOS adalah platform manajemen bisnis berbasis cloud yang menyediakan fitur-fitur berikut sesuai tipe akun:</p>
            <ul className="mt-4 space-y-2">
              <BulletItem><strong className="text-white">Broker Ayam & Telur:</strong> Manajemen transaksi beli-jual, pelacakan pengiriman, laporan profit otomatis, manajemen piutang RPA, dan analitik pasar.</BulletItem>
              <BulletItem><strong className="text-white">Peternak:</strong> Manajemen siklus kandang, pencatatan deplesi dan mortalitas, estimasi panen, listing stok ke broker, dan laporan performa kandang.</BulletItem>
              <BulletItem><strong className="text-white">Rumah Potong Ayam (RPA):</strong> Manajemen riwayat pembelian, pelacakan piutang, dan profil buyer.</BulletItem>
            </ul>
            <p className="mt-4">
              TernakOS menyediakan layanan dalam bentuk <em>as-is</em> dan terus dikembangkan. Kami berhak menambahkan, mengubah, atau menghentikan fitur tertentu dengan pemberitahuan wajar kepada Pengguna yang terpengaruh.
            </p>
          </TermSection>

          {/* 04 */}
          <TermSection number="04" title="Pendaftaran Akun & Keamanan">
            <p>Untuk menggunakan layanan TernakOS, Anda wajib membuat akun dengan informasi yang akurat, lengkap, dan terkini. Anda bertanggung jawab atas:</p>
            <ul className="mt-4 space-y-2">
              <BulletItem>Kerahasiaan kata sandi dan kredensial akun Anda.</BulletItem>
              <BulletItem>Seluruh aktivitas yang terjadi di bawah akun Anda, baik yang Anda lakukan maupun yang dilakukan pihak lain dengan izin Anda.</BulletItem>
              <BulletItem>Segera memberitahu kami di <a href="mailto:support@ternakos.id" className="text-emerald-400 hover:underline">support@ternakos.id</a> apabila terdapat akses tidak sah ke akun Anda.</BulletItem>
            </ul>
            <p className="mt-4">Anda dilarang mendaftarkan lebih dari satu akun untuk satu entitas bisnis tanpa izin tertulis dari TernakOS. Pembuatan akun dengan identitas palsu atau menyesatkan merupakan pelanggaran yang dapat berujung pada pemblokiran akun tanpa pengembalian dana.</p>
          </TermSection>

          {/* 05 */}
          <TermSection number="05" title="Autentikasi Pihak Ketiga (Google Sign-In)">
            <p>
              TernakOS menawarkan opsi masuk menggunakan Akun Google melalui layanan OAuth 2.0 milik Google LLC. Dengan memilih opsi ini, Anda memahami dan menyetujui hal-hal berikut:
            </p>
            <ul className="mt-4 space-y-3">
              <BulletItem>
                <strong className="text-white">Data yang diterima dari Google:</strong> Kami hanya menerima data dasar profil Google Anda, yaitu nama lengkap, alamat email, dan foto profil (jika tersedia). Kami tidak meminta dan tidak mengakses Google Drive, Gmail, Kalender, Kontak, atau layanan Google lainnya.
              </BulletItem>
              <BulletItem>
                <strong className="text-white">Tujuan penggunaan:</strong> Data dari Google digunakan semata-mata untuk membuat dan mengidentifikasi akun TernakOS Anda. Tidak ada data Google yang digunakan untuk iklan, analitik pihak ketiga, atau tujuan lain di luar autentikasi.
              </BulletItem>
              <BulletItem>
                <strong className="text-white">Pencabutan akses:</strong> Anda dapat mencabut akses TernakOS dari akun Google Anda kapan saja melalui pengaturan keamanan Google di <span className="text-emerald-400">myaccount.google.com/permissions</span>. Pencabutan ini tidak menghapus data bisnis yang sudah tersimpan di TernakOS.
              </BulletItem>
              <BulletItem>
                <strong className="text-white">Tidak ada transfer ke pihak ketiga:</strong> Data yang diterima dari Google tidak dibagikan, dijual, atau ditransfer ke pihak ketiga manapun.
              </BulletItem>
            </ul>
            <p className="mt-4">
              Penggunaan layanan Google tunduk pada <span className="text-[#94A3B8]">Kebijakan Privasi dan Persyaratan Layanan Google</span>. TernakOS tidak bertanggung jawab atas kebijakan atau praktik Google yang berada di luar kendali kami.
            </p>
          </TermSection>

          {/* 06 */}
          <TermSection number="06" title="Ketentuan Penggunaan yang Dapat Diterima">
            <p>Anda setuju untuk hanya menggunakan TernakOS untuk tujuan yang sah dan sesuai hukum yang berlaku di Republik Indonesia. Secara khusus, Anda <strong className="text-white">DILARANG</strong> untuk:</p>
            <ul className="mt-4 space-y-2">
              <BulletItem>Menggunakan platform untuk kegiatan ilegal, penipuan, atau yang merugikan pihak lain.</BulletItem>
              <BulletItem>Mencoba mengakses data Pengguna lain, melakukan reverse engineering, atau mengeksploitasi celah keamanan sistem.</BulletItem>
              <BulletItem>Mengunggah, menyebarkan, atau menyimpan konten berbahaya seperti malware, virus, atau kode berbahaya lainnya.</BulletItem>
              <BulletItem>Melakukan scraping, crawling, atau pengambilan data otomatis dari platform tanpa izin tertulis.</BulletItem>
              <BulletItem>Menggunakan platform untuk tujuan kompetitif tanpa izin, termasuk membangun produk atau layanan yang bersaing langsung dengan TernakOS menggunakan data atau fitur kami.</BulletItem>
              <BulletItem>Melebihi batas penggunaan wajar yang dapat mengganggu kinerja layanan bagi Pengguna lain (abuse of service).</BulletItem>
              <BulletItem>Mengalihkan atau menjual kembali akses platform kepada pihak ketiga tanpa persetujuan tertulis dari TernakOS.</BulletItem>
            </ul>
            <p className="mt-4">Pelanggaran terhadap ketentuan ini memberikan TernakOS hak untuk menangguhkan atau menghentikan akun Anda secara permanen tanpa kewajiban pengembalian dana.</p>
          </TermSection>

          {/* 07 */}
          <TermSection number="07" title="Paket Berlangganan & Pembayaran">
            <p>TernakOS menawarkan model berlangganan dengan detail sebagai berikut:</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <PlanCard name="Starter" color="text-[#94A3B8]" border="border-white/10">
                <p>Gratis selamanya. Akses fitur dasar dengan 1 kandang. Tidak memerlukan pembayaran.</p>
              </PlanCard>
              <PlanCard name="Pro" color="text-emerald-400" border="border-emerald-500/30">
                <p>Berbayar, akses fitur lengkap hingga 2 kandang. Tagihan bulanan atau tahunan.</p>
              </PlanCard>
              <PlanCard name="Business" color="text-amber-400" border="border-amber-500/30">
                <p>Berbayar, akses fitur penuh tanpa batas kandang. Diperuntukkan bisnis skala besar.</p>
              </PlanCard>
            </div>
            <ul className="mt-6 space-y-3">
              <BulletItem><strong className="text-white">Prabayar:</strong> Semua pembayaran dilakukan di muka sebelum periode berlangganan dimulai.</BulletItem>
              <BulletItem><strong className="text-white">Metode Pembayaran:</strong> Transfer bank ke rekening resmi TernakOS yang tertera di halaman pembayaran. Bukti transfer wajib diunggah untuk verifikasi manual oleh tim kami.</BulletItem>
              <BulletItem><strong className="text-white">Aktivasi:</strong> Akun diaktifkan dalam 1x24 jam kerja setelah pembayaran diverifikasi.</BulletItem>
              <BulletItem><strong className="text-white">Kegagalan Pembayaran:</strong> Akses fitur Pro/Business akan ditangguhkan sementara jika langganan tidak diperbarui setelah periode berakhir. Data Anda tetap aman selama masa tenggang 30 hari.</BulletItem>
              <BulletItem><strong className="text-white">Perubahan Harga:</strong> Harga berlangganan dapat berubah. Pengguna aktif akan diberitahu minimal 30 hari sebelum perubahan berlaku dan harga lama tetap berlaku hingga akhir periode berjalan.</BulletItem>
            </ul>
          </TermSection>

          {/* 08 */}
          <TermSection number="08" title="Kebijakan Pengembalian Dana (Refund)">
            <p>TernakOS memberikan jaminan uang kembali (<em>money-back guarantee</em>) dengan ketentuan berikut:</p>
            <ul className="mt-4 space-y-3">
              <BulletItem><strong className="text-white">Jangka Waktu:</strong> Refund dapat diajukan dalam 7 hari kalender pertama sejak tanggal aktivasi paket berbayar.</BulletItem>
              <BulletItem><strong className="text-white">Syarat:</strong> Refund hanya diberikan jika platform mengalami gangguan teknis yang signifikan dan tidak dapat diselesaikan dalam waktu wajar, sehingga secara material menghalangi penggunaan layanan.</BulletItem>
              <BulletItem><strong className="text-white">Pengecualian:</strong> Tidak ada refund untuk pembatalan sepihak tanpa alasan teknis, ketidakcocokan ekspektasi yang bersifat subjektif, atau perpindahan ke kompetitor.</BulletItem>
              <BulletItem><strong className="text-white">Proses:</strong> Ajukan permintaan refund ke <a href="mailto:support@ternakos.id" className="text-emerald-400 hover:underline">support@ternakos.id</a> disertai bukti gangguan teknis. Tim kami akan merespons dalam 3 hari kerja.</BulletItem>
              <BulletItem><strong className="text-white">Metode Pengembalian:</strong> Dana dikembalikan melalui transfer bank ke rekening yang sama dengan pembayaran asal, dalam waktu 5-10 hari kerja setelah persetujuan.</BulletItem>
            </ul>
          </TermSection>

          {/* 09 */}
          <TermSection number="09" title="Pembatalan & Penghentian Layanan">
            <p><strong className="text-white">Pembatalan oleh Pengguna:</strong> Anda dapat berhenti menggunakan dan berlangganan TernakOS kapan saja. Akses ke fitur berbayar tetap berjalan hingga akhir periode berlangganan yang sudah dibayar. Tidak ada biaya pembatalan.</p>
            <p className="mt-4"><strong className="text-white">Penghentian oleh TernakOS:</strong> Kami berhak menangguhkan atau menghentikan akun Anda tanpa pemberitahuan sebelumnya apabila:</p>
            <ul className="mt-2 space-y-2">
              <BulletItem>Terdapat pelanggaran terhadap Syarat & Ketentuan ini.</BulletItem>
              <BulletItem>Ditemukan aktivitas penipuan, ilegal, atau berbahaya yang dilakukan melalui akun Anda.</BulletItem>
              <BulletItem>Akun tidak aktif selama lebih dari 12 bulan berturut-turut tanpa pembayaran.</BulletItem>
            </ul>
            <p className="mt-4"><strong className="text-white">Retensi Data Pasca-Penghentian:</strong> Setelah akun dinonaktifkan, data Anda disimpan selama 90 hari masa tenggang. Setelah itu, data dihapus secara permanen dari sistem kami kecuali diwajibkan oleh hukum untuk menyimpannya lebih lama (misalnya untuk keperluan perpajakan atau audit).</p>
          </TermSection>

          {/* 10 */}
          <TermSection number="10" title="Kepemilikan Data & Hak Kekayaan Intelektual">
            <p><strong className="text-white">Data Bisnis Anda:</strong> Seluruh Data Bisnis yang Anda masukkan ke dalam platform adalah milik Anda sepenuhnya. TernakOS tidak mengklaim hak kepemilikan atas data tersebut. Kami hanya berperan sebagai penyedia infrastruktur dan pengolah data atas instruksi Anda.</p>
            <p className="mt-4"><strong className="text-white">Lisensi Terbatas:</strong> Dengan menggunakan layanan kami, Anda memberikan TernakOS lisensi terbatas, non-eksklusif, dan dapat dicabut untuk memproses Data Bisnis Anda semata-mata dalam rangka menyediakan layanan yang Anda minta.</p>
            <p className="mt-4"><strong className="text-white">Hak TernakOS:</strong> Seluruh elemen platform TernakOS — termasuk namun tidak terbatas pada kode sumber, desain antarmuka, algoritma, merek, dan logo — adalah milik eksklusif TernakOS Indonesia dan dilindungi oleh hukum hak cipta dan hak kekayaan intelektual Republik Indonesia. Anda tidak diperkenankan menyalin, memodifikasi, mendistribusikan, atau menggunakan elemen tersebut tanpa izin tertulis.</p>
            <p className="mt-4"><strong className="text-white">Data Agregat Anonim:</strong> TernakOS dapat menggunakan data yang dianonimkan dan diagregasikan (tanpa informasi yang dapat mengidentifikasi bisnis atau individu Anda) untuk keperluan peningkatan layanan, pengembangan fitur, dan referensi harga pasar komoditas peternakan Indonesia.</p>
          </TermSection>

          {/* 11 */}
          <TermSection number="11" title="Batasan Tanggung Jawab">
            <p>Sejauh yang diizinkan oleh hukum yang berlaku di Republik Indonesia:</p>
            <ul className="mt-4 space-y-3">
              <BulletItem><strong className="text-white">Tidak Ada Jaminan:</strong> Layanan TernakOS disediakan "sebagaimana adanya" (<em>as-is</em>) dan "sebagaimana tersedia" (<em>as-available</em>). Kami tidak memberikan jaminan bahwa layanan akan bebas dari gangguan, kesalahan, atau kehilangan data.</BulletItem>
              <BulletItem><strong className="text-white">Keputusan Bisnis:</strong> TernakOS tidak bertanggung jawab atas kerugian finansial atau keputusan bisnis yang diambil berdasarkan data, laporan, atau analitik yang ditampilkan dalam platform. Pengguna disarankan melakukan validasi mandiri untuk transaksi bernilai signifikan.</BulletItem>
              <BulletItem><strong className="text-white">Batas Ganti Rugi:</strong> Dalam hal apapun, total tanggung jawab kumulatif TernakOS kepada Anda tidak akan melebihi jumlah yang Anda bayarkan kepada kami dalam 3 bulan terakhir sebelum klaim timbul.</BulletItem>
              <BulletItem><strong className="text-white">Kerugian Tidak Langsung:</strong> TernakOS tidak bertanggung jawab atas kehilangan laba, kehilangan data, kerusakan reputasi, atau kerugian tidak langsung lainnya, bahkan jika TernakOS telah diberitahu kemungkinan terjadinya kerugian tersebut.</BulletItem>
            </ul>
          </TermSection>

          {/* 12 */}
          <TermSection number="12" title="Keadaan Kahar (Force Majeure)">
            <p>
              TernakOS tidak bertanggung jawab atas kegagalan atau keterlambatan dalam pelaksanaan layanan yang disebabkan oleh keadaan di luar kendali wajar kami, termasuk namun tidak terbatas pada: bencana alam, gangguan infrastruktur internet nasional, pemadaman layanan pihak ketiga (Supabase, Google Cloud, AWS), tindakan pemerintah, epidemi, atau peristiwa <em>force majeure</em> lainnya. Kami akan segera menginformasikan gangguan tersebut dan berupaya memulihkan layanan secepat mungkin.
            </p>
          </TermSection>

          {/* 13 */}
          <TermSection number="13" title="Perubahan Layanan & Ketentuan">
            <p>
              TernakOS berhak mengubah Syarat & Ketentuan ini sewaktu-waktu. Untuk perubahan yang bersifat material — seperti perubahan harga, pembatasan fitur, atau kebijakan data — kami akan memberikan pemberitahuan melalui:
            </p>
            <ul className="mt-4 space-y-2">
              <BulletItem>Email ke alamat yang terdaftar di akun Anda, minimal 7 hari sebelum berlaku.</BulletItem>
              <BulletItem>Notifikasi dalam platform saat Anda login.</BulletItem>
            </ul>
            <p className="mt-4">
              Penggunaan layanan yang berlanjut setelah tanggal efektif perubahan merupakan persetujuan Anda terhadap versi terbaru. Jika Anda tidak menyetujui perubahan, Anda berhak untuk menghentikan langganan sebelum perubahan berlaku.
            </p>
          </TermSection>

          {/* 14 */}
          <TermSection number="14" title="Hukum yang Berlaku & Penyelesaian Sengketa">
            <p>
              Syarat & Ketentuan ini tunduk pada dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap sengketa yang timbul dari atau sehubungan dengan ketentuan ini akan diselesaikan secara bertahap sebagai berikut:
            </p>
            <ol className="mt-4 space-y-3 list-none">
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">1.</span>
                <span className="text-[#94A3B8]"><strong className="text-white">Musyawarah:</strong> Para pihak berupaya menyelesaikan sengketa melalui musyawarah mufakat dalam jangka waktu 30 hari sejak sengketa timbul.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">2.</span>
                <span className="text-[#94A3B8]"><strong className="text-white">Mediasi:</strong> Jika musyawarah gagal, para pihak dapat menempuh jalur mediasi melalui lembaga mediasi yang disepakati bersama.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">3.</span>
                <span className="text-[#94A3B8]"><strong className="text-white">Pengadilan:</strong> Jika mediasi tidak menghasilkan penyelesaian, sengketa akan diselesaikan melalui Pengadilan Negeri yang berwenang sesuai domisili hukum TernakOS Indonesia.</span>
              </li>
            </ol>
          </TermSection>

          {/* 15 */}
          <TermSection number="15" title="Privasi & Perlindungan Data Pribadi">
            <p>
              Pengumpulan, penggunaan, dan perlindungan data pribadi Anda diatur secara terpisah dan terperinci dalam <Link to="/privacy" className="text-emerald-400 hover:underline font-semibold">Kebijakan Privasi TernakOS</Link>, yang merupakan satu kesatuan tidak terpisahkan dari Syarat & Ketentuan ini.
            </p>
            <p className="mt-4">
              Kami beroperasi sesuai dengan Undang-Undang Perlindungan Data Pribadi Republik Indonesia (UU No. 27 Tahun 2022) dan peraturan pelaksanaannya. Dengan menggunakan layanan kami, Anda memberikan persetujuan yang sah untuk pemrosesan data pribadi sebagaimana diuraikan dalam Kebijakan Privasi.
            </p>
          </TermSection>

          {/* 16 */}
          <TermSection number="16" title="Ketentuan Lain-Lain">
            <ul className="space-y-3">
              <BulletItem><strong className="text-white">Keterpisahan:</strong> Jika suatu ketentuan dalam dokumen ini dinyatakan tidak sah atau tidak dapat dilaksanakan oleh pengadilan yang berwenang, ketentuan tersebut akan diubah seminimal mungkin untuk membuatnya dapat dilaksanakan, dan ketentuan lainnya tetap berlaku penuh.</BulletItem>
              <BulletItem><strong className="text-white">Tidak Ada Pengabaian:</strong> Kegagalan TernakOS untuk menegakkan suatu hak atau ketentuan tidak akan dianggap sebagai pengabaian hak tersebut.</BulletItem>
              <BulletItem><strong className="text-white">Keseluruhan Perjanjian:</strong> Dokumen ini, bersama dengan Kebijakan Privasi, merupakan keseluruhan perjanjian antara Anda dan TernakOS mengenai penggunaan layanan dan menggantikan semua perjanjian sebelumnya.</BulletItem>
              <BulletItem><strong className="text-white">Bahasa:</strong> Dokumen ini disusun dalam Bahasa Indonesia. Jika terdapat versi terjemahan, versi Bahasa Indonesia yang berlaku dan mengikat secara hukum.</BulletItem>
            </ul>
          </TermSection>

          {/* 17 */}
          <TermSection number="17" title="Hubungi Kami">
            <p>Untuk pertanyaan, keluhan, atau permintaan terkait Syarat & Ketentuan ini, silakan hubungi kami melalui:</p>
            <div className="mt-6 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white font-bold">TernakOS Indonesia</p>
                <p className="text-[#94A3B8] text-sm mt-1">Tim Legal & Support</p>
                <p className="text-[#94A3B8] text-sm mt-1">Jam Kerja: Senin–Jumat, 08.00–17.00 WIB</p>
              </div>
              <a
                href="mailto:support@ternakos.id"
                className="px-6 py-3 bg-[#10B981] hover:bg-[#34D399] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
              >
                support@ternakos.id
              </a>
            </div>
          </TermSection>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-[#4B6478] text-sm">
        <p>© 2026 TernakOS Indonesia. All rights reserved.</p>
        <p className="mt-2">
          <Link to="/privacy" className="text-emerald-500/70 hover:text-emerald-400 transition-colors">Kebijakan Privasi</Link>
          {' · '}
          <a href="mailto:support@ternakos.id" className="text-emerald-500/70 hover:text-emerald-400 transition-colors">Hubungi Kami</a>
        </p>
      </footer>
    </div>
  );
}

function TermSection({ number, title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <span className="text-emerald-500 font-display">{number}.</span> {title}
      </h2>
      <div className="text-[#94A3B8] leading-relaxed space-y-3 pl-0 md:pl-9">
        {children}
      </div>
    </section>
  );
}

function BulletItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function DefItem({ term, children }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
      <span><strong className="text-white">{term}:</strong> {children}</span>
    </li>
  );
}

function PlanCard({ name, color, border, children }) {
  return (
    <div className={`p-5 rounded-2xl bg-white/[0.02] border ${border}`}>
      <h4 className={`font-black text-lg mb-2 ${color}`}>{name}</h4>
      <div className="text-[#94A3B8] text-sm leading-relaxed">{children}</div>
    </div>
  );
}
