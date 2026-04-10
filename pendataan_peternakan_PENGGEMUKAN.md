# Sistem Pendataan Peternakan Kambing & Domba — PENGGEMUKAN (Feedlot)
> Dokumen pendataan ringkas dan operasional untuk unit penggemukan (fattening). Fokus pada efisiensi pakan, pertambahan bobot badan harian, dan perputaran ternak yang cepat menuju pasar.

---

## DAFTAR ISI

1. [Identitas Ternak Masuk](#1-identitas-ternak-masuk)
2. [Monitoring Pertumbuhan & Bobot](#2-monitoring-pertumbuhan--bobot)
3. [Manajemen Pakan](#3-manajemen-pakan)
4. [Kesehatan & Vaksinasi](#4-kesehatan--vaksinasi)
5. [Kebersihan Kandang](#5-kebersihan-kandang)
6. [Pegawai & Jadwal Kerja](#6-pegawai--jadwal-kerja)
7. [Pemasaran & Penjualan](#7-pemasaran--penjualan)
8. [Keuangan Ringkas](#8-keuangan-ringkas)

---

## 1. Identitas Ternak Masuk

> Setiap ternak yang masuk ke unit penggemukan wajib diregistrasi pada hari yang sama.

### 1.1 Form Penerimaan Ternak

| Field | Keterangan | Contoh |
|---|---|---|
| ID / Ear Tag | Nomor tag yang dipasang saat masuk | `GEM-2024-0301` |
| Tanggal Masuk | Tanggal ternak tiba di kandang | `2024-07-01` |
| Asal Ternak | Nama peternak / pasar / daerah asal | `Pasar Hewan Sleman` |
| Ras / Tipe | Kambing Kacang / Boer Cross / Etawa / Domba Garut / dll | `Domba Garut Cross` |
| Jenis Kelamin | Jantan / Betina | `Jantan` |
| Estimasi Umur | Berdasarkan gigi / keterangan penjual | `6–8 bulan` |
| Bobot Masuk (kg) | Ditimbang hari kedatangan | `18,5 kg` |
| Harga Beli (Rp) | Harga perolehan ternak | `Rp 1.450.000` |
| Kondisi Saat Masuk | Sehat / Kurus / Cacat / Sakit | `Sehat, BCS 2,5` |
| Nomor Kandang | Kandang penempatan | `KDG-F2` |
| Batch Penggemukan | Grup/periode penggemukan | `BATCH-2024-07` |

### 1.2 Status Karantina Ternak Baru

| Field | Keterangan |
|---|---|
| Tanggal mulai karantina | Hari kedatangan |
| Durasi karantina | Minimal 14 hari (dipisah dari kawanan lama) |
| Obat cacing saat masuk | Jenis obat, dosis, tanggal |
| Vaksinasi saat masuk | Jenis vaksin, tanggal |
| Kondisi akhir karantina | Sehat / Masih diobservasi / Afkir |
| Tanggal bergabung kawanan | Tanggal ternak masuk kandang penggemukan reguler |

---

## 2. Monitoring Pertumbuhan & Bobot

### 2.1 Rekam Bobot Per Ternak

| Tanggal | Umur di Farm (hari) | Bobot (kg) | ADG (g/hari) | BCS | Keterangan |
|---|---|---|---|---|---|
| 2024-07-01 | 0 | 18,5 | — | 2,5 | Bobot masuk |
| 2024-08-01 | 31 | 22,8 | 139 | 3,0 | Penimbangan rutin |
| 2024-09-01 | 62 | 27,1 | 139 | 3,0 | Penimbangan rutin |
| 2024-10-01 | 92 | 32,0 | 163 | 3,5 | Menjelang jual |

**Frekuensi Penimbangan:** Minimal 1× per bulan. Wajib ditimbang saat masuk dan saat keluar (jual).

### 2.2 Indikator Performa Penggemukan

| Indikator | Formula | Target Penggemukan |
|---|---|---|
| ADG (Average Daily Gain) | (Berat akhir − Berat awal) / Lama (hari) | ≥ 150 g/hari |
| Total Pertambahan Bobot | Berat jual − Berat masuk | ≥ 15 kg per siklus |
| Lama Penggemukan | Hari dari masuk hingga jual | 60–90 hari |
| Berat Jual Target | Berat saat dijual | ≥ 30–35 kg |
| BCS Target Jual | BCS saat dijual | 3,0–3,5 |
| FCR | Total pakan (kg BK) / Total PBBH (kg) | ≤ 8 |

### 2.3 Rekap Performa Batch

| Batch | Tgl Masuk | Tgl Jual | Jumlah (ekor) | BB Rata Masuk (kg) | BB Rata Jual (kg) | ADG Rata (g/hr) | FCR | Mortalitas |
|---|---|---|---|---|---|---|---|---|
| BATCH-2024-04 | Apr 2024 | Jun 2024 | 30 | 17,2 | 31,5 | 159 | 7,8 | 1 ekor (3,3%) |
| BATCH-2024-07 | Jul 2024 | Sep 2024 | 35 | 18,5 | 32,0 | 147 | 8,1 | 0 ekor (0%) |

---

## 3. Manajemen Pakan

### 3.1 Formulasi Ransum Penggemukan

| Bahan Pakan | Proporsi (%) | Catatan |
|---|---|---|
| Hijauan (rumput, jerami fermentasi) | 50–60% | Sumber serat, rumen sehat |
| Konsentrat komersial (PK ≥ 16%) | 25–30% | Sumber energi + protein |
| Dedak padi / pollard | 10–15% | Sumber energi tambahan |
| Mineral blok | Ad libitum | Selalu tersedia |

**Target Nutrien Ransum Penggemukan:**

| Nutrien | Target |
|---|---|
| Protein Kasar (PK) | 13–16% BK |
| TDN | 62–68% BK |
| Serat Kasar (SK) | 18–25% BK |
| Rasio Ca : P | 2 : 1 |

### 3.2 Pencatatan Pakan Harian (Per Kandang)

| Tanggal | Kandang | Jumlah Ternak | Hijauan Diberikan (kg) | Konsentrat Diberikan (kg) | Sisa Pakan (kg) | Konsumsi Aktual (kg) |
|---|---|---|---|---|---|---|
| 2024-09-01 | KDG-F2 | 12 | 60 | 18 | 4 | 74 |
| 2024-09-01 | KDG-F3 | 15 | 75 | 22 | 6 | 91 |

### 3.3 Jadwal Pemberian Pakan

| Waktu | Pakan | Keterangan |
|---|---|---|
| 05.30 | Hijauan pagi | 40% dari jatah hijauan harian |
| 07.00 | Konsentrat pagi | 50% dari jatah konsentrat harian |
| 12.00 | Hijauan siang + air minum cek | 30% hijauan harian |
| 15.00 | Konsentrat sore | 50% dari jatah konsentrat harian |
| 17.00 | Hijauan sore | 30% hijauan harian |
| Sepanjang hari | Air minum + mineral blok | Ad libitum |

### 3.4 Kalkulasi FCR & Efisiensi Pakan

| Field | Nilai | Keterangan |
|---|---|---|
| Total pakan dikonsumsi (kg BK) | 385 kg | Selama 90 hari penggemukan |
| Total PBBH (kg) | 13,5 kg | BB jual − BB masuk |
| FCR | **8,1** | 385 / 13,5 × ≈ per ekor |
| Biaya pakan per ekor (Rp) | 462.000 | Total biaya pakan per ekor |
| Biaya pakan per kg PBBH (Rp) | 34.200 | Biaya pakan / PBBH |

### 3.5 Stok Pakan & Gudang

| Bahan | Stok Saat Ini (kg) | Kebutuhan/Hari (kg) | Estimasi Habis |
|---|---|---|---|
| Rumput Gajah segar | 2.500 | 200 | 12 hari |
| Jerami fermentasi | 1.200 | 80 | 15 hari |
| Konsentrat komersial | 500 | 50 | 10 hari |
| Dedak padi | 300 | 30 | 10 hari |
| Mineral blok | 20 biji | ± 2 biji/minggu | 10 minggu |

---

## 4. Kesehatan & Vaksinasi

### 4.1 Protokol Standar Saat Ternak Masuk

| Tindakan | Obat / Vaksin | Dosis | Keterangan |
|---|---|---|---|
| Obat cacing (saat masuk) | Albendazole 10% | 1 ml / 10 kg BB | Oral, semua ternak masuk |
| Vitamin B kompleks | Injeksi B kompleks | 3 ml IM | Mengatasi stres transport |
| Vaksin PMK | Vaksin PMK | 2 ml IM | Jika belum divaksin |
| Vaksin Clostridial (CDT) | CDT | 2 ml SC | Jika belum divaksin |

### 4.2 Jadwal Vaksinasi Rutin

| Vaksin | Target | Interval | Waktu Terbaik |
|---|---|---|---|
| PMK | Seluruh ternak | 6 bulan | Saat masuk + H-90 (jika masih di farm) |
| Anthrax | Daerah endemik | 1 tahun | Awal musim kemarau |
| Clostridial (CDT) | Seluruh ternak | 6 bulan | Saat masuk + H-90 |
| Obat cacing | Seluruh ternak | 3 bulan (rotasi) | Saat masuk, H-30, H-60 jika siklus panjang |

### 4.3 Log Kesehatan Harian

| Tanggal | ID Ternak | Tanda Klinis | Tindakan | Obat & Dosis | Petugas | Hasil |
|---|---|---|---|---|---|---|
| 2024-08-10 | GEM-2024-0315 | Diare cair, lemas | Isolasi, terapi | Sulfa 5 ml + elektrolit oral | Budi | Sembuh H+4 |
| 2024-08-22 | GEM-2024-0327 | Pincang kiri depan | Periksa kaki, cuci | Penisilin 3 ml IM + foot bath | drh. Hasan | Sembuh H+3 |

**Tanda-tanda Klinis Penting yang Harus Segera Dilaporkan:**
- Diare (terutama berdarah)
- Nafsu makan turun drastis > 1 hari
- Demam (suhu rektal > 40,5°C)
- Sesak nafas / batuk terus-menerus
- Bengkak di kepala, leher, atau rahang
- Luka tidak sembuh
- Kematian mendadak tanpa gejala sebelumnya

### 4.4 Data Mortalitas

| Tanggal | ID Ternak | Batch | BB Terakhir (kg) | Dugaan Penyebab | Autopsi | Nilai Kerugian (Rp) |
|---|---|---|---|---|---|---|
| 2024-06-18 | GEM-2024-0285 | BATCH-04 | 28,0 | Pneumonia | Tidak | 1.800.000 |

**Target:** Tingkat mortalitas ≤ 3% per batch.

---

## 5. Kebersihan Kandang

### 5.1 Jadwal Pembersihan

| Frekuensi | Tugas | Bahan / Alat | Penanggung Jawab |
|---|---|---|---|
| Harian (2×) | Buang kotoran dari lantai kandang | Sekop, gerobak | Shift aktif |
| Harian | Cuci tempat minum + isi ulang air | Air bersih, sikat | Shift aktif |
| Harian | Angkat sisa pakan | Manual | Shift aktif |
| 2× seminggu | Cuci lantai dengan air bertekanan | Selang / pompa | Petugas kandang |
| 1× seminggu | Desinfeksi lantai dan dinding | Karbol / Glutaraldehyde 1% | Kepala kandang |
| 2× seminggu | Ganti larutan foot bath | NaOH 2% / Formalin 5% | Shift pagi |
| 1× bulan | Fumigasi kandang kosong (antar batch) | Formalin 37% | Kepala kandang |
| 1× triwulan | Pengapuran dinding dan lantai | Kapur tohor 20% | Semua pegawai |

### 5.2 Checklist Kebersihan Harian

| Item Checklist | Pagi ✓/✗ | Sore ✓/✗ |
|---|---|---|
| Kotoran dibuang dari semua kandang | | |
| Tempat minum dicuci dan diisi ulang | | |
| Sisa pakan diangkat | | |
| Saluran air / selokan tidak tersumbat | | |
| Foot bath terisi larutan desinfektan | | |
| Tidak ada tanda hama (tikus, lalat berlebih) | | |
| Lantai kering dan tidak becek berbahaya | | |
| Tempat penampungan kotoran tertutup | | |

**Petugas:** _________________ Tanggal: _________________

### 5.3 Pengelolaan Kotoran

| Aspek | Keterangan |
|---|---|
| Produksi kotoran per ekor/hari | ± 1,5–2 kg |
| Pengolahan | Kompos aerobik (45–60 hari) |
| Produk | Pupuk organik padat |
| Nilai jual kompos | Rp 400–600/kg |
| Jarak kandang dari sumber air | Minimal 25 meter |

---

## 6. Pegawai & Jadwal Kerja

### 6.1 Data Pegawai Penggemukan

| ID | Nama | Jabatan | Shift | Area Kandang | No. HP |
|---|---|---|---|---|---|
| PGW-01 | Budi S. | Kepala Kandang | Pagi | Semua | — |
| PGW-02 | Andi P. | Petugas Kandang | Pagi | F1, F2, F3 | — |
| PGW-03 | Sari W. | Petugas Kandang | Sore | F1, F2, F3 | — |
| PGW-04 | Joko M. | Petugas Pakan | Pagi | Gudang pakan | — |
| PGW-05 | drh. Hasan | Dokter Hewan | On-call | Semua | — |

### 6.2 Tugas Harian Ringkas

| Waktu | Tugas | PIC |
|---|---|---|
| 05.00 | Cek kondisi malam, laporan kejadian | Piket |
| 05.30 | Buang kotoran, bersih sisa pakan | Shift pagi |
| 06.00 | Pakan hijauan pagi | Joko |
| 07.00 | Konsentrat pagi + catat sisa pakan | Andi |
| 08.00 | Cuci lantai kandang + tempat minum | Andi, Sari |
| 10.00 | Penimbangan bobot (sesuai jadwal) | Budi |
| 11.00 | Cek kesehatan visual semua ternak | Budi |
| 12.00 | Hijauan siang + cek air minum | Shift aktif |
| 15.00 | Konsentrat sore | Sari |
| 16.00 | Desinfeksi (jadwal mingguan) | Sari |
| 17.00 | Hijauan sore + cek mineral blok | Sari |
| 19.00 | Laporan harian (feed intake, kejadian) | Budi / Admin |

### 6.3 KPI Pegawai

| Indikator | Target |
|---|---|
| Kehadiran | ≥ 95% |
| Kelengkapan form harian | 100% |
| Laporan kejadian sakit ≤ 2 jam sejak terlihat | 100% |
| Kerapian kandang area tanggung jawab | Sesuai standar |

---

## 7. Pemasaran & Penjualan

### 7.1 Segmentasi Pasar Penggemukan

| Segmen Pasar | Tipe Pembeli | Bobot Target (kg) | Harga Referensi |
|---|---|---|---|
| Aqiqah & Qurban | Konsumen langsung / agen | 25–40 kg | Rp 1,8–3,5 juta/ekor |
| Jagal & RPH | Pengepul daging | 30–40 kg | Rp 45–55 ribu/kg hidup |
| Katering & restoran | Pembelian karkas | Karkas ≥ 15 kg | Rp 100–130 ribu/kg karkas |
| Pengepul / tengkulak | Lot besar | Fleksibel | Rp 40–50 ribu/kg hidup |
| Penjualan langsung (eceran farm) | Perorangan | 25–35 kg | Premium 10–15% di atas pasar |

### 7.2 Log Penjualan

| Tanggal | ID Ternak | Bobot Jual (kg) | Lama di Farm (hari) | Pembeli | Harga (Rp) | Jenis Transaksi | Dokumen |
|---|---|---|---|---|---|---|---|
| 2024-09-20 | GEM-2024-0301 | 32,0 | 81 | Agen Aqiqah Solo | 2.400.000 | Tunai | Nota + SKKH |
| 2024-09-20 | GEM-2024-0302 | 29,5 | 81 | Agen Aqiqah Solo | 2.200.000 | Tunai | Nota + SKKH |
| 2024-09-22 | GEM-2024-0310–0315 | 31,2 (rata) | 83 | Jagal Pak Darto | 8.400.000 | Transfer | Nota + SKKH |

### 7.3 Dokumen Penjualan Wajib

| Dokumen | Keterangan |
|---|---|
| Nota / Kwitansi | Nomor urut, nama pembeli, jumlah, harga |
| SKKH (Surat Keterangan Kesehatan Hewan) | Diterbitkan drh. berwenang, berlaku 14 hari |
| Surat Jalan | Wajib untuk pengiriman lintas kabupaten / provinsi |
| Foto ternak | Minimal 1 foto per ekor yang dijual |

### 7.4 Strategi Pemasaran Ringkas

| Saluran | Keterangan |
|---|---|
| WhatsApp Broadcast | Update stok rutin ke grup agen & pelanggan tetap |
| Media sosial | Foto & video ternak siap jual (konten autentik) |
| Kemitraan agen aqiqah | Kontrak tetap untuk suplai bulanan |
| Kemitraan RPH / jagal | Harga borongan, volume besar |
| Website / marketplace ternak | Listing online untuk jangkauan lebih luas |

### 7.5 KPI Pemasaran

| KPI | Target |
|---|---|
| Waktu jual dari siap jual | ≤ 14 hari |
| Harga rata-rata / kg hidup | ≥ harga pasar setempat |
| Persentase penjualan langsung (non-tengkulak) | ≥ 50% |
| Repeat order pelanggan | ≥ 60% |

---

## 8. Keuangan Ringkas

### 8.1 Analisis Per Ekor Per Siklus (90 Hari)

| Item | Nilai (Rp) | Keterangan |
|---|---|---|
| **PEMASUKAN** | | |
| Harga jual | 2.400.000 | 32 kg × Rp 75.000/kg hidup |
| **PENGELUARAN** | | |
| Harga beli ternak | 1.450.000 | Bobot masuk 18,5 kg |
| Biaya pakan | 462.000 | 90 hari × Rp 5.133/hari |
| Kesehatan & vaksin | 45.000 | Obat masuk + rutin |
| Tenaga kerja (alokasi) | 120.000 | Proporsi biaya TK per ekor |
| Penyusutan kandang | 30.000 | Alokasi per ekor per siklus |
| Lain-lain | 30.000 | Transportasi, administrasi |
| **Total Biaya** | **2.137.000** | |
| **Laba Bersih** | **263.000** | Per ekor |
| **Margin** | **11,0%** | |
| **R/C Ratio** | **1,12** | |

### 8.2 Break-Even Analysis

| Field | Nilai |
|---|---|
| Total Biaya Operasional Per Ekor | Rp 2.137.000 |
| Harga Jual Break-Even (/kg hidup) | Rp 66.781 / kg (32 kg) |
| Target Harga Jual Minimum | ≥ Rp 67.000 / kg hidup |
| ADG Minimum untuk BEP | ≥ 120 g/hari (bobot jual ≥ 29 kg) |

### 8.3 Laporan Keuangan Bulanan Ringkas

| Field | Keterangan |
|---|---|
| Total Penerimaan (Rp) | Semua penjualan bulan berjalan |
| Total Pengeluaran Pakan (Rp) | Semua pembelian pakan |
| Total Pengeluaran Kesehatan (Rp) | Vaksin + obat + drh. |
| Total Pengeluaran Tenaga Kerja (Rp) | Gaji + tunjangan |
| Total Pembelian Ternak (Rp) | Biaya pengadaan bakalan |
| Laba Bersih (Rp) | Total penerimaan − total pengeluaran |
| Arus Kas (Cash Flow) | Positif / Negatif |

---

## RINGKASAN KPI PENGGEMUKAN

| Kategori | KPI | Target |
|---|---|---|
| Pertumbuhan | ADG | ≥ 150 g/hari |
| Pertumbuhan | Bobot jual | ≥ 30 kg |
| Pakan | FCR | ≤ 8 |
| Pakan | Biaya pakan/kg PBBH | ≤ Rp 40.000 |
| Kesehatan | Mortalitas per batch | ≤ 3% |
| Keuangan | R/C Ratio | ≥ 1,2 |
| Keuangan | Laba per ekor | ≥ Rp 250.000 |
| Pemasaran | Waktu jual dari siap jual | ≤ 14 hari |
| Operasional | Lama penggemukan | 60–90 hari |

---

*Dokumen ini adalah versi operasional ringkas untuk unit penggemukan (feedlot). Untuk panduan breeding lengkap, lihat dokumen: `pendataan_peternakan_BREEDING.md`. Versi: 1.0*
