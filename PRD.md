# AJ224 ERP — Product Requirements Document (PRD) Versi 1

Sistem ERP internal UD. AJ224 untuk proyek stringing tower SUTET.

---

## 1. Info Dokumen

| Item | Keterangan |
|---|---|
| Produk | AJ224 ERP (aplikasi web internal) |
| Perusahaan | UD. AJ224 — Lamongan, Jawa Timur |
| Versi dokumen | 1.0 — Draft untuk validasi klien |
| Tanggal | 25 Oktober 2026 |
| Status | Menunggu validasi asumsi (Bagian 5) dan pertanyaan terbuka (Bagian 19) |
| Bahasa aplikasi | Bahasa Indonesia |
| Teknologi | Next.js, Supabase (PostgreSQL, Auth, Storage, Edge Functions, pg_cron), Tailwind CSS |

**Konvensi prioritas**

- **Wajib** — harus ada saat go-live v1. Tanpa fitur ini masalah utama tidak terselesaikan.
- **Sebaiknya** — bernilai tinggi, tetapi boleh ditunda ke v1.1 bila waktu tidak cukup.

**Konvensi ID kebutuhan**

`UMM` Umum · `MST` Master Data · `MKT` Marketing · `PRJ` Proyek · `OPS` Laporan Lapangan · `ALT` Alat · `MAT` Material · `K3` Keselamatan · `FIN` Keuangan · `HCM` SDM · `PAY` Payroll · `DSB` Dashboard

---

## 2. Ringkasan Eksekutif

UD. AJ224 mengerjakan proyek stringing (penarikan konduktor) tower SUTET. Pekerjaannya berisiko tinggi dan nilai kontraknya besar. Saat ini hampir semua proses berjalan dengan kertas, WhatsApp, dan file Excel yang tersimpan terpisah per folder. Akibatnya:

- laba per proyek tidak diketahui;
- piutang termin dan utang supplier sulit dipantau;
- pekerja bisa naik tower dengan sertifikat kedaluwarsa;
- alat hilang atau rusak tanpa jejak;
- riwayat tender tidak terekam.

**AJ224 ERP v1** adalah aplikasi web sederhana yang menjadikan **Proyek sebagai pusat data**. Setiap biaya, tagihan, absensi, laporan harian, pergerakan alat dan material, serta insiden K3 selalu terikat ke satu proyek (atau ke "Kantor/Umum" untuk biaya kantor). Dengan begitu, laba-rugi per proyek, posisi piutang/utang, dan status keselamatan tersedia otomatis tanpa rekap manual.

v1 sengaja **tidak** membangun akuntansi penuh, mesin pajak, atau alur persetujuan berjenjang. Fokusnya adalah pencatatan yang konsisten dan ringan, sesuai cara kerja tim saat ini. Ini terutama penting bagi tim lapangan yang bekerja dengan HP Android di lokasi bersinyal lemah.

---

## 3. Latar Belakang & Masalah

### 3.1 Kondisi saat ini

- Data penawaran tender dan riwayat klien tersimpan di file pribadi tim marketing.
- Biaya proyek (upah lapangan, akomodasi, mobilisasi alat, material) tercampur dan tersebar di banyak file `.xlsx`, terpisah dari informasi proyek lainnya.
- Absensi lapangan ditulis di kertas yang ditandatangani mandor, lalu direkap manual untuk gaji.
- Laporan harian dan progres dikirim lewat foto di WhatsApp.
- Data sertifikat K3 pekerja tidak terpusat, dan tanggal kedaluwarsanya tidak dipantau.
- Pergerakan alat dari gudang ke proyek (dan sebaliknya) tidak tercatat dengan baik.

### 3.2 Masalah & dampak per divisi

| Divisi | Masalah | Dampak |
|---|---|---|
| Marketing | Data tender tersebar; tidak ada rekap menang/kalah | Strategi penawaran sulit dievaluasi, relasi dengan kontraktor tidak terjaga, peluang berikutnya hilang |
| Keuangan | Biaya proyek (gaji, mobilisasi alat, material) tidak dipisah per proyek; piutang termin dan utang supplier sulit dipantau | Laba per proyek tidak diketahui, arus kas terganggu, pembayaran supplier bisa terlambat |
| Operasional | Biaya spesifik proyek tidak terinci; progres, alat, dan material tidak terpantau | Proyek terlambat, alat hilang/rusak, biaya membengkak, kecelakaan kerja berulang |
| HCM | Data karyawan, sertifikasi, penugasan, dan absensi tidak terpusat | Pekerja tanpa sertifikat valid naik tower, payroll terlambat, kompetensi tidak terukur |
| Manajemen | Tidak ada data gabungan untuk proyek, keuangan, dan K3 | Keputusan strategis diambil berdasarkan perkiraan, bukan data |

### 3.3 Peta Masalah → Solusi

Setiap kebutuhan dari dokumen overview dipetakan ke fitur v1.

| Kebutuhan | Solusi v1 | ID |
|---|---|---|
| Marketing: mengelola tender dan riwayat klien | Data klien + kontak + log aktivitas; daftar tender lengkap dengan riwayat | MKT-01 s.d. MKT-04 |
| Marketing: memantau status penawaran | Pipeline status tender, riwayat revisi nilai penawaran, pengingat batas waktu | MKT-04, MKT-05, MKT-06 |
| Marketing: win rate dan prioritas | Peluang menang (%) → nilai tertimbang → daftar prioritas; analitik win rate | MKT-07, MKT-08 |
| Marketing: mengetahui nilai tiap kontrak | Konversi tender menang → proyek; data kontrak + addendum | MKT-09, PRJ-02 |
| Keuangan: invoice termin dan pembayaran | Jadwal termin, invoice dari termin, pencatatan pembayaran | PRJ-03, FIN-01 s.d. FIN-03 |
| Keuangan: piutang dan jatuh tempo | Daftar jatuh tempo, umur piutang (aging), pengingat | FIN-04, FIN-05 |
| Keuangan: utang supplier | Tagihan supplier dengan jatuh tempo dan pembayaran | FIN-06 s.d. FIN-08 |
| Keuangan: biaya proyek (sekarang di Excel terpisah) | Semua biaya wajib terikat proyek + kategori; RAB vs realisasi; kas lapangan | PRJ-04, FIN-09 s.d. FIN-12 |
| Keuangan & HCM: payroll | Payroll dari absensi + kasbon; biaya gaji dialokasikan ke proyek | PAY-01 s.d. PAY-09 |
| Operasional: progres per segmen tower | Seksi tarik × tahapan stringing; progres diperbarui dari laporan harian | PRJ-05 s.d. PRJ-08, OPS-01 |
| Operasional: pemakaian alat | Stok alat per lokasi & kondisi, surat jalan mobilisasi, riwayat alat | ALT-01 s.d. ALT-07 |
| Operasional: stok material | Transaksi dan stok material per lokasi, rekonsiliasi material titipan klien | MAT-01 s.d. MAT-07 |
| Operasional: laporan harian lapangan | Laporan harian dengan foto, cuaca, kendala | OPS-01 s.d. OPS-04 |
| Operasional: insiden K3 | Laporan insiden, investigasi, tindakan perbaikan | K3-01 s.d. K3-04 |
| HCM: data karyawan | Data karyawan, dokumen, pengaturan gaji | HCM-01, HCM-02 |
| HCM: penugasan proyek | Penugasan dengan validasi sertifikat otomatis | HCM-05, HCM-06 |
| HCM: sertifikasi K3 dan kedaluwarsa | Data sertifikat, status otomatis, pengingat | HCM-03, HCM-04 |
| HCM: pelatihan/workshop | Data pelatihan → sertifikat otomatis; daftar kebutuhan pelatihan | HCM-07, HCM-08 |
| HCM: monitoring absensi | Absensi harian per kru oleh admin lapangan; rekap dan kunci periode | HCM-09 s.d. HCM-12 |
| Manajemen: laba-rugi per proyek | Laporan L/R proyek + peringatan dini biaya vs progres | FIN-12, DSB-02 |
| Manajemen: status setiap proyek | Tabel kesehatan proyek: progres vs rencana, status | DSB-01, DSB-02 |
| Manajemen: utang dan piutang | Ringkasan piutang/utang di dashboard | DSB-01, FIN-05, FIN-08 |
| Manajemen: ringkasan insiden K3 | Ringkasan K3, hari tanpa LTI | K3-05, DSB-01 |

---

## 4. Tujuan & Metrik Keberhasilan

**Tujuan**

1. Laba-rugi setiap proyek dapat dilihat kapan saja tanpa rekap Excel manual.
2. Tidak ada termin yang terlambat ditagih dan tidak ada utang supplier yang terlewat jatuh temponya.
3. Tidak ada pekerja dengan sertifikat wajib kedaluwarsa yang ditugaskan ke proyek.
4. Posisi dan kondisi setiap alat selalu diketahui.
5. Riwayat tender dan win rate tersedia untuk evaluasi strategi.

**Metrik** (diukur 3 bulan setelah go-live)

| Metrik | Target |
|---|---|
| Proyek aktif yang memiliki RAB dan seluruh biayanya tercatat di sistem | 100% |
| Hari kerja proyek dengan absensi dan laporan harian terinput paling lambat H+1 | ≥ 90% |
| Penugasan pekerja dengan sertifikat wajib tidak berlaku (tanpa override tercatat) | 0 |
| Waktu penyusunan payroll setelah periode ditutup | ≤ 2 hari kerja |
| Invoice termin diterbitkan ≤ 7 hari setelah termin berstatus "Siap Ditagih" | ≥ 90% |
| Tagihan supplier yang dibayar melewati jatuh tempo tanpa catatan | 0 |
| Tender yang ditutup dengan status akhir (dan alasan bila kalah) | 100% |
| Selisih alat saat mobilisasi/demobilisasi yang terdokumentasi (rusak/hilang) | 100% |

---

## 5. Asumsi Bisnis & Alur Kerja

Asumsi berikut menjadi dasar desain v1. Semuanya perlu divalidasi ke klien. Kolom terakhir menjelaskan dampaknya bila asumsi ternyata salah.

