#!/usr/bin/env bash
set -e

REPO="arielaugusstt/amkoperational"

echo "=== AMK Operational: GitHub Issues Automation ==="
echo "Target Repository: $REPO"

# Check if gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "Peringatan: GitHub CLI (gh) belum login. Silakan jalankan 'gh auth login' terlebih dahulu."
    exit 1
fi

echo "Membuat 8 GitHub Issues / Milestones..."

gh issue create --repo "$REPO" \
  --title "[Epic 1] Project Setup, Laravel 13, MySQL Schema & Pre-loaded Master Seeder" \
  --label "setup,database" \
  --body "Inisialisasi Laravel 13, konfigurasi MySQL, pembuatan seluruh migrasi tabel dinamis (Master, Transaksi, Resep 3 Lapis), dan seeder data awal (19 Stand, SPG, Konfigurasi Menu 1, 27+ Menu AMK/Jumbo/AMKopi/PTT, 20 Bahan Baku & Resep 3 Lapis)."

gh issue create --repo "$REPO" \
  --title "[Epic 2] Sistem Autentikasi & Role Access (SPG Mobile-First vs Superadmin Desktop)" \
  --label "auth,ui-ux" \
  --body "Login multi-role (Username & PIN/Password), proteksi role, Dashboard SPG (Mobile-First dengan indikator status 'Sudah Input' / 'Belum Input' per Stand & Tanggal), serta Layout Navigasi Superadmin."

gh issue create --repo "$REPO" \
  --title "[Epic 3] Engine LocalStorage Auto-Save Persistence & Client-Side Utilities" \
  --label "frontend,core" \
  --body "Hook useLocalStoragePersistence spesifik per (Menu, Stand, Tanggal), banner notifikasi 'Draft input terakhir berhasil dipulihkan', tombol CLEAR DATA dengan dialog konfirmasi, auto-format Rupiah (Rp 1.000.000), dan kompresi gambar bukti QRIS."

gh issue create --repo "$REPO" \
  --title "[Epic 4] Modul Input SPG 1: Laporan Harian (Menu 1)" \
  --label "spg-module,menu-1" \
  --body "Input Stand, Tanggal, 1–5 SPG bertugas, Nominal Penjualan dinamis + Tambah Penjualan, Autosum Total Penjualan, Validasi Pengunci 'QRIS + Tunai == Total Penjualan', Biaya Harian + Sisa Setoran Tunai, Upload Bukti QRIS, dan Input QTY Item."

gh issue create --repo "$REPO" \
  --title "[Epic 5] Modul Input SPG 2: Form Penjualan Detail per Item (Menu 2)" \
  --label "spg-module,menu-2" \
  --body "Gatekeeper pengecekan Menu 1, tampilan Accordion per kelompok menu (AMK 27 Menu, Jumbo, Air Mineral, AMKOPI, PTT), harga otomatis sesuai matriks Stand, opsi Tambah Unregistered (maks 3 baris tanpa pengali QTY), dan validasi kunci 'Grand Total Menu 2 == Total Penjualan Menu 1'."

gh issue create --repo "$REPO" \
  --title "[Epic 6] Modul Input SPG 3: Form Bahan Baku Harian & Stock Opname (Menu 3)" \
  --label "spg-module,menu-3" \
  --body "Gatekeeper Menu 1, kalkulasi otomatis Stok Akhir = Stok Awal + Masuk - Terpakai - Rusak, badge referensi [Data Menu 1: XX] untuk item ber-link (Cup 12oz, 16oz, 22oz, Kurma, AMKopi, Air Mineral), serta fitur pengajuan Stock Opname (Pending Approval Superadmin)."

gh issue create --repo "$REPO" \
  --title "[Epic 7] Mesin Reverse Analytic Check (RESEPAMK 3-Layer Formula) & Versioning" \
  --label "analytics,superadmin" \
  --body "Kalkulasi konversi penjualan Menu 2 ke pemakaian bahan teoritis melalui 3 lapis rumus (VOL_REG 185ml/190ml/170ml dengan Effective Date Versioning, Batch Dapur Tea Pekat/AMK Dingin/AMK Tea/Premix, Koefisien Bahan Mentah), status resep Active/Unmapped, serta Tabel Komparasi Audit Menu 2 vs Menu 3 (Hijau <=5%, Kuning 5-10%, Merah >10%)."

gh issue create --repo "$REPO" \
  --title "[Epic 8] Dashboard Superadmin, Generator WA Pribadi, Master Data Excel (SheetJS) & Webhook" \
  --label "superadmin,excel" \
  --body "Generator Teks WA 1-Click Copy (Blok 1, Blok 2, Blok 3 + Rekap Total AMK/Kurma/AMKopi), halaman Master Data Dinamis (UI Tabel + Download/Upload 4 Template .xlsx via SheetJS), Export Laporan Multi-Sheet .xlsx, Approval Stock Opname, Edit/Revisi Laporan SPG, dan Google Sheets Webhook."

echo "Semua issue berhasil dibuat di GitHub!"

