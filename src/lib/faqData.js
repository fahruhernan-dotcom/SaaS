/**
 * faqData.js
 * ~200 FAQ TernakOS — SEO-targeted, long-tail keywords, based on real features.
 * Each answer may contain an optional `link` for internal linking.
 *
 * Categories:
 *   1. umum        — Umum & Branding (25)
 *   2. broker_ayam — Solusi Broker Ayam (40)
 *   3. sembako     — Solusi Agen Sembako (40)
 *   4. peternak    — Solusi Peternak Mandiri (40)
 *   5. teknis      — Teknis, Keamanan & Langganan (55)
 */

export const FAQ_CATEGORIES = [
  { id: 'umum',        label: 'Umum & Branding',                emoji: '💡', count: 25 },
  { id: 'broker_ayam', label: 'Solusi Broker Ayam',             emoji: '🐔', count: 40 },
  { id: 'sembako',     label: 'Solusi Agen Sembako',            emoji: '🛒', count: 40 },
  { id: 'peternak',    label: 'Solusi Peternak Mandiri',        emoji: '🏠', count: 40 },
  { id: 'teknis',      label: 'Teknis, Keamanan & Langganan',   emoji: '🔐', count: 55 },
]

export const FAQ_DATA = {

  // ──────────────────────────────────────────────────────────────
  // KATEGORI 1: UMUM & BRANDING (25)
  // ──────────────────────────────────────────────────────────────
  umum: [
    {
      q: 'Apa itu TernakOS?',
      a: 'TernakOS adalah platform manajemen bisnis peternakan Indonesia berbasis cloud. Dirancang khusus untuk broker ayam, peternak broiler, agen sembako, dan rumah potong ayam (RPA) agar bisa mengelola transaksi, stok, piutang, dan laporan keuangan dari HP tanpa instalasi software.',
      link: '/fitur',
    },
    {
      q: 'Siapa saja yang bisa menggunakan TernakOS?',
      a: 'TernakOS tersedia untuk lima tipe bisnis: (1) Broker Ayam — catat beli/jual/pengiriman, (2) Broker Telur — POS dan stok per grade, (3) Distributor Sembako — manajemen stok FIFO multi-item, (4) Peternak Broiler Mandiri/Mitra — recording siklus dan FCR, (5) Rumah Potong Ayam (RPA) — order, hutang, dan distribusi.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS tersedia dalam bentuk aplikasi mobile di Play Store atau App Store?',
      a: 'TernakOS adalah Progressive Web App (PWA) yang berjalan langsung di browser Chrome, Safari, atau Firefox tanpa perlu download dari Play Store atau App Store. Kamu bisa tambahkan ke home screen HP untuk pengalaman seperti aplikasi native.',
    },
    {
      q: 'Mengapa harus memilih TernakOS dibanding mencatat transaksi secara manual di buku atau Excel?',
      a: 'Catatan manual rawan hilang, salah hitung, dan tidak bisa diakses real-time oleh seluruh tim. TernakOS menyimpan semua data di cloud, menghitung margin/piutang/FCR otomatis, dan bisa diakses dari HP mana saja kapan saja — termasuk saat di kandang.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS aman untuk data bisnis saya?',
      a: 'Ya. TernakOS menggunakan Row Level Security (RLS) PostgreSQL — standar keamanan bank — yang memastikan data bisnis kamu tidak bisa diakses oleh pengguna lain meskipun berada di platform yang sama. Setiap bisnis terisolasi penuh.',
    },
    {
      q: 'Apakah TernakOS bisa dipakai untuk bisnis peternakan yang baru mulai?',
      a: 'Sangat cocok. Paket Starter gratis 14 hari tanpa kartu kredit. Setup kurang dari 15 menit, tidak perlu pengetahuan teknis. Langsung bisa catat transaksi pertama di hari yang sama.',
      link: '/harga',
    },
    {
      q: 'Berapa biaya berlangganan TernakOS per bulan?',
      a: 'TernakOS menyediakan tiga paket: Starter (gratis, trial 14 hari), Pro (berbayar, untuk bisnis berkembang), dan Business (berbayar, untuk operasi skala besar dengan fitur penuh). Cek halaman harga untuk detail terkini.',
      link: '/harga',
    },
    {
      q: 'Apakah ada versi gratis TernakOS?',
      a: 'Ada. Kamu bisa mulai trial 14 hari penuh tanpa kartu kredit dan tanpa batasan fitur. Setelah trial berakhir, kamu bisa pilih paket berbayar atau akun akan dibatasi ke mode read-only.',
      link: '/harga',
    },
    {
      q: 'Apakah TernakOS bisa dipakai untuk lebih dari satu jenis bisnis dalam satu akun?',
      a: 'Bisa. Satu akun login bisa terhubung ke beberapa bisnis sekaligus — misalnya kamu punya kandang broiler sekaligus usaha broker ayam. Tinggal switch bisnis dari dashboard utama tanpa perlu login ulang.',
    },
    {
      q: 'Apa perbedaan TernakOS dengan software akuntansi umum seperti Jurnal atau Accurate?',
      a: 'Software akuntansi umum dirancang untuk semua industri dan butuh setup akun buku besar yang kompleks. TernakOS dibuat khusus untuk peternakan Indonesia — sudah paham istilah FCR, timbangan hidup, susut berat, piutang RPA, dan siklus kandang. Tidak perlu konfigurasi dari nol.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung bisnis peternakan yang menggunakan sistem kemitraan (INTI-Plasma)?',
      a: 'Ya, untuk peternak. Kamu bisa pilih model bisnis "Mitra Penuh", "Mitra Pakan", atau "Mitra Sapronak" saat setup kandang. TernakOS mendukung pencatatan harga kontrak dari perusahaan INTI (CP, Japfa, Charoen, dll) dan deducting sapronak otomatis.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS memiliki fitur notifikasi otomatis?',
      a: 'Ya. TernakOS mengirim notifikasi in-app untuk: piutang jatuh tempo, stok pakan menipis, pengiriman tiba, harga pasar berubah, dan masa trial hampir habis. Tidak perlu cek manual setiap hari.',
    },
    {
      q: 'Bagaimana cara daftar akun TernakOS?',
      a: 'Buka ternakos.com, klik "Mulai Gratis", isi nama, email, dan password. Verifikasi email, lalu pilih tipe bisnis kamu di halaman onboarding. Proses selesai dalam kurang dari 5 menit.',
      link: '/register',
    },
    {
      q: 'Apakah TernakOS bisa dipakai oleh beberapa pengguna dalam satu bisnis?',
      a: 'Bisa. Owner bisa undang anggota tim via kode 6 digit unik. Setiap anggota bisa diberi role berbeda: Staff (akses operasional), Manajer (peternak), View Only (hanya lihat), atau Sopir (hanya update status pengiriman).',
    },
    {
      q: 'Apa itu TernakOS Market?',
      a: 'TernakOS Market adalah fitur marketplace berbasis WhatsApp yang mempertemukan peternak, broker, dan RPA. Peternak bisa listing stok ayam siap panen, broker bisa listing penawaran beli, dan RPA bisa posting permintaan stok — semua terhubung via tombol WA langsung.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS ada di seluruh Indonesia atau hanya kota tertentu?',
      a: 'TernakOS adalah platform berbasis web yang bisa digunakan di seluruh Indonesia. Tidak ada pembatasan wilayah. Selama ada koneksi internet, kamu bisa mengaksesnya dari Sabang sampai Merauke.',
    },
    {
      q: 'Apakah TernakOS cocok untuk peternak kampung atau skala kecil?',
      a: 'Sangat cocok. Paket Starter dirancang untuk peternak skala kecil dengan 1 kandang. Input harian cukup 2 menit dari HP. Tidak perlu laptop atau pengetahuan komputer khusus.',
      link: '/harga',
    },
    {
      q: 'Bagaimana TernakOS membantu meningkatkan keuntungan bisnis peternakan?',
      a: 'TernakOS menghilangkan kebocoran profit dari: (1) salah hitung margin karena pencatatan manual, (2) piutang yang terlupakan, (3) FCR yang tidak termonitor, (4) stok pakan yang terbuang karena tidak terpantau. Rata-rata pengguna menemukan kebocoran 5-15% dari pendapatan mereka setelah mulai pakai TernakOS.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS menyediakan laporan keuangan otomatis?',
      a: 'Ya. TernakOS menyediakan laporan cash flow, laporan profit per periode, breakdown biaya, dan analisis margin — semua otomatis dari data transaksi yang sudah dicatat. Tidak perlu buat laporan manual di Excel.',
      link: '/fitur',
    },
    {
      q: 'Apakah data di TernakOS bisa diekspor ke Excel atau PDF?',
      a: 'Fitur export laporan tersedia di beberapa modul. Roadmap kami mencakup export PDF untuk nota dan laporan keuangan. Cek halaman fitur untuk status terkini.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung harga pasar ayam broiler hidup hari ini?',
      a: 'Ya. TernakOS memiliki halaman monitoring harga ayam broiler hidup yang diperbarui setiap hari. Keunggulan kami adalah data yang bersumber dari rata-rata transaksi nyata (real-time) broker aktif di platform TernakOS, dipadukan dengan referensi pasar eksternal seperti Chickin.id.',
      link: '/harga-pasar',
    },
    {
      q: 'Bagaimana TernakOS mendapatkan data harga ayam yang akurat?',
      a: 'Data kami bersifat hibrida: (1) Referensi pasar dari scraper otomatis, dan (2) Data agregat dari ribuan transaksi nyata broker di seluruh provinsi Indonesia. Ini menjadikan TernakOS satu-satunya platform yang menampilkan harga beli dan jual nyata di lapangan, bukan sekadar estimasi.',
      link: '/harga-pasar',
    },
    {
      q: 'Apakah ada demo atau video tutorial TernakOS?',
      a: 'Kamu bisa langsung coba trial 14 hari gratis untuk merasakan semua fitur secara langsung. Tutorial dan panduan penggunaan tersedia di dalam aplikasi.',
      link: '/register',
    },
    {
      q: 'Apakah TernakOS bisa dipakai oleh distributor daging ayam?',
      a: 'Ya. Sub-tipe "Distributor Daging" menggunakan dashboard broker ayam yang sama dengan fitur lengkap: catat pembelian, penjualan, pengiriman, dan piutang. Cocok untuk distributor daging segar ke pasar, restoran, atau supermarket.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS memiliki fitur untuk pelanggan setia atau program loyalitas?',
      a: 'Saat ini TernakOS memiliki reliability score per RPA/buyer yang membantu kamu menilai kepercayaan pembeli berdasarkan riwayat transaksi dan pembayaran. Fitur program loyalitas formal ada di roadmap kami.',
    },
    {
      q: 'Bagaimana cara menghubungi tim TernakOS jika ada pertanyaan atau masalah?',
      a: 'Kamu bisa menghubungi tim TernakOS melalui WhatsApp yang tersedia di halaman utama, atau melalui email support. Tim kami siap membantu hari kerja Senin–Jumat.',
    },
  ],

  // ──────────────────────────────────────────────────────────────
  // KATEGORI 2: BROKER AYAM (40)
  // ──────────────────────────────────────────────────────────────
  broker_ayam: [
    {
      q: 'Bagaimana cara mencatat timbangan ayam saat beli dari kandang di TernakOS?',
      a: 'Buka menu Transaksi → Catat Transaksi → pilih mode "Beli Dulu". Input kandang asal, harga per kg, bobot kirim, dan jumlah ekor. Semua tersimpan otomatis dan langsung masuk ke kalkulasi modal.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung integrasi harga pasar ayam hari ini untuk broker?',
      a: 'Ya. Dashboard broker menampilkan harga pasar terkini yang diperbarui setiap hari. Harga ini bersumber dari rata-rata transaksi broker aktif di TernakOS, sehingga lebih akurat dari data scraper biasa.',
      link: '/harga-pasar',
    },
    {
      q: 'Bisakah mengirim nota timbangan langsung ke WhatsApp peternak atau pembeli?',
      a: 'Bisa. Setelah transaksi selesai, klik tombol "Kirim Nota" — sistem otomatis membuka WhatsApp dengan nota yang sudah diformat rapi berisi detail transaksi. Tidak perlu ketik ulang.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melacak piutang pembeli atau RPA yang belum bayar di TernakOS?',
      a: 'Menu RPA menampilkan total piutang per pembeli secara real-time. Kamu bisa lihat breakdown per transaksi, catat pembayaran partial (cash/transfer/giro), dan sistem menghitung saldo sisa otomatis. Ada alert otomatis saat jatuh tempo.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada laporan selisih timbangan antara timbangan kandang dan timbangan saat tiba di RPA?',
      a: 'Ada. TernakOS memisahkan bobot kirim (initial_weight_kg) dan bobot tiba (arrived_weight_kg). Selisihnya disebut susut berat (shrinkage) dan otomatis masuk ke loss report. Revenue dihitung dari bobot tiba, bukan bobot kirim — jadi profit selalu akurat.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung margin keuntungan broker ayam secara otomatis?',
      a: 'Margin = (Harga Jual per kg × Bobot Tiba) − Modal Beli − Biaya Kirim − Biaya Lainnya. TernakOS menghitung ini otomatis saat kamu input data pengiriman. Tidak perlu kalkulator.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa mencatat transaksi beli dulu sebelum ada pembeli (order dulu)?',
      a: 'Bisa. Wizard transaksi punya dua mode: "Beli Dulu" (input pembelian kandang → lalu jual) dan "Order Dulu" (dapat pesanan dari RPA dulu → lalu cari kandang → lalu kirim). Pilih sesuai pola bisnis kamu.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara input data sopir dan kendaraan pengiriman ayam di TernakOS?',
      a: 'Menu Armada memungkinkan kamu daftarkan semua kendaraan (plat, tipe, kapasitas) dan sopir (nama, HP, nomor SIM, upah per trip). Saat catat pengiriman, tinggal pilih dari database yang sudah ada.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS punya fitur untuk mencatat mortalitas atau kematian ayam saat pengiriman?',
      a: 'Ya. Saat catat kedatangan pengiriman, input ekor tiba vs ekor kirim. Sistem otomatis membuat loss report mortalitas, menghitung jumlah yang mati, dan estimasi kerugian finansialnya.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melihat cash flow harian broker ayam di TernakOS?',
      a: 'Menu Cash Flow menampilkan semua pemasukan dan pengeluaran per periode: hari ini, minggu ini, bulan ini, bulan lalu, keseluruhan, atau rentang tanggal custom. Setiap baris ditampilkan transparan per jenis biaya.',
      link: '/fitur',
    },
    {
      q: 'Apakah bisa mencatat transaksi broker ayam yang melibatkan beberapa kandang sekaligus?',
      a: 'Bisa. Setiap transaksi terhubung ke satu kandang mitra. Untuk pengiriman gabungan dari beberapa kandang, buat transaksi terpisah per kandang. Semua tetap teragregasi di dashboard beranda dan cash flow.',
    },
    {
      q: 'Bagaimana cara mencatat payment terms NET 7 atau NET 30 untuk pembeli ayam?',
      a: 'Saat input penjualan, pilih payment terms: Cash, NET 3, NET 7, NET 14, atau NET 30 hari. Sistem otomatis menghitung tanggal jatuh tempo dan menampilkan alert saat mendekati due date.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa dipakai untuk broker ayam kampung atau jenis ayam lainnya?',
      a: 'Ya. TernakOS mendukung berbagai tipe ayam: broiler, kampung, petelur afkir, dan jenis lainnya. Kamu bisa input chicken_type sesuai kebutuhan saat mencatat transaksi.',
    },
    {
      q: 'Apakah ada fitur rating kualitas kandang mitra untuk broker ayam?',
      a: 'Ada. Setiap kandang bisa diberi rating 1–5 bintang berdasarkan kualitas pengiriman terakhir (bobot, kesehatan, ketepatan waktu). Ini membantu kamu prioritaskan kandang mitra terbaik.',
      link: '/fitur',
    },
    {
      q: 'Bisakah sopir pengiriman ayam mengupdate status kiriman dari HP-nya sendiri?',
      a: 'Bisa. Sopir mendapat akses khusus dengan role "Sopir" via kode undangan. Dari dashboard sopir, mereka bisa lihat daftar pengiriman yang di-assign dan update status tanpa bisa akses data keuangan.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengelola banyak kandang mitra sekaligus dalam satu akun broker?',
      a: 'Menu Kandang menampilkan database semua kandang mitra kamu: stok tersedia, bobot rata-rata, status (siap/growing/aktif), dan riwayat transaksi per kandang. Filter dan cari kandang dengan cepat.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa menghitung biaya transport per kg untuk broker ayam?',
      a: 'Ya. Saat input pengiriman, masukkan biaya kirim total. TernakOS otomatis menghitung biaya transport per kg berdasarkan bobot yang dikirim dan memperhitungkannya dalam kalkulasi margin akhir.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencetak atau mengexport laporan transaksi broker ayam?',
      a: 'Laporan transaksi bisa dilihat dengan filter tanggal fleksibel di menu Transaksi dan Cash Flow. Export laporan ke format digital tersedia dan fitur cetak PDF sedang dalam pengembangan.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada fitur untuk mencatat biaya operasional tambahan broker seperti bahan bakar atau tol?',
      a: 'Ada. Menu Cash Flow memiliki fitur "Catat Biaya Tambahan" (extra_expenses) untuk mencatat pengeluaran di luar transaksi utama: bahan bakar, tol, pakan cadangan, biaya kandang, dan lainnya.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung net profit broker ayam per bulan di TernakOS?',
      a: 'Net Profit = Total Pendapatan Penjualan − Modal Beli − Biaya Pengiriman − Loss Mortalitas − Biaya Extra. TernakOS merangkum ini otomatis di Cash Flow dengan filter periode bulanan.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung pembayaran partial atau cicilan dari pembeli ayam?',
      a: 'Ya. Setiap transaksi bisa dicatat dengan status: Lunas, Belum Lunas, atau Sebagian. Untuk pembayaran partial, kamu catat setiap kali ada pembayaran masuk dan sistem update saldo piutang otomatis.',
      link: '/fitur',
    },
    {
      q: 'Apakah data transaksi broker ayam di TernakOS bisa dilihat oleh staf atau karyawan?',
      a: 'Tergantung role yang kamu berikan. Role Staff bisa lihat dan input transaksi operasional tetapi tidak bisa akses Cash Flow dan data keuangan sensitif. Role View Only hanya bisa lihat tanpa bisa edit apapun.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melaporkan loss atau kerugian akibat ayam mati selama pengiriman ke laporan keuangan?',
      a: 'Loss report mortalitas dibuat otomatis saat kamu input data kedatangan pengiriman. Estimasi kerugian (ekor mati × harga per kg × bobot rata-rata) otomatis masuk ke total kerugian di Cash Flow.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS punya fitur simulator keuntungan untuk broker ayam sebelum deal?',
      a: 'Ya. Menu Simulator memungkinkan kamu input harga beli kandang, estimasi bobot, biaya kirim, dan target harga jual — sistem langsung menampilkan estimasi margin per kg dan total profit. Berguna sebelum negosiasi harga.',
      link: '/fitur',
    },
    {
      q: 'Bisakah broker ayam melihat histori harga timbangan semua kandang mitra sebelumnya?',
      a: 'Bisa. Setiap kandang mitra memiliki riwayat transaksi lengkap. Kamu bisa lihat histori harga beli, bobot, dan tanggal transaksi dari kandang tersebut untuk referensi negosiasi.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung transaksi ayam broiler, ayam kampung, dan bebek dalam satu platform?',
      a: 'Ya. TernakOS tidak membatasi jenis unggas. Kamu bisa input chicken_type sesuai jenis yang diperdagangkan. Satu akun broker bisa mencatat transaksi berbagai jenis unggas sekaligus.',
    },
    {
      q: 'Bagaimana cara memantau reliability atau reputasi pembeli RPA di TernakOS?',
      a: 'Setiap RPA/pembeli memiliki reliability score yang dihitung berdasarkan riwayat pembayaran (tepat waktu vs telat) dan total outstanding. Score ini membantu kamu memutuskan apakah akan perpanjang kredit ke pembeli tersebut.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada alert otomatis saat piutang broker ayam jatuh tempo?',
      a: 'Ya. Sistem notifikasi TernakOS mengirim alert in-app ketika ada piutang yang mendekati atau melewati tanggal jatuh tempo. Tidak perlu ingat manual tanggal-tanggal jatuh tempo pembeli.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencatat pengiriman ayam dengan dua kendaraan berbeda untuk satu transaksi penjualan?',
      a: 'Setiap pengiriman dicatat terpisah dengan kendaraan dan sopir masing-masing. Untuk satu penjualan yang dikirim dua kendaraan, buat dua entri pengiriman yang terhubung ke penjualan yang sama.',
    },
    {
      q: 'Apakah TernakOS bisa dipakai untuk broker ayam yang beroperasi di beberapa kota sekaligus?',
      a: 'Bisa. Satu akun broker bisa mencatat kandang mitra dan pembeli dari berbagai lokasi. Filter dan laporan bisa disesuaikan per wilayah melalui catatan di profil kandang dan RPA.',
    },
    {
      q: 'Bagaimana cara mendaftarkan kandang baru sebagai mitra broker di TernakOS?',
      a: 'Buka menu Kandang → Tambah Kandang. Isi nama kandang, pemilik, nomor HP, lokasi, dan kapasitas. Kandang langsung bisa dipilih saat mencatat transaksi berikutnya.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung harga beli ayam per ekor selain per kilogram?',
      a: 'Sistem kalkulasi utama TernakOS menggunakan harga per kg (standar industri broiler Indonesia). Untuk kebutuhan pencatatan per ekor, kamu bisa manfaatkan field notes atau gunakan konversi bobot rata-rata.',
    },
    {
      q: 'Bagaimana cara melihat tren margin broker ayam dalam 3 bulan terakhir?',
      a: 'Menu Cash Flow dengan filter "Keseluruhan" atau pilih range tanggal 3 bulan menampilkan grafik tren net profit harian. Kamu bisa langsung lihat tren naik turun margin per periode.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS punya fitur untuk mencatat pembelian ayam yang dibayar dengan giro atau cek?',
      a: 'Saat mencatat pembayaran, pilih metode: cash, transfer bank, atau giro. Field referensi nomor giro/cek tersedia untuk keperluan audit dan rekonsiliasi.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menangani transaksi yang dibatalkan setelah dicatat di TernakOS?',
      a: 'TernakOS menggunakan sistem soft-delete — data tidak benar-benar dihapus. Kamu bisa hapus transaksi dari tampilan aktif, dan data tetap bisa dipulihkan dari menu Recycle Bin di Akun jika diperlukan.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung integrasi dengan timbangan digital di kandang?',
      a: 'Saat ini input bobot dilakukan manual. Integrasi dengan timbangan digital IoT ada di roadmap pengembangan TernakOS untuk paket Business.',
    },
    {
      q: 'Bisakah broker ayam melihat estimasi stok ayam siap panen dari semua kandang mitra sekaligus?',
      a: 'Bisa. Menu Kandang menampilkan status tiap kandang: ready (siap panen), growing (masih tumbuh), atau empty (kosong). Kamu bisa lihat estimasi bobot dan jumlah ekor tersedia dari seluruh kandang mitra.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada fitur manajemen kontrak harga antara broker dan kandang mitra?',
      a: 'Saat ini harga dicatat per transaksi. Fitur kontrak harga jangka panjang dengan kandang mitra ada dalam roadmap pengembangan kami.',
    },
    {
      q: 'Bagaimana cara broker ayam di TernakOS membedakan pendapatan dari berbagai tipe pembeli (RPA, pasar, langsung)?',
      a: 'Setiap transaksi penjualan memiliki field buyer_type: RPA, Pedagang Pasar, Restoran, Pengepul, Supermarket, atau Lainnya. Laporan Cash Flow bisa difilter per tipe pembeli untuk analisis profitabilitas.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa menghitung HPP (Harga Pokok Penjualan) per kg untuk broker ayam?',
      a: 'Ya. HPP per kg = (Total Modal Beli + Biaya Transport + Biaya Lain) ÷ Bobot Tiba. TernakOS menghitung ini otomatis per transaksi dan menampilkannya di detail transaksi dan laporan Cash Flow.',
      link: '/fitur',
    },
  ],

  // ──────────────────────────────────────────────────────────────
  // KATEGORI 3: SEMBAKO (40)
  // ──────────────────────────────────────────────────────────────
  sembako: [
    {
      q: 'Bagaimana sistem FIFO (First In First Out) bekerja di TernakOS untuk agen sembako?',
      a: 'FIFO di TernakOS bekerja per batch produk. Saat ada penjualan, sistem otomatis mendebet stok dari batch yang masuk paling awal. Ini memastikan barang yang masuk pertama keluar pertama, mencegah stok expired mengendap di gudang.',
      link: '/fitur',
    },
    {
      q: 'Bisakah mengelola stok telur, beras, minyak goreng, dan sembako lainnya dalam satu dashboard?',
      a: 'Bisa. TernakOS mendukung multi-item sembako tanpa batas. Setiap produk memiliki profil lengkap: satuan (kg, sak, karton, liter), harga beli, harga jual, stok real-time, dan riwayat mutasi.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara input stok masuk per batch dari supplier di TernakOS?',
      a: 'Buka menu Gudang → Tambah Stok → pilih produk → input batch baru: jumlah, harga beli per unit, dan tanggal masuk. Sistem otomatis membuat batch baru yang akan dikelola dengan metode FIFO.',
      link: '/fitur',
    },
    {
      q: 'Apakah stok sembako otomatis berkurang saat ada penjualan yang dicatat?',
      a: 'Ya. Setiap kali transaksi penjualan berhasil dicatat, stok produk yang terjual otomatis berkurang sesuai FIFO. Kamu tidak perlu update stok manual setelah setiap penjualan.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melihat produk sembako yang paling laris dalam satu bulan?',
      a: 'Menu Laporan menampilkan analitik penjualan per produk: total terjual, revenue, HPP, dan profit bersih. Kamu bisa sort berdasarkan volume atau nilai penjualan untuk identifikasi produk terlaris.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung multi-satuan untuk produk sembako (misalnya jual per kg tapi beli per sak)?',
      a: 'Ya. Setiap produk bisa memiliki satuan utama dan satuan sekunder dengan konversi otomatis. Contoh: beli per sak (50 kg), jual per kg — TernakOS menghitung konversinya otomatis.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencatat faktur pembelian dari supplier sembako yang berisi banyak item sekaligus?',
      a: 'Fitur multi-item entry di menu Gudang memungkinkan kamu input puluhan item dalam satu faktur pembelian. Tidak perlu buat entri terpisah per produk.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada alert stok minimum untuk produk sembako agar tidak kehabisan barang?',
      a: 'Ya. TernakOS menampilkan status stok per produk: Aman (hijau), Cukup (kuning), atau Menipis (merah + notifikasi). Kamu bisa set threshold minimum per produk sesuai kebutuhan.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung HPP (Harga Pokok Penjualan) produk sembako dengan metode FIFO?',
      a: 'TernakOS menghitung HPP FIFO otomatis saat ada penjualan. HPP menggunakan harga dari batch pertama yang masuk. Jika batch pertama habis, sistem lanjut ke batch berikutnya secara otomatis.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung sistem harga grosir dan eceran yang berbeda untuk produk sembako?',
      a: 'Ya. Setiap produk bisa memiliki harga jual berbeda per tipe pelanggan. Fitur dual-pricing memungkinkan harga retail (eceran) dan harga partai (grosir) dikelola terpisah.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencatat penjualan sembako dengan sistem tempo atau kredit ke toko mitra?',
      a: 'Pilih payment terms "Tempo" saat input penjualan dan isi tanggal jatuh tempo. Transaksi otomatis masuk ke dashboard piutang. Saat toko bayar, catat pembayaran dan saldo piutang update real-time.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa mengelola piutang dari banyak toko atau agen sekaligus?',
      a: 'Bisa. Dashboard piutang menampilkan total outstanding per pelanggan, riwayat pembayaran, dan limit kredit. Kamu bisa monitor semua toko mitra dalam satu tampilan tanpa Excel.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menangani barang rusak atau expired di gudang sembako?',
      a: 'TernakOS memiliki fitur penyesuaian stok (stock adjustment) untuk mencatat pengurangan stok akibat barang rusak atau expired. Data ini tercatat di riwayat mutasi stok untuk keperluan audit.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung pengiriman sembako ke beberapa toko dalam satu hari?',
      a: 'Ya. Setiap penjualan bisa dilengkapi data pengiriman: sopir, kendaraan, dan status (dikirim/tiba). Kamu bisa catat multiple pengiriman per hari ke toko berbeda.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung profit bersih agen sembako per bulan di TernakOS?',
      a: 'Menu Laporan menampilkan profit bersih: Total Pendapatan − HPP (FIFO) − Biaya Operasional − Biaya Gaji. Filter per periode bulan untuk melihat profit bulanan dengan detail breakdown.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada fitur untuk mencatat retur barang dari pelanggan di TernakOS?',
      a: 'Saat ini retur dapat dicatat melalui penyesuaian stok manual dan penghapusan atau edit transaksi penjualan terkait. Fitur retur formal dengan alur kerja terstruktur ada dalam roadmap kami.',
    },
    {
      q: 'Bagaimana TernakOS membantu agen sembako mencegah selisih stok antara fisik dan sistem?',
      a: 'TernakOS menyediakan fitur Stok Opname untuk rekonsiliasi stok. Kamu input stok fisik hasil hitung ulang dan sistem menampilkan selisih per produk yang perlu disesuaikan.',
      link: '/fitur',
    },
    {
      q: 'Apakah bisa mencatat gaji atau komisi karyawan pengiriman sembako di TernakOS?',
      a: 'Ya. Modul Pegawai memungkinkan pencatatan data karyawan, gaji, dan payroll. Kamu bisa catat pembayaran gaji bulanan dan komisi per pengiriman.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung manajemen supplier bahan sembako dari berbagai daerah?',
      a: 'Ya. Database supplier mencatat nama, kontak, lokasi, dan riwayat pembelian per supplier. Kamu bisa lihat histori harga per supplier untuk negosiasi yang lebih baik.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melihat laporan penjualan sembako per periode untuk keperluan pajak?',
      a: 'Menu Laporan menampilkan ringkasan penjualan per periode dengan total omzet, HPP, dan profit bersih. Data ini bisa dijadikan dasar pelaporan pajak sederhana.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa digunakan untuk toko sembako yang memiliki beberapa cabang?',
      a: 'Paket Business mendukung multi-pengguna dan konsolidasi laporan. Setiap cabang bisa dioperasikan oleh tim berbeda dengan akses yang dikontrol dari satu akun owner.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara input harga jual yang berbeda untuk pelanggan yang berbeda?',
      a: 'Kamu bisa set harga jual saat membuat invoice penjualan. Sistem dual-pricing mendukung harga retail dan grosir sebagai default, dan harga bisa dioverride per transaksi sesuai negosiasi.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung transaksi sembako dengan pembayaran tunai dan transfer bank?',
      a: 'Ya. Setiap transaksi bisa dicatat dengan metode pembayaran: tunai, transfer bank, atau tempo (piutang). Untuk transaksi tempo, kamu bisa catat pembayaran saat pelanggan melunasi.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengetahui margin keuntungan per produk sembako di TernakOS?',
      a: 'Laporan profitabilitas per produk menampilkan harga jual rata-rata, HPP FIFO, dan margin persen per produk. Identifikasi produk mana yang paling menguntungkan dan mana yang perlu direview harganya.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa dipakai untuk distributor sembako yang melayani ratusan toko?',
      a: 'Bisa. Database pelanggan tidak ada batas jumlah. Paket Business mendukung operasi skala besar dengan tim banyak dan laporan konsolidasi semua toko dalam satu dashboard.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara mencatat diskon atau potongan harga untuk pelanggan setia sembako?',
      a: 'Diskon bisa dicatat sebagai penyesuaian harga saat membuat invoice penjualan. Field catatan tersedia untuk mendokumentasikan alasan diskon.',
    },
    {
      q: 'Apakah ada notifikasi ketika stok produk sembako tertentu hampir habis?',
      a: 'Ya. TernakOS menampilkan indikator visual (merah/kuning/hijau) per produk berdasarkan level stok. Notifikasi in-app dikirim saat stok masuk kategori "Menipis".',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengelola produk sembako yang memiliki tanggal kadaluarsa?',
      a: 'Setiap batch stok masuk memiliki tanggal pembelian. Dengan metode FIFO, batch tertua otomatis dijual lebih dulu sehingga risiko expired berkurang. Fitur tracking tanggal expired eksplisit ada dalam roadmap.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung POS (Point of Sale) untuk kasir toko sembako?',
      a: 'Ya. Fitur POS di TernakOS dirancang untuk transaksi kasir yang cepat: pilih produk, input jumlah, dan checkout. Invoice otomatis dibuat dan stok langsung berkurang.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melihat histori pembelian dari supplier sembako tertentu?',
      a: 'Di menu Toko Supplier, pilih supplier yang ingin dilihat. Sistem menampilkan seluruh riwayat pembelian dari supplier tersebut: tanggal, produk, jumlah, harga, dan total nilai.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung kategori produk sembako yang fleksibel?',
      a: 'Ya. Kamu bisa membuat dan mengelola kategori produk sesuai kebutuhan: beras, minyak, tepung, gula, sembako kering, dll. Tidak ada batasan kategori.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melacak pengiriman sembako yang sedang dalam perjalanan?',
      a: 'Status pengiriman bisa diupdate oleh sopir langsung dari dashboard sopir mereka. Kamu bisa pantau status: disiapkan, dikirim, atau sudah tiba di toko tujuan.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa menghasilkan invoice atau faktur penjualan sembako yang profesional?',
      a: 'Ya. Setiap penjualan otomatis menghasilkan invoice bernomor urut dengan detail lengkap: tanggal, produk, jumlah, harga, dan total. Invoice bisa dikirim via WhatsApp ke pelanggan.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara memastikan akurasi stok sembako setelah banyak transaksi?',
      a: 'Lakukan Stok Opname secara berkala melalui menu fitur. Hitung stok fisik, input ke sistem, dan TernakOS akan menampilkan selisih yang perlu disesuaikan beserta nilai kerugiannya.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung berbagai metode pembayaran gaji karyawan toko sembako?',
      a: 'Ya. Modul Pegawai mendukung pencatatan gaji dengan metode: gaji bulanan flat, bonus per pengiriman, atau persentase dari omzet. Riwayat pembayaran per karyawan tersimpan lengkap.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghubungi supplier sembako langsung dari TernakOS?',
      a: 'Setiap profil supplier menyimpan nomor WhatsApp. Klik tombol WA di profil supplier untuk langsung membuka chat WhatsApp dengan supplier tersebut.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung stok konsinyasi untuk produk sembako?',
      a: 'Fitur konsinyasi khusus belum tersedia, namun kamu bisa mengelola stok konsinyasi secara manual dengan memanfaatkan catatan di profil supplier dan penyesuaian stok.',
    },
    {
      q: 'Bagaimana cara menganalisis tren penjualan sembako untuk perencanaan pembelian stok?',
      a: 'Laporan penjualan per periode membantu kamu melihat tren: produk apa yang meningkat penjualannya, kapan peak season, dan berapa rata-rata volume per bulan. Data ini jadi dasar planning pembelian stok.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa diintegrasikan dengan sistem timbangan digital untuk produk curah?',
      a: 'Saat ini input berat dilakukan manual. Integrasi timbangan digital untuk produk curah ada dalam roadmap pengembangan TernakOS.',
    },
    {
      q: 'Bagaimana cara menangani pembayaran piutang sembako yang datang sebagian-sebagian?',
      a: 'Setiap kali toko mitra bayar sebagian, catat di menu pembayaran dengan jumlah yang dibayar. Sistem otomatis update saldo piutang dan menampilkan status "Sebagian" hingga lunas penuh.',
      link: '/fitur',
    },
  ],

  // ──────────────────────────────────────────────────────────────
  // KATEGORI 4: PETERNAK (40)
  // ──────────────────────────────────────────────────────────────
  peternak: [
    {
      q: 'Apa itu kalkulator FCR di TernakOS dan bagaimana cara menggunakannya?',
      a: 'FCR (Feed Conversion Ratio) mengukur efisiensi pakan: berapa kg pakan dibutuhkan untuk menghasilkan 1 kg bobot ayam. Di TernakOS, FCR dihitung otomatis setiap kali kamu input data harian (pakan terpakai + bobot sample). Semakin rendah FCR, semakin efisien dan menguntungkan kandang kamu.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung Indeks Performa (IP) kandang ayam broiler secara otomatis di TernakOS?',
      a: 'IP dihitung otomatis saat siklus selesai: IP = (Survival Rate × Bobot Rata-rata × 100) ÷ (FCR × Umur Panen). TernakOS menampilkan IP dengan benchmark: >400 Sangat Baik, 300-400 Baik, <300 Perlu Evaluasi.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencatat kematian harian atau mortalitas ayam broiler di TernakOS?',
      a: 'Buka Input Harian → pilih siklus aktif → isi form: tanggal, jumlah mati hari ini, pakan terpakai (kg), dan bobot sample (gram). Data mortalitas kumulatif terupdate otomatis di dashboard siklus.',
      link: '/fitur',
    },
    {
      q: 'Bisakah memantau pemakaian pakan per hari dan per periode siklus kandang ayam?',
      a: 'Ya. Setiap input harian mencatat pakan terpakai. TernakOS menampilkan grafik pakan harian, total pakan per siklus, dan proyeksi kebutuhan pakan hingga panen berdasarkan tren konsumsi.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada grafik pertumbuhan bobot ayam broiler per hari di TernakOS?',
      a: 'Ya. Dashboard siklus menampilkan grafik bobot rata-rata harian yang kamu catat dari sampling. Kamu bisa membandingkan kurva pertumbuhan aktual dengan standar FCR target yang kamu tetapkan.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara membandingkan hasil panen siklus ini dengan siklus sebelumnya?',
      a: 'Menu Laporan Siklus menampilkan semua siklus selesai dengan KPI masing-masing: FCR, IP, survival rate, HPP per kg, dan profit bersih. Kamu bisa bandingkan performa antar siklus untuk evaluasi.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung pencatatan vaksinasi ayam broiler per siklus?',
      a: 'Ya. Modul Vaksinasi memungkinkan pencatatan: jenis vaksin, tanggal, dosis, dan tenaga pelaksana. Data ini terintegrasi ke laporan biaya siklus dan bisa dijadikan referensi untuk siklus berikutnya.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung HPP per kg ayam broiler saat panen di TernakOS?',
      a: 'HPP per kg = (Biaya DOC + Biaya Pakan + Biaya Obat/Vaksin + Biaya TK + Biaya Lainnya) ÷ Total Bobot Panen. TernakOS menghitung ini otomatis dari semua biaya yang dicatat selama siklus.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung peternak yang bekerja sama dengan perusahaan INTI (kemitraan)?',
      a: 'Ya. TernakOS mendukung model bisnis kemitraan penuh, mitra pakan, dan mitra sapronak. Kamu bisa input nama INTI (CP Prima, Japfa, Charoen Pokphand, dll), harga kontrak, dan sistem deducting sapronak otomatis saat catat panen.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencatat biaya DOC (Day Old Chick) saat memulai siklus baru?',
      a: 'Saat membuat siklus baru, isi jumlah DOC masuk dan harga per ekor. TernakOS otomatis menghitung total biaya DOC dan memasukkannya ke akumulasi biaya siklus.',
      link: '/fitur',
    },
    {
      q: 'Apakah bisa memantau lebih dari satu kandang sekaligus di dashboard peternak TernakOS?',
      a: 'Bisa. Halaman beranda peternak menampilkan semua kandang aktif dalam bentuk kartu. Setiap kartu menampilkan ringkasan: umur ayam hari ini, FCR terkini, stok pakan, dan status siklus.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung estimasi keuntungan peternak broiler sebelum panen selesai?',
      a: 'TernakOS menghitung estimasi profit real-time: (Estimasi Bobot Panen × Harga Jual Target) − Total Biaya Siklus Berjalan. Kamu bisa pantau apakah target keuntungan tercapai sebelum hari H panen.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada fitur pencatatan biaya obat-obatan dan vitamin ayam per siklus?',
      a: 'Ya. Modul Biaya Siklus mencatat semua jenis pengeluaran: DOC, pakan, obat, vaksin, listrik, air, litter, dan biaya lainnya. Semua terakumulasi ke total biaya siklus secara otomatis.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengelola stok pakan ayam (starter, grower, finisher) di TernakOS?',
      a: 'Menu Pakan menampilkan stok per jenis pakan: Starter, Grower, Finisher, Konsentrat, Jagung, Dedak. Status stok: Aman (≥500 kg), Cukup (100-499 kg), Menipis (<100 kg). Catat pembelian dan pemakaian dari sini.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada notifikasi otomatis saat stok pakan ayam hampir habis?',
      a: 'Ya. Saat stok pakan turun di bawah 100 kg untuk jenis tertentu, TernakOS menampilkan notifikasi in-app dan indikator merah berkedip di dashboard. Berguna agar tidak kehabisan pakan di tengah siklus.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa dipakai untuk peternak ayam layer (petelur) juga?',
      a: 'Dashboard peternak layer sedang dalam pengembangan. Saat ini peternak ayam petelur bisa mendaftar di waiting list untuk mendapat akses pertama ketika fitur tersedia.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara mencatat panen ayam broiler dan menghitung total pendapatan panen di TernakOS?',
      a: 'Buka siklus aktif → Tutup Siklus → isi data panen: tanggal, jumlah ekor panen, total bobot, harga per kg, dan tipe pembeli (broker/RPA/pasar). TernakOS langsung menghitung pendapatan bersih dan profit siklus.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa dipakai oleh peternak mandiri yang tidak bermitra dengan perusahaan?',
      a: 'Sangat cocok. Model bisnis "Mandiri Murni" dan "Mandiri Semi" tersedia penuh di TernakOS. Kamu catat semua biaya sendiri dan menentukan harga jual berdasarkan harga pasar terkini.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mendaftarkan anak kandang (pekerja) dan mencatat gaji mereka di TernakOS?',
      a: 'Menu Tim → Tambah Anggota → undang via kode 6 digit dengan role "Pekerja". Untuk penggajian, menu Anak Kandang mendukung sistem gaji: flat bulanan, bonus panen, atau kombinasi keduanya.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada template input harian peternak ayam yang mudah digunakan dari HP?',
      a: 'Ya. Form input harian didesain untuk diselesaikan dalam 2 menit dari HP: isi mortalitas, pakan terpakai, dan bobot sample. Sistem otomatis menghitung FCR hari itu dan update grafik.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara melihat survival rate atau tingkat hidup ayam per siklus di TernakOS?',
      a: 'Survival Rate = ((DOC Masuk - Total Mati Kumulatif) ÷ DOC Masuk) × 100%. TernakOS menghitung dan menampilkan ini otomatis di dashboard siklus dan laporan akhir siklus.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung multiple siklus aktif di kandang yang sama secara bersamaan?',
      a: 'TernakOS mendukung multi-siklus paralel per kandang. Ini berguna untuk kandang yang dibagi zona atau kandang yang memiliki beberapa batch DOC masuk di waktu berbeda.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung biaya produksi per ekor ayam broiler di TernakOS?',
      a: 'Biaya per ekor = Total Biaya Siklus ÷ Jumlah Ekor Panen. TernakOS menghitung ini otomatis di laporan siklus. Berguna untuk membandingkan efisiensi antar siklus atau antar kandang.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada fitur untuk mencatat jadwal panen estimasi dan notifikasi sebelum panen?',
      a: 'Ya. Saat buat siklus baru, isi tanggal DOC masuk dan target umur panen (hari). TernakOS otomatis menghitung estimasi tanggal panen dan menampilkannya di dashboard siklus.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara input sampling bobot ayam broiler per hari di TernakOS?',
      a: 'Di form input harian, ada field "Bobot Rata-rata Sample (gram)". Masukkan bobot rata-rata dari sampling 5-10 ekor perwakilan. TernakOS menggunakan data ini untuk kalkulasi FCR dan estimasi total bobot siap panen.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa mendeteksi apakah FCR kandang saya sudah optimal atau perlu perbaikan?',
      a: 'Ya. TernakOS memberikan benchmark FCR: <1,5 (Sangat Baik), 1,5-1,7 (Baik), 1,7-1,9 (Cukup), >1,9 (Perlu Evaluasi). Benchmark IP juga tersedia untuk evaluasi menyeluruh performa siklus.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencatat biaya listrik dan air kandang ayam per siklus?',
      a: 'Di menu Biaya Siklus, pilih kategori pengeluaran "Listrik" atau "Air", isi jumlah dan tanggal. Semua biaya utilitas terakumulasi ke total biaya siklus dan tercermin di HPP per kg akhir.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung peternak yang memiliki kandang di lokasi yang berbeda-beda?',
      a: 'Ya. Setiap kandang memiliki field lokasi. Dashboard menampilkan semua kandang tanpa batasan lokasi. Kamu bisa kelola kandang di desa berbeda, bahkan kecamatan berbeda, dari satu akun.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengetahui kapan waktu terbaik untuk memanen ayam broiler berdasarkan data di TernakOS?',
      a: 'Analisis siklus menampilkan tren FCR dan bobot harian. Waktu panen optimal biasanya saat FCR mulai meningkat (efisiensi turun) dan bobot target sudah tercapai. TernakOS membantu kamu membaca tren ini dari grafik.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung pencatatan penggunaan litter atau sekam kandang per siklus?',
      a: 'Ya. Kategori biaya "Litter" tersedia di modul Biaya Siklus. Kamu bisa catat pembelian sekam, jumlah, harga, dan tanggal penggunaan.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengundang manajer kandang untuk bisa akses TernakOS tanpa melihat data keuangan?',
      a: 'Undang via kode 6 digit dengan role "Manajer" (peternak). Manajer bisa input harian, buka/tutup siklus, catat vaksinasi, dan lihat laporan performa. Tetapi tidak bisa akses data keuangan sensitif dan tidak bisa undang anggota baru.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada laporan perbandingan FCR antara siklus musim hujan dan musim kemarau di TernakOS?',
      a: 'Menu laporan siklus menampilkan semua siklus historis dengan tanggal dan FCR masing-masing. Kamu bisa analisis manual perbandingan antar musim dari data yang tersedia.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mencatat pembayaran gaji anak kandang dengan bonus panen di TernakOS?',
      a: 'Sistem penggajian mendukung kombinasi gaji flat + bonus panen. Bonus bisa otomatis dihitung jika FCR di bawah target yang kamu tetapkan. Catat pembayaran per karyawan dengan tanggal dan metode bayar.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS bisa dipakai untuk monitoring kandang ayam dari jarak jauh?',
      a: 'Ya. Karena TernakOS berbasis cloud, kamu bisa pantau semua dashboard dari mana saja: rumah, perjalanan, atau dari kota lain. Anak kandang input data dari lokasi kandang, kamu pantau dari mana saja.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara menghitung break-even point (BEP) peternak broiler dengan TernakOS?',
      a: 'BEP per kg = Total Biaya Siklus ÷ Total Bobot Panen. TernakOS menampilkan ini di laporan siklus. Bandingkan BEP dengan harga pasar terkini dari menu Harga Pasar untuk keputusan jual yang tepat.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada fitur reminder atau jadwal untuk pemberian obat rutin ayam broiler di TernakOS?',
      a: 'Fitur jadwal vaksinasi dan obat-obatan rutin sedang dalam roadmap pengembangan. Saat ini pencatatan dilakukan manual per kejadian di modul Vaksinasi.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengelola kandang yang sedang istirahat (kosong) antara dua siklus?',
      a: 'Saat siklus selesai, status kandang otomatis berubah ke "Kosong" dan bisa diisi kembali dengan siklus baru. Histori siklus sebelumnya tetap tersimpan untuk referensi.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung analisis profitabilitas per model bisnis peternak (mandiri vs mitra)?',
      a: 'Ya. Laporan siklus mencakup breakdown biaya lengkap yang bisa dibandingkan antar siklus. Karena model bisnis tersimpan per kandang, kamu bisa analisis profitabilitas model mandiri vs mitra dari data historis.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada fitur untuk peternak menjual langsung ke broker via TernakOS?',
      a: 'Ya. TernakOS Market memungkinkan peternak listing stok ayam siap panen. Broker yang melihat listing bisa langsung menghubungi via WhatsApp untuk negosiasi harga.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mendapatkan laporan performa kandang selama 6 bulan terakhir dari TernakOS?',
      a: 'Menu Laporan → pilih tab Siklus Selesai. Semua siklus yang sudah tutup ditampilkan dengan KPI lengkap. Untuk grafik tren 6 bulan, gunakan filter tanggal di halaman laporan.',
      link: '/fitur',
    },
  ],

  // ──────────────────────────────────────────────────────────────
  // KATEGORI 5: TEKNIS, KEAMANAN & LANGGANAN (55)
  // ──────────────────────────────────────────────────────────────
  teknis: [
    {
      q: 'Apakah data saya tersimpan di cloud dan aman dari kehilangan?',
      a: 'Ya. Semua data TernakOS disimpan di Supabase Cloud (PostgreSQL) dengan replikasi real-time. Data tidak pernah tersimpan hanya di HP kamu — meski HP hilang atau rusak, semua data tetap aman dan bisa diakses dari perangkat lain.',
    },
    {
      q: 'Apa itu Row Level Security (RLS) yang digunakan TernakOS?',
      a: 'Row Level Security adalah fitur keamanan database PostgreSQL yang memastikan setiap pengguna hanya bisa melihat data miliknya sendiri. Di TernakOS, ini berarti data bisnis kamu tidak bisa bocor ke akun pengguna lain meskipun menggunakan server yang sama.',
    },
    {
      q: 'Apakah TernakOS bisa diakses tanpa internet (offline mode)?',
      a: 'TernakOS menggunakan sistem caching lokal dan prefetching — data yang sudah dimuat sebelumnya tetap bisa dilihat saat koneksi terputus sementara. Namun untuk input data baru atau sinkronisasi, koneksi internet tetap diperlukan.',
    },
    {
      q: 'Bagaimana jika saya lupa password akun TernakOS?',
      a: 'Klik "Lupa Password" di halaman login. Masukkan email yang terdaftar dan TernakOS akan mengirim link reset password. Klik link tersebut dan buat password baru dalam waktu kurang dari 5 menit.',
      link: '/login',
    },
    {
      q: 'Apakah ada biaya bulanan atau sekali bayar untuk TernakOS?',
      a: 'TernakOS menggunakan model berlangganan bulanan (atau tahunan dengan diskon). Tidak ada biaya setup atau biaya tersembunyi. Paket Starter tersedia gratis dengan trial 14 hari penuh.',
      link: '/harga',
    },
    {
      q: 'Apakah TernakOS bisa diakses dari laptop dan komputer desktop?',
      a: 'Bisa. TernakOS berjalan di semua browser modern: Chrome, Firefox, Safari, Edge — baik di HP maupun laptop/komputer desktop. Tampilan otomatis menyesuaikan ukuran layar (responsive design).',
    },
    {
      q: 'Bagaimana cara backup data di TernakOS secara manual?',
      a: 'Karena data disimpan otomatis di cloud, backup manual tidak diperlukan. Supabase melakukan snapshot database secara berkala. Untuk export data, gunakan fitur laporan yang tersedia di masing-masing modul.',
    },
    {
      q: 'Apakah TernakOS memiliki enkripsi data saat transmisi?',
      a: 'Ya. Semua koneksi antara browser dan server TernakOS menggunakan HTTPS dengan enkripsi TLS. Data yang dikirim tidak bisa disadap dalam perjalanan.',
    },
    {
      q: 'Berapa banyak pengguna yang bisa diundang dalam satu akun bisnis TernakOS?',
      a: 'Batas pengguna tergantung paket. Starter mendukung hingga beberapa anggota tim, Pro lebih banyak, dan Business mendukung pengguna tidak terbatas. Cek halaman harga untuk detail per paket.',
      link: '/harga',
    },
    {
      q: 'Apakah ada fitur audit trail untuk melihat siapa yang mengubah data di TernakOS?',
      a: 'TernakOS menyimpan log perubahan data. Admin/Owner bisa melihat riwayat aktivitas tim dari menu yang tersedia. Fitur audit trail lengkap tersedia di paket Business.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara menambah atau mengupgrade paket berlangganan TernakOS?',
      a: 'Buka menu Akun → Langganan. Pilih paket yang diinginkan dan ikuti instruksi pembayaran. Upgrade aktif segera setelah pembayaran dikonfirmasi. Fitur tambahan langsung bisa digunakan.',
      link: '/harga',
    },
    {
      q: 'Apakah TernakOS mendukung pembayaran langganan via transfer bank?',
      a: 'Ya. TernakOS mendukung pembayaran via transfer bank. Instruksi rekening tujuan tersedia setelah kamu memilih paket di halaman langganan.',
      link: '/harga',
    },
    {
      q: 'Apa yang terjadi dengan data saya jika masa trial TernakOS berakhir?',
      a: 'Setelah trial 14 hari berakhir, akun masuk mode read-only — kamu masih bisa melihat data yang sudah ada tetapi tidak bisa input data baru. Upgrade ke paket berbayar kapan saja untuk melanjutkan.',
      link: '/harga',
    },
    {
      q: 'Apakah bisa membatalkan berlangganan TernakOS kapan saja?',
      a: 'Ya. Tidak ada kontrak jangka panjang. Kamu bisa batalkan langganan kapan saja dari menu Akun. Akses tetap aktif hingga akhir periode yang sudah dibayar.',
    },
    {
      q: 'Bagaimana cara mengganti email atau nomor HP yang terdaftar di TernakOS?',
      a: 'Buka menu Akun → Pengaturan Profil. Di sini kamu bisa update email, nomor HP, dan informasi bisnis lainnya. Perubahan email memerlukan verifikasi ke email baru.',
    },
    {
      q: 'Apakah TernakOS punya fitur 2FA (Two-Factor Authentication) untuk keamanan login?',
      a: 'Fitur 2FA sedang dalam roadmap keamanan TernakOS. Saat ini keamanan dibantu oleh sistem email verification saat daftar dan reset password yang aman.',
    },
    {
      q: 'Berapa lama data transaksi tersimpan di TernakOS?',
      a: 'Data tersimpan selama akun aktif tanpa batas waktu. Tidak ada penghapusan data otomatis. Bahkan jika berlangganan berakhir, data tetap bisa diakses dalam mode read-only.',
    },
    {
      q: 'Apakah TernakOS bisa diakses dari beberapa perangkat sekaligus?',
      a: 'Ya. Satu akun bisa diakses dari HP, tablet, dan laptop secara bersamaan. Tidak ada batasan jumlah perangkat per akun.',
    },
    {
      q: 'Bagaimana cara menghapus akun TernakOS secara permanen?',
      a: 'Untuk menghapus akun, hubungi tim support TernakOS via WhatsApp atau email. Tim kami akan memproses penghapusan data sesuai kebijakan privasi yang berlaku.',
    },
    {
      q: 'Apakah TernakOS GDPR compliant atau mengikuti regulasi perlindungan data Indonesia?',
      a: 'TernakOS mengikuti prinsip-prinsip perlindungan data pribadi sesuai regulasi Indonesia (UU PDP). Data pribadi pengguna hanya digunakan untuk keperluan operasional platform.',
    },
    {
      q: 'Apakah TernakOS memiliki SLA (Service Level Agreement) uptime server?',
      a: 'TernakOS menggunakan infrastruktur Supabase yang memiliki uptime tinggi dengan monitoring 24/7. Detail SLA tersedia untuk paket Business.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara menghubungi support TernakOS jika ada bug atau error?',
      a: 'Hubungi tim TernakOS via WhatsApp yang tersedia di halaman utama atau melalui email support. Laporkan bug dengan screenshot dan deskripsi langkah reproduksi untuk penanganan lebih cepat.',
    },
    {
      q: 'Apakah TernakOS melakukan update atau pembaruan fitur secara berkala?',
      a: 'Ya. TernakOS dirilis pembaruan fitur secara reguler. Update berjalan otomatis di background — tidak perlu download apapun. Pengguna akan dinotifikasi tentang fitur baru melalui notifikasi in-app.',
    },
    {
      q: 'Apakah karyawan yang diundang bisa dihapus akses-nya dari TernakOS?',
      a: 'Ya. Owner bisa mencabut akses anggota tim kapan saja dari menu Tim. Setelah dicabut, anggota tersebut tidak bisa lagi login ke bisnis tersebut.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara membuat kode undangan untuk karyawan baru di TernakOS?',
      a: 'Menu Tim → Generate Kode. Sistem membuat kode 6 karakter unik yang berlaku 7 hari. Bagikan kode ini ke karyawan baru dan mereka daftar menggunakan kode tersebut — otomatis terhubung ke bisnis kamu dengan role yang sudah ditentukan.',
      link: '/fitur',
    },
    {
      q: 'Apakah role pengguna di TernakOS bisa diubah setelah mereka bergabung?',
      a: 'Ya. Owner bisa mengubah role anggota tim kapan saja dari menu Tim. Perubahan berlaku segera setelah disimpan.',
      link: '/fitur',
    },
    {
      q: 'Apakah ada limit jumlah transaksi per bulan di TernakOS?',
      a: 'Tidak ada limit transaksi di semua paket TernakOS. Kamu bisa catat transaksi sebanyak yang dibutuhkan tanpa khawatir kena batasan.',
      link: '/harga',
    },
    {
      q: 'Bagaimana TernakOS menangani error atau kegagalan saat input data?',
      a: 'TernakOS memiliki validasi data berlapis: validasi di form (real-time) dan validasi di server (sebelum data disimpan ke database). Jika ada error, pesan yang jelas ditampilkan agar kamu bisa memperbaiki input.',
    },
    {
      q: 'Apakah TernakOS bisa diintegrasikan dengan sistem ERP atau akuntansi yang sudah ada?',
      a: 'Integrasi langsung dengan ERP/akuntansi pihak ketiga belum tersedia. Export data dari TernakOS bisa diimport manual ke sistem lain. API untuk integrasi ada dalam roadmap paket Business.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara memindahkan data dari Excel atau catatan manual ke TernakOS?',
      a: 'Saat ini import data dari Excel belum tersedia. Kamu bisa mulai fresh dari TernakOS untuk data baru, atau gunakan fitur backfill untuk memasukkan data historis penting secara manual.',
    },
    {
      q: 'Apakah TernakOS mendukung multiple bahasa selain Bahasa Indonesia?',
      a: 'TernakOS saat ini tersedia dalam Bahasa Indonesia. Dukungan bahasa Inggris ada dalam roadmap untuk mendukung pengguna internasional.',
    },
    {
      q: 'Bagaimana cara reset data bisnis jika ingin mulai dari awal di TernakOS?',
      a: 'Untuk reset data bisnis, hubungi tim support TernakOS. Tim akan membantu proses penghapusan data bisnis tertentu sesuai kebutuhan kamu.',
    },
    {
      q: 'Apakah TernakOS menggunakan teknologi yang terbukti untuk keamanan data?',
      a: 'Ya. TernakOS dibangun di atas Supabase (PostgreSQL) — infrastruktur database yang sama yang digunakan oleh ribuan perusahaan teknologi global. Row Level Security (RLS) adalah standar keamanan enterprise.',
    },
    {
      q: 'Bagaimana cara melihat riwayat aktivitas login ke akun TernakOS?',
      a: 'Riwayat login tersedia di menu Akun → Keamanan. Kamu bisa lihat kapan dan dari perangkat mana terakhir kali akun diakses.',
    },
    {
      q: 'Apakah ada diskon untuk berlangganan TernakOS tahunan?',
      a: 'Ya. Berlangganan tahunan mendapat diskon dibanding bayar bulanan. Cek halaman harga untuk detail promo dan perbandingan harga.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara mendapatkan invoice pembayaran berlangganan TernakOS untuk keperluan pembukuan?',
      a: 'Invoice pembayaran tersedia di menu Akun → Riwayat Tagihan. Kamu bisa download atau cetak invoice untuk keperluan reimbursement atau pembukuan bisnis.',
    },
    {
      q: 'Apakah TernakOS mendukung notifikasi push di HP Android?',
      a: 'TernakOS mendukung notifikasi in-app yang muncul saat kamu membuka aplikasi. Notifikasi push native untuk browser sedang dalam pengembangan.',
    },
    {
      q: 'Berapa lama waktu yang dibutuhkan untuk menguasai semua fitur TernakOS?',
      a: 'Fitur dasar (catat transaksi, lihat dashboard) bisa dikuasai dalam 30 menit pertama. Fitur lanjutan seperti analitik dan multi-kandang biasanya dikuasai dalam 1-2 minggu penggunaan aktif.',
    },
    {
      q: 'Apakah TernakOS menyediakan panduan atau tutorial untuk pengguna baru?',
      a: 'Ya. Onboarding wizard memandu kamu langkah demi langkah saat pertama kali daftar. Panduan singkat tersedia di setiap fitur utama. Tim support juga siap membantu via WhatsApp.',
    },
    {
      q: 'Apakah ada fitur Recycle Bin untuk memulihkan data yang tidak sengaja dihapus?',
      a: 'Ada. TernakOS menggunakan sistem soft-delete — data yang dihapus tidak benar-benar hilang. Fitur Recycle Bin di menu Akun memungkinkan kamu melihat dan memulihkan data: transaksi, kandang, RPA, dan pengiriman.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara switch atau ganti bisnis aktif di TernakOS jika punya beberapa bisnis?',
      a: 'Di pojok kiri bawah (mobile) atau sidebar (desktop), ada Business Switcher yang menampilkan semua bisnis kamu. Klik nama bisnis yang ingin diaktifkan untuk pindah konteks. Data langsung berganti ke bisnis yang dipilih.',
    },
    {
      q: 'Apakah TernakOS menyimpan log error untuk keperluan debugging?',
      a: 'Ya. TernakOS memiliki sistem error logging untuk membantu tim teknis mengidentifikasi dan memperbaiki masalah dengan cepat. Log ini tidak bisa diakses pengguna biasa untuk menjaga privasi.',
    },
    {
      q: 'Bagaimana cara menghubungkan akun TernakOS dengan nomor WhatsApp bisnis?',
      a: 'Nomor WhatsApp disimpan di profil bisnis kamu. Fitur kirim nota dan notifikasi WA menggunakan nomor yang tersimpan ini secara otomatis saat kamu klik tombol WA.',
    },
    {
      q: 'Apakah TernakOS mendukung dark mode atau tema tampilan yang berbeda?',
      a: 'TernakOS hadir dalam tampilan dark mode modern yang konsisten di semua halaman. Selain itu, tersedia ThemePicker dengan 8 pilihan warna aksen yang bisa dikustomisasi sesuai preferensi.',
    },
    {
      q: 'Apakah transaksi yang diinput oleh staf bisa diverifikasi atau diapprove oleh owner?',
      a: 'Saat ini tidak ada fitur approval workflow. Semua transaksi yang diinput staf langsung tersimpan. Owner bisa melihat semua aktivitas tim di riwayat transaksi dan audit log.',
    },
    {
      q: 'Bagaimana cara memastikan karyawan tidak bisa melihat data gaji atau keuangan sensitif?',
      a: 'Role Staff tidak memiliki akses ke menu Cash Flow, laporan keuangan, dan data gaji. Role View Only hanya bisa lihat data operasional. Owner yang mengontrol siapa mendapat akses apa.',
      link: '/fitur',
    },
    {
      q: 'Apakah TernakOS mendukung pencatatan data dalam mata uang selain Rupiah?',
      a: 'Saat ini TernakOS menggunakan Rupiah (IDR) sebagai satu-satunya mata uang. Dukungan multi-currency untuk transaksi ekspor-impor ada dalam roadmap jangka panjang.',
    },
    {
      q: 'Apa perbedaan paket Starter, Pro, dan Business di TernakOS?',
      a: 'Starter: gratis trial 14 hari, 1 kandang (peternak), fitur dasar. Pro: berbayar, lebih banyak kandang, fitur analitik lanjutan. Business: unlimited kandang, unlimited pengguna, semua fitur termasuk API dan priority support.',
      link: '/harga',
    },
    {
      q: 'Apakah TernakOS cocok untuk koperasi peternak yang melayani banyak anggota?',
      a: 'Paket Business mendukung skenario ini. Koperasi bisa onboard dengan akun owner dan undang anggota peternak sebagai tim. Setiap anggota bisa input data kandang masing-masing dalam satu ekosistem bisnis.',
      link: '/harga',
    },
    {
      q: 'Bagaimana cara memperbarui informasi nama bisnis dan alamat di TernakOS?',
      a: 'Buka menu Akun → Profil Bisnis. Edit nama bisnis, alamat, area operasi, dan informasi lainnya lalu simpan. Perubahan berlaku segera.',
    },
    {
      q: 'Apakah TernakOS pernah mengalami downtime atau gangguan layanan?',
      a: 'Seperti semua platform cloud, sesekali ada maintenance terjadwal yang biasanya dilakukan di luar jam sibuk (malam hari). Status layanan TernakOS dipantau secara real-time.',
    },
    {
      q: 'Bagaimana cara migrasi data dari TernakOS ke platform lain jika suatu saat ingin pindah?',
      a: 'TernakOS menghormati kepemilikan data kamu. Fitur export data tersedia. Untuk kebutuhan migrasi penuh, tim support akan membantu prosesnya.',
    },
    {
      q: 'Apakah TernakOS menggunakan AI atau machine learning untuk analisis bisnis?',
      a: 'Ya. TernakOS memiliki fitur TernakBot AI Assistant yang bisa menjawab pertanyaan analisis bisnis dari data kamu: "Siapa pembeli paling sering nunggak?", "Bagaimana tren margin bulan ini?", dan pertanyaan operasional lainnya.',
      link: '/fitur',
    },
    {
      q: 'Bagaimana cara mengaktifkan kembali akun TernakOS yang sudah tidak aktif?',
      a: 'Login dengan akun lama kamu di ternakos.com. Jika masa langganan sudah habis, pilih paket baru di menu Akun → Langganan dan lakukan pembayaran. Akses penuh kembali aktif segera.',
      link: '/login',
    },
  ],
}

/**
 * Returns flat array of all FAQ items for a given category,
 * formatted for JSON-LD schema injection.
 */
export function getFAQForSchema(categoryId) {
  const items = FAQ_DATA[categoryId] ?? []
  return items.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  }))
}

/**
 * Returns all FAQs across all categories as flat array for full-page schema.
 */
export function getAllFAQForSchema() {
  return Object.values(FAQ_DATA).flat().map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  }))
}