| # | Asumsi | Alasan | Dampak jika salah |
|---|---|---|---|
| A1 | Klien utama adalah kontraktor EPC. UD. AJ224 berperan sebagai subkontraktor stringing; pemilik akhir umumnya PLN. | Masalah marketing menyebut "relasi dengan kontraktor". | Kecil: cukup menambah jenis klien. |
| A2 | Material utama (konduktor, insulator, fitting, spacer) umumnya disuplai klien sebagai **material titipan**. Perusahaan membeli material habis pakai (BBM, tali, grease, baut, dll). | Pola umum subkontraktor stringing. | Jika perusahaan membeli material utama, cukup dicatat sebagai pembelian biasa. Desain tetap berlaku. |
| A3 | Stok dicatat **dalam jumlah saja, tanpa valuasi**. Biaya material diakui saat pembelian (tagihan supplier/pengeluaran) dan langsung dibebankan ke proyek. | Menghindari kerumitan FIFO/rata-rata dan biaya ganda. | Valuasi persediaan masuk roadmap v2. |
| A4 | Absensi lapangan diisi admin lapangan/mandor **per kru per hari**. Pekerja tidak punya akun. | Sesuai cara kerja sekarang (absensi kertas ditandatangani mandor); banyak pekerja tidak memakai aplikasi. | Absensi mandiri (GPS/selfie) masuk roadmap. |
| A5 | Lokasi tower sering bersinyal lemah, sehingga input absensi dan laporan harian boleh mundur hingga **H+3** (dapat diatur). | Lokasi SUTET umumnya di pegunungan, sawah, dan hutan. | Batas dapat diubah di pengaturan. |
| A6 | Kantor memberi dana operasional (**kas lapangan**) ke PIC proyek. PIC membelanjakannya dan melapor dengan nota. | Pola umum proyek lapangan di Indonesia. | Jika semua belanja lewat kantor, fitur kas lapangan cukup tidak dipakai. |
| A7 | Pekerja lapangan dibayar **harian** (upah × hari hadir + uang makan + tunjangan lapangan + lembur); staf kantor dibayar **bulanan**. Kasbon umum terjadi dan dipotong dari gaji. | Pola umum pekerja proyek. | Skema borongan memakai komponen "insentif/borongan" manual di slip (lihat Pertanyaan Terbuka). |
| A8 | PPh 21 dan BPJS diisi **manual** sebagai potongan. Tidak ada mesin hitung pajak di v1. | Mengurangi kompleksitas; perhitungan pajak tetap dibantu konsultan pajak. | Mesin PPh 21/BPJS masuk roadmap. |
| A9 | v1 **bukan sistem akuntansi**: tidak ada jurnal, buku besar, atau neraca. Data keuangan dapat diekspor ke Excel untuk akuntan/konsultan pajak. | Masalah yang disebut adalah visibilitas biaya, piutang, dan utang, bukan pelaporan akuntansi. | Integrasi akuntansi masuk roadmap. |
| A10 | Satu pekerja hanya punya **satu penugasan proyek aktif** pada satu waktu. | Kru stringing bergerak sebagai satu tim per proyek; menyederhanakan absensi dan alokasi gaji. | Absensi tetap mencatat proyek per hari, sehingga perpindahan antarproyek tetap terekam. |
| A11 | Skala: ±10–25 akun pengguna, ±50–200 karyawan (termasuk pekerja harian), dan 2–5 proyek berjalan bersamaan. | Ukuran khas UD kontraktor spesialis. | Arsitektur tetap mampu menampung 10× skala ini. |
| A12 | Tim kantor memakai laptop/PC; tim lapangan memakai HP Android (Chrome). | Umum di lapangan. | — |
| A13 | Progres dilaporkan per **seksi tarik** (bentang antara dua tower tension) dengan tahapan stringing standar. | Cara umum pelaporan progres stringing ke kontraktor utama. | Template tahapan dapat diubah per proyek. |
| A14 | Pekerja lokal sering direkrut langsung di lokasi proyek (helper/warga sekitar). | Umum di proyek transmisi. | Jika tidak ada, fitur HCM-12 cukup tidak dipakai. |

---

## 6. Pengguna & Peran

Akun dibuat oleh Super Admin melalui undangan email. Tidak ada pendaftaran mandiri. Satu akun memiliki satu peran.

| Peran | Siapa | Tanggung jawab utama di sistem |
|---|---|---|
| Super Admin | Admin IT/pemilik | Mengelola pengguna, peran, master data, dan pengaturan |
| Direktur (Manajemen) | Direktur/pemilik | Melihat seluruh data dan dashboard; menyetujui payroll |
| Marketing | Staf marketing | Klien, tender, analitik tender |
| Finance | Staf keuangan | Invoice, piutang, tagihan supplier, utang, pengeluaran, verifikasi kas lapangan, pembayaran gaji |
| HCM | Staf SDM | Karyawan, sertifikasi, pelatihan, penugasan, absensi kantor, kasbon, penyusunan payroll |
| Operasional | Manajer operasional/proyek di kantor | Seksi & progres, RAB (bersama Finance), laporan harian, alat, material, K3 — untuk seluruh proyek |
| Lapangan | Site manager, pengawas, admin proyek | Absensi kru, laporan harian, kas lapangan, penerimaan alat/material, pemakaian material, lapor insiden — **hanya untuk proyek tempat ia ditugaskan** |

Catatan:

- Data gaji (tarif, slip, payroll) hanya dapat dilihat oleh Finance, HCM, dan Direktur. Super Admin tidak otomatis melihat data gaji.
- Akun peran Lapangan terhubung ke data karyawan. Akses proyeknya ditentukan otomatis oleh penugasan aktif (HCM-05).
- Petugas K3 (Safety Officer) memakai peran Operasional (di kantor) atau Lapangan (di lokasi).

---

## 7. Ruang Lingkup

### 7.1 Termasuk v1

1. Pengaturan & Master Data
2. Marketing (Klien & Tender)
3. Proyek (Kontrak, Termin, RAB, Seksi & Progres)
4. Laporan Harian Lapangan
5. Alat & Mobilisasi
6. Material & Stok
7. K3 (Insiden)
8. Keuangan (Piutang, Utang, Biaya, Kas Lapangan, L/R Proyek)
9. HCM (Karyawan, Sertifikasi, Pelatihan, Penugasan, Absensi)
10. Payroll (termasuk Kasbon)
11. Dashboard & Notifikasi
12. Fitur Umum (lampiran, ekspor Excel, cetak PDF, impor data awal, log audit)

### 7.2 Di luar lingkup v1 (roadmap)

| Fitur | Alasan ditunda | Target |
|---|---|---|
| Akuntansi penuh (jurnal, buku besar, neraca, laporan arus kas formal) | Bukan masalah utama; ditangani akuntan eksternal | v2 |
| e-Faktur, mesin hitung PPh 21 & BPJS | Kompleks dan regulasinya sering berubah | v2 |
| Purchase Request/PO dan persetujuan berjenjang | Belum ada proses formal; menambah birokrasi | v2 |
| Valuasi persediaan (FIFO/rata-rata) | Lihat asumsi A3 | v2 |
| Absensi mandiri dengan GPS/selfie | Lihat asumsi A4 | v2 |
| Aplikasi mobile native dan mode offline penuh | Web responsif cukup untuk v1 | v2+ |
| Integrasi WhatsApp, bank, Accurate/Jurnal | Biaya dan ketergantungan pada pihak ketiga | v2+ |
| Perawatan alat terjadwal dan inspeksi APD | v1 fokus pada lokasi dan kondisi alat | v2 |
| Penilaian kinerja, rekrutmen, pengajuan cuti | Bukan masalah utama | v2+ |
| Gantt chart/penjadwalan detail | Kurva rencana sederhana sudah cukup | v2 |
| Portal klien, multi-perusahaan, multi-mata uang | Tidak dibutuhkan | — |

---

## 8. Alur Kerja End-to-End

```
[1] TENDER (Marketing)
    Prospek → Persiapan → Penawaran Dikirim → Negosiasi → Menang / Kalah / Batal
                                   │ (Menang)
                                   ▼
[2] PROYEK DIBUAT DARI TENDER (Marketing → Finance & Operasional)
    Data kontrak • jadwal termin • RAB per kategori • seksi tarik & tahapan
                                   │
                                   ▼
[3] PERSIAPAN (HCM + Operasional)
    Penugasan kru (cek sertifikat) → Mobilisasi alat (Surat Jalan)
    → Penerimaan material titipan klien → Top-up kas lapangan (Finance)
                                   │
                                   ▼
[4] EKSEKUSI HARIAN (Lapangan)
    Absensi kru → Laporan harian (progres seksi, foto, kendala) → Pemakaian material
    → Pengeluaran kas lapangan (foto nota) → Lapor insiden K3 bila terjadi
                                   │
                                   ▼
[5] PENAGIHAN (Finance)
    Progres mencapai syarat termin → notifikasi "Siap Ditagih" → unggah BAP
    → Terbitkan invoice → Catat pembayaran diterima
                                   │
                                   ▼
[6] BIAYA & GAJI (Finance + HCM + Direktur)
    Tagihan supplier & pembayarannya • Verifikasi kas lapangan
    • Payroll: susun (HCM) → setujui (Direktur) → bayar (Finance) → biaya teralokasi ke proyek
                                   │
                                   ▼
[7] PENUTUPAN PROYEK (Operasional + Finance)
    Demobilisasi alat → Rekonsiliasi material titipan → Kas lapangan dikembalikan
    → Status "Selesai" → Tagih retensi setelah masa pemeliharaan → Status "Ditutup" (L/R final)
```

---

## 9. Struktur Menu

- **Beranda** — dashboard sesuai peran + daftar "Perlu Tindakan"
- **Marketing** — Klien · Tender · Analitik Tender
- **Proyek** — Daftar Proyek → Halaman Detail Proyek dengan tab:
  Ringkasan · Kontrak & Termin · RAB & Biaya · Seksi & Progres · Laporan Harian · Tim & Absensi · Alat · Material · K3 · Dokumen
