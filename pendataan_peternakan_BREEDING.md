# Sistem Pendataan Peternakan Kambing & Domba — BREEDING (Pembibitan)
> Dokumen ini merupakan panduan pendataan lengkap dan terstandar untuk peternakan breeding (pembibitan). Tujuan utama adalah menghasilkan bibit unggul, mencegah inbreeding, dan memaksimalkan efisiensi reproduksi kawanan.

---

## DAFTAR ISI

1. [Identitas & Silsilah (Pedigree)](#1-identitas--silsilah-pedigree)
2. [Monitoring Pertumbuhan (Growth Performance)](#2-monitoring-pertumbuhan-growth-performance)
3. [Manajemen Reproduksi](#3-manajemen-reproduksi)
4. [Kesehatan & Biosekuriti](#4-kesehatan--biosekuriti)
5. [Nutrisi & Efisiensi Pakan](#5-nutrisi--efisiensi-pakan)
6. [Data Produksi Karkas](#6-data-produksi-karkas)
7. [Manajemen Pegawai](#7-manajemen-pegawai)
8. [Kebersihan & Sanitasi Kandang](#8-kebersihan--sanitasi-kandang)
9. [Manajemen Pemasaran](#9-manajemen-pemasaran)
10. [Keuangan & Analisis Usaha](#10-keuangan--analisis-usaha)
11. [Infrastruktur & Aset Kandang](#11-infrastruktur--aset-kandang)
12. [Dokumen & Legalitas](#12-dokumen--legalitas)

---

## 1. Identitas & Silsilah (Pedigree)

> Fondasi dari seluruh sistem manajemen breeding. Tanpa data silsilah yang akurat, program seleksi genetik dan pencegahan inbreeding tidak dapat berjalan.

### 1.1 Data Identitas Dasar

| Field | Keterangan | Contoh |
|---|---|---|
| ID Ternak | Nomor unik ear tag / chip / tato | `KMB-2024-0147` |
| Nama Panggilan | Opsional, untuk ternak unggulan | `Jamal` |
| Jenis Kelamin | Jantan / Betina / Kastrasi | `Jantan` |
| Tanggal Lahir | Format YYYY-MM-DD | `2024-03-14` |
| Tipe Kelahiran | Tunggal / Kembar 2 / Kembar 3+ | `Kembar 2` |
| Berat Lahir (kg) | Diukur dalam 24 jam pertama | `3,2 kg` |
| ID Chip RFID | Nomor chip 15 digit (ISO 11784) | `982000362841047` |
| Kode Tato | Lokasi dan kode tato (telinga/paha) | `Telinga kiri: A147` |
| Kode Kandang | Penempatan kandang asal | `KDG-B3` |
| Status Aktif | Aktif / Afkir / Mati / Terjual | `Aktif` |

### 1.2 Komposisi Genetik & Ras

| Field | Keterangan | Contoh |
|---|---|---|
| Ras / Breed Dominan | Nama ras utama | `Boer` |
| Komposisi Silang | Persentase darah tiap ras | `50% Boer / 50% Kacang` |
| Generasi (F1/F2/F3) | Level persilangan | `F2` |
| Asal-usul Ternak | Lokal / Impor / Hasil IB | `Hasil IB Semen Import` |
| Keunggulan Genetik | Catatan sifat unggul diamati | `ADG tinggi, kembar, tahan panas` |
| Koefisien Inbreeding (%) | Hasil kalkulasi pedigree software | `0,00%` |
| Estimated Breeding Value (EBV) | Nilai genetik ternak untuk sifat target | `EBV ADG: +12 g/hari` |

### 1.3 Silsilah (Family Tree) — 3 Generasi

```
TERNAK AKTIF
└── KMB-2024-0147 (Jamal — Jantan, F2 Boer, Lahir 14 Mar 2024)
    │
    ├── INDUK (Dam): KMB-2021-0032
    │   ├── Betina · F1 Boer
    │   ├── Nenek (Dam's Dam): KMB-2018-0011 (Betina · Kacang Lokal)
    │   └── Kakek (Dam's Sire): KMB-2017-0003 (Jantan · Boer Import)
    │
    └── PEJANTAN (Sire): KMB-2019-0008
        ├── Jantan · Boer Murni Import
        ├── Nenek (Sire's Dam): KMB-2015-0022 (Betina · Boer SA)
        └── Kakek (Sire's Sire): KMB-2014-0005 (Jantan · Boer SA)
```

**Data Silsilah yang Wajib Dicatat:**

| Field | Keterangan |
|---|---|
| ID Induk (Dam) | ID ear tag / chip induk betina |
| ID Pejantan (Sire) | ID ear tag / chip pejantan atau kode semen IB |
| ID Nenek (Dam's Dam) | Generasi ke-2 jalur betina |
| ID Kakek (Dam's Sire) | Generasi ke-2 jalur jantan dari betina |
| ID Nenek Pejantan (Sire's Dam) | Generasi ke-2 jalur betina dari pejantan |
| ID Kakek Pejantan (Sire's Sire) | Generasi ke-2 jalur jantan dari pejantan |
| Jumlah Saudara Kandung | Total anak dari pasangan yang sama |
| ID Saudara Kembar | ID semua saudara dalam kelahiran yang sama |

### 1.4 Klasifikasi & Tujuan Ternak

| Field | Pilihan |
|---|---|
| Tujuan Pemeliharaan | Pejantan unggul / Indukan / Calon bibit / Afkir |
| Kelas Seleksi | Elite / Grade A / Grade B / Afkir |
| Skor Seleksi Fenotip | Penilaian konformasi tubuh 1–10 |
| Tanggal Seleksi Terakhir | Tanggal evaluasi seleksi dilakukan |
| Keputusan Seleksi | Dipertahankan / Dijual bibit / Dijual potong |
| Nilai Pasar Terkini | Estimasi harga jual saat ini (Rp) |

---

## 2. Monitoring Pertumbuhan (Growth Performance)

### 2.1 Rekam Bobot Berkala

| Tanggal | Umur (hari) | Bobot (kg) | ADG (g/hari) | BCS (1–5) | Petugas | Keterangan |
|---|---|---|---|---|---|---|
| 2024-03-14 | 0 | 3,2 | — | — | Budi | Berat lahir |
| 2024-04-14 | 31 | 7,1 | 126 | 3,0 | Budi | Pre-weaning |
| 2024-05-14 | 61 | 11,0 | 130 | 3,0 | Andi | Pre-weaning |
| 2024-06-12 | 90 | 14,7 | 123 | 3,5 | Budi | **Sapih (Weaning)** |
| 2024-07-12 | 120 | 18,9 | 140 | 3,5 | Andi | Post-weaning |
| 2024-08-12 | 151 | 23,8 | 158 | 3,5 | Budi | Post-weaning |

**Frekuensi Penimbangan yang Direkomendasikan:**
- Berat lahir: dalam 12–24 jam setelah lahir
- Pra-sapih: setiap 30 hari
- Sapih: tepat di umur 60–90 hari (wajib)
- Pasca-sapih: setiap 30 hari hingga umur 6 bulan
- Dewasa: setiap 60–90 hari atau menjelang kawin / partus

### 2.2 Indikator Pertumbuhan Kunci

| Indikator | Formula | Target Breeding |
|---|---|---|
| Berat Lahir | Ditimbang langsung | Jantan ≥ 3 kg / Betina ≥ 2,7 kg |
| Berat Sapih 90 hari | Ditimbang langsung | ≥ 12 kg |
| ADG Pra-sapih | (Bw sapih − Bw lahir) / umur hari | ≥ 100 g/hari |
| ADG Pasca-sapih | (Bw akhir − Bw sapih) / selisih hari | ≥ 120 g/hari |
| Berat 6 Bulan | Ditimbang langsung | Jantan ≥ 28 kg / Betina ≥ 22 kg |
| BCS Dewasa | Palpasi punggung dan rusuk (skala 1–5) | 2,5–3,5 (kondisi ideal kawin) |

### 2.3 Body Condition Score (BCS) — Panduan Skoring

| Skor | Deskripsi | Kondisi Tulang Punggung | Kondisi Otot Loin | Tindakan |
|---|---|---|---|---|
| 1 | Sangat kurus | Sangat menonjol tajam | Tidak ada | Evaluasi nutrisi & kesehatan segera |
| 2 | Kurus | Mudah diraba, menonjol | Tipis | Tingkatkan pemberian pakan |
| 3 | Ideal | Teraba dengan tekanan | Berkembang baik | Pertahankan manajemen |
| 4 | Gemuk | Sulit diraba, tertutup lemak | Tebal | Kurangi konsentrat |
| 5 | Obesitas | Tidak teraba | Sangat tebal | Evaluasi ulang ransum |

**BCS Ideal per Fase:**

| Fase | Target BCS |
|---|---|
| Dara / Pra-kawin pertama | 3,0–3,5 |
| Menjelang kawin (flushing) | 3,0–3,5 |
| Kebuntingan awal (0–3 bulan) | 2,5–3,0 |
| Kebuntingan akhir (3–5 bulan) | 3,0–3,5 |
| Awal laktasi / menyusui | 2,5–3,0 |
| Penyapihan | 2,5–3,0 |
| Pejantan aktif kawin | 3,0–3,5 |

### 2.4 Pengukuran Morfometrik (Konformasi Tubuh)

| Pengukuran | Alat | Cara Ukur | Target Jantan Dewasa |
|---|---|---|---|
| Lingkar dada (cm) | Pita ukur | Tepat di belakang siku | ≥ 80 cm |
| Panjang badan (cm) | Tongkat ukur | Bahu → tuber ischii | ≥ 70 cm |
| Tinggi pundak (cm) | Tongkat ukur | Tanah → withers | ≥ 75 cm |
| Lebar dada (cm) | Kaliper | Lebar terluar bahu | ≥ 20 cm |
| Dalam dada (cm) | Tongkat ukur | Withers → sternum | ≥ 30 cm |
| Lingkar skrotum (cm) | Pita ukur | Diameter terlebar testis | ≥ 28 cm (jantan ≥ 1 tahun) |

---

## 3. Manajemen Reproduksi

### 3.1 Data Reproduksi Indukan Betina

| Field | Keterangan | Contoh |
|---|---|---|
| Umur Pertama Birahi | Umur saat tanda birahi pertama kali teramati | `6 bulan` |
| Umur Pertama Kawin | Umur saat perkawinan pertama dilakukan | `8–10 bulan` |
| Berat Kawin Pertama | Harus ≥ 60–70% dari berat dewasa | `22 kg` |
| Siklus Birahi | Panjang rata-rata siklus (hari) | `19–21 hari` |
| Lama Birahi | Durasi tanda estrus terlihat | `24–48 jam` |
| Metode Deteksi Birahi | Visual / Jantan pemancing / Hormonal | `Visual + pejantan pemancing` |

### 3.2 Riwayat Kawin Per Indukan

| Tgl Birahi | Tgl Kawin | ID Pejantan | Metode | Konfirmasi Bunting | Hasil |
|---|---|---|---|---|---|
| 2023-01-08 | 2023-01-10 | KMB-0008 | Alami | USG hari ke-45: positif | Kembar 2 |
| 2023-08-03 | 2023-08-05 | KMB-0015 | IB | Palpasi hari ke-60: positif | Tunggal |
| 2024-03-18 | 2024-03-20 | KMB-0008 | Alami | USG hari ke-45: positif | Bunting (belum lahir) |

### 3.3 Data Perkawinan Detail

| Field | Keterangan |
|---|---|
| Metode Perkawinan | Alami (hand mating / pasture mating) / Inseminasi Buatan (IB) |
| ID Semen (jika IB) | Kode batch semen beku / semen cair |
| Asal Semen | Nama pejantan donor, pusat IB, negara asal |
| Kualitas Semen | Motilitas (%), konsentrasi (juta/ml), abnormalitas (%) |
| Petugas Inseminator | Nama dan nomor lisensi inseminator |
| Dosis Semen | Volume deposisi (ml) |
| Lokasi Deposisi | Serviks / Uterus (untuk laparoskopi) |
| Waktu IB | Jam ke-12–18 setelah onset birahi |
| Pengulangan IB | Apakah dilakukan repeat IB (hari ke-2) |

### 3.4 Riwayat Kebuntingan

| Field | Keterangan | Contoh |
|---|---|---|
| Estimasi Tanggal Partus | Tgl kawin + 147–155 hari | `2024-08-18` |
| Konfirmasi Kebuntingan 1 | Palpasi rektal hari ke-45–60 | `Positif, hari ke-50` |
| Konfirmasi Kebuntingan 2 | USG hari ke-25–45 | `Positif, 2 fetus terdeteksi` |
| Jumlah Fetus (USG) | Hasil deteksi jumlah embrio | `2 fetus` |
| Kondisi Plasenta | Normal / Plasenta previa | `Normal` |
| Skor Kondisi Tubuh Bunting | BCS saat konfirmasi kebuntingan | `3,0` |
| Pakan Flushing | Penambahan pakan 2 minggu pra-kawin | `Konsentrat +200g/hari` |
| Pakan Flushing Pre-Partus | Penambahan pakan 6 minggu sebelum lahir | `Konsentrat +300g/hari` |
| Tanda Pra-Partus | Edema ambing, relaksasi ligamen | `Diamati H-7` |

### 3.5 Data Kelahiran (Partus)

| Field | Keterangan |
|---|---|
| Tanggal & Jam Partus | Waktu tepat kelahiran |
| Lama Proses Kelahiran | Dari pembukaan serviks hingga selesai (jam) |
| Tipe Kelahiran | Tunggal / Kembar 2 / Kembar 3 |
| Presentasi Fetus | Normal (anterior) / Posterior / Malpresentasi |
| Bantuan Partus | Tidak / Assisted manual / Operasi SC |
| Kondisi Anak Lahir | Normal / Lemah / Mati |
| Pengeluaran Plasenta | Spontan (≤6 jam) / Tertinggal (>6 jam) |
| Kondisi Ambing Post-Partus | Normal / Mastitis / Agalaktia |
| Kolostrum Diberikan | Ya / Tidak / Susu pengganti |
| Waktu Anak Pertama Menyusu | Idealnya dalam 30–60 menit |

### 3.6 Performa Indukan & KPI Reproduksi

| KPI | Formula | Target Breeding |
|---|---|---|
| Lambing Rate (%) | (Anak lahir / Induk kawin) × 100 | ≥ 130% |
| Lambing Interval (bulan) | Jarak antar kelahiran satu induk | ≤ 8 bulan (3× per 2 tahun) |
| Conception Rate (%) | (Bunting / Dikawinkan) × 100 | ≥ 80% |
| Weaning Rate (%) | (Anak sapih / Anak lahir hidup) × 100 | ≥ 90% |
| Litter Size | Rata-rata anak per kelahiran | ≥ 1,5 |
| Doe Efficiency (kg) | Total bobot anak sapih per induk per tahun | ≥ 20 kg |
| Repeat Breeder (%) | % indukan yang memerlukan ≥3× IB | ≤ 10% |

### 3.7 Data Pejantan (Sire Management)

| Field | Keterangan |
|---|---|
| ID Pejantan | Nomor ear tag / chip |
| Uji Kualitas Semen | Motilitas, konsentrasi, morfologi — dilakukan rutin 3 bulan |
| Rasio Pejantan : Betina | Alami: 1:25–35 / IB: 1 pejantan untuk ratusan |
| Periode Istirahat | Rotasi pejantan untuk mencegah overuse |
| Riwayat Anak | Jumlah keturunan, ADG rata-rata keturunan |
| Indeks Pejantan | EBV berdasarkan performa keturunan |
| Tanggal Terakhir Uji Semen | Tanggal pemeriksaan terakhir |
| Status Kesehatan Reproduksi | Bebas brucellosis, vibriosis, dll. |

---

## 4. Kesehatan & Biosekuriti

### 4.1 Jadwal Vaksinasi

| Vaksin | Target Penyakit | Umur Pertama | Interval Ulang | Dosis & Rute | Keterangan |
|---|---|---|---|---|---|
| PMK (FMD) | Penyakit Mulut & Kuku | 2–4 bulan | 6 bulan | 2 ml IM | Wajib, terutama daerah endemik |
| Anthrax | Bacillus anthracis | 6 bulan | 1 tahun | 1 ml SC | Wajib di daerah endemik |
| Brucellosis (RB51/S19) | Brucella melitensis | Dara 3–6 bulan | — | 2 ml SC | Hanya betina, 1× seumur hidup |
| Clostridial (CDT) | Enterotoksemia, tetanus | 6–8 minggu | 4–6 bulan | 2 ml SC | Booster 4 minggu setelah pertama |
| Rabies | Virus rabies | 3 bulan | 1 tahun | 1 ml IM | Daerah endemik rabies |
| Pasteurellosis | Pneumonia bakteri | 3 bulan | 6 bulan | Sesuai produk | Sebelum musim hujan |
| CCPP | Contagious Caprine Pleuropneumonia | 3 bulan | 1 tahun | 1 ml SC | Daerah endemik |

**Catatan Vaksinasi Per Ternak:**

| Field | Keterangan |
|---|---|
| Nama Vaksin & Merek | Nama produk komersial |
| Nomor Batch Vaksin | Untuk traceability |
| Tanggal Pemberian | YYYY-MM-DD |
| Dosis (ml) | Volume yang disuntikkan |
| Rute Pemberian | IM / SC / Intranasal |
| Lokasi Injeksi | Leher / Paha / Belakang telinga |
| Nama Petugas | Yang melakukan vaksinasi |
| Reaksi Pasca-Vaksin | Normal / Pembengkakan lokal / Reaksi sistemik |
| Tanggal Booster | Jadwal ulangan |

### 4.2 Program Pengendalian Cacing (Antelmintik)

> Rotasi kelas obat wajib dilakukan untuk mencegah resistensi antelmintik (AWR — Anthelmintic Resistance).

| Kelas | Contoh Obat | Dosis | Waktu Pemberian |
|---|---|---|---|
| Benzimidazole (BZD) | Albendazole, Fenbendazole | 7,5 mg/kg | Siklus ke-1 |
| Levamisole (LV) | Levamisole HCl | 7,5 mg/kg | Siklus ke-2 |
| Macrocyclic Lactone (ML) | Ivermectin, Doramectin | 0,2 mg/kg | Siklus ke-3 |
| Kombinasi BZD+LV | Netobimin | Sesuai produk | Kasus resistensi |

**Jadwal Pemberian Antelmintik:**

| Periode | Tindakan | Target Ternak |
|---|---|---|
| Pra-kawin (H-14) | Pemeriksaan FAMACHA + obat cacing | Semua indukan |
| Pra-partus (H-14) | Obat cacing kelas ML | Semua bunting |
| Saat sapih | Obat cacing anak baru sapih | Semua cempe |
| Musim hujan awal | Obat cacing preventif | Seluruh kawanan |
| Setelah masuk ternak baru | Karantina + obat cacing | Ternak baru |

**FAMACHA Score (Indikator Anemia akibat cacing Haemonchus):**

| Skor | Warna Konjungtiva | Tindakan |
|---|---|---|
| 1 | Merah-pink cerah | Tidak perlu obat cacing |
| 2 | Pink | Tidak perlu / monitor |
| 3 | Pink pucat | Obat cacing jika ada faktor risiko |
| 4 | Pucat | Wajib obat cacing |
| 5 | Putih / sangat pucat | Obat cacing + suportif segera |

### 4.3 Riwayat Penyakit Per Ternak

| Tanggal | Tanda Klinis | Diagnosis Sementara | Pemeriksaan Lab | Pengobatan | Dosis | Durasi | Hasil | Dokter |
|---|---|---|---|---|---|---|---|---|
| 2024-02-05 | Diare berdarah, lemas | Enteritis hemoragik | Feses: E. coli positif | Sulfa + elektrolit oral | 5 ml/kg | 5 hari | Sembuh | drh. Hasan |
| 2024-03-12 | Pincang kaki kiri depan | Foot rot (Fusobacterium) | Klinis | Penisilin prokain IM + foot bath 10% ZnSO4 | 20.000 IU/kg | 3 hari | Sembuh | drh. Hasan |

**Field Riwayat Penyakit Lengkap:**

| Field | Keterangan |
|---|---|
| Tanggal Pertama Sakit | Tanggal gejala pertama kali terlihat |
| Anamnesis | Riwayat singkat: kapan, apa yang berubah |
| Tanda Klinis | Deskripsi gejala lengkap |
| Suhu Rektal (°C) | Normal 38,5–40,5°C |
| Frekuensi Nafas (/menit) | Normal 15–30/menit |
| Frekuensi Jantung (/menit) | Normal 70–90/menit |
| Rumen Motilitas | Normal 1–2×/menit |
| Pemeriksaan Penunjang | Jenis sampel, lab yang digunakan |
| Hasil Lab | Nilai dan interpretasi |
| Diagnosis Kerja | Diagnosis berdasarkan klinis + lab |
| Terapi | Nama obat, dosis, rute, frekuensi |
| Periode Henti Susu/Karkas (Withdrawal) | Hari setelah obat tidak boleh disembelih |
| Tanggal Sembuh | Tanggal ternak dinyatakan pulih |
| Tanggal Follow-up | Jadwal pemeriksaan ulang |
| Biaya Pengobatan | Total biaya (Rp) |

### 4.4 Protokol Biosekuriti Kandang

| Aspek | Prosedur |
|---|---|
| Karantina ternak baru | Minimal 21 hari terpisah dari kawanan |
| Foot bath | Desinfektan di setiap pintu masuk kandang, diganti 2× seminggu |
| Kendaraan masuk | Disemprot desinfektan di gerbang farm |
| Tamu / pengunjung | Wajib ganti pakaian & alas kaki, isi buku tamu |
| Alat kandang | Tidak boleh dipindah antar kandang tanpa desinfeksi |
| Bangkai ternak | Dikubur minimal 1 meter atau dibakar, jauh dari sumber air |
| Kontrol hama | Fumigasi kandang kosong bulanan, rodentisida sesuai jadwal |
| Air minum | Bersumber dari sumur / PAM, diuji kualitas 6 bulan sekali |

### 4.5 Data Mortalitas

| Tanggal | ID Ternak | Umur | Jenis Kelamin | Dugaan Penyebab | Autopsi? | Temuan Autopsi | Tindak Lanjut |
|---|---|---|---|---|---|---|---|
| 2024-01-15 | KMB-2023-0089 | 3 minggu | Betina | Pneumonia neonatal | Ya | Konsolidasi lobus kranial | Perbaiki ventilasi kandang induk |
| 2024-04-22 | KMB-2022-0055 | 2 tahun | Jantan | Urolitiasis | Ya | Batu uretra, ruptur kandung kemih | Evaluasi rasio Ca:P ransum |

**KPI Mortalitas:**

| KPI | Formula | Target |
|---|---|---|
| Tingkat Mortalitas Dewasa (%) | (Mati / Total dewasa) × 100 | ≤ 3% / tahun |
| Tingkat Mortalitas Anak Pre-sapih (%) | (Anak mati / Anak lahir hidup) × 100 | ≤ 10% |
| Tingkat Mortalitas Anak Pasca-sapih (%) | (Mati post-sapih / Anak sapih) × 100 | ≤ 5% |

---

## 5. Nutrisi & Efisiensi Pakan

### 5.1 Formulasi Ransum Per Kelompok

| Kelompok | Bahan Pakan | Komposisi (%) | PK (%) | TDN (%) | SK (%) | Abu (%) |
|---|---|---|---|---|---|---|
| Indukan laktasi | Rumput Gajah segar | 35 | 8,5 | 55 | 28 | 8 |
| | Jerami fermentasi | 20 | 6,0 | 48 | 32 | 9 |
| | Konsentrat 18% PK | 30 | 18,0 | 75 | 7 | 9 |
| | Dedak padi halus | 10 | 12,0 | 60 | 12 | 10 |
| | Mineral blok | 5 | — | — | — | — |
| | **Total** | **100** | **≈12,8** | **≈62** | **≈21** | — |
| Bunting akhir (6 minggu pra-partus) | Hijauan berkualitas | 40 | 9,0 | 57 | 26 | — |
| | Konsentrat 16% PK | 35 | 16,0 | 72 | 8 | — |
| | Bungkil kedelai | 10 | 44,0 | 78 | 6 | — |
| | Dedak | 10 | 12,0 | 60 | 12 | — |
| | Mineral premix | 5 | — | — | — | — |
| Cempe pre-sapih | Starter creep feed | Ad libitum | ≥ 18 | ≥ 70 | ≤ 8 | — |
| Dara/Jantan muda | Hijauan + konsentrat terbatas | 70/30 | 12,0 | 60 | 22 | — |

### 5.2 Kebutuhan Nutrien Per Fase (Standar NRC)

| Fase / Kategori | BK (g/hari) | PK (g/hari) | TDN (g/hari) | Ca (g/hari) | P (g/hari) |
|---|---|---|---|---|---|
| Indukan kering, bobot 40 kg | 900 | 95 | 540 | 2,0 | 1,8 |
| Indukan bunting akhir, bobot 45 kg | 1.400 | 145 | 770 | 4,0 | 2,7 |
| Indukan laktasi, bobot 45 kg | 1.600 | 170 | 900 | 4,5 | 3,0 |
| Cempe growing 15–25 kg | 700 | 90 | 460 | 3,5 | 2,2 |
| Pejantan aktif, bobot 60 kg | 1.200 | 120 | 720 | 2,8 | 2,0 |

### 5.3 Pencatatan Feed Intake Harian

| Tanggal | Kelompok / Kandang | Jenis Pakan | Jumlah Diberikan (kg) | Sisa Pakan (kg) | Konsumsi Aktual (kg) | Keterangan |
|---|---|---|---|---|---|---|
| 2024-07-12 | Indukan laktasi A | Rumput Gajah | 120 | 8 | 112 | Cuaca panas, konsumsi turun |
| 2024-07-12 | Indukan laktasi A | Konsentrat | 28 | 0 | 28 | — |
| 2024-07-12 | Cempe pasca-sapih B | Starter | 15 | 1,5 | 13,5 | — |

### 5.4 Feed Conversion Ratio (FCR)

| Field | Formula | Contoh |
|---|---|---|
| FCR | Total pakan (kg BK) / Total PBBH (kg) | `7,2` |
| Biaya per kg PBBH | Total biaya pakan / Total PBBH (kg) | `Rp 58.000/kg PBBH` |
| Income Over Feed Cost (IOFC) | Nilai jual ternak − Biaya pakan | `Rp 1.200.000 / periode` |

### 5.5 Program Suplementasi

| Suplemen | Tujuan | Dosis | Target Ternak | Frekuensi |
|---|---|---|---|---|
| Mineral blok (Ca, P, Mg, Na, Zn) | Mencegah defisiensi mineral | Ad libitum | Seluruh kawanan | Selalu tersedia |
| Vitamin A, D, E injeksi | Mendukung reproduksi & imunitas | 2 ml IM | Indukan pra-kawin | 1× / 6 bulan |
| Selenium + Vitamin E | Mencegah white muscle disease | 0,1 mg Se/kg BB | Indukan bunting akhir, cempe | H-30 pre-partus |
| Propylene glycol | Mencegah ketosis | 100 ml oral | Indukan hiperlaktasi, bunting akhir | 14 hari pra-partus |
| Probiotik | Menjaga keseimbangan rumen | 5 g/ekor | Post-sapih, pasca-sakit | Sesuai kebutuhan |
| Urea (NPN, untuk pakan kualitas rendah) | Sumber nitrogen tambahan | Maks 1% dari BK ransum | Ternak dewasa saja | Campuran ransum |

### 5.6 Kualitas Air Minum

| Parameter | Standar Minimum | Frekuensi Uji |
|---|---|---|
| pH | 6,5 – 8,5 | 6 bulan |
| Total Dissolved Solids (TDS) | < 1.000 ppm | 6 bulan |
| Nitrat | < 100 ppm | 6 bulan |
| Coliform | Negatif | 6 bulan |
| Ketersediaan | Ad libitum 24 jam | Harian (cek visual) |
| Volume kebutuhan per ekor | 3–8 liter/hari (tergantung suhu & fase) | — |

---

## 6. Data Produksi Karkas

> Berlaku untuk ternak breeding yang telah diafkir atau jantan yang tidak lolos seleksi.

### 6.1 Data Pre-Slaughter

| Field | Keterangan | Contoh |
|---|---|---|
| Tanggal Pemotongan | YYYY-MM-DD | `2024-09-15` |
| Bobot Hidup | Ditimbang hari pemotongan | `34,2 kg` |
| Bobot Puasa (Bobot Kosong) | Setelah puasa 12–24 jam | `33,1 kg` |
| Kondisi Kesehatan Ante-Mortem | Lulus pemeriksaan dokter hewan | `Layak potong` |
| Nomor Sertifikat Halal | Jika diperlukan | `SH-2024-001247` |

### 6.2 Data Post-Slaughter

| Field | Keterangan | Contoh |
|---|---|---|
| Bobot Karkas Panas (HCW) | Ditimbang segera setelah pemotongan | `16,8 kg` |
| Bobot Karkas Dingin (CCW) | Setelah chilling 24 jam | `16,2 kg` |
| Persentase Karkas (%) | (HCW / Bobot hidup) × 100 | `49,1%` |
| Bobot Kepala | — | `1,8 kg` |
| Bobot Kaki 4 | — | `1,6 kg` |
| Bobot Kulit | — | `2,8 kg` |
| Bobot Jeroan Merah (jantung, hati, paru, limpa) | — | `2,4 kg` |
| Bobot Jeroan Hijau (lambung, usus) | — | `3,1 kg` |
| Tebal Lemak Punggung (mm) | Diukur di rusuk ke-12/13 | `8,2 mm` |
| Luas Urat Daging Mata Rusuk (LM) | Diukur dengan grid atau USG | `12,4 cm²` |
| pH Daging 45 menit post-mortem | pH normal: 6,2–6,8 | `6,4` |
| pH Daging 24 jam post-mortem | pH akhir normal: 5,4–5,8 | `5,6` |
| Warna Daging (CIELAB/visual) | Merah muda cerah = ideal | `L:40,2 a:18,1 b:8,7` |
| Water Holding Capacity (WHC) | % cairan tertahan | `>75%` |
| Marbling Score | Skor lemak intramuskular 1–5 | `2` |

### 6.3 Distribusi Potongan Karkas

| Potongan | Bobot (kg) | Persentase dari HCW | Harga/kg (Rp) | Nilai (Rp) |
|---|---|---|---|---|
| Gigot / Paha belakang | 5,1 | 30,4% | 130.000 | 663.000 |
| Shoulder / Bahu | 3,9 | 23,2% | 110.000 | 429.000 |
| Loin / Pinggang | 2,8 | 16,7% | 150.000 | 420.000 |
| Rack / Rusuk | 2,2 | 13,1% | 140.000 | 308.000 |
| Neck / Leher | 1,4 | 8,3% | 90.000 | 126.000 |
| Breast / Dada | 1,4 | 8,3% | 85.000 | 119.000 |
| **Total Karkas** | **16,8** | **100%** | — | **2.065.000** |
| Jeroan merah | 2,4 | — | 25.000 | 60.000 |
| Kulit | 2,8 | — | 15.000 | 42.000 |
| Kepala + kaki | 3,4 | — | 20.000 | 68.000 |
| **Total Penerimaan** | — | — | — | **2.235.000** |

---

## 7. Manajemen Pegawai

### 7.1 Data Identitas Pegawai

| Field | Keterangan |
|---|---|
| ID Pegawai | Nomor unik karyawan |
| Nama Lengkap | — |
| Jabatan / Posisi | Kepala kandang / Petugas kandang / Inseminator / Sopir / Admin / dll |
| Tanggal Mulai Kerja | — |
| Status Kerja | Tetap / Kontrak / Harian Lepas / Magang |
| Nomor KTP | — |
| Nomor BPJS TK & Kesehatan | — |
| Alamat & No. HP | — |
| Pendidikan Terakhir | — |
| Sertifikat / Lisensi | Inseminator, Juru Sembelih Halal, dll |
| Kondisi Kesehatan | Bebas TBC, cek MCU tahunan |

### 7.2 Pembagian Shift & Tanggung Jawab

| Shift | Jam | Personil | Area Tanggung Jawab |
|---|---|---|---|
| Shift Pagi 1 | 04.30 – 13.00 | Kepala kandang + 2 petugas | Semua unit, pakan pagi, penimbangan |
| Shift Pagi 2 | 06.00 – 14.00 | 1 petugas pakan | Gudang pakan, distribusi konsentrat |
| Shift Sore | 13.00 – 21.00 | 2 petugas | Pakan sore, kebersihan, pengamatan malam |
| Piket Malam | 21.00 – 05.00 | 1 petugas (bergantian) | Ronda, partus darurat, laporan malam |
| Admin | 08.00 – 16.00 | 1 admin | Pencatatan data, laporan, keuangan |
| Dokter Hewan | On-call + rutin 2×/minggu | drh. konsultan | Kesehatan hewan, vaksinasi, IB |

### 7.3 Tugas Harian Terperinci

| Waktu | Tugas | Standar Penyelesaian | Penanggung Jawab |
|---|---|---|---|
| 04.30 | Pemeriksaan kondisi ternak malam, laporan kejadian malam | Semua ternak terpantau, kelahiran tercatat | Piket malam |
| 05.00 | Pembersihan sisa pakan malam, cek tempat minum | Bersih sebelum pakan pagi | Shift pagi |
| 05.30 | Pemberian hijauan pagi | Merata ke semua kandang | Shift pagi |
| 07.00 | Pemberian konsentrat + pencatatan feed intake | Ditimbang dan dicatat per kandang | Petugas pakan |
| 08.00 | Pembersihan kotoran kandang (buang feses) | Semua kandang bersih dari kotoran kasar | Petugas kandang |
| 09.00 | Pencucian tempat minum + pengisian ulang air | Bersih dan penuh | Shift pagi |
| 10.00 | Penimbangan bobot ternak (sesuai jadwal) | Dicatat dalam form penimbangan | Kepala kandang + admin |
| 11.00 | Pemeriksaan kesehatan visual harian | Setiap ekor dicek tanda-tanda sakit | Kepala kandang |
| 12.00 | Pemberian hijauan siang | — | Shift pagi / overlap |
| 14.00 | Tindakan medis / vaksinasi / IB (sesuai jadwal) | Sesuai jadwal mingguan | drh. Hasan |
| 15.00 | Pembersihan lantai kandang (sikat + desinfektan terjadwal) | Sesuai jadwal kebersihan | Shift sore |
| 17.00 | Pemberian hijauan sore + mineral blok (cek ketersediaan) | — | Shift sore |
| 19.00 | Laporan harian digital (feed intake, kondisi kesehatan, kejadian) | Terisi lengkap sebelum jam 20.00 | Admin / Kepala kandang |
| 20.00 | Ronda malam pertama | Semua pintu kandang terkunci | Shift sore / piket |

### 7.4 Evaluasi Kinerja Pegawai

| Indikator | Frekuensi Evaluasi | Target |
|---|---|---|
| Kehadiran & ketepatan waktu | Bulanan | ≥ 95% |
| Kelengkapan pencatatan form | Mingguan | 100% form terisi |
| Kejadian ternak mati saat piket | Per kejadian | 0 kelalaian |
| Kerapian & kebersihan kandang area tanggung jawab | Mingguan | Sesuai standar SOP |
| Keikutsertaan pelatihan | Tahunan | 100% |
| Laporan keterlambatan tindakan (penyakit tidak segera dilaporkan) | Per kejadian | 0 insiden |

### 7.5 Pelatihan & Pengembangan SDM

| Topik Pelatihan | Target Peserta | Frekuensi | Penyelenggara |
|---|---|---|---|
| Manajemen kesehatan ternak dasar | Semua petugas | 1× / tahun | Dinas Peternakan / drh. |
| Teknik IB (Inseminasi Buatan) | Inseminator | 1× / 2 tahun | BBIB / Perguruan Tinggi |
| Pertolongan pertama partus | Semua petugas | 1× / tahun | drh. konsultan |
| Keselamatan dan Kesehatan Kerja (K3) | Semua karyawan | 1× / tahun | Internal |
| Pencatatan data digital | Admin + kepala kandang | 1× / tahun | Internal / vendor software |
| Formulasi ransum dasar | Kepala kandang + petugas pakan | 1× / tahun | Ahli nutrisi / konsultan |

---

## 8. Kebersihan & Sanitasi Kandang

### 8.1 Jadwal Pembersihan Terstruktur

| Frekuensi | Jenis Pekerjaan | Metode / Bahan | Penanggung Jawab | Standar Hasil |
|---|---|---|---|---|
| Setiap hari (2×) | Buang kotoran (feses dan urin) dari lantai kandang | Sekop, gerobak dorong | Shift aktif | Tidak ada penumpukan kotoran |
| Setiap hari | Cuci dan isi ulang tempat minum | Air bersih + sikat | Shift aktif | Bersih dari lendir/alga |
| Setiap hari | Angkat sisa pakan dari tempat pakan | Manual | Shift aktif | Tidak ada pakan basi tersisa |
| 2× seminggu | Sikat dan cuci lantai kandang dengan air bertekanan | Selang air, sikat keras | Shift sore | Lantai bersih visual |
| 1× seminggu | Desinfeksi lantai dan dinding kandang | Karbol / Glutaraldehyde 1% | Kepala kandang | Semua permukaan terbasahi |
| 1× seminggu | Ganti alas kandang (litter) | Sekam padi / serbuk gergaji | Petugas kandang | Litter kering < 30% kelembaban |
| 2× seminggu | Ganti larutan foot bath di pintu masuk | NaOH 2% / Formalin 5% | Shift pagi | Larutan jernih & konsentrasi tepat |
| 1× bulan | Fumigasi kandang kosong (rotasi kandang) | Formalin 37% + KMnO4 | Kepala kandang + drh. | Semua vektor mati, kandang bebas 48 jam |
| 1× triwulan | Pengapuran dinding, lantai, dan selokan | Kapur tohor 20% | Semua pegawai | Permukaan putih merata |
| 1× tahun | Desinfeksi total farm (termasuk gudang dan alat) | Rotasi desinfektan | Kepala kandang | — |

### 8.2 Checklist Harian Kebersihan

| Item | ✓/✗ | Keterangan |
|---|---|---|
| Kotoran ternak sudah dibuang (pagi) | | |
| Kotoran ternak sudah dibuang (sore) | | |
| Tempat minum dicuci dan diisi ulang | | |
| Sisa pakan pagi diangkat | | |
| Sisa pakan sore diangkat | | |
| Saluran pembuangan tidak tersumbat | | |
| Ventilasi kandang terbuka / berfungsi | | |
| Foot bath pintu masuk terisi | | |
| Tidak ada tanda lalat / nyamuk berlebih | | |
| Tidak ada tanda tikus / predator masuk | | |
| Tempat pembuangan kotoran (kompos) tertutup | | |
| Peralatan kandang (sekop, ember) tersimpan rapi | | |
| Petugas menggunakan APD (sepatu boot, sarung tangan) | | |

**Ditandatangani oleh:** _____________ Tanggal: _____________

### 8.3 Manajemen Kotoran & Limbah Ternak

| Field | Keterangan |
|---|---|
| Estimasi produksi kotoran/ekor/hari | 1,5–2,5 kg kotoran padat + urin |
| Metode pengomposan | Aerobik windrow / Vermicomposting |
| Waktu dekomposisi | 45–60 hari (aerobik aktif dengan pembalikan) |
| Suhu optimal kompos | 50–65°C (fase termofilik, membunuh patogen) |
| Frekuensi pembalikan | 2× seminggu |
| Produk akhir | Pupuk organik padat |
| Kadar air produk akhir | 30–40% |
| Nilai jual kompos | Rp 400–600/kg |
| Pengelolaan limbah cair (urin) | Biogas / pupuk cair / IPAL sederhana |
| Jarak kandang dari sumber air | Minimal 25 meter dari sumur |

### 8.4 Protokol Biosekuriti Tambahan

| Aspek | Prosedur | Frekuensi |
|---|---|---|
| Kontrol hama (tikus, lalat, nyamuk) | Perangkap + insektisida sesuai regulasi | Mingguan (kontrol) |
| Pengendalian satwa liar | Pagar kandang rapat, atap tertutup | Permanen |
| Pembuangan bangkai | Dikubur ≥1 m atau dibakar, dicatat | Per kejadian |
| Visitor log | Buku tamu + protokol desinfeksi | Setiap tamu |
| Kendaraan masuk | Semprot roda + undercarriage | Setiap kendaraan |
| Uji air minum | Laboratorium terakreditasi | 6 bulan sekali |
| Pengendalian kunjungan | Tamu non-esensial dilarang masuk area produksi | Permanen |

---

## 9. Manajemen Pemasaran

### 9.1 Segmentasi Produk Breeding

| Produk | Target Pasar | Harga Referensi | Syarat Kualitas |
|---|---|---|---|
| Bibit jantan F1/F2 unggul | Peternak, sentra pembibitan | Rp 3–8 juta/ekor | Pedigree lengkap, BCS 3–3,5, bebas penyakit |
| Bibit betina dara siap kawin | Peternak kecil, pemerintah | Rp 2,5–5 juta/ekor | BCS 3, vaksin lengkap, umur 8–12 bulan |
| Cempe lepas sapih | Peternak penggemukan | Rp 800rb–1,5 juta/ekor | Bobot ≥12 kg, vaksin dasar |
| Indukan afkir | Jagal / pasar hewan | Harga potong + premium | BCS ≥ 2,5 |
| Semen beku (jika memiliki pejantan elite) | BBIB, peternak IB | Rp 50–200rb/dosis | Kualitas semen A (motilitas ≥40% post-thaw) |
| Pupuk kompos | Petani, kebun | Rp 400–600/kg | Kadar air <40%, matang |

### 9.2 Data Pelanggan & Jaringan Pemasaran

| Field | Keterangan |
|---|---|
| ID Pelanggan | Nomor unik pembeli |
| Nama Lengkap / Instansi | — |
| Kategori | Peternak / Jagal / Dinas / Eksportir / Perorangan |
| Alamat & No. HP | — |
| Riwayat Pembelian | Tanggal, jumlah, jenis, harga |
| Metode Pembayaran | Tunai / Transfer / Kredit |
| Rating Pelanggan | Prioritas / Reguler / Baru |
| Catatan Khusus | Preferensi, negosiasi, keluhan |

### 9.3 Pencatatan Transaksi Penjualan

| Tanggal | ID Ternak | Deskripsi | Pembeli | Harga/ekor (Rp) | Jumlah | Total (Rp) | Dokumen |
|---|---|---|---|---|---|---|---|
| 2024-07-05 | KMB-2023-045 | Bibit jantan F2 Boer, 10 bulan, 28 kg | Pak Hendra – Magelang | 4.500.000 | 2 | 9.000.000 | Nota + SKKH |
| 2024-07-18 | KMB-2023-058, 059 | Cempe betina sapih, ±12 kg | KTT Maju Jaya | 1.200.000 | 5 | 6.000.000 | Nota + SKKH |

### 9.4 Dokumen Wajib Setiap Transaksi

| Dokumen | Keterangan |
|---|---|
| Nota/Kwitansi | Bukti pembayaran resmi, nomor seri urut |
| Surat Keterangan Kesehatan Hewan (SKKH) | Diterbitkan drh. berwenang, berlaku 14 hari |
| Surat Jalan / Angkutan Ternak | Wajib dalam perjalanan lintas kabupaten/provinsi |
| Sertifikat Vaksinasi | Bukti vaksinasi yang telah diberikan |
| Kartu Identitas Ternak (Pedigree Card) | Riwayat silsilah, berat, kesehatan |
| Foto Ternak | Minimal 2 foto (samping kiri, samping kanan) |

### 9.5 Strategi & Saluran Pemasaran

| Saluran | Keterangan | Biaya | Efektivitas |
|---|---|---|---|
| Penjualan langsung di farm | Pembeli datang, inspeksi langsung | Rendah | Tinggi (nilai tawar lebih baik) |
| WhatsApp Group / Broadcast | Grup peternak daerah, update stok rutin | Sangat rendah | Tinggi untuk pasar lokal |
| Media sosial (Instagram, Facebook, TikTok) | Konten edukatif + promosi bibit | Rendah | Tinggi untuk brand awareness |
| Marketplace ternak (ternakqu, dll.) | Listing online khusus ternak | Komisi 2–5% | Jangkauan luas |
| Kemitraan dengan dinas peternakan | Program bantuan bibit pemerintah | Proses administrasi | Volume besar, harga stabil |
| Pameran & lelang ternak | Kontes domba, pameran agro | Biaya ikut + transportasi | Brand premium, harga tinggi |
| Kerjasama dengan KTT (Kelompok Tani Ternak) | Penjualan kolektif | — | Jangkauan lebih luas |

### 9.6 KPI Pemasaran

| KPI | Formula | Target |
|---|---|---|
| Nilai Penjualan Bulanan (Rp) | Total semua transaksi dalam bulan | Sesuai proyeksi bisnis |
| Harga Rata-rata Per Ekor | Total penjualan / Jumlah terjual | Meningkat 5–10% / tahun |
| Waktu Rata-rata Penjualan | Hari dari siap jual hingga terjual | ≤ 30 hari |
| Tingkat Repeat Order | Pembeli yang kembali beli / Total pembeli | ≥ 60% |
| Rasio Bibit Terjual vs Afkir | Bibit terjual / Total ternak keluar | ≥ 70% terjual sebagai bibit |
| Keluhan Pelanggan | Jumlah komplain per periode | 0 keluhan tidak tertangani |

---

## 10. Keuangan & Analisis Usaha

### 10.1 Biaya Produksi (Cost of Production)

| Komponen Biaya | Contoh Item | % dari Total Biaya |
|---|---|---|
| Pakan (terbesar) | Hijauan, konsentrat, mineral, air | 55–65% |
| Tenaga kerja | Gaji, tunjangan, BPJS, pelatihan | 15–20% |
| Kesehatan hewan | Vaksin, obat, drh. konsultan | 5–8% |
| Penyusutan kandang & alat | Nilai aset / umur ekonomis | 5–10% |
| Listrik & air | Pompa air, lampu kandang | 2–4% |
| Transportasi | Pengambilan pakan, pengiriman ternak | 2–3% |
| Administrasi | ATK, software, dokumentasi | 1–2% |
| Lain-lain | Tak terduga | 2–3% |

### 10.2 Analisis Pendapatan Per Periode (Per Indukan / Per Siklus)

| Item Pendapatan | Satuan | Jumlah | Harga (Rp) | Total (Rp) |
|---|---|---|---|---|
| Penjualan bibit jantan unggul | ekor | 1 | 4.500.000 | 4.500.000 |
| Penjualan bibit betina sapih | ekor | 1 | 1.200.000 | 1.200.000 |
| Penjualan kompos | kg | 50 | 500 | 25.000 |
| **Total Pendapatan / indukan / siklus** | | | | **5.725.000** |
| **Total Biaya / indukan / siklus** | | | | 3.200.000 |
| **Net Margin** | | | | **2.525.000** |
| **R/C Ratio** | | | | **1,79** |

### 10.3 Laporan Keuangan Bulanan (Ringkasan)

| Field | Keterangan |
|---|---|
| Total Penerimaan (Rp) | Semua sumber pendapatan |
| Total Pengeluaran Operasional (Rp) | Pakan + TK + Kesehatan + Lainnya |
| Laba Kotor (Rp) | Penerimaan − Pengeluaran operasional |
| Penyusutan Aset (Rp) | Alokasi bulanan |
| Laba Bersih (Rp) | Laba kotor − Penyusutan |
| Arus Kas (Cash Flow) | Positif / Negatif |
| Catatan Hutang / Piutang | Cicilan KUR, piutang dagang |

---

## 11. Infrastruktur & Aset Kandang

### 11.1 Inventaris Kandang

| ID Kandang | Tipe | Kapasitas (ekor) | Penghuni Saat Ini | Kondisi | Terakhir Didesinfeksi |
|---|---|---|---|---|---|
| KDG-A1 | Kandang indukan laktasi | 20 | 18 | Baik | 2024-07-01 |
| KDG-A2 | Kandang indukan kering | 15 | 12 | Baik | 2024-07-01 |
| KDG-B1 | Kandang pejantan | 5 | 3 | Baik | 2024-07-01 |
| KDG-B2 | Kandang dara/jantan muda | 25 | 22 | Cukup | 2024-06-15 |
| KDG-B3 | Kandang penggemukan (afkir) | 20 | 10 | Baik | 2024-07-01 |
| KDG-C1 | Kandang beranak (maternity pen) | 10 | 0 | Siap | 2024-07-10 |
| KDG-C2 | Kandang karantina | 8 | 2 | Baik | 2024-07-08 |
| GDG-01 | Gudang pakan | — | — | Baik | 2024-07-01 |

### 11.2 Inventaris Peralatan

| Alat | Jumlah | Kondisi | Terakhir Kalibrasi / Servis | Nilai (Rp) |
|---|---|---|---|---|
| Timbangan ternak digital (cap. 200 kg) | 2 | Baik | Mei 2024 | 2.500.000 |
| USG portable (reproduksi) | 1 | Baik | Jan 2024 | 25.000.000 |
| Ear tag applicator | 3 | Baik | — | 150.000 |
| RFID reader | 1 | Baik | — | 3.500.000 |
| Selang + pompa air | 2 set | Baik | — | 500.000 |
| Sprayer desinfektan (20 L) | 4 | Baik | — | 200.000 |
| Mesin chopper rumput | 1 | Cukup | Mar 2024 | 8.000.000 |
| Gerobak dorong | 5 | Baik | — | 250.000 |
| Peralatan bedah minor | 1 set | Baik | — | 1.500.000 |
| Termos nitrogen cair (semen beku) | 1 | Baik | Apr 2024 | 4.500.000 |

---

## 12. Dokumen & Legalitas

| Dokumen | Nomor | Tanggal Terbit | Masa Berlaku | Status |
|---|---|---|---|---|
| Izin Usaha Peternakan (IUP) | — | — | — | Aktif |
| Nomor Induk Berusaha (NIB) | — | — | Permanen | Aktif |
| Sertifikasi NKV (Nomor Kontrol Veteriner) | — | — | 3 tahun | Aktif |
| Sertifikat Bebas PMK / Brucellosis (farm) | — | — | 1 tahun | Aktif |
| NPWP Usaha | — | — | Permanen | Aktif |
| Izin Lingkungan / AMDAL | — | — | — | Aktif |
| Kontrak lahan (jika sewa) | — | — | Sesuai kontrak | Aktif |
| Asuransi Ternak (AUTS/AUTK) | — | — | 1 tahun | Aktif |

---

## RINGKASAN KPI UTAMA BREEDING FARM

| Kategori | KPI | Target |
|---|---|---|
| Reproduksi | Conception Rate | ≥ 80% |
| Reproduksi | Lambing Rate | ≥ 130% |
| Reproduksi | Lambing Interval | ≤ 8 bulan |
| Reproduksi | Litter Size | ≥ 1,5 |
| Pertumbuhan | ADG Pre-sapih | ≥ 100 g/hari |
| Pertumbuhan | ADG Post-sapih | ≥ 120 g/hari |
| Pertumbuhan | Berat Sapih 90 hari | ≥ 12 kg |
| Kesehatan | Mortalitas Dewasa | ≤ 3% / tahun |
| Kesehatan | Mortalitas Pre-sapih | ≤ 10% |
| Pakan | FCR | ≤ 8 |
| Keuangan | R/C Ratio | ≥ 1,5 |
| Genetik | Koefisien Inbreeding | < 6,25% (F1) |

---

*Dokumen ini hendaknya diperbarui minimal setiap 6 bulan atau mengikuti perubahan SOP peternakan. Versi: 1.0 — Disusun berdasarkan praktik manajemen peternakan breeding kambing & domba berstandar nasional dan internasional.*
