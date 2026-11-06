# AJ224 ERP

Aplikasi web untuk mengelola usaha **UD. AJ224**, kontraktor stringing (penarikan konduktor) tower SUTT/SUTET. Aplikasi ini menggantikan kertas, WhatsApp, dan file Excel yang terpisah-pisah.

**Proyek adalah pusat data.** Setiap biaya, tagihan, absensi, laporan harian, alat, material, dan insiden K3 selalu terikat ke satu proyek (atau ke "Kantor/Umum"). Karena itu laba-rugi per proyek, piutang, utang, dan status keselamatan langsung terlihat tanpa rekap manual.

Aplikasi berjalan di browser, baik di komputer maupun HP. Semua tampilan berbahasa Indonesia, nilai uang dalam Rupiah, dan waktu dalam WIB.

---

## Fitur

| Modul | Isi |
|---|---|
| **Beranda** | Dashboard sesuai peran, daftar "Perlu Tindakan", dan notifikasi |
| **Marketing** | Data klien, tender dari prospek sampai menang/kalah, analitik tender |
| **Proyek** | Kontrak, termin, RAB, seksi tarik & progres. Halaman proyek merangkum biaya, tim, alat, material, K3, dan dokumen |
| **Laporan Harian** | Progres harian, foto lapangan, kendala, dan cuaca, langsung dari HP |
| **Alat & Mobilisasi** | Daftar alat, lokasi dan kondisinya, serta Surat Jalan kirim/terima |
| **Material & Stok** | Stok per lokasi, penerimaan, pemakaian, stok opname, material titipan klien, dan peringatan stok minimum |
| **K3 (Insiden)** | Lapor insiden, investigasi, tindakan perbaikan, LTIFR, dan hari tanpa kecelakaan |
| **Keuangan** | Invoice & piutang (umur piutang), tagihan supplier & utang, pengeluaran, kas lapangan, dan Laporan Laba/Rugi per proyek |
| **SDM** | Karyawan, sertifikasi (peringatan kedaluwarsa), pelatihan, penugasan, absensi, dan kasbon |
| **Payroll** | Hitung gaji, persetujuan Direktur, pembayaran, slip gaji, dan biaya gaji otomatis masuk ke proyek |
| **Fitur umum** | Lampiran foto/dokumen, ekspor Excel, cetak PDF, impor data awal dari Excel, dan log audit |

## Peran pengguna

Akun dibuat oleh Super Admin lewat undangan email; tidak ada pendaftaran mandiri. Satu akun memiliki satu peran.

| Peran | Untuk siapa | Yang dikerjakan |
|---|---|---|
| **Super Admin** | Admin IT / pemilik | Mengelola pengguna, peran, master data, profil perusahaan, dan parameter sistem |
| **Direktur** | Direktur / pemilik | Melihat seluruh data dan dashboard, serta menyetujui payroll |
| **Marketing** | Staf marketing | Klien, tender, dan analitik tender |
| **Finance** | Staf keuangan | Invoice, piutang, tagihan supplier, utang, pengeluaran, verifikasi kas lapangan, dan pembayaran gaji |
| **HCM** | Staf SDM | Karyawan, sertifikasi, pelatihan, penugasan, absensi, kasbon, dan penyusunan payroll |
| **Operasional** | Manajer operasional / proyek di kantor | Progres, RAB, laporan harian, alat, material, dan K3 untuk semua proyek |
| **Lapangan** | Site manager / pengawas di lokasi | Absensi kru, laporan harian, kas lapangan, terima alat/material, pakai material, dan lapor insiden. **Hanya untuk proyek tempat ia ditugaskan** |

Data gaji hanya bisa dilihat oleh Finance, HCM, dan Direktur. Super Admin pun tidak bisa melihatnya.

---

## Cara menjalankan di komputer sendiri

Cukup satu perintah. Semua yang dibutuhkan, yaitu aplikasi, database, login, penyimpanan file, dan kotak email uji, ikut berjalan di Docker. Database langsung terisi data contoh.

### 1. Siapkan

- Pasang **Docker Desktop** dari <https://www.docker.com/products/docker-desktop/>, lalu buka dan tunggu sampai statusnya *running*.
- Sediakan sekitar **4 GB** ruang disk kosong dan koneksi internet untuk unduhan pertama.

