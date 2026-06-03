# 📄 Surat Klarifikasi & Konfirmasi Penggunaan Midtrans — TernakOS

**Kepada Yth. Tim Verifikasi / Compliance Midtrans**  
**Perihal: Klarifikasi Penggunaan Payment Gateway pada Platform TernakOS**

Dengan hormat,

Sehubungan dengan peninjauan pendaftaran merchant **TernakOS** dan pertanyaan yang diajukan oleh Tim Compliance Midtrans:

> *"Mohon konfirmasinya terkait fitur transaksi jual beli? apakah nantinya user apps akan mendaftarkan diri masing2 ke payment gateway untuk menggunakan fitur ini?"*

Bersama surat ini, kami selaku pengelola platform **TernakOS** memberikan konfirmasi resmi beserta penjelasan alur kerja (*system workflow*) untuk menegaskan batasan integrasi payment gateway Midtrans di platform kami.

---

## 🗺️ Perbandingan Alur Kerja Platform

Untuk memperjelas batasan sistem, berikut adalah penjelasan alur kerja untuk masing-masing modul:

### 1. Alur Pembayaran Langganan SaaS (Satu-satunya Alur yang Terintegrasi Midtrans)
Aliran dana yang diproses oleh Midtrans **hanya terjadi** saat Pengguna membayar biaya sewa software (SaaS Subscription) ke **TernakOS** agar akun premium mereka aktif.
1. **Pemilihan Paket**: Pengguna (Peternak/Broker/RPA) masuk ke menu upgrade di dalam dashboard TernakOS dan memilih paket premium (misalnya paket Pro senilai Rp 149.000/bulan).
2. **Pembuatan Invoice**: Sistem backend TernakOS membuat data transaksi invoice berstatus `pending`.
3. **Pengalihan ke Midtrans**: Pengguna diarahkan ke antarmuka pembayaran **Midtrans Snap** (QRIS/VA/E-Wallet).
4. **Penyelesaian Transaksi**: Pengguna melakukan transfer pembayaran.
5. **Webhook & Aktivasi**: Midtrans mengirimkan notifikasi instan (*webhook*) ke server TernakOS. Setelah divalidasi, sistem TernakOS otomatis memperpanjang masa aktif paket pengguna.
6. **Penerimaan Dana**: Dana masuk ke akun merchant terpusat milik **TernakOS**. 
* **Kesimpulan**: *Pengguna akhir (peternak/broker/RPA) tidak perlu mendaftar ke Midtrans karena kedudukan mereka di alur ini murni sebagai pembeli/konsumen SaaS.*

```
[ Pengguna ] ───(Upgrade Paket)───> [ TernakOS (Invoice Pending) ]
                                              │
                                       (Redirect Snap)
                                              ▼
[ Pengguna ] ───(Bayar via QRIS/VA)───> [ Midtrans Gateway ] ───(Kirim Webhook)───> [ Server TernakOS ]
                                                                                           │
                                                                                    (Aktivasi Paket)
                                                                                           ▼
                                                                                   [ Akun Premium Aktif ]
```

---

### 2. Alur Pencatatan Jual Beli Operasional (TIDAK Terintegrasi Midtrans)
Modul ini murni berupa **pencatatan data administrasi (Buku Kas & Recording)** untuk operasional harian peternakan pengguna. Tidak ada transaksi keuangan digital yang difasilitasi oleh aplikasi.
1. **Transaksi Offline**: Peternak melakukan kesepakatan jual beli hewan ternak atau pakan dengan mitranya di lapangan secara langsung.
2. **Pembayaran Manual**: Proses pembayaran riil dilakukan secara **offline** di luar aplikasi (misalnya melalui transfer bank manual antar-rekening pribadi mereka, atau tunai saat serah terima barang).
3. **Pencatatan Administratif (Ledger)**: Peternak menginput data nominal transaksi ke dalam aplikasi TernakOS agar laporan keuangan/buku kas usaha mereka di dashboard ter-update secara rapi, serta agar sistem dapat menghitung HPP (Harga Pokok Penjualan) secara otomatis.
4. **Status Administratif**: Transaksi ditandai sebagai `Lunas` atau `Hutang` di aplikasi murni untuk pencatatan buku kas mereka sendiri.
* **Kesimpulan**: *Tidak ada uang yang mengalir melewati sistem kami atau Midtrans pada alur pencatatan operasional ini. Aplikasi bertindak sebagai buku kas digital.*

```
[ Pengguna (Penjual) ] ───(Kirim Ternak & Nota)───> [ Mitra Bisnis (Pembeli) ]
          │                                                    │
    (Input Buku Kas)                                    (Bayar Transfer Bank Manual / Cash)
          │                                                    │
          ▼                                                    ▼
[ TernakOS Ledger ]                                  [ Rekening Pribadi Penjual ]
(Murni pencatatan data administrasi & HPP)                (Aliran dana riil di luar sistem)
```

---

## 3. Kesimpulan & Penegasan Ulang
1. Pengguna aplikasi (peternak/broker/RPA) **tidak akan mendaftarkan diri masing-masing ke payment gateway (Midtrans)** karena mereka tidak menerima pembayaran digital antar-pengguna di dalam aplikasi kami.
2. Akun Midtrans yang kami ajukan ini **hanya akan digunakan secara B2C (Business-to-Consumer)** untuk menerima pembayaran paket premium (SaaS Subscription) dari pengguna ke **TernakOS**.

Demikian klarifikasi ini kami sampaikan untuk memperjelas alur penggunaan payment gateway Midtrans di platform kami. Kami sangat berharap proses peninjauan ini dapat segera disetujui agar aktivasi layanan Midtrans dapat dilanjutkan.

Salam hangat,  
**Tim Manajemen TernakOS**  
[support@ternakos.id](mailto:support@ternakos.id) | [https://ternakos.my.id](https://ternakos.my.id)
