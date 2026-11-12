# AMK Operational & Reverse Analytic Web App
### Bisnis Minuman Multi-Outlet "Air Mata Kucing (AMK)" & "AMKopi"

Aplikasi web full-stack modern berbasis **Laravel 13**, **MySQL**, **React (Vite)**, **Tailwind CSS**, **lucide-react**, dan **SheetJS (xlsx)**. Dirancang dengan pendekatan **Mobile-First** untuk SPG di lapangan dan **Desktop-Optimized** untuk Superadmin.

---

## Fitur Utama

### 1. Sistem Login & Role Access
- **Role SPG**:
  - Dashboard input cepat dengan 3 modul utama.
  - Indikator status input hari ini (`Sudah Input` / `Belum Input`) per stand dan tanggal.
  - Form ramah sentuhan jari dengan kontras tinggi.
- **Role Superadmin**:
  - Executive Dashboard dengan metrik omset, QRIS, tunai, biaya, dan sisa setoran.
  - **Generator Teks WhatsApp (1-Click Copy)** berformat 100% identik dengan pelaporan pribadi (Blok 1, Blok 2, Blok 3 + Rekap Total).
  - Modul **Reverse Analytic (`RESEPAMK`)** dengan audit bahan teoritis vs aktual.
  - Persetujuan (Approval) **Stock Opname**.
  - Manajemen Master Data dinamis via UI & via template Excel (`xlsx`).

### 2. Mekanisme Anti-Hilang (`LocalStorage` Auto-Save Persistence)
- Menyimpan state input secara real-time ke penyimpanan lokal perangkat spesifik per `(Menu, Stand, Tanggal)`.
- Jika halaman ter-refresh, browser tertutup, atau koneksi terputus, data otomatis dipulihkan dengan banner notifikasi: *"Draft input terakhir berhasil dipulihkan"*.
- Draft hanya terhapus jika proses `SUBMIT` berhasil 100% atau pengguna menekan tombol `CLEAR DATA` dengan dialog konfirmasi.

### 3. Tiga Modul Input SPG (Urutan Wajib: 1 → 2 → 3)
1. **Menu 1: Laporan Harian**
   - Pemilihan Stand, Tanggal, dan 1–5 SPG bertugas.
   - Input nominal rupiah otomatis (`Rp 1.000.000`) + opsi `+ Tambah Penjualan`.
   - Box `[AUTOSUM] Total Semua Penjualan`.
   - **Validasi Pengunci**: `Nominal QRIS + Nominal Tunai == Total Semua Penjualan` (tombol submit terkunci jika tidak balance).
   - Biaya harian stand & `[AUTO-SUBTRACT] Sisa Setoran Tunai`.
   - Upload screenshot settlement QRIS dengan kompresi client-side.
   - Input kuantitas cup bulat (Cup 12oz, 22oz, 16oz, Kurma, AMKopi, PTT, Air Mineral).
2. **Menu 2: Form Penjualan Detail**
   - **Gatekeeper Merah**: Mewajibkan Menu 1 diisi terlebih dahulu.
   - Accordion per kelompok (`AMK 27 Menu`, `Jumbo`, `Air Mineral`, `AMKOPI`, `PTT`) dengan harga otomatis per stand.
   - Opsi `+ Tambah Unregistered` (maksimal 3 baris tanpa pengali QTY).
   - **Validasi Pengunci**: `Grand Total Menu 2 == Total Penjualan Menu 1`.
3. **Menu 3: Form Bahan Baku Harian & Stock Opname**
   - Gatekeeper Menu 1.
   - Rumus otomatis: `Stok Akhir = Stok Awal + Masuk - Terpakai - Rusak`.
   - Badge referensi `[Data Menu 1: XX]` untuk bahan yang terhubung dengan Menu 1.
   - Mode pengajuan **Stock Opname** fisik ke Superadmin.

### 4. Mesin Reverse Analytic Check (`RESEPAMK`)
- **Lapis 1**: Parameter saji per cup `VOL_REG` (default 185ml, opsi 190ml / 170ml) dengan **Effective Date Versioning**.
- **Lapis 2**: Rasio komposisi adonan setengah jadi (Tea Pekat, Adonan AMK Dingin, AMK Tea, Premix Peach, Mocca, Kiwi).
- **Lapis 3**: Kalkulasi koefisien bahan mentah per 1 ml adonan.
- **Tabel 1**: Kebutuhan Batch Dapur (ml).
- **Tabel 2**: Komparasi Audit Menu 2 vs Menu 3 dengan indikator Hijau (&le;5%), Kuning (5–10%), dan Merah (&gt;10%).

### 5. Arsitektur Master Data Dinamis & Excel SheetJS
Download Template, Upload / Import, dan Edit UI untuk 4 Template:
1. `Master_Stand_dan_SPG.xlsx` (19 Stand default, Blok 1, 2, 3)
2. `Master_Konfigurasi_Menu1.xlsx` (Kategori nominal & QTY)
3. `Master_Menu_dan_Harga_Stand_Menu2.xlsx` (Matriks harga per stand)
4. `Master_Bahan_Baku_dan_Resep_AMK.xlsx` (4 sheet resep terintegrasi)

---

## Cara Menjalankan Aplikasi di Lokal

### 1. Prasyarat
- PHP 8.2+
- Composer
- MySQL
- Node.js & npm

### 2. Setup Database & Migrasi
```bash
# Pastikan service MySQL berjalan
brew services start mysql

# Migrasi dan seeding seluruh data default
php artisan migrate:fresh --seed
```

### 3. Build & Jalankan Aplikasi
```bash
# Install dependensi frontend & build assets
npm install
npm run build

# Jalankan server Laravel
php artisan serve
```

Buka di browser: `http://localhost:8000`

### 4. Akun Demo Cepat
- **Superadmin**: username `admin` | password / PIN `admin123`
- **SPG 1**: username `spg1` | PIN `1234`
- **SPG 2 s/d 15**: username `spg2` s/d `spg15` | PIN `1234`

---

## Otomasi GitHub Issues & Push

Untuk membuat 8 GitHub Issues secara otomatis setelah melakukan autentikasi di terminal:

```bash
# Login ke GitHub CLI (jika belum login)
gh auth login

# Jalankan skrip pembuat issue
./scripts/create_github_issues.sh

# Push kode ke repositori
git push -u origin main
```