### 2. Unduh proyek

Unduh folder proyek ini, misalnya dari GitHub: **Code → Download ZIP**, lalu ekstrak. Bisa juga dengan `git clone`.

### 3. Buka terminal di folder proyek

- **Mac:** klik kanan folder proyek → *New Terminal at Folder*.
- **Windows:** buka folder proyek, ketik `powershell` di kolom alamat File Explorer, lalu tekan Enter.

### 4. Jalankan

```bash
docker compose up -d --build
```

Pertama kali, proses ini butuh **5–15 menit** (mengunduh dan menyiapkan semuanya). Berikutnya hanya beberapa detik.

### 5. Buka aplikasi

Buka **<http://localhost:3000>** di browser. Jika halaman belum muncul, tunggu satu menit lalu muat ulang.

### Akun demo

Semua akun demo memakai kata sandi **`XoeaMqu92fwT`**.

| Peran | Email |
|---|---|
| Super Admin | `superadmin@aj224.test` |
| Direktur | `direktur@aj224.test` |
| Marketing | `marketing@aj224.test` |
| Finance | `finance@aj224.test` |
| HCM | `hcm@aj224.test` |
| Operasional | `operasional@aj224.test` |
| Lapangan | `lapangan@aj224.test` (paling nyaman dibuka di HP / jendela sempit) |

### Alamat penting

| Alamat | Isinya |
|---|---|
| <http://localhost:3000> | Aplikasi AJ224 ERP |
| <http://localhost:54324> | Kotak email uji. Semua email dari aplikasi (undangan pengguna, atur ulang kata sandi) masuk ke sini, tidak ada yang terkirim ke internet |

---

## Perintah sehari-hari

Jalankan di terminal, di dalam folder proyek.

| Tujuan | Perintah |
|---|---|
| Menghentikan aplikasi (data tetap tersimpan) | `docker compose stop` |
| Menyalakan lagi | `docker compose up -d` |
| Memperbarui setelah kode proyek berubah | `docker compose up -d --build` |
| Melihat status (semua harus *running* / *healthy*) | `docker compose ps` |
| Melihat log aplikasi bila ada masalah | `docker compose logs app` |
| **Menghapus semua data** dan mulai dari data contoh lagi | `docker compose down -v`, lalu `docker compose up -d` |

## Jika ada masalah

- **"Cannot connect to the Docker daemon"**: Docker Desktop belum menyala. Buka dulu, tunggu sampai *running*, lalu ulangi perintahnya.
- **"port is already allocated"**: port 3000, 54321, atau 54324 sedang dipakai aplikasi lain. Buat file bernama `.env` di folder proyek, isi dengan port lain, misalnya:

  ```
  APP_PORT=3001
  API_PORT=54331
  MAIL_PORT=54334
  ```

  Jalankan lagi `docker compose up -d --build`, lalu buka <http://localhost:3001>.
- **Halaman tidak terbuka**: jalankan `docker compose ps`. Tunggu sampai `app` berstatus *healthy*.
- **Ingin mulai dari awal**: `docker compose down -v`, lalu `docker compose up -d`.

## Catatan keamanan

Paket Docker ini hanya untuk **mencoba aplikasi di satu komputer**. Kunci dan kata sandinya adalah nilai demo yang sudah umum diketahui, dan aplikasi hanya bisa dibuka dari komputer itu sendiri (`localhost`). Jangan memakai paket ini untuk server atau data asli perusahaan.

---

## Untuk developer

- Teknologi: Next.js 16 (App Router), Supabase (Postgres, Auth, Storage, RLS), shadcn/ui, dan Tailwind CSS 4.
- Pengembangan harian memakai Supabase CLI: `pnpm db:start`, `pnpm db:reset`, dan `pnpm dev`. Kunci lokalnya ada di `.env.local` (lihat `.env.example`).
- Struktur database dan aturan akses ada di `supabase/migrations`, data contoh di `supabase/seed.sql`. Kebutuhan produk ada di `PRD.md`, spesifikasi per modul di `openspec/specs`.
- Paket Docker: `docker-compose.yml`, `Dockerfile`, dan folder `docker/` (gateway API, pengaturan awal database, dan skrip migrasi + seed yang hanya menerapkan migrasi baru setiap kali dinyalakan).