- **Operasional** — Laporan Harian · Alat & Mobilisasi · Material & Stok · Insiden K3
- **Keuangan** — Invoice & Piutang · Tagihan Supplier & Utang · Pengeluaran & Kas Lapangan · Laporan L/R
- **SDM** — Karyawan · Sertifikasi · Pelatihan · Penugasan · Absensi · Kasbon · Payroll
- **Pengaturan** — Pengguna & Peran · Profil Perusahaan · Master Data · Parameter Sistem

**Halaman Detail Proyek** adalah pusat informasi. Semua angka di dalamnya diambil dari modul terkait, tanpa input ulang.

**Tampilan khusus peran Lapangan (HP).** Beranda berisi tombol besar untuk proyek aktifnya: *Absensi Hari Ini*, *Laporan Harian*, *Catat Pengeluaran*, *Terima Alat/Material*, *Pakai Material*, *Lapor Insiden*. Menu lain disembunyikan.

---

## 10. Kebutuhan Fungsional

### 10.1 Umum (UMM)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| UMM-01 | Login & sesi | Login dengan email + kata sandi; lupa kata sandi via email; logout | Wajib | Orang tanpa akun tidak bisa masuk; tidak ada halaman pendaftaran |
| UMM-02 | Akses berbasis peran | Menu dan data mengikuti peran (Bagian 13) | Wajib | Peran Lapangan hanya melihat proyek penugasannya, termasuk saat mengakses langsung lewat URL |
| UMM-03 | Lampiran | Unggah file (PDF, JPG, PNG, XLSX) pada data terkait; foto dikompres otomatis di perangkat | Wajib | Foto ≤ 1 MB setelah kompresi; file maksimal 10 MB; hanya pengguna yang berhak dapat membuka file |
| UMM-04 | Ekspor Excel | Setiap daftar dan laporan dapat diekspor ke .xlsx sesuai filter aktif | Wajib | Isi ekspor sama dengan data di layar |
| UMM-05 | Cetak/PDF | Tata letak cetak berkop perusahaan untuk Invoice, Surat Jalan, Slip Gaji, Laporan Harian, dan Laporan Insiden | Wajib | Dapat disimpan sebagai PDF dari browser dan rapi di kertas A4 |
| UMM-06 | Notifikasi dalam aplikasi | Ikon lonceng + daftar "Perlu Tindakan" di beranda | Wajib | Notifikasi sesuai peran penerima; dapat ditandai sudah dibaca |
| UMM-07 | Ringkasan email harian | Email pagi berisi pengingat penting (sertifikat, jatuh tempo, termin siap ditagih) | Sebaiknya | Terkirim pukul 07.00 WIB, hanya bila ada item |
| UMM-08 | Log audit | Mencatat siapa, kapan, dan apa yang berubah pada data keuangan, payroll, absensi terkunci, stok opname, dan override | Wajib | Direktur dan Super Admin dapat melihat riwayat per data |
| UMM-09 | Pencarian & filter | Pencarian teks dan filter (proyek, status, rentang tanggal) di setiap daftar | Wajib | — |
| UMM-10 | Penomoran otomatis | Nomor dokumen otomatis untuk tender, proyek, invoice, surat jalan, dan insiden | Wajib | Format dapat diatur (mis. `INV/AJ224/2026/10/001`); tidak ada nomor ganda |
| UMM-11 | Pembatalan aman | Transaksi tidak dihapus permanen, melainkan dibatalkan (status Batal) dengan alasan | Wajib | Data batal tetap terlihat dengan tanda khusus dan tidak dihitung di laporan |
| UMM-12 | Draf lokal formulir lapangan | Isian laporan harian dan pengeluaran tersimpan di perangkat bila koneksi terputus | Sebaiknya | Isian tidak hilang saat halaman dimuat ulang |
| UMM-13 | Impor data awal | Impor dari templat Excel/CSV untuk karyawan, sertifikat, klien, supplier, alat, material, seksi, saldo awal piutang/utang/biaya | Wajib | Baris yang gagal ditampilkan beserta alasannya; data valid tetap masuk |

### 10.2 Pengaturan & Master Data (MST)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| MST-01 | Pengguna & peran | Undang pengguna, tetapkan peran, hubungkan ke data karyawan, nonaktifkan akun | Wajib | Akun nonaktif langsung tidak bisa login |
| MST-02 | Profil perusahaan | Nama, alamat, NPWP, logo, rekening bank (untuk kop dan invoice), status PKP | Wajib | Data tampil di semua dokumen cetak |
| MST-03 | Supplier | Nama, kategori (material, sewa alat, transportasi, akomodasi, katering, lainnya), kontak, rekening, termin pembayaran default (hari) | Wajib | — |
| MST-04 | Lokasi | Gudang (mis. Gudang Lamongan) dan lokasi proyek (dibuat otomatis saat proyek dibuat) | Wajib | Setiap proyek memiliki tepat satu lokasi |
| MST-05 | Kategori biaya | Daftar baku yang dapat ditambah: Upah & Gaji, Akomodasi & Konsumsi, Mobilisasi/Demobilisasi, Material & Consumable, Sewa Alat & Kendaraan, BBM & Transportasi, Perbaikan Alat, K3 & APD, Pelatihan & Sertifikasi, Perizinan & Sosial (ROW/warga), Lain-lain, serta Overhead Kantor | Wajib | Kategori yang sudah dipakai tidak bisa dihapus, hanya dinonaktifkan |
| MST-06 | Jabatan & sertifikat wajib | Daftar jabatan (Site Manager, Pengawas, Mandor, Linesman/Pemanjat, Operator Mesin, Helper, Driver, Safety Officer, Admin Proyek, Staf Kantor) beserta sertifikat wajib untuk tiap jabatan | Wajib | Dipakai oleh validasi penugasan (HCM-06) |
| MST-07 | Jenis sertifikat | Mis. Bekerja di Ketinggian (TKBT Tingkat 1/2), SKTTK, Ahli K3 Umum, SIO Operator, P3K, SIM B1; masa berlaku default | Wajib | — |
| MST-08 | Template tahapan stringing | Tahapan dan bobot default yang dapat diubah: Pemasangan Pulley (10), Penarikan Pilot Wire (10), Penarikan Konduktor (30), Sagging (15), Clamping (15), Spacer & Damper (10), Jumper (5), GSW/OPGW (5) | Wajib | Total bobot harus 100; tahapan di luar lingkup kontrak dapat dihapus per proyek |
| MST-09 | Kategori alat & material | Kategori dan satuan | Wajib | — |
| MST-10 | Parameter sistem | Batas input mundur (default H+3), batas "segera kedaluwarsa" sertifikat (default 60 hari), ambang status proyek (10/20 poin), tarif PPN, jam kerja standar per hari (8), pembagi gaji harian staf (26), format nomor dokumen | Wajib | Perubahan parameter tercatat di log audit |

### 10.3 Marketing (MKT)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| MKT-01 | Data klien | Nama perusahaan, jenis (Kontraktor EPC, BUMN, PLN, Swasta), alamat, NPWP, termin pembayaran default, catatan; beberapa kontak (nama, jabatan, HP, email) | Wajib | Halaman klien menampilkan riwayat tender, proyek, total nilai kontrak, dan win rate klien tersebut |
| MKT-02 | Log aktivitas & tindak lanjut | Catat kunjungan/telepon/meeting dengan klien beserta tanggal tindak lanjut | Sebaiknya | Tindak lanjut yang jatuh tempo muncul di "Perlu Tindakan" Marketing |
| MKT-03 | Data tender | Nama paket, klien, pemilik akhir (mis. PLN UIP), lokasi, tegangan (150/275/500 kV), panjang (kms), jumlah tower, lingkup pekerjaan, tanggal informasi, batas penawaran, nilai penawaran, estimasi biaya (HPP), PIC, dokumen (RKS, BoQ, surat penawaran) | Wajib | Margin rencana dihitung otomatis (Bagian 11.1) |
| MKT-04 | Status tender | Prospek → Persiapan Penawaran → Penawaran Dikirim → Negosiasi → Menang / Kalah / Batal (Tidak Ikut) | Wajib | Status Kalah wajib mengisi alasan (Harga, Teknis, Jadwal, Relasi, Administrasi, Lainnya); pemenang dan harga pemenang boleh diisi bila diketahui |
| MKT-05 | Riwayat revisi penawaran | Setiap perubahan nilai penawaran tersimpan otomatis (tanggal, nilai lama → baru, catatan) | Wajib | Riwayat terlihat di detail tender |
| MKT-06 | Pengingat batas penawaran | Notifikasi H-3 dan H-1 sebelum batas penawaran | Wajib | Hanya untuk tender berstatus Prospek atau Persiapan |
| MKT-07 | Peluang & prioritas | Marketing mengisi peluang menang (%); sistem menghitung nilai tertimbang dan menampilkan tender aktif terurut prioritas, dengan win rate historis klien yang sama sebagai acuan | Wajib | Tender dengan batas penawaran ≤ 7 hari diberi label "Mendesak" |
| MKT-08 | Analitik tender | Win rate (jumlah dan nilai) per periode, per klien, dan per tegangan; rekap alasan kalah; nilai pipeline per status | Wajib | Angka sesuai rumus Bagian 11.1 |
| MKT-09 | Konversi ke proyek | Tombol "Buat Proyek" pada tender Menang; data tender terisi otomatis ke proyek baru | Wajib | Satu tender hanya menghasilkan satu proyek; ada tautan dua arah tender ↔ proyek |

