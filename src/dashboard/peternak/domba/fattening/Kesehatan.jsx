import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Syringe, Info, Trash2, ArrowLeft, HeartPulse, Activity,
  Wheat, Home, FileText, AlertTriangle, BookOpen, ChevronDown, Search,
  ShieldAlert, Biohazard, Clock, Pill, FlaskConical, ShieldCheck, Bug
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useDombaActiveBatches,
  useDombaHealthLogs,
  useDombaAnimals,
  useAddDombaHealthLog,
  useDeleteDombaHealthLog
} from '@/lib/hooks/useDombaPenggemukanData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'

const BASE = '/peternak/peternak_domba_penggemukan'

// ─── Disease Reference Database ───────────────────────────────────────────────

const DISEASE_DB = [
  {
    name: 'PMK (Penyakit Mulut & Kuku)',
    isContagious: true, zoonosis: true, severity: 'kritis',
    pathogen: 'Virus Aphthovirus (Family Picornaviridae)',
    gejala: 'Demam tinggi (40–41°C), lepuhan di bibir, lidah, gusi, celah kuku, dan puting; air liur berlebihan; pincang parah; nafsu makan hilang; anak domba bisa mati mendadak karena miokarditis',
    tindakan: 'Isolasi ketat. Bersihkan luka mulut dengan larutan PK 0,1%. Kuku direndam formalin 4%. Antibiotik sekunder untuk cegah infeksi bakteri. Vitamin C dosis tinggi. WAJIB lapor Dinas Peternakan dalam 24 jam',
    obat: 'Antiseptik (PK/Betadine) + Oxytetracycline + Vitamin C + Vitamin B-Kompleks',
    obat_alternatif: null,
    estimasi_sembuh: '2–3 minggu',
    isolasi: true,
    biosecurity: 'Semprot kandang Natrium Hipoklorit 2% atau kapur tohor. Batasi lalu lintas orang/kendaraan. Pakai APD lengkap. Lapor pemerintah — penyakit strategis nasional.',
  },
  {
    name: 'Scabies / Kudis',
    isContagious: true, zoonosis: true, severity: 'parah',
    pathogen: 'Tungau Sarcoptes scabiei var. ovis',
    gejala: 'Gatal hebat, sering menggaruk/gosok ke dinding; bulu rontok membentuk area botak; kulit menebal berkerak; luka berair berbau; penurunan bobot drastis; kasus parah seluruh tubuh tertular',
    tindakan: 'Cukur bulu area terinfeksi. Rendam dengan air sabun hangat, gosok kerak hingga lepas. Injeksi Ivermectin subkutan. Oleskan salep belerang pada lesi lokal. Periksa ulang 14 hari kemudian',
    obat: 'Ivermectin 1% injeksi subkutan (0,2 mg/kgBB) + Salep belerang 10%',
    obat_alternatif: 'Minyak kelapa + belerang (tradisional)',
    estimasi_sembuh: '3–6 minggu',
    isolasi: true,
    biosecurity: 'Semprot kandang dengan akarisida. Bakar bulu yang dicukur. Ganti semua alas kandang. Cuci tangan dan ganti baju setelah menangani.',
  },
  {
    name: 'Orf / Dakangan',
    isContagious: true, zoonosis: true, severity: 'sedang',
    pathogen: 'Virus Parapoxvirus',
    gejala: 'Luka melepuh lalu keropeng tebal di bibir, moncong, lubang hidung, dan kadang puting; anak domba susah menyusu; nafsu makan turun karena nyeri mulut; demam ringan',
    tindakan: 'Pakai sarung tangan karet selalu (zoonosis). Basahi dan lepas keropeng perlahan. Oleskan antiseptik. Beri pakan lunak yang dicacah kecil. Vitamin B-Kompleks untuk nafsu makan',
    obat: 'Gusanex/Dicodine spray + Betadine + Vitamin B-Kompleks',
    obat_alternatif: 'Perasan jeruk nipis + garam pada luka',
    estimasi_sembuh: '2–3 minggu (self-limiting virus)',
    isolasi: true,
    biosecurity: 'Desinfeksi palungan harian. Jangan berbagi tempat makan/minum antara domba sakit dan sehat.',
  },
  {
    name: 'Pink Eye',
    isContagious: true, zoonosis: false, severity: 'sedang',
    pathogen: 'Moraxella ovis, Chlamydophila spp., atau Mycoplasma',
    gejala: 'Mata merah, berair banyak, belekan; selaput mata keruh/biru; mata tertutup karena silau; bisa satu atau dua mata; kasus lanjut kornea memutih — bisa menyebabkan kebutaan permanen',
    tindakan: 'Bersihkan belekan dengan kapas + air hangat. Oleskan salep mata antibiotik 2x sehari. Tempatkan di tempat teduh, jauh dari debu dan lalat',
    obat: 'Terramycin Ophthalmic Ointment atau tetes mata Chloramphenicol',
    obat_alternatif: 'Air rebusan daun sirih (dingin, tersaring bersih)',
    estimasi_sembuh: '5–10 hari',
    isolasi: true,
    biosecurity: 'Kendalikan populasi lalat. Rutin bersihkan amonia kandang untuk kurangi iritasi mata.',
  },
  {
    name: 'Brucellosis',
    isContagious: true, zoonosis: true, severity: 'parah',
    pathogen: 'Brucella melitensis / Brucella ovis',
    gejala: 'Betina: aborsi mendadak trimester akhir tanpa gejala sebelumnya, plasenta tertahan, cairan vagina berlebihan. Jantan: pembengkakan testis (orchitis), infertilitas. Keduanya: penurunan bobot, lesu, sendi bengkak',
    tindakan: 'TIDAK ADA pengobatan efektif yang memberantas bakteri. Laporkan ke Dinas Peternakan. Pisahkan hewan reaktor-positif (uji serologis). Konsultasi untuk kebijakan culling',
    obat: 'Tidak direkomendasikan mengobati sendiri — konsultasi dokter hewan/Dinas Peternakan',
    obat_alternatif: null,
    estimasi_sembuh: 'Tidak bisa sembuh total — manajemen populasi dan culling',
    isolasi: true,
    biosecurity: 'Bakar/kubur dalam (>1m) fetus aborsi dan plasenta. Uji serologis seluruh kawanan. Pakai APD lengkap saat menangani plasenta.',
  },
  {
    name: 'Pasteurellosis',
    isContagious: true, zoonosis: false, severity: 'parah',
    pathogen: 'Mannheimia haemolytica dan Pasteurella multocida',
    gejala: 'Demam tinggi tiba-tiba (41–42°C), napas cepat dan sesak, ingus mukopurulen hijau/kuning, batuk, lemah, tidak mau bergerak, busa dari mulut/hidung, mata merah. Sering muncul setelah transportasi atau perubahan cuaca ekstrem',
    tindakan: 'Injeksi antibiotik SESEGERA MUNGKIN — setiap jam keterlambatan memperburuk prognosis. Antiinflamasi untuk turunkan demam dan radang paru. Pisahkan dari kawanan segera',
    obat: 'Oxytetracycline LA injeksi (20mg/kgBB) + Meloxicam atau Flunixin Meglumine',
    obat_alternatif: 'Amoxicillin + Sulphatrimethoprim',
    estimasi_sembuh: '5–10 hari jika ditangani cepat',
    isolasi: true,
    biosecurity: 'Hindari stres transportasi, aklimatisasi bertahap setelah pengiriman. Vaksin tersedia (Pasteurella bacterin).',
  },
  {
    name: 'Enterotoxemia / Pulpy Kidney',
    isContagious: false, zoonosis: false, severity: 'kritis',
    pathogen: 'Clostridium perfringens tipe C dan D',
    gejala: 'Kematian MENDADAK pada domba paling sehat/gemuk. Jika sempat diamati: kejang, kepala melengkung ke belakang, diare berdarah, kembung, sempoyongan, keluar air liur berlebihan. Sering menyerang domba baru pindah ke pakan konsentrat tinggi',
    tindakan: 'Sangat sulit ditangani karena berlangsung sangat cepat. Antitoksin C. perfringens jika tersedia. Penicillin G dosis tinggi. Probiotik. Kurangi pakan konsentrat segera',
    obat: 'Antitoksin Clostridium (jika ada) + Penicillin G + Probiotik',
    obat_alternatif: null,
    estimasi_sembuh: 'Prognosis buruk jika sudah bergejala parah',
    isolasi: false,
    biosecurity: 'VAKSINASI adalah kunci (Covexin-8 atau Ultravac 5 in 1). Hindari perubahan pakan mendadak — transisi konsentrat bertahap 7–14 hari.',
  },
  {
    name: 'Foot Rot / Busuk Kuku',
    isContagious: true, zoonosis: false, severity: 'sedang',
    pathogen: 'Dichelobacter nodosus + Fusobacterium necrophorum (sinergistik)',
    gejala: 'Pincang parah satu atau beberapa kaki, domba berjalan berlutut, bau busuk khas dari sela kuku, jaringan antara kuku melunak/membusuk berwarna abu kehitaman, kulit sekitar kuku merah dan bengkak',
    tindakan: 'Potong/bersihkan kuku yang membusuk (foot trimming) hingga jaringan sehat. Rendam kaki dalam Zinc Sulfat 10% atau Formaldehid 5% selama 15–30 menit, 2x seminggu. Injeksi antibiotik sistemik',
    obat: 'Zinc Sulfat 10% untuk foot bath + Oxytetracycline injeksi LA',
    obat_alternatif: 'Chlortetracycline spray pada luka kuku',
    estimasi_sembuh: '4–8 minggu',
    isolasi: true,
    biosecurity: 'Jaga kandang tetap kering. Foot bath wajib di pintu masuk kandang saat musim hujan. Menular sangat efektif di tanah/kandang basah.',
  },
  {
    name: 'Ringworm / Kurap Jamur',
    isContagious: true, zoonosis: true, severity: 'ringan',
    pathogen: 'Jamur Trichophyton verrucosum / Microsporum spp.',
    gejala: 'Bercak bulat botak berbatas tegas, kulit bersisik abu-abu putih seperti abu rokok, tidak selalu gatal (berbeda dengan scabies), bulu patah di tepi bercak, bisa muncul di kepala, leher, sekitar mata, atau punggung',
    tindakan: 'Cukur dan bakar bulu di area lesi + margin 2 cm. Oleskan antijamur topikal 2x sehari. Kasus luas bisa diberi Griseofulvin oral',
    obat: 'Miconazole/Clotrimazole krim topikal + Griseofulvin oral (kasus luas)',
    obat_alternatif: 'Larutan Kalium Permanganat encer atau VCO (minyak kelapa murni)',
    estimasi_sembuh: '4–8 minggu',
    isolasi: true,
    biosecurity: 'Desinfeksi kandang dengan Natrium Hipoklorit/Formalin. Jangan berbagi peralatan grooming antar domba.',
  },
  {
    name: 'Mastitis',
    isContagious: false, zoonosis: false, severity: 'sedang',
    pathogen: 'Staphylococcus aureus, Streptococcus spp., E. coli',
    gejala: 'Ambing panas, merah, keras, bengkak; domba menghindar saat anaknya menyusu; susu berubah warna (kekuningan/kemerahan/ada gumpalan); demam; kasus gangrenous: ambing biru/hitam dan dingin (darurat)',
    tindakan: 'Injeksi antibiotik sistemik. Infus antibiotik intramammary langsung ke puting. Kompres dingin untuk kurangi radang. Perah susu terinfeksi secara teratur dan buang',
    obat: 'Amoxicillin injeksi + Mastijet Fort (intramammary) + Meloxicam (antiinflamasi)',
    obat_alternatif: null,
    estimasi_sembuh: '7–14 hari; gangrenous mastitis prognosis buruk',
    isolasi: false,
    biosecurity: 'Disinfeksi tangan pemerah. Celup puting dengan iodine teat dip setelah pemerahan. Pisahkan anak dari induk sementara.',
  },
  {
    name: 'Cacingan',
    isContagious: false, zoonosis: false, severity: 'sedang',
    pathogen: 'Haemonchus contortus, Fasciola gigantica, Moniezia spp.',
    gejala: 'Penurunan bobot drastis meski makan banyak; anemia (selaput mata pucat — skor FAMACHA); rahang bawah bengkak berisi cairan (bottle jaw); bulu kusam/kasar; kembung ringan; diare atau konstipasi; pertumbuhan anak domba jauh tertinggal',
    tindakan: 'Cekokkan obat cacing sesuai bobot badan. Berikan pakan pemulihan (konsentrat + mineral). Rotasi padang gembalaan untuk putus siklus hidup cacing',
    obat: 'Albendazole 7,5mg/kgBB oral, atau Levamisole, atau Ivermectin (untuk Haemonchus)',
    obat_alternatif: 'Daun pepaya dilayukan + biji pinang muda',
    estimasi_sembuh: '2–4 minggu hingga kondisi membaik',
    isolasi: false,
    biosecurity: 'Layukan rumput sebelum diberikan. Rotasi kandang/padang tiap 6–8 minggu. Deworming rutin tiap 3 bulan.',
  },
  {
    name: 'Kembung / Bloat',
    isContagious: false, zoonosis: false, severity: 'kritis',
    pathogen: 'Bukan infeksi — gangguan fermentasi rumen akibat legum/hijauan basah berlebihan',
    gejala: 'Perut sebelah KIRI membesar seperti drum (saat diketuk berbunyi blong); napas cepat dan sesak; mulut terbuka, lidah membiru pada kasus parah; gelisah, susah berdiri; KEMATIAN dalam 2–4 jam jika tidak ditangani',
    tindakan: 'Cekokkan Tympanol/minyak goreng. Posisikan kepala lebih tinggi. Pijat rumen (perut kiri) untuk bantu keluarkan gas. Ajak berjalan. Jika perut sangat keras dan napas sangat sesak → TROCAR DARURAT oleh dokter hewan',
    obat: 'Tympanol oral + Minyak goreng 50–100ml + Simethicone',
    obat_alternatif: 'Minuman soda cair (tanpa pemanis) untuk merangsang sendawa',
    estimasi_sembuh: '1–3 jam jika ditangani segera',
    isolasi: false,
    biosecurity: 'Layukan legum/hijauan muda minimum 2–4 jam sebelum diberikan. Beri jerami/rumput kering dulu sebelum hijauan basah.',
  },
  {
    name: 'Diare / Enteritis',
    isContagious: false, zoonosis: false, severity: 'sedang',
    pathogen: 'E. coli (anak domba), Salmonella, Cryptosporidium, atau perubahan pakan mendadak',
    gejala: 'Feses encer/cair, bisa berbau busuk atau berdarah; ekor dan belakang tubuh kotor; lesu; dehidrasi (mata cekung, kulit tidak elastis); nafsu makan turun; anak domba tampak kurus dengan perut kempis — anak domba bisa mati dehidrasi dalam 24 jam',
    tindakan: 'Oralit SEGERA (rehidrasi prioritas utama). Probiotik untuk perbaiki flora usus. Jika ada darah atau demam → antibiotik. Puasakan pakan padat 12 jam, ganti dengan oralit',
    obat: 'Oralit + Probiotik + Kaolin-Pectin (adsorben) + Sulphatrimethoprim jika ada demam/darah',
    obat_alternatif: 'Air rebusan daun jambu biji (astringen alami) + larutan gula-garam',
    estimasi_sembuh: '3–7 hari',
    isolasi: false,
    biosecurity: 'Bersihkan kotoran segera. Pastikan pakan dan air minum selalu bersih.',
  },
  {
    name: 'Pneumonia',
    isContagious: false, zoonosis: false, severity: 'parah',
    pathogen: 'Mycoplasma ovipneumoniae (primer) + bakteri sekunder, dipicu lingkungan lembap/dingin/pengap',
    gejala: 'Batuk terutama pagi hari di suhu dingin; napas cepat, cuping hidung membesar; ingus jernih → kuning/hijau; demam (39,5–41°C); lesu, malas bergerak; pada kasus kronis domba kurus permanen (OPA)',
    tindakan: 'Pindahkan ke tempat hangat dan kering. Injeksi antibiotik LA atau Tulathromycin segera. Antiinflamasi untuk turunkan demam. Mukolitik untuk cairkan lendir',
    obat: 'Oxytetracycline LA injeksi + Meloxicam (antiinflamasi) + Vitamin C',
    obat_alternatif: 'Amoxicillin + Bromhexine (mukolitik)',
    estimasi_sembuh: '7–14 hari (akut); kronis sulit sembuh total',
    isolasi: false,
    biosecurity: 'Kandang harus berventilasi baik tapi tidak berangin kencang. Hindari kepadatan tinggi. Jaga domba dari kehujanan dan suhu dingin ekstrem malam hari.',
  },
  {
    name: 'Anemia',
    isContagious: false, zoonosis: false, severity: 'sedang',
    pathogen: 'Infestasi Haemonchus contortus masif, defisiensi Fe, defisiensi Cu, atau perdarahan kronis',
    gejala: 'Selaput mata (konjungtiva) pucat hingga putih (skor FAMACHA 4–5); lesu, tidak semangat; penurunan bobot; bulu kusam; pada kasus parah: edema submandibular (bottle jaw — rahang bawah bengkak berisi cairan); jantung berdegup keras',
    tindakan: 'Identifikasi penyebab (cacing? defisiensi mineral?). Obat cacing jika penyebabnya Haemonchus. Injeksi Vitamin B12 + suplemen Fe jika defisiensi. Berikan pakan bergizi tinggi',
    obat: 'Ivermectin/Albendazole (jika cacing) + Injeksi Vitamin B12 + Fe-Dextran (jika defisiensi mineral)',
    obat_alternatif: null,
    estimasi_sembuh: '4–8 minggu untuk pemulihan penuh',
    isolasi: false,
    biosecurity: 'Pastikan domba mendapat mineral blok yang cukup. Deworming rutin tiap 3 bulan.',
  },
  {
    name: 'White Muscle Disease',
    isContagious: false, zoonosis: false, severity: 'parah',
    pathogen: 'Defisiensi Selenium dan/atau Vitamin E',
    gejala: 'Kelemahan otot (anak domba tidak kuat berdiri/menyusu), tremor otot, jalan sempoyongan, otot paha/punggung terasa keras seperti papan saat diraba, napas cepat jika otot jantung terkena, kematian mendadak pada kasus parah',
    tindakan: 'Injeksi Selenium + Vitamin E (Tokoferolan) SEGERA. Pencegahan pada induk bunting akhir sangat efektif untuk melindungi anak domba',
    obat: 'Tokoferolan (Se + Vit E) injeksi IM/SC',
    obat_alternatif: null,
    estimasi_sembuh: '1–2 minggu jika ringan; kasus berat bisa permanen',
    isolasi: false,
    biosecurity: 'Injeksi induk bunting 4 minggu sebelum melahirkan. Pastikan mineral blok tersedia di kandang sepanjang waktu.',
  },
  {
    name: 'Hipokalsemia / Milk Fever',
    isContagious: false, zoonosis: false, severity: 'kritis',
    pathogen: 'Kadar kalsium darah turun drastis — sering pada induk sesaat setelah atau sebelum melahirkan',
    gejala: 'TIBA-TIBA lemas, tidak bisa berdiri, kepala menoleh ke belakang atau ke samping, kejang kecil, suhu tubuh turun (hypothermia), rumen berhenti bergerak (atonik), tidak responsif terhadap rangsangan',
    tindakan: 'DARURAT — injeksi Kalsium Boroglukonat IV sangat lambat (10–15 menit) atau SC di beberapa titik. Hangatkan tubuh domba. Jangan beri makan sampai domba bisa berdiri sendiri',
    obat: 'Kalsium Boroglukonat 40% (250ml IV sangat lambat) atau SC',
    obat_alternatif: null,
    estimasi_sembuh: '30 menit – 2 jam setelah injeksi jika benar hipokalsemia',
    isolasi: false,
    biosecurity: 'Diet seimbang kalsium–fosfor pada akhir kebuntingan. Hindari pakan legum tinggi oxalat menjelang partus.',
  },
  {
    name: 'Pregnancy Toxemia',
    isContagious: false, zoonosis: false, severity: 'parah',
    pathogen: 'Kekurangan energi parah pada induk bunting kembar/triplet di 4–6 minggu terakhir kebuntingan',
    gejala: 'Induk bunting kembar/triplet; lesu, tidak mau makan, memisahkan diri dari kawanan; sempoyongan, buta sementara (star gazing); napas bau aseton/buah; pada stadium lanjut tidak bisa berdiri',
    tindakan: 'Glukosa oral (Propylene Glycol 60–80ml, 2x sehari) atau injeksi Dextrose 5% IV. Steroid (Dexamethasone) jika mendekati hari H untuk percepat pematangan paru anak. Vitamin B-Kompleks',
    obat: 'Propylene Glycol oral 2x/hari + Dextrose IV + Vit B-Kompleks + Dexamethasone (jika mendekati partus)',
    obat_alternatif: null,
    estimasi_sembuh: '3–7 hari jika ditangani awal',
    isolasi: false,
    biosecurity: 'Pantau BCS (kondisi tubuh) induk — jangan biarkan kurus saat bunting. Naikkan konsentrat bertahap di 6 minggu terakhir kebuntingan.',
  },
  {
    name: 'Keracunan',
    isContagious: false, zoonosis: false, severity: 'kritis',
    pathogen: 'Tanaman beracun (lamtoro berlebihan/HCN, Lantana, Oleander), pestisida organofosfat, atau logam berat',
    gejala: 'Bervariasi: tiba-tiba lemas/kolaps; air liur berbusa berlebihan; pupil melebar atau menyempit; tremor/kejang; napas sangat cepat atau sangat lambat; diare parah; perubahan warna selaput lendir (kebiruan/sangat merah)',
    tindakan: 'Keracunan organofosfat → injeksi Atropin Sulfat. Keracunan umum → berikan Karbon Aktif (Norit) dilarutkan air dan cekokkan. Infus elektrolit. SEGERA hubungi dokter hewan',
    obat: 'Atropin Sulfat (organofosfat) + Karbon Aktif (Norit) oral + Infus elektrolit',
    obat_alternatif: null,
    estimasi_sembuh: 'Tergantung jenis dan jumlah racun — bisa dari jam hingga tidak tertolong',
    isolasi: false,
    biosecurity: 'Kenali dan singkirkan tanaman beracun di sekitar kandang. Jangan beri lamtoro lebih dari 30% komposisi pakan.',
  },
  {
    name: 'Polioencephalomalacia',
    isContagious: false, zoonosis: false, severity: 'kritis',
    pathogen: 'Defisiensi Thiamin (Vit B1) — dipicu perubahan pakan mendadak ke konsentrat tinggi atau tanaman mengandung thiaminase',
    gejala: 'Buta MENDADAK (tidak responsif terhadap cahaya), kepala mendongak ke atas (star gazing), berjalan memutar, kejang, kepala melengkung ke belakang (opisthotonos), depresi berat — kerusakan otak PERMANEN jika terlambat ditangani',
    tindakan: 'Injeksi Thiamin IV atau IM dosis tinggi SESEGERA MUNGKIN — setiap jam keterlambatan mengurangi peluang pemulihan. Kurangi/hentikan pakan konsentrat tinggi. Steroid pendukung',
    obat: 'Thiamin HCl 10–20mg/kgBB injeksi IV (lambat) atau IM, 3x sehari selama 3 hari',
    obat_alternatif: null,
    estimasi_sembuh: '24–48 jam jika sangat awal; keterlambatan → kerusakan permanen',
    isolasi: false,
    biosecurity: 'Transisi pakan konsentrat bertahap 7–14 hari. Suplementasi Vitamin B-Kompleks rutin saat pergantian pakan.',
  },
]