### 10.4 Proyek (PRJ)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| PRJ-01 | Daftar proyek | Kode, nama, klien, status (Persiapan, Berjalan, Tertunda, Selesai, Ditutup), progres, nilai kontrak | Wajib | Dapat difilter per status dan klien |
| PRJ-02 | Data kontrak | No. kontrak/SPK, tanggal, nilai kontrak (sebelum PPN), kena PPN ya/tidak, tanggal mulai dan target selesai, masa pemeliharaan, lingkup, dokumen kontrak; addendum (nomor, tanggal, nilai baru, perubahan jadwal) | Wajib | Nilai kontrak yang dipakai di laporan adalah nilai setelah addendum terakhir; riwayat addendum tersimpan |
| PRJ-03 | Jadwal termin | Daftar termin (Uang Muka, Termin 1…n, Retensi) dengan persentase/nilai dan syarat: **Progres ≥ X%**, **Tanggal** (mis. akhir masa pemeliharaan untuk retensi), atau **Manual** (mis. setelah BAST). Status: Belum Waktunya → Siap Ditagih → Ditagih → Lunas | Wajib | Peringatan bila total termin ≠ 100% nilai kontrak; saat syarat terpenuhi, status otomatis menjadi "Siap Ditagih" dan Finance menerima notifikasi |
| PRJ-04 | RAB per kategori | Anggaran biaya per kategori biaya (MST-05) | Wajib | Tab RAB & Biaya menampilkan Anggaran, Realisasi, Sisa, dan % Terpakai per kategori; kuning bila ≥ 80%, merah bila > 100% |
| PRJ-05 | Seksi tarik | Daftar seksi: kode, tower awal–akhir (mis. T.12–T.18), jumlah tower, panjang (km), jumlah sirkuit, kms (otomatis), rencana mulai & selesai | Wajib | Seksi dapat diimpor dari Excel (UMM-13) |
| PRJ-06 | Tahapan & progres seksi | Setiap seksi memakai template tahapan (MST-08, dapat disesuaikan per proyek); progres tiap tahap 0–100% (kumulatif) | Wajib | Progres seksi dan proyek dihitung otomatis (Bagian 11.2); setiap perubahan progres mencatat sumbernya (laporan harian yang mana) |
| PRJ-07 | Matriks progres | Tabel seksi × tahapan berwarna (belum/berjalan/selesai) dengan progres total | Wajib | Dapat diekspor ke Excel untuk lampiran laporan ke klien |
| PRJ-08 | Kurva rencana vs realisasi | Grafik progres rencana vs aktual per minggu | Sebaiknya | Rencana dihitung dari jadwal seksi (Bagian 11.2) |
| PRJ-09 | Ringkasan proyek | Tab Ringkasan: progres vs rencana, status kesehatan (Normal/Waspada/Kritis), nilai kontrak, total ditagih, total diterima, total biaya, laba kotor, tim aktif, alat di lokasi, insiden, kendala terbaru | Wajib | Semua angka berasal dari modul terkait tanpa input ulang |
| PRJ-10 | Dokumen proyek | Penyimpanan dokumen per jenis: kontrak, addendum, BAP, BAST, gambar, izin, korespondensi | Wajib | — |
| PRJ-11 | Penutupan proyek | Checklist: semua alat sudah didemobilisasi, rekonsiliasi material selesai, kas lapangan nol/dikembalikan, semua termin selain retensi lunas | Wajib | Status "Ditutup" hanya bisa dipilih bila checklist terpenuhi, atau dengan override Direktur disertai catatan |

### 10.5 Laporan Harian Lapangan (OPS)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| OPS-01 | Laporan harian | Per proyek per tanggal: cuaca (pagi/siang/sore: Cerah, Berawan, Hujan, Hujan Lebat), jam kerja efektif, safety briefing/toolbox meeting (ya/tidak + jumlah peserta), baris aktivitas (seksi, tahapan, progres kumulatif setelah hari ini, keterangan), jumlah tenaga kerja (otomatis dari absensi hari itu), alat utama yang dipakai, kendala, rencana esok hari, foto (1–10). Bila tidak ada kegiatan (libur, hujan, stop kerja), cukup tandai "Tidak Ada Kegiatan" + alasan | Wajib | Satu laporan per proyek per tanggal; input paling lambat H+3; progres seksi diperbarui saat laporan dikirim; progres tidak bisa diturunkan kecuali oleh Operasional dengan alasan |
| OPS-02 | Kategori kendala | Cuaca, ROW/Lahan/Warga, Material Belum Datang, Alat Rusak, Izin Padam/Crossing, Tenaga Kerja, Lainnya — dengan keterangan | Wajib | Rekap kendala per kategori tersedia per proyek |
| OPS-03 | Pemeriksaan laporan | Operasional melihat laporan yang masuk, menandai "Sudah Diperiksa", atau memberi komentar revisi | Wajib | Proyek berstatus Berjalan yang belum mengirim laporan (atau tanda "Tidak Ada Kegiatan") muncul di "Perlu Tindakan" Operasional pada H+1 |
| OPS-04 | Cetak laporan harian | Format cetak dengan foto untuk dikirim ke kontraktor utama | Wajib | Isi laporan satu halaman A4; foto pada halaman lampiran |

### 10.6 Alat & Mobilisasi (ALT)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| ALT-01 | Data alat | Kode, nama, kategori (Mesin Utama: puller, tensioner, mesin press hidrolik, winch, genset; Alat Bantu: pulley/stringing block, come-along, running board, swivel, sock joint, grounding set; Alat Ukur: dinamometer, theodolite; Kendaraan; APD), tipe pelacakan (**Per Unit** dengan nomor seri, atau **Per Jumlah**), kepemilikan (Milik Sendiri / Sewa + supplier + tarif sewa), foto | Wajib | Alat Per Unit selalu berjumlah 1 dengan identitas unik |
| ALT-02 | Stok alat per lokasi & kondisi | Jumlah alat per lokasi (gudang/proyek) per kondisi: Baik, Rusak, Dalam Perbaikan, Hilang | Wajib | Total alat = jumlah di semua lokasi dan kondisi |
| ALT-03 | Surat Jalan (mobilisasi/demobilisasi) | Buat surat jalan: lokasi asal → tujuan, tanggal, kendaraan/sopir, daftar alat + jumlah + kondisi. Status Dikirim → Diterima. Biaya angkut dicatat terpisah lewat Tagihan Supplier/Pengeluaran kategori Mobilisasi dengan merujuk nomor surat jalan | Wajib | Stok asal berkurang saat Dikirim; stok tujuan bertambah saat Diterima; surat jalan dapat dicetak |
| ALT-04 | Konfirmasi penerimaan | Penerima (Lapangan/gudang) mengonfirmasi jumlah dan kondisi alat yang diterima; selisih wajib disertai keterangan dan foto | Wajib | Selisih otomatis tercatat sebagai Rusak/Hilang dan memicu notifikasi ke Operasional |
| ALT-05 | Perubahan kondisi | Lapor alat rusak, hilang, atau selesai diperbaiki di lokasi, dengan foto dan catatan | Wajib | Riwayat kondisi tiap alat tersimpan |
| ALT-06 | Riwayat alat | Riwayat lokasi (proyek mana dan berapa hari), kondisi, dan perbaikan per alat | Wajib | Untuk alat Per Unit, lama pemakaian di tiap proyek tampil dalam hari |
| ALT-07 | Alat sewa aktif | Daftar alat sewaan yang sedang dipakai: proyek, tanggal mulai, tarif, estimasi biaya sewa berjalan | Sebaiknya | Dipakai Finance sebagai acuan saat mencocokkan tagihan vendor sewa |

### 10.7 Material & Stok (MAT)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| MAT-01 | Data material | Kode, nama, satuan (m, kg, pcs, set, drum, liter), kategori, kepemilikan (Milik Perusahaan / Titipan Klien), stok minimum (untuk consumable) | Wajib | — |
| MAT-02 | Penerimaan material | Terima material ke lokasi, baik dari supplier (no. nota) maupun dari klien (no. surat jalan/BA serah terima klien), dengan foto dokumen | Wajib | Stok di lokasi bertambah |
| MAT-03 | Pemakaian material | Catat pemakaian di proyek: tanggal, material, jumlah, seksi (opsional), keterangan | Wajib | Stok berkurang; jumlah tidak boleh melebihi stok tersedia |
| MAT-04 | Transfer material | Pindah material antar lokasi (gudang ↔ proyek) dengan mekanisme surat jalan | Wajib | Status Dikirim → Diterima, sama seperti ALT-03/ALT-04 |
| MAT-05 | Stok opname | Penyesuaian stok berdasarkan hitung fisik, disertai alasan | Wajib | Selisih tercatat di log audit |
| MAT-06 | Rekonsiliasi material titipan | Per proyek per material titipan: diterima dari klien, terpakai, dikembalikan, sisa/susut | Wajib | Dapat diekspor untuk berita acara rekonsiliasi dengan klien |
| MAT-07 | Peringatan stok minimum | Notifikasi bila stok consumable di suatu lokasi di bawah minimum | Sebaiknya | — |

Catatan: modul ini hanya mencatat **jumlah** (asumsi A3). Biaya material tercatat di modul Keuangan saat pembelian.

### 10.8 K3 — Insiden (K3)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| K3-01 | Lapor insiden | Tanggal & jam, proyek, lokasi (seksi/tower), klasifikasi (Near Miss, P3K/First Aid, Perawatan Medis, Hari Kerja Hilang/LTI, Fatal, Kerusakan Properti/Alat), kronologi, orang terlibat/korban (dari data karyawan atau nama pihak luar), bagian tubuh terdampak, saksi, foto, tindakan segera | Wajib | Dapat dilaporkan dari HP oleh Lapangan; tetap tersimpan walau investigasi belum diisi |
| K3-02 | Notifikasi segera | Insiden LTI dan Fatal langsung dikirim ke Direktur dan Operasional (dalam aplikasi + email) | Wajib | Terkirim ≤ 5 menit setelah laporan dibuat |
| K3-03 | Investigasi | Penyebab langsung, akar masalah (Manusia, Alat, Metode, Lingkungan, Material), jumlah hari kerja hilang | Wajib | Status: Dilaporkan → Investigasi → Ditutup |
| K3-04 | Tindakan perbaikan | Daftar tindakan: uraian, PIC, tenggat, status (Terbuka/Selesai), bukti | Wajib | Insiden hanya dapat Ditutup bila semua tindakan berstatus Selesai |
| K3-05 | Ringkasan K3 | Jumlah insiden per klasifikasi, proyek, dan bulan; hari tanpa LTI (per proyek dan perusahaan); tindakan terbuka/terlambat; LTIFR | Wajib (LTIFR: Sebaiknya) | Angka sesuai Bagian 11.6 |

### 10.9 Keuangan (FIN)

**Piutang**

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| FIN-01 | Invoice termin | Buat invoice dari termin "Siap Ditagih": nilai termin (bruto), potongan manual (pengembalian uang muka, retensi), DPP, PPN (bila perusahaan PKP dan kontrak kena PPN), total; tanggal, jatuh tempo (default dari termin pembayaran klien), lampiran BAP | Wajib | Status: Draft → Terbit → Dibayar Sebagian → Lunas / Batal; invoice dapat dicetak lengkap dengan terbilang |
| FIN-02 | Invoice non-termin | Invoice lain (mis. pekerjaan tambah), tetap terikat ke proyek | Wajib | — |
| FIN-03 | Pembayaran masuk | Catat penerimaan: tanggal, jumlah diterima, potongan PPh oleh klien (nilai + no. bukti potong), rekening tujuan, bukti transfer | Wajib | Mendukung pembayaran bertahap; invoice Lunas bila jumlah diterima + potongan PPh = total invoice |
| FIN-04 | Piutang & jatuh tempo | Daftar invoice belum lunas: sisa tagihan, jatuh tempo, hari terlambat | Wajib | Invoice lewat jatuh tempo ditandai merah; notifikasi H-7 dan saat lewat jatuh tempo |
| FIN-05 | Umur piutang (aging) | Rekap piutang per klien dan proyek berdasarkan kelompok umur | Wajib | Sesuai Bagian 11.4 |

**Utang**

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| FIN-06 | Tagihan supplier | Supplier, no. nota/faktur, tanggal, jatuh tempo (default dari termin supplier), PPN (opsional), lampiran; baris rincian berisi uraian, jumlah, serta **proyek (atau Kantor/Umum) dan kategori biaya per baris**, sehingga satu tagihan dapat dibagi ke beberapa proyek | Wajib | Baris tanpa proyek/kategori tidak dapat disimpan |
| FIN-07 | Pembayaran supplier | Catat pembayaran sebagian/penuh: tanggal, rekening sumber, bukti | Wajib | Status: Belum Dibayar → Dibayar Sebagian → Lunas |
| FIN-08 | Utang & jadwal bayar | Daftar utang per jatuh tempo (terlambat, minggu ini, minggu depan) + aging | Wajib | Notifikasi ke Finance H-3 sebelum jatuh tempo |

**Biaya & Kas Lapangan**

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| FIN-09 | Pengeluaran langsung | Pembayaran tunai/transfer tanpa tagihan (mis. kompensasi warga, akomodasi, konsumsi): tanggal, proyek atau Kantor/Umum, kategori, jumlah, penerima, metode, foto nota/bukti | Wajib | Tanpa nota hanya boleh bila dicentang "Tanpa Nota" + keterangan |
| FIN-10 | Kas lapangan | Per proyek: Finance mencatat top-up dana ke PIC lapangan; PIC mencatat pengeluaran dengan foto nota dan jenis (**Biaya Proyek**, **Kasbon Karyawan**, atau **Pembayaran Gaji**); Finance memverifikasi (Disetujui/Ditolak + alasan); pengembalian sisa dana dicatat | Wajib | Saldo kas lapangan selalu terlihat oleh PIC dan Finance (Bagian 11.3); hanya pengeluaran "Biaya Proyek" yang Disetujui yang menjadi biaya proyek; "Kasbon Karyawan" yang Disetujui otomatis menjadi kasbon (PAY-05) |
| FIN-11 | Realisasi biaya proyek | Seluruh biaya proyek dari semua sumber (tagihan supplier, pengeluaran langsung, kas lapangan disetujui, alokasi gaji) per kategori, dibandingkan dengan RAB | Wajib | Total per kategori sama dengan angka di tab RAB & Biaya |
| FIN-12 | Laporan L/R proyek | Per proyek: nilai kontrak, nilai pekerjaan terselesaikan, pendapatan diakui, biaya per kategori, laba kotor, margin, laba rencana, proyeksi laba akhir, posisi kas proyek | Wajib | Rumus sesuai Bagian 11.3; dapat diekspor |
| FIN-13 | Biaya overhead kantor | Pengeluaran kantor (sewa, listrik, ATK, gaji staf kantor) dicatat ke "Kantor/Umum" | Wajib | Tidak masuk L/R proyek, tetapi masuk ringkasan perusahaan |
| FIN-14 | Ringkasan bulanan perusahaan | Per bulan: pendapatan (invoice terbit), biaya proyek, biaya overhead, laba sederhana; kas masuk vs kas keluar | Sebaiknya | — |

### 10.10 HCM / SDM

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| HCM-01 | Data karyawan | NIK karyawan, nama, NIK KTP, tempat/tanggal lahir, alamat, no. HP, kontak darurat, golongan darah, status kerja (Tetap/Kontrak/Harian Lepas), tipe (Kantor/Lapangan), jabatan, tanggal masuk/keluar, rekening bank, no. BPJS, foto | Wajib | NIK karyawan unik; karyawan nonaktif tidak dapat ditugaskan atau diabsen |
| HCM-02 | Dokumen & pengaturan gaji | Dokumen (KTP, KK, kontrak kerja, ijazah). Pengaturan gaji: tipe (Harian/Bulanan), upah harian atau gaji pokok, tunjangan tetap, uang makan/hari, tunjangan lapangan/hari, tarif lembur/jam, potongan tetap (BPJS) | Wajib | Pengaturan gaji hanya terlihat oleh HCM, Finance, dan Direktur |
| HCM-03 | Sertifikat karyawan | Jenis, nomor, penerbit, tanggal terbit, tanggal kedaluwarsa (kosong = seumur hidup), file scan; status dihitung otomatis | Wajib | Status sesuai Bagian 11.5 |
| HCM-04 | Pengingat sertifikat | Daftar sertifikat Segera Kedaluwarsa dan Kedaluwarsa; notifikasi ke HCM saat sertifikat masuk batas 60 hari dan saat kedaluwarsa, serta ke Operasional bila karyawan sedang bertugas | Wajib | — |
| HCM-05 | Penugasan proyek | Karyawan, proyek, jabatan di proyek, tanggal mulai, tanggal selesai (opsional); maksimal satu penugasan aktif per karyawan | Wajib | Penugasan aktif menentukan daftar kru di absensi proyek dan akses akun Lapangan |
| HCM-06 | Validasi sertifikat saat penugasan | Sistem menolak penugasan bila sertifikat wajib jabatan tersebut tidak ada atau tidak berlaku. HCM dapat melakukan override dengan alasan | Wajib | Override tercatat di log audit dan tampil di dashboard Direktur; kru yang sertifikatnya kedaluwarsa selama penugasan ditandai merah di absensi dan dashboard |
| HCM-07 | Pelatihan | Nama pelatihan, jenis (Internal/Eksternal), penyelenggara, tanggal, lokasi, peserta + hasil (Lulus/Tidak Lulus), jenis sertifikat yang dihasilkan. Biaya pelatihan dicatat lewat Pengeluaran/Tagihan Supplier kategori Pelatihan & Sertifikasi | Wajib | Peserta Lulus otomatis mendapat/memperbarui sertifikat (nomor dan file dapat dilengkapi kemudian) |
| HCM-08 | Kebutuhan pelatihan | Daftar karyawan yang sertifikat wajib jabatannya belum ada, kedaluwarsa, atau segera kedaluwarsa, dikelompokkan per jenis sertifikat | Wajib | Karyawan dari daftar ini dapat langsung dipilih sebagai peserta pelatihan baru |
| HCM-09 | Absensi lapangan | Lapangan membuka "Absensi Hari Ini" → daftar kru dari penugasan aktif → tandai status (Hadir, Izin, Sakit, Cuti, Alpa, Libur) + jam lembur; ada aksi cepat "Tandai Semua Hadir"; foto lembar absensi kertas (opsional) | Wajib | Satu catatan per karyawan per tanggal; input paling lambat H+3 |
| HCM-10 | Absensi kantor | HCM mengisi atau mengimpor absensi staf kantor dengan format yang sama | Wajib | — |
| HCM-11 | Rekap & kunci absensi | Rekap per periode per karyawan/proyek. Absensi terkunci setelah payroll periode tersebut disetujui; koreksi setelahnya hanya oleh HCM dengan alasan, dan dibayarkan sebagai penyesuaian di payroll berikutnya | Wajib | Koreksi setelah terkunci tercatat di log audit |
| HCM-12 | Pekerja baru dari lapangan | Lapangan dapat menambahkan pekerja lokal dengan data minimal (nama, NIK KTP, no. HP, jabatan, upah harian) berstatus "Menunggu Verifikasi HCM"; pekerja tersebut langsung bisa diabsen | Wajib | Hanya untuk jabatan tanpa sertifikat wajib; slip gaji tidak dapat disetujui sebelum HCM memverifikasi |

### 10.11 Payroll (PAY)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| PAY-01 | Periode gaji | Buat periode (tanggal mulai–selesai, mis. bulanan atau dua mingguan) untuk kelompok Lapangan, Kantor, atau Semua | Wajib | Periode tidak boleh tumpang tindih untuk karyawan yang sama |
| PAY-02 | Generate draf payroll | Sistem menghitung slip semua karyawan aktif di kelompok tersebut dari absensi, pengaturan gaji, dan cicilan kasbon (Bagian 11.7) | Wajib | Karyawan dengan absensi belum lengkap atau belum diverifikasi diberi tanda |
| PAY-03 | Penyesuaian manual | HCM dapat menambah komponen per slip: insentif/bonus/borongan, potongan PPh 21, potongan lain, koreksi periode lalu — wajib dengan keterangan | Wajib | — |
| PAY-04 | Persetujuan | Draft (HCM) → Diajukan → Disetujui (Direktur) atau Dikembalikan (dengan catatan) → Dibayar (Finance) | Wajib | Setelah Disetujui, slip dan absensi periode tersebut terkunci |
| PAY-05 | Kasbon | Karyawan, tanggal, jumlah, keterangan, cicilan per periode gaji; saldo otomatis. Dicatat oleh HCM/Finance, atau otomatis dari kas lapangan (FIN-10) | Wajib | Cicilan otomatis terpotong di payroll; saldo kasbon tidak pernah negatif |
| PAY-06 | Pembayaran gaji | Finance menandai slip dibayar (massal atau per karyawan), dengan tanggal dan metode (transfer/tunai); ekspor daftar transfer (nama, bank, no. rekening, jumlah) ke Excel | Wajib | Gaji yang dibayar tunai lewat kas lapangan dicatat sebagai pengeluaran kas lapangan jenis "Pembayaran Gaji" |
| PAY-07 | Slip gaji | Cetak/PDF slip per karyawan; cetak massal per proyek untuk dibagikan di lapangan | Wajib | — |
| PAY-08 | Alokasi biaya gaji ke proyek | Saat payroll Disetujui, pendapatan bruto tiap karyawan dibagi ke proyek sesuai hari hadir di proyek tersebut; sisanya ke Overhead Kantor | Wajib | Total alokasi = total pendapatan bruto payroll; muncul di realisasi biaya kategori Upah & Gaji |
| PAY-09 | Rekap payroll | Rekap per periode per proyek/kelompok untuk akuntan | Wajib | Dapat diekspor |