// ─── Config & Constants ────────────────────────────────────────────────────────

const SEVERITY_CFG = {
  ringan: { label: 'Ringan',  bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  sedang: { label: 'Sedang',  bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-400'   },
  parah:  { label: 'Parah',   bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  text: 'text-orange-400'  },
  kritis: { label: 'Kritis',  bg: 'bg-rose-500/15',    border: 'border-rose-500/30',    text: 'text-rose-400'    },
}

const LOG_TYPE_CFG = {
  medis:           { label: 'Kesehatan', icon: HeartPulse, iconCls: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20'   },
  sakit:           { label: 'Kesehatan', icon: HeartPulse, iconCls: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20'   },
  vaksinasi:       { label: 'Vaksinasi', icon: Syringe,    iconCls: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  pemeriksaan:     { label: 'Periksa',   icon: Activity,   iconCls: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  insiden_pakan:   { label: 'Pakan',     icon: Wheat,      iconCls: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  insiden_kandang: { label: 'Kandang',   icon: Home,       iconCls: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  insiden:         { label: 'Lainnya',   icon: FileText,   iconCls: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20'  },
}

const DEFAULT_CFG = { label: 'Laporan', icon: FileText, iconCls: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }

const CONTAGIOUS_SET = new Set(DISEASE_DB.filter(d => d.isContagious).map(d => d.name))

const LOG_FILTER_TABS = [
  { id: 'semua',   label: 'Semua' },
  { id: 'health',  label: 'Kesehatan', types: ['medis', 'sakit', 'vaksinasi', 'pemeriksaan', 'cedera', 'kematian'] },
  { id: 'pakan',   label: 'Pakan',     types: ['insiden_pakan'] },
  { id: 'kandang', label: 'Kandang',   types: ['insiden_kandang'] },
  { id: 'lainnya', label: 'Lainnya',   types: ['insiden'] },
]

const REF_FILTERS = [
  { id: 'semua',        label: 'Semua' },
  { id: 'menular',      label: 'Menular' },
  { id: 'tidak_menular', label: 'Tidak Menular' },
  { id: 'kritis',       label: 'Kritis' },
  { id: 'zoonosis',     label: 'Zoonosis' },
]

// ─── DiseaseCard ───────────────────────────────────────────────────────────────

function DiseaseCard({ disease }) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEVERITY_CFG[disease.severity]

  return (
    <motion.div
      layout
      className={cn(
        'border rounded-[20px] overflow-hidden transition-colors',
        disease.severity === 'kritis' ? 'border-rose-500/20 bg-rose-500/[0.03]' :
        disease.severity === 'parah'  ? 'border-orange-500/20 bg-orange-500/[0.03]' :
        'border-white/[0.06] bg-white/[0.02]'
      )}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-snug truncate">{disease.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', sev.bg, sev.border, sev.text)}>
              {sev.label}
            </span>
            {disease.isContagious && (
              <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/25 text-rose-400">
                <ShieldAlert size={8} /> Menular
              </span>
            )}
            {disease.zoonosis && (
              <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/25 text-purple-400">
                <Biohazard size={8} /> Zoonosis
              </span>
            )}
            {!disease.isContagious && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500/70">
                Tidak Menular
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn('text-[#4B6478] shrink-0 transition-transform duration-300', expanded && 'rotate-180')}
        />
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
              {/* Pathogen */}
              <div className="flex items-start gap-2">
                <Bug size={12} className="text-[#4B6478] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Patogen / Penyebab</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{disease.pathogen}</p>
                </div>
              </div>

              {/* Gejala */}
              <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/[0.04]">
                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5">Gejala Klinis</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{disease.gejala}</p>
              </div>

              {/* Tindakan */}
              <div className="bg-blue-500/[0.04] rounded-2xl p-3 border border-blue-500/10">
                <p className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest mb-1.5">Cara Penanganan</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{disease.tindakan}</p>
              </div>

              {/* Obat */}
              <div>
                <div className="flex items-start gap-2 mb-1.5">
                  <Pill size={12} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Obat Disarankan</p>
                    <p className="text-[11px] text-green-300 font-semibold leading-relaxed">{disease.obat}</p>
                  </div>
                </div>
                {disease.obat_alternatif && (
                  <div className="flex items-start gap-2 ml-0">
                    <FlaskConical size={12} className="text-amber-400/70 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Obat Alternatif</p>
                      <p className="text-[11px] text-amber-300/80 leading-relaxed">{disease.obat_alternatif}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Estimasi + Isolasi row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={10} className="text-[#4B6478]" />
                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Estimasi Sembuh</p>
                  </div>
                  <p className="text-[11px] text-white font-bold">{disease.estimasi_sembuh}</p>
                </div>
                <div className={cn(
                  'rounded-xl p-2.5 border',
                  disease.isolasi
                    ? 'bg-rose-500/10 border-rose-500/20'
                    : 'bg-white/[0.02] border-white/[0.04]'
                )}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={10} className={disease.isolasi ? 'text-rose-400' : 'text-[#4B6478]'} />
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', disease.isolasi ? 'text-rose-400/70' : 'text-[#4B6478]')}>Isolasi</p>
                  </div>
                  <p className={cn('text-[11px] font-bold', disease.isolasi ? 'text-rose-400' : 'text-slate-500')}>
                    {disease.isolasi ? 'WAJIB' : 'Tidak Perlu'}
                  </p>
                </div>
              </div>

              {/* Biosecurity */}
              <div className="flex items-start gap-2 bg-amber-500/[0.04] rounded-xl p-3 border border-amber-500/10">
                <Info size={12} className="text-amber-400/70 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-amber-400/70 uppercase tracking-widest mb-0.5">Biosecurity & Pencegahan</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{disease.biosecurity}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DombaKesehatan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchId = searchParams.get('batch')

  const { data: batches = [], isLoading: loadingBatches } = useDombaActiveBatches()
  const activeBatch = useMemo(() =>
    batchId ? batches.find(b => b.id === batchId) : batches[0]
  , [batchId, batches])

  const { data: logs = [], isLoading: loadingLogs } = useDombaHealthLogs(activeBatch?.id)
  const { data: animals = [] } = useDombaAnimals(activeBatch?.id)
  const addLog = useAddDombaHealthLog()
  const deleteLog = useDeleteDombaHealthLog()

  const [activeView, setActiveView] = useState('riwayat') // 'riwayat' | 'referensi'
  const [activeLogFilter, setActiveLogFilter] = useState('semua')
  const [activeRefFilter, setActiveRefFilter] = useState('semua')
  const [refSearch, setRefSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    animal_id: '',
    log_type: 'sakit',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medication_used: '',
    notes: ''
  })

  const animalMap = useMemo(() => {
    const m = {}
    animals.forEach(a => { m[a.id] = a })
    return m
  }, [animals])

  const filteredLogs = useMemo(() => {
    const tab = LOG_FILTER_TABS.find(t => t.id === activeLogFilter)
    if (!tab || activeLogFilter === 'semua') return logs
    return logs.filter(l => tab.types?.includes(l.log_type))
  }, [logs, activeLogFilter])

  const filteredDiseases = useMemo(() => {
    let list = DISEASE_DB
    if (activeRefFilter === 'menular')       list = list.filter(d => d.isContagious)
    if (activeRefFilter === 'tidak_menular') list = list.filter(d => !d.isContagious)
    if (activeRefFilter === 'kritis')        list = list.filter(d => d.severity === 'kritis')
    if (activeRefFilter === 'zoonosis')      list = list.filter(d => d.zoonosis)
    if (refSearch.trim()) {
      const q = refSearch.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.gejala.toLowerCase().includes(q) ||
        d.pathogen.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeRefFilter, refSearch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeBatch) return
    setIsSubmitting(true)
    try {
      await addLog.mutateAsync({
        batch_id: activeBatch.id,
        ...form,
        animal_id: form.animal_id === 'null' || !form.animal_id ? null : form.animal_id
      })
      toast.success('Log kesehatan berhasil disimpan')
      setShowAdd(false)
      setForm({ log_date: new Date().toISOString().split('T')[0], animal_id: '', log_type: 'sakit', symptoms: '', diagnosis: '', treatment: '', medication_used: '', notes: '' })
    } catch {
      toast.error('Gagal menyimpan log kesehatan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus log ini?')) return
    try {
      await deleteLog.mutateAsync({ logId: id, batch_id: activeBatch?.id })
      toast.success('Log dihapus')
    } catch {
      toast.error('Gagal menghapus log')
    }
  }

  if (loadingBatches || (activeBatch && loadingLogs)) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/peternak/peternak_domba_penggemukan/beranda')} className="p-2 -ml-2 text-[#4B6478] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">Layanan Kesehatan Domba</h1>
        </div>

        {/* Batch selector */}
        {batches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 mb-4">
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => navigate(`${BASE}/kesehatan?batch=${b.id}`)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeBatch?.id === b.id
                    ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/20'
                    : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]'
                }`}
              >
                {b.batch_code}
              </button>
            ))}
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
          <button
            onClick={() => setActiveView('riwayat')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
              activeView === 'riwayat'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-[#4B6478] hover:text-white'
            )}
          >
            <Activity size={13} /> Riwayat
          </button>
          <button
            onClick={() => setActiveView('referensi')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
              activeView === 'referensi'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-[#4B6478] hover:text-white'
            )}
          >
            <BookOpen size={13} /> Referensi Penyakit
          </button>
        </div>

        {/* Log filter tabs — only in riwayat view */}
        {activeView === 'riwayat' && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3">
            {LOG_FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLogFilter(tab.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                  activeLogFilter === tab.id
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]'
                )}
              >
                {tab.label}
                {tab.id !== 'semua' && (
                  <span className="ml-1 opacity-50">
                    {logs.filter(l => tab.types?.includes(l.log_type)).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── RIWAYAT VIEW ── */}
      {activeView === 'riwayat' && (
        <>
          {!activeBatch ? (
            <div className="px-4 py-20 text-center">
              <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
                <HeartPulse size={24} className="text-[#4B6478]" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Pilih Batch Terlebih Dahulu</p>
              <p className="text-xs text-[#4B6478]">Kamu perlu memiliki batch aktif untuk mencatat kesehatan</p>
            </div>
          ) : (
            <div className="px-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Sora'] font-bold text-sm text-white">
                  Riwayat Laporan
                  <span className="ml-2 text-[#4B6478] font-normal">({filteredLogs.length})</span>
                </h2>
                <button
                  onClick={() => setShowAdd(true)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-green-600/10"
                >
                  <Plus size={14} /> Catat Penanganan
                </button>
              </div>

              <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[32px]">
                    <Activity size={24} className="text-[#4B6478] mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-[#4B6478]">Belum ada laporan untuk kategori ini</p>
                  </div>
                ) : (
                  filteredLogs.map(log => {
                    const cfg = LOG_TYPE_CFG[log.log_type] || DEFAULT_CFG
                    const IconComp = cfg.icon
                    const isContagious = CONTAGIOUS_SET.has(log.diagnosis)
                    const animalTag = log.animal_id ? (animalMap[log.animal_id]?.ear_tag || 'Unknown') : null

                    return (
                      <div key={log.id} className={cn('border rounded-[24px] p-4 transition-all hover:bg-white/[0.05]', cfg.bg, cfg.border)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', cfg.bg, cfg.border)}>
                              <IconComp size={16} className={cfg.iconCls} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border', cfg.bg, cfg.border, cfg.iconCls)}>
                                  {cfg.label}
                                </span>
                                {isContagious && (
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-400">
                                    <AlertTriangle size={9} /> Menular
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#4B6478] font-bold mt-0.5">
                                {new Date(log.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {animalTag && <span className="ml-2 text-white/60">· {animalTag}</span>}
                                {!animalTag && <span className="ml-2">· Seluruh Batch</span>}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 text-red-500/30 hover:text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="border-t border-white/[0.04] pt-3 space-y-2">
                          {log.diagnosis && log.diagnosis !== cfg.label && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">Diagnosa</p>
                              <p className="text-xs font-bold text-white">{log.diagnosis}</p>
                            </div>
                          )}
                          {log.symptoms && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">
                                {['insiden_pakan','insiden_kandang','insiden'].includes(log.log_type) ? 'Deskripsi' : 'Gejala'}
                              </p>
                              <p className="text-xs text-slate-300 leading-relaxed">{log.symptoms}</p>
                            </div>
                          )}
                          {(log.action_taken || log.treatment) && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">Tindakan</p>
                              <p className="text-xs text-slate-300 leading-relaxed">{log.action_taken || log.treatment}</p>
                            </div>
                          )}
                          {log.medication_used && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">Obat</p>
                              <p className="text-xs font-bold text-green-400">{log.medication_used}</p>
                            </div>
                          )}
                          {log.notes && (
                            <div className="flex items-start gap-1.5 pt-1 border-t border-white/[0.04]">
                              <Info size={11} className="text-[#4B6478] shrink-0 mt-0.5" />
                              <p className="text-[10px] text-[#4B6478] italic leading-relaxed">{log.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── REFERENSI VIEW ── */}
      {activeView === 'referensi' && (
        <div className="px-4 mt-5">
          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
            <input
              type="text"
              placeholder="Cari nama penyakit, gejala, patogen..."
              value={refSearch}
              onChange={e => setRefSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
            {REF_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveRefFilter(f.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                  activeRefFilter === f.id
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stats bar */}
          <div className="flex gap-3 mb-4 text-[10px] text-[#4B6478] font-bold">
            <span>{filteredDiseases.length} penyakit</span>
            <span>·</span>
            <span className="text-rose-400">{filteredDiseases.filter(d => d.isContagious).length} menular</span>
            <span>·</span>
            <span className="text-rose-500">{filteredDiseases.filter(d => d.severity === 'kritis').length} kritis</span>
            <span>·</span>
            <span className="text-purple-400">{filteredDiseases.filter(d => d.zoonosis).length} zoonosis</span>
          </div>

          {/* Disease cards */}
          <div className="space-y-2">
            {filteredDiseases.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-[32px]">
                <Search size={24} className="text-[#4B6478] mx-auto mb-2 opacity-20" />
                <p className="text-xs text-[#4B6478]">Tidak ada penyakit yang cocok</p>
              </div>
            ) : (
              filteredDiseases.map(d => <DiseaseCard key={d.name} disease={d} />)
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-white/[0.02] rounded-[20px] border border-white/[0.05] flex items-start gap-3">
            <Info size={14} className="text-[#4B6478] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#4B6478] leading-relaxed">
              Referensi ini bersifat informatif untuk konteks peternakan domba di Jawa Tengah. Untuk kasus serius, selalu konsultasikan dengan dokter hewan atau mantri ternak setempat.
            </p>
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="absolute inset-0 bg-[#06090F]/80 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[40px] p-8 pb-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-['Sora'] font-black text-xl text-white mb-1">Catat Penanganan</h3>
                  <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest">Input Data Medis & Vaksin</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#4B6478] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Tanggal</label>
                  <input type="date" required value={form.log_date} onChange={e => setForm({...form, log_date: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors shadow-inner" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Pilih Ternak (Opsional)</label>
                  <Select value={form.animal_id} onValueChange={v => setForm({...form, animal_id: v})}>
                    <SelectTrigger className="w-full h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white px-5 shadow-inner">
                      <SelectValue placeholder="Pilih ekor... (kosong = seluruh batch)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl shadow-2xl">
                      <SelectItem value="null">-- Seluruh Batch --</SelectItem>
                      {animals.map(a => (
                        <SelectItem key={a.id} value={a.id} className="py-3 px-4 border-b border-white/5 last:border-0">
                          <div className="flex flex-col">
                            <span className="font-black text-sm">{a.ear_tag}</span>
                            <span className="text-[10px] text-[#4B6478] font-bold uppercase">{a.breed || 'No Breed'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Gejala Teramati</label>
                  <input type="text" required placeholder="Diare, lemas, nafsu makan turun..." value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 transition-colors shadow-inner" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Diagnosa Sementara</label>
                  <input type="text" placeholder="Cacingan, Kembung, dll..." value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-green-200 placeholder:text-[#4B6478]/50 focus:outline-none focus:border-green-500/50 transition-colors shadow-inner" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Obat Digunakan</label>
                    <input type="text" placeholder="Albendazole, B-Complex..." value={form.medication_used} onChange={e => setForm({...form, medication_used: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Penanganan</label>
                    <input type="text" placeholder="Suntik IM, Karantina..." value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors shadow-inner" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Catatan Tambahan</label>
                  <textarea rows={2} placeholder="Tambahkan detail lainnya..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 resize-none transition-colors shadow-inner" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 mt-4 active:scale-[0.98]">
                  <HeartPulse size={18} className={isSubmitting ? 'animate-pulse' : ''} />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Log Kesehatan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