### 10.12 Dashboard (DSB)

| ID | Fitur | Deskripsi | Prioritas | Kriteria penerimaan |
|---|---|---|---|---|
| DSB-01 | Dashboard Direktur | Kartu ringkas: nilai kontrak aktif, nilai belum ditagih, piutang (total & lewat jatuh tempo), utang (total & jatuh tempo 7 hari), win rate tahun berjalan & nilai pipeline, hari tanpa LTI, kru aktif dengan sertifikat bermasalah/override, payroll menunggu persetujuan | Wajib | Setiap kartu dapat diklik menuju daftar rinciannya |
| DSB-02 | Tabel kesehatan proyek | Per proyek aktif: progres aktual vs rencana, % biaya terhadap RAB, laba kotor, margin, status Normal/Waspada/Kritis (Bagian 11.3), kendala terbanyak | Wajib | Status sesuai rumus Bagian 11.3 |
| DSB-03 | Grafik ringkas | Aging piutang, insiden K3 per bulan, pipeline tender per status, biaya per kategori per proyek | Sebaiknya | — |
| DSB-04 | Beranda per peran | **Marketing:** tender prioritas, batas waktu dekat, tindak lanjut. **Finance:** termin siap ditagih, piutang/utang jatuh tempo, kas lapangan menunggu verifikasi, payroll siap dibayar. **HCM:** sertifikat bermasalah, pekerja baru menunggu verifikasi, absensi belum lengkap, payroll dikembalikan. **Operasional:** laporan harian belum masuk, selisih alat, insiden terbuka, stok minimum. **Lapangan:** tombol cepat + status tugas hari ini | Wajib | Setiap item mengarah ke halaman tindakannya |

---

## 11. Aturan Bisnis & Rumus

### 11.1 Tender

- **Win rate (jumlah)** = Menang ÷ (Menang + Kalah) × 100%. Tender Batal/Tidak Ikut tidak dihitung.
- **Win rate (nilai)** = Σ nilai penawaran Menang ÷ Σ nilai penawaran (Menang + Kalah) × 100%.
- **Nilai tertimbang** = nilai penawaran terakhir × peluang menang (%).
- **Margin rencana** = (nilai penawaran − estimasi biaya) ÷ nilai penawaran.
- Periode analitik ditentukan dari tanggal status akhir (Menang/Kalah).
- Urutan prioritas default: nilai tertimbang tertinggi; label "Mendesak" bila batas penawaran ≤ 7 hari.

### 11.2 Progres

- **kms seksi** = panjang (km) × jumlah sirkuit.
- **Progres seksi** = Σ (bobot tahap × progres tahap %) ÷ Σ bobot tahap.
- **Progres proyek** = Σ (progres seksi × kms seksi) ÷ Σ kms seksi.
- **Progres rencana** pada tanggal tertentu: per seksi 0% sebelum rencana mulai, 100% setelah rencana selesai, dan naik linear di antaranya. Rencana proyek = rata-rata tertimbang kms.
- **Deviasi jadwal** = progres aktual − progres rencana (poin persen).
- Termin berubah menjadi "Siap Ditagih" bila: progres proyek ≥ syarat progres, **atau** tanggal syarat sudah lewat, **atau** ditandai manual oleh Finance/Operasional.

> Contoh: Seksi S-03 (T.12–T.18), 4,2 km × 2 sirkuit = 8,4 kms. Pulley 100%, Pilot Wire 100%, Konduktor 50%, tahap lain 0%.
> Progres seksi = (10×100 + 10×100 + 30×50) ÷ 100 = **35%**.

### 11.3 Keuangan proyek

**Aturan satu sumber biaya** (agar tidak terjadi biaya ganda):

| Jenis transaksi | Dicatat sebagai | Menjadi biaya proyek? |
|---|---|---|
| Pembelian bertempo/kredit dari supplier | Tagihan Supplier (FIN-06) | Ya, saat tagihan dicatat |
| Pembayaran tagihan supplier | Pembayaran Supplier (FIN-07) | Tidak (hanya pelunasan) |
| Belanja langsung oleh kantor | Pengeluaran Langsung (FIN-09) | Ya |
| Belanja di lapangan | Kas Lapangan jenis Biaya Proyek (FIN-10) | Ya, setelah Disetujui Finance |
| Top-up kas lapangan | Top-up (FIN-10) | Tidak (hanya perpindahan dana) |
| Kasbon karyawan | Kasbon (PAY-05) | Tidak (piutang karyawan) |
| Gaji | Alokasi payroll (PAY-08) | Ya, saat payroll Disetujui |
| Gaji dibayar tunai dari kas lapangan | Kas Lapangan jenis Pembayaran Gaji | Tidak (biaya sudah dari alokasi payroll) |

**Rumus**

- **Nilai Kontrak** = nilai kontrak setelah addendum terakhir, sebelum PPN.
- **Nilai Pekerjaan Terselesaikan** = Nilai Kontrak × progres proyek.
- **Pendapatan Diakui** = Σ DPP invoice berstatus Terbit/Dibayar Sebagian/Lunas.
- **Belum Ditagih** = Nilai Pekerjaan Terselesaikan − Pendapatan Diakui. Angka ini menjadi sinyal untuk segera menagih.
- **Biaya Realisasi** = Σ baris tagihan supplier + Σ pengeluaran langsung + Σ kas lapangan "Biaya Proyek" yang Disetujui + Σ alokasi gaji — semuanya untuk proyek tersebut dan tidak termasuk yang Batal. Bila perusahaan PKP, biaya dihitung tanpa PPN; bila non-PKP, PPN termasuk biaya.
- **Laba Kotor** = Pendapatan Diakui − Biaya Realisasi. **Margin** = Laba Kotor ÷ Pendapatan Diakui.
- **Laba Rencana** = Nilai Kontrak − Total RAB.
- **Estimasi Biaya Akhir** = Σ per kategori dari nilai terbesar antara RAB kategori dan Realisasi kategori.
- **Proyeksi Laba Akhir** = Nilai Kontrak − Estimasi Biaya Akhir (proyeksi konservatif).
- **Posisi Kas Proyek** = Σ pembayaran diterima − (Σ pembayaran supplier + Σ pengeluaran langsung + Σ top-up kas lapangan bersih setelah pengembalian + Σ alokasi gaji dari payroll berstatus Dibayar).
- **Saldo Kas Lapangan** = Σ top-up − Σ pengeluaran (status Menunggu + Disetujui) − Σ pengembalian dana ke kantor. Pengeluaran yang Ditolak tidak mengurangi saldo, sehingga dananya tetap menjadi tanggungan PIC.

**Status kesehatan proyek**

- **Indeks Biaya** = (% RAB terpakai) − (progres proyek aktual), dalam poin persen. % RAB terpakai = Biaya Realisasi ÷ Total RAB.
- **Normal**: Indeks Biaya ≤ 10 **dan** deviasi jadwal ≥ −10.
- **Waspada**: Indeks Biaya > 10 **atau** deviasi jadwal < −10.
- **Kritis**: Indeks Biaya > 20 **atau** deviasi jadwal < −20 **atau** Biaya Realisasi > Total RAB.
- Ambang dapat diubah di Parameter Sistem (MST-10).

### 11.4 Piutang & utang

- **Sisa tagihan** piutang = total invoice − Σ diterima − Σ potongan PPh. Sisa utang = total tagihan − Σ dibayar.
- **Jatuh tempo default** = tanggal invoice + termin pembayaran klien (hari); untuk utang, tanggal nota + termin supplier.
- **Hari terlambat** = hari ini − jatuh tempo (bila positif dan belum lunas).
- **Kelompok umur**: Belum Jatuh Tempo · 1–30 hari · 31–60 hari · 61–90 hari · > 90 hari.

### 11.5 Sertifikat

- **Berlaku**: tanggal kedaluwarsa > hari ini + 60 hari, atau tanpa tanggal kedaluwarsa.
- **Segera Kedaluwarsa**: hari ini ≤ tanggal kedaluwarsa ≤ hari ini + 60 hari.
- **Kedaluwarsa**: tanggal kedaluwarsa < hari ini.
- Karyawan **Layak Tugas** untuk jabatan X bila semua sertifikat wajib jabatan X berstatus Berlaku atau Segera Kedaluwarsa pada tanggal mulai penugasan.

### 11.6 K3

- **Hari tanpa LTI** = hari ini − tanggal insiden LTI/Fatal terakhir. Dihitung per proyek dan per perusahaan; bila belum pernah terjadi, dihitung sejak proyek dimulai.
- **Jam kerja** = Σ (hari Hadir × jam kerja standar + jam lembur), diambil dari absensi.
- **LTIFR** = (jumlah LTI + Fatal) × 1.000.000 ÷ jam kerja.

### 11.7 Payroll

**Pekerja harian**

- Upah = upah harian × hari Hadir
- Uang makan = uang makan/hari × hari Hadir
- Tunjangan lapangan = tunjangan lapangan/hari × hari Hadir di proyek
- Lembur = jam lembur × tarif lembur/jam
- **Pendapatan bruto** = Upah + Uang makan + Tunjangan lapangan + Lembur + Insentif manual
- Status selain Hadir tidak dibayar (dapat disesuaikan setelah validasi; lihat Pertanyaan Terbuka).

**Staf bulanan**

- Gaji = gaji pokok + tunjangan tetap
- Potongan alpa = (gaji pokok ÷ 26) × hari Alpa
- Komponen harian (uang makan/tunjangan lapangan) per hari Hadir, bila diatur
- **Pendapatan bruto** = Gaji − Potongan alpa + komponen harian + Lembur + Insentif manual
- Karyawan yang masuk/keluar di tengah periode: gaji pokok diprorata berdasarkan hari kalender aktif.

**Potongan & gaji bersih**

- Cicilan kasbon = nilai terkecil antara cicilan yang ditetapkan dan saldo kasbon.
- Potongan lain: BPJS (tetap, dari pengaturan karyawan), PPh 21 (manual), potongan lain (manual).
- **Gaji bersih** = Pendapatan bruto − total potongan. Gaji bersih tidak boleh negatif; bila terjadi, cicilan kasbon otomatis dikurangi dan sisanya ditunda ke periode berikutnya.

**Alokasi ke proyek**

- Biaya gaji proyek P = Pendapatan bruto × (hari Hadir di proyek P ÷ total hari Hadir dalam periode).
- Hari Hadir tanpa proyek (di kantor) → Overhead Kantor.
- Bila total hari Hadir = 0 (mis. staf bulanan cuti penuh), biaya dialokasikan ke proyek penugasan aktif, atau ke Overhead Kantor bila tidak ada penugasan.
- Potongan karyawan (kasbon, PPh 21, BPJS bagian karyawan) **tidak** mengurangi biaya proyek.

---

## 12. Model Data (Garis Besar)

Nama entitas bersifat indikatif; penamaan final ditentukan tim pengembang.

| Kelompok | Entitas utama | Relasi penting |
|---|---|---|
| Akses | profil_pengguna (peran, karyawan_id) | 1 pengguna ↔ 0/1 karyawan |
| Master | perusahaan, klien, kontak_klien, supplier, lokasi, kategori_biaya, jabatan, jenis_sertifikat, jabatan_sertifikat_wajib, template_tahapan, kategori_alat_material, parameter_sistem | — |
| Marketing | aktivitas_klien, tender, revisi_penawaran | tender → klien; tender 1 ↔ 0/1 proyek |
| Proyek | proyek, addendum, termin, rab, seksi, tahapan_proyek, progres_seksi_tahap, riwayat_progres | proyek → klien, tender; (seksi × tahapan) → progres |
| Laporan lapangan | laporan_harian, aktivitas_laporan, kendala_laporan | laporan → proyek (unik proyek + tanggal); aktivitas → seksi, tahapan |
| Alat | alat, stok_alat (alat × lokasi × kondisi), surat_jalan, item_surat_jalan, riwayat_kondisi_alat | surat_jalan → lokasi asal & tujuan |
| Material | material, stok_material (material × lokasi), transaksi_material, item_transaksi_material | transaksi → lokasi, proyek, seksi (opsional) |
| K3 | insiden, korban_insiden, tindakan_perbaikan | insiden → proyek; korban → karyawan (opsional) |
| Keuangan | invoice, pembayaran_invoice, tagihan_supplier, baris_tagihan, pembayaran_supplier, pengeluaran, topup_kas_lapangan, pengembalian_kas_lapangan | invoice → proyek, termin; baris_tagihan & pengeluaran → proyek (atau Kantor) + kategori_biaya |
| SDM | karyawan, pengaturan_gaji, dokumen_karyawan, sertifikat_karyawan, pelatihan, peserta_pelatihan, penugasan, absensi | absensi → karyawan, proyek (unik karyawan + tanggal) |
| Payroll | periode_gaji, slip_gaji, komponen_slip, kasbon, cicilan_kasbon, alokasi_gaji | slip → periode, karyawan; alokasi_gaji → proyek |
| Sistem | lampiran (generik), notifikasi, log_audit | lampiran → data apa pun (jenis + id) |

Tampilan gabungan yang dibutuhkan: **biaya proyek** (gabungan empat sumber biaya), **progres proyek**, **L/R proyek**, **aging piutang/utang**, **status sertifikat**, dan **saldo kas lapangan**.

---

## 13. Matriks Hak Akses

Keterangan: **K** = kelola (buat/ubah) · **L** = lihat · **S** = setujui · **(P)** = hanya proyek penugasannya · **—** = tidak ada akses

| Modul | Super Admin | Direktur | Marketing | Finance | HCM | Operasional | Lapangan |
|---|---|---|---|---|---|---|---|
| Pengguna & parameter sistem | K | L | — | — | — | — | — |
| Klien & kontak | K | L | K | L | — | L | — |
| Supplier | K | L | — | K | — | L | — |
| Master teknis (jabatan, sertifikat, tahapan, kategori) | K | L | — | K (kategori biaya) | K (jabatan, sertifikat) | K (tahapan, alat, material) | — |
| Tender & analitik | L | L | K | L | — | L | — |
| Proyek: data kontrak & termin | L | L | K (buat dari tender) | K | — | L | — |
| Proyek: RAB | L | L | — | K | — | K | — |
| Seksi & progres | L | L | L | L | — | K | K (P, via laporan harian) |
| Laporan harian | L | L | — | — | — | K + periksa | K (P) |
| Alat & surat jalan | L | L | — | L | — | K | K (P: terima, lapor kondisi) |
| Material & stok | L | L | — | L | — | K | K (P: terima, pakai) |
| Insiden K3 | L | L | — | — | L | K | K (P: lapor) |
| Invoice & piutang | L | L | L | K | — | L (status saja) | — |
| Tagihan supplier & utang | L | L | — | K | — | L | — |
| Pengeluaran & kas lapangan | L | L | — | K + verifikasi | — | L | K (P: catat) |
| L/R proyek | L | L | — | L | — | L | — |
| Karyawan (data umum) | L | L | — | L | K | L | L (P: kru) + tambah pekerja lokal |
| Pengaturan gaji, kasbon, payroll | — | S | — | K (bayar, kasbon) | K (susun, kasbon) | — | — |
| Sertifikat & pelatihan | L | L | — | — | K | L | L (P: kru) |
| Penugasan | L | L | — | — | K | L | L (P) |
| Absensi | L | L | — | L | K | L | K (P) |
| Dashboard Direktur & log audit | L | L | — | — | — | — | — |

---

## 14. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Bahasa & format | Seluruh antarmuka dalam Bahasa Indonesia. Mata uang "Rp 1.250.000" (tanpa desimal); tanggal "25 Okt 2026" atau dd/mm/yyyy; zona waktu WIB (Asia/Jakarta); pemisah desimal koma (4,2 km) |
| Perangkat | Desktop (Chrome/Edge terbaru) untuk kantor; HP Android dengan lebar layar ≥ 360 px (Chrome) untuk lapangan; formulir lapangan nyaman dipakai dengan satu tangan |
| Kinerja | Halaman utama tampil ≤ 3 detik di jaringan 4G; foto dikompres di perangkat sebelum diunggah; daftar memakai paginasi |
| Koneksi lemah | Formulir lapangan ringan; unggahan foto dapat diulang bila gagal; input mundur hingga H+3; draf lokal (UMM-12) |
| Keamanan | Row Level Security aktif di semua tabel; storage privat dengan URL bertanda tangan berumur pendek; kata sandi minimal 8 karakter; data gaji dipisah dan dibatasi; akun karyawan yang keluar segera dinonaktifkan |
| Integritas data | Transaksi tidak dihapus permanen (UMM-11); log audit; validasi angka (tidak negatif); biaya wajib memiliki proyek dan kategori |
| Cadangan | Backup harian otomatis (Supabase Pro), Point-in-Time Recovery sebagai opsi; ekspor bulanan data penting ke Excel sebagai arsip |
| Ketersediaan | Mengikuti SLA Vercel dan Supabase; tidak ada pemeliharaan terencana pada pukul 06.00–22.00 WIB |
| Skalabilitas | Menampung 10× skala asumsi A11 tanpa perubahan arsitektur |
| Kemudahan pakai | Pengguna baru dapat menyelesaikan tugas utamanya setelah pelatihan ≤ 1 jam; istilah mengikuti bahasa lapangan (seksi, tower, termin, BAP, kasbon) |

---

## 15. Arsitektur & Pemanfaatan Supabase

| Kebutuhan | Solusi |
|---|---|
| Aplikasi web | Next.js (App Router) dengan Server Components dan Server Actions untuk operasi data; Tailwind CSS; komponen UI siap pakai (mis. shadcn/ui) dan pustaka grafik ringan (mis. Recharts) |
| Hosting | Vercel untuk aplikasi; Supabase Pro region Singapura (ap-southeast-1) agar latensi ke Indonesia rendah |
| Autentikasi | Supabase Auth email + kata sandi; undangan pengguna oleh admin; reset kata sandi via email; pendaftaran publik dimatikan; SMTP kustom (mis. Resend/Mailgun) untuk email Auth dan notifikasi |
| Peran | Tabel profil pengguna menyimpan peran; peran disisipkan ke token login (Custom Access Token Hook) sehingga RLS dan UI dapat membaca peran dengan cepat |
| Hak akses data | Row Level Security per tabel berdasarkan peran. Untuk peran Lapangan, akses dibatasi ke proyek dari penugasan aktif. Data gaji disimpan di tabel terpisah agar mudah dibatasi |
| Logika & laporan | View dan fungsi PostgreSQL untuk angka yang dipakai berulang (biaya proyek gabungan, progres, L/R, aging, status sertifikat, saldo kas lapangan), sehingga angka di semua halaman konsisten. Trigger untuk penomoran dokumen, riwayat progres, pembaruan stok, dan log audit |
| File | Supabase Storage dengan bucket privat per domain: dokumen proyek, foto lapangan, bukti keuangan, dokumen karyawan, dan K3. Kebijakan akses mengikuti aturan RLS |
| Tugas terjadwal | pg_cron + Edge Functions setiap pagi: memperbarui status sertifikat, jatuh tempo piutang/utang, termin berbasis tanggal, dan laporan harian yang belum masuk → membuat notifikasi; mengirim ringkasan email (UMM-07) |
| Notifikasi segera | Trigger database/Edge Function saat insiden LTI/Fatal dibuat → notifikasi + email |
| Realtime | Tidak wajib di v1. Notifikasi cukup dimuat saat halaman dibuka; Supabase Realtime opsional untuk ikon lonceng |
| Ekspor & impor | Ekspor .xlsx dari aplikasi; impor Excel/CSV dengan templat untuk migrasi awal |
| Lingkungan | Dua project Supabase: **Staging** (pengujian/UAT) dan **Produksi**, dengan migrasi skema terversi |

---

## 16. Migrasi Data & Onboarding

**Tanggal cut-off**: tanggal mulai pemakaian sistem (disarankan awal bulan). Semua transaksi setelah cut-off wajib diinput di sistem.

| Data | Sumber | Penanggung jawab | Catatan |
|---|---|---|---|
| Karyawan + pengaturan gaji | Excel HR | HCM | Wajib selesai sebelum absensi dimulai |
| Sertifikat karyawan + scan | Arsip fisik/scan | HCM | Prioritaskan pekerja lapangan |
| Klien & supplier | Excel/kontak | Marketing, Finance | — |
| Riwayat tender (minimal 2 tahun terakhir) | Arsip marketing | Marketing | Dasar win rate awal |
| Proyek berjalan: kontrak, termin, RAB, seksi, progres saat ini | Excel proyek | Operasional, Finance | Progres saat ini dicatat sebagai progres awal |
| Biaya proyek berjalan s.d. cut-off | Excel biaya | Finance | Diimpor sebagai satu baris saldo awal per kategori, agar L/R tetap lengkap |
| Piutang & utang terbuka | Excel keuangan | Finance | Hanya invoice/tagihan yang belum lunas |
| Kasbon terbuka | Catatan HR/keuangan | HCM | Saldo per karyawan |
| Alat & lokasi saat ini | Hasil stok opname | Operasional | Lakukan opname fisik sebelum go-live |
| Stok material per lokasi | Hasil stok opname | Operasional | Termasuk material titipan di proyek berjalan |

**Onboarding**

- Pelatihan per peran (≤ 1 jam per peran). Tim Lapangan dilatih langsung (di lokasi atau daring) dan diberi panduan bergambar satu halaman.
- Masa paralel 2–4 minggu: cara lama (kertas/Excel) tetap berjalan sebagai pembanding, terutama untuk payroll pertama.
- Satu "champion" per divisi sebagai tempat bertanya pertama.

---

## 17. Rencana Rilis (Indikatif)

| Tahap | Minggu | Isi | Hasil yang dapat dipakai |
|---|---|---|---|
| 0. Persiapan | 0 | Validasi asumsi dan pertanyaan terbuka; kumpulkan contoh dokumen (invoice, slip, laporan harian, surat jalan) | PRD final |
| 1. Fondasi | 1–3 | Auth & peran, master data, karyawan, sertifikat, jabatan, klien, tender & analitik | Marketing dan HCM mulai memakai; data sertifikat terpusat |
| 2. Proyek & Lapangan | 4–6 | Proyek, termin, RAB, seksi & progres, penugasan, absensi, laporan harian, alat & surat jalan, material | Tim lapangan mulai input harian |
| 3. Keuangan & K3 | 7–9 | Invoice, piutang, tagihan supplier, utang, pengeluaran, kas lapangan, L/R proyek, insiden K3 | Finance memakai penuh; L/R proyek tersedia |
| 4. Payroll & Dashboard | 10–12 | Kasbon, payroll, alokasi gaji, dashboard, notifikasi & email, cetak/ekspor, log audit | Payroll pertama (paralel dengan cara lama) |
| 5. UAT & Go-live | 13–14 | Migrasi data, UAT per peran, perbaikan, pelatihan, go-live | Sistem produksi |

Setiap akhir tahap, hasilnya dipasang di Staging untuk ditinjau klien.

**Kriteria go-live**

- Semua fitur Wajib lulus UAT.
- Data migrasi sudah diverifikasi oleh penanggung jawab masing-masing.
- Hasil payroll paralel sama dengan cara lama, atau selisihnya dapat dijelaskan.
- Setiap peran sudah dilatih.

---

## 18. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Tim lapangan enggan atau lupa input | Data progres, absensi, dan biaya tidak lengkap | Formulir minimal dengan tombol besar; "Tandai Semua Hadir"; pengingat harian; payroll hanya dihitung dari absensi sistem (insentif alami untuk input); champion lapangan |
| Sinyal lemah di lokasi | Input gagal atau hilang | Kompresi foto, input mundur H+3, draf lokal, unggah ulang |
| Data awal berantakan | Laporan awal salah | Templat impor, stok opname sebelum go-live, saldo awal per kategori, cut-off yang jelas |
| Biaya tercatat ganda atau terlewat | L/R salah | Aturan satu sumber biaya (Bagian 11.3); proyek dan kategori wajib diisi; Finance meninjau realisasi vs RAB setiap minggu |
| Kebocoran data gaji | Masalah internal | RLS ketat, tabel gaji terpisah, log audit |
| Override sertifikat disalahgunakan | Risiko keselamatan | Override wajib dengan alasan, tercatat, dan tampil di dashboard Direktur |
| Penambahan fitur di tengah pengembangan | Jadwal molor | Daftar "Di luar lingkup" yang tegas; permintaan baru masuk backlog v2 |
| Ketergantungan pada satu admin | Operasional terhenti | Minimal dua akun Super Admin; dokumentasi singkat |

---

## 19. Pertanyaan Terbuka (untuk divalidasi ke klien)

1. Apakah UD. AJ224 berstatus PKP? Potongan PPh apa yang biasa dilakukan klien atas invoice?
2. Bagaimana skema upah pekerja lapangan: harian, bulanan, atau borongan per seksi/kms? Berapa periode pembayarannya (mingguan, dua mingguan, bulanan)? Dibayar transfer atau tunai di lokasi?
3. Apakah material utama selalu disuplai klien, atau ada proyek yang materialnya dibeli sendiri?
4. Apakah ada tenaga kerja dari mandor borongan/subkon pihak ketiga? (Jika ya, dicatat sebagai tagihan supplier, bukan payroll.)
5. Siapa yang berwenang menyetujui pengeluaran dan pembayaran supplier? Apakah perlu batas nominal yang wajib disetujui Direktur?
6. Format invoice, kwitansi, slip gaji, surat jalan, dan laporan harian apa yang dipakai sekarang (mohon contoh)? Apakah kontraktor utama mewajibkan format tertentu?
7. Tahapan stringing dan bobot apa yang dipakai dalam BAP/laporan ke kontraktor utama? Apakah GSW/OPGW biasanya termasuk lingkup?
8. Berapa jumlah karyawan, calon pengguna, dan proyek yang sedang berjalan saat ini?
9. Berapa tahun riwayat tender yang ingin dimasukkan?
10. Sertifikat apa saja yang diwajibkan klien/kontraktor utama untuk tiap jabatan?
11. Apakah pekerja harian yang sakit (dengan surat dokter) atau izin tertentu tetap dibayar?
12. Apakah Operasional boleh melihat nilai kontrak dan laba proyek, atau cukup RAB dan biaya?
13. Apakah staf kantor sudah memakai mesin fingerprint yang datanya bisa diimpor?

---

## 20. Glosarium

| Istilah | Arti |
|---|---|
| SUTET | Saluran Udara Tegangan Ekstra Tinggi (275/500 kV). Dalam dokumen ini mencakup juga SUTT 150 kV |
| Stringing | Pekerjaan penarikan dan pemasangan kawat konduktor/kawat tanah pada tower transmisi |
| Seksi tarik | Bentang penarikan konduktor antara dua tower tension (mis. T.12–T.18) |
| kms | Kilometer sirkuit = panjang jalur (km) × jumlah sirkuit |
| Pulley / stringing block | Katrol yang dipasang di tower sebagai jalur penarikan konduktor |
| Pilot wire | Tali/kawat penuntun yang ditarik lebih dulu sebelum konduktor |
| Sagging | Penyetelan lendutan konduktor sesuai tabel desain |
| Clamping | Pemasangan klem suspensi/tension setelah sagging |
| Spacer / Damper | Perangkat pengatur jarak antarkonduktor / peredam getaran |
| Jumper | Kawat penghubung konduktor di tower tension |
| GSW / OPGW | Ground Steel Wire / Optical Ground Wire (kawat tanah) |
| ROW | Right of Way — hak/izin lahan dan jalur di bawah jaringan |
| Izin padam / crossing | Izin pemadaman jaringan eksisting saat stringing menyilang jaringan lain |
| Termin | Tahap penagihan sesuai kontrak |
| Retensi | Bagian nilai kontrak yang ditahan klien hingga masa pemeliharaan selesai |
| BAP / BAST | Berita Acara Pembayaran (Progres) / Berita Acara Serah Terima |
| RAB | Rencana Anggaran Biaya |
| HPP | Harga Pokok — estimasi biaya untuk mengerjakan proyek |
| DPP | Dasar Pengenaan Pajak |
| PKP | Pengusaha Kena Pajak (wajib memungut PPN) |
| Piutang / Utang | Tagihan ke klien yang belum dibayar / kewajiban ke supplier yang belum dibayar |
| Kasbon | Pinjaman atau uang muka gaji karyawan, dipotong dari gaji |
| Kas lapangan | Dana operasional yang dipegang PIC proyek di lokasi |
| K3 | Keselamatan dan Kesehatan Kerja |
| Near miss | Kejadian hampir celaka tanpa korban atau kerusakan |
| LTI | Lost Time Injury — cedera yang menyebabkan hilangnya hari kerja |
| LTIFR | Lost Time Injury Frequency Rate — jumlah LTI per 1.000.000 jam kerja |
| TKBT | Tenaga Kerja Bangunan Tinggi — sertifikat bekerja di ketinggian |
| SKTTK | Sertifikat Kompetensi Tenaga Teknik Ketenagalistrikan |
| SIO | Surat Izin Operator (alat berat/angkat) |
| APD | Alat Pelindung Diri |
| PIC | Person in Charge — penanggung jawab |
