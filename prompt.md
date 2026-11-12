buat planning issue dan clone push pada github : https://github.com/arielaugusstt/amkoperational.git

1. Buat aplikasi berbasis web menggunakan laravel terbaru
2. database menggunakan mySQL
3. Design ui buat agar maksimal saat diakses menggunakan mobile (akses paling banyak akan menggunakan mobila dan hanya admin yang akan menggunakan PC)
4. # MASTER SPECIFICATION: WEB APP OPERASIONAL, INVENTORI & REVERSE ANALYTIC "AIR MATA KUCING (AMK)"

Buatkan aplikasi web Full-Stack yang responsif (Mobile-First untuk SPG di lapangan, Desktop-Optimized untuk Superadmin) untuk manajemen input penjualan harian, rincian penjualan per varian item, stok bahan baku harian, serta audit otomatis berbasis rumus konversi resep ("Reverse Analytic") untuk bisnis minuman multi-outlet **Air Mata Kucing (AMK)** & **AMKopi**.

## TECH STACK & CORE REQUIREMENTS
1. **Framework & UI**: Laravel terbaru + Tailwind CSS + `lucide-react` untuk ikon. Desain bersih, kontras tinggi, tombol ramah sentuhan jari di layar HP.
2. **Excel Engine**: Gunakan library `xlsx` (SheetJS) untuk seluruh fitur Download Template Excel (.xlsx), Upload/Import Master Data Excel (.xlsx), dan Export Laporan Komprehensif Multi-Sheet (.xlsx).
3. **Mekanisme Anti-Hilang (`LocalStorage` Auto-Save Persistence)**:
   * WAJIB diterapkan di seluruh form input SPG (Menu 1, Menu 2, Menu 3).
   * Setiap kali pengguna memilih dropdown atau mengetik angka/teks, simpan state form secara real-time ke `localStorage` perangkat (spesifik per Menu, Stand, dan Tanggal).
   * Jika halaman tidak sengaja ter-refresh, tab tertutup, atau koneksi terputus, seluruh data yang sudah diketik otomatis dipulihkan (Auto-Restore) saat halaman dibuka kembali dengan banner notifikasi: *"Draft input terakhir berhasil dipulihkan"*.
   * Draft di `localStorage` hanya dihapus jika proses `SUBMIT` berhasil 100% atau pengguna menekan tombol `CLEAR DATA` (melalui dialog konfirmasi).

---

## 1. SISTEM LOGIN & ROLE ACCESS
Hanya terdapat **2 Role Pengguna**:
1. **SPG**:
   * Hanya dapat mengakses Dashboard Input SPG yang berisi 3 tombol modul utama:
     1. **`Laporan Harian`** (Input rekap penjualan cepat harian)
     2. **`Form Penjualan`** (Penjualan harian detail per item)
     3. **`Form Bahan Baku`** (Bahan baku harian detail)
   * Menampilkan indikator status input hari ini untuk stand yang dipilih (`Sudah Input` / `Belum Input` untuk masing-masing dari 3 menu).
2. **Superadmin**:
   * Akses penuh ke Dashboard Komprehensif, Generator Teks Laporan WhatsApp, Export Master Excel (.xlsx) & Integrasi Google Sheets Webhook, Modul **Reverse Analytic Check (`RESEPAMK`)**, Persetujuan (Approval) Stock Opname, Edit/Revisi Data Laporan SPG, serta Manajemen Master Data Dinamis (via UI & via Import/Export Template Excel).

---

## 2. ARSITEKTUR MASTER DATA DINAMIS (IMPORT & EXPORT EXCEL DI SUPERADMIN)
Semua daftar Stand, SPG, item di Menu 1, kelompok & harga item per stand di Menu 2, daftar bahan baku di Menu 3, hingga parameter resep bersifat **DINAMIS** (dapat ditambah, diubah, atau dinonaktifkan oleh Superadmin kapan saja, misal ke depan ada tambahan `Cup 28 oz`, varian `Greentea`, atau resep `AMKopi`).

Sediakan halaman **"Master Data & Template Excel"** di Superadmin dengan fitur **Download Template (.xlsx)**, **Upload/Import (.xlsx)**, dan **Edit via Tabel UI** untuk 4 Master Template berikut:

### A. Template 1: `Master_Stand_dan_SPG.xlsx`
* **Sheet 1 (`Master_Stand`)**:
  `Kode_Stand` | `Nama_Stand` | `Wilayah_Laporan` (Utara / Selatan / Barat) | `Blok_WA` (Blok 1 / Blok 2 / Blok 3) | `Urutan_Tampil` | `Punya_AMKopi` (Ya/Tidak) | `Tampilkan_Csdng_WA` (Ya/Tidak) | `Tampilkan_PTT_WA` (Ya/Tidak) | `Status_Aktif`.
  * *Data Awal (Pre-loaded Default 19 Stand)*:
    * **Blok 1 (Utara/Pusat - 12 Stand)**: `WTC` (Csdng: Ya), `Delta`, `PA 1`, `ITC UG`, `BG-L2`, `ITC FC 2`, `KAZA` (Csdng: Ya), `TP 1`, `TP 2` (Csdng: Ya), `TP 3`, `BG LL`, `GC`.
    * **Blok 2 (Selatan - 6 Stand)**: `R-1` (PTT: Ya), `R-2`, `SUNCITY`, `LIPPO`, `TRANS` (Csdng: Ya), `R-4`.
    * **Blok 3 (Barat - 1 Stand + 10 Stand AMKopi)**: `PTC`. Sedangkan 10 Stand yang memiliki `Punya_AMKopi = Ya` adalah: `R-1`, `R-2`, `R-4`, `TP 1`, `TP 2`, `TP 3`, `GC`, `Delta`, `BG LL`, `BG-L2`.
* **Sheet 2 (`Master_SPG`)**:
  `ID_SPG` | `Nama_SPG` | `Username` | `PIN_Password` | `Status_Aktif`.

### B. Template 2: `Master_Konfigurasi_Menu1.xlsx`
Mengatur field input pada Menu 1 agar Superadmin bisa menambah kategori nominal atau item QTY baru di masa depan:
* **Sheet 1 (`Kategori_Nominal_Menu1`)**: `Kode_Kategori` | `Label_Input_Nominal` | `Urutan` | `Status_Aktif`.
  * *Pre-loaded Default*:
    1. `NOM_AMK` : Nominal Total Penjualan AMK *(AMK Murni, tidak dikurangi Kurma)*
    2. `NOM_KURMA` : Nominal Total Penjualan Kurma *(Kategori Mandiri)*
    3. `NOM_AMKOPI` : Nominal Total Penjualan AMKopi *(Kategori Mandiri)*
    4. `NOM_PTT` : Nominal Total Penjualan PTT
    5. `NOM_MINERAL` : Nominal Total Penjualan Air Mineral
* **Sheet 2 (`Item_QTY_Menu1`)**: `Kode_QTY_Menu1` | `Label_Input_QTY` | `Urutan` | `Status_Aktif`.
  * *Pre-loaded Default*:
    1. `QTY_CUP_12` : Cup 12 oz AMK
    2. `QTY_CUP_22` : Cup 22 oz AMK
    3. `QTY_CUP_16` : Cup 16 oz AMK
    4. `QTY_CUP_KURMA` : Cup Kurma
    5. `QTY_CUP_KOPI` : Cup AMKopi
    6. `QTY_PTT` : Jumlah PTT
    7. `QTY_MINERAL` : Jumlah Air Mineral

### C. Template 3: `Master_Menu_dan_Harga_Stand_Menu2.xlsx`
Mengatur daftar item untuk Menu 2 beserta matriks harga per Stand (karena satu stand dengan stand lain bisa berbeda harga):
* **Struktur Kolom Matriks**:
  `Kelompok_Menu` | `Kode_Item` | `Nama_Item` | `Status_Aktif` | `Harga_Default` | `WTC` | `Delta` | `PA 1` | `ITC UG` | `BG-L2` | `ITC FC 2` | `KAZA` | `TP 1` | `TP 2` | `TP 3` | `BG LL` | `GC` | `R-1` | `R-2` | `SUNCITY` | `LIPPO` | `TRANS` | `R-4` | `PTC` *(kolom stand otomatis mengikuti Master Stand)*.
* *Pre-loaded Kelompok Menu*:
  1. `AMK 27 Menu` (Berisi 27 varian menu AMK seperti AMK Ori, AMK Lengkeng, AMK Cream, AMK Tea, Peach, Mocca, Kiwi, varian 2-in-1, Oreo, dll.)
  2. `Jumbo`
  3. `Air Mineral`
  4. `AMKOPI`
  5. `PTT`
  *(Kelompok maupun item baru yang ditambahkan di Excel otomatis muncul di Menu 2).*

### D. Template 4: `Master_Bahan_Baku_dan_Resep_AMK.xlsx`
Berisi 4 Sheet terintegrasi untuk mengatur Menu 3 dan mesin Reverse Analytic (`RESEPAMK`):
* **Sheet 1 (`Master_Bahan_Menu3`)**:
  `Kode_Bahan` | `Kategori_Bahan` | `Nama_Bahan_Baku` | `Satuan` | `Link_Kode_QTY_Menu1` *(Diisi kode seperti `QTY_CUP_12`, `QTY_CUP_16`, `QTY_CUP_22`, `QTY_CUP_KURMA`, `QTY_CUP_KOPI`, `QTY_MINERAL`, atau dikosongkan untuk PTT & bahan lainnya)* | `Stok_Awal_WTC` | `Stok_Awal_Delta` | *(dst per Stand)*.
  * *Wajib Pre-loaded*: Kemasan Cup (`Cup 12oz`, `Cup 16oz`, `Cup 22oz`, `Cup Kurma`, `Cup AMKopi`), `Air Mineral`, `PTT`, serta **13 Bahan Baku Utama RESEPAMK** (`Syrup AMK`, `Tea Bag`, `Gula Pasir`, `Sirup Premix Peach`, `Sirup Premix Mocca`, `Sirup Premix Kiwi`, `Creamer`, `Coffee`, `Perasa Orange`, `Perasa Lime`, `Perasa Guava`, `Oreo`, `Lengkeng`).
* **Sheet 2 (`Parameter_Global_Resep`)**: Parameter takaran yang dapat diubah dengan Tanggal Efektif Berlaku (`Effective_Date`).
* **Sheet 3 (`Rumus_Batch_Dapur`)**: Rasio komposisi adonan dasar.
* **Sheet 4 (`Mapping_Resep_Menu2`)**: Komposisi bahan per item Menu 2.

---

## 3. SPESIFIKASI DETAIL 3 MODUL INPUT SPG

Dalam alur kerja operasional: **Menu 1, Menu 2, dan Menu 3 saling berkaitan. Menu 1 WAJIB diinput terlebih dahulu, kemudian Menu 2 dan Menu 3 diinput selanjutnya.**

---

### MODUL 1: `Laporan Harian` (Input Rekap Penjualan Cepat Harian)
Semua input uang menggunakan pemformatan **Currency Rupiah otomatis (`Rp 1.000.000`)** saat diketik.

**Urutan Input Form Menu 1:**
1. **Stand**: Menu Dropdown (memilih dari Master Stand).
2. **Tanggal**: Datepicker (default: Tanggal Hari Ini).
3. **SPG yang Bertugas (1 s/d 5 Orang)**: Menu Dropdown memilih dari Master SPG. Sediakan SPG 1 (Wajib) dan tombol/opsi memilih hingga 4–5 orang SPG yang bertugas di stand tersebut.
4. **Input Nominal Laporan Penjualan (Angka Currency Rupiah):**
   * **a. Nominal Total Penjualan AMK** `(Rp)` — *Merupakan penjualan AMK Murni, jangan dikurangi Kurma*
   * **b. Nominal Total Penjualan Kurma** `(Rp)` — *Penjualan mandiri*
   * **c. Nominal Total Penjualan AMKopi** `(Rp)` — *Penjualan mandiri*
   * **d. Nominal Total Penjualan PTT** `(Rp)`
   * **e. Nominal Total Penjualan Air Mineral** `(Rp)`
   * *(Render otomatis kategori tambahan jika ada penambahan di Master Data).*
   * **Tombol `+ Tambah Penjualan`**: Ketika diklik, memunculkan baris baru untuk menambah nominal penjualan item lain yang berisi: `Input Keterangan (Textbox)` + `Input Nominal (Angka Currency Rupiah)` + tombol hapus baris.
   * **Box `[AUTOSUM] Total Semua Penjualan`**: Menjumlahkan otomatis seluruh nominal penjualan di atas (`Read-Only`).
5. **Pembagian Metode Pembayaran:**
   * **e. Nominal QRIS** `(Angka Currency Rupiah)`
   * **f. Nominal Tunai** `(Angka Currency Rupiah)`
   * **Validasi Pengunci (Wajib Sama):** Jumlah `Nominal QRIS + Nominal Tunai` **HARUS SAMA PERSIS** dengan `Autosum Total Semua Penjualan`. Jika belum sama, tampilkan peringatan merah `"Selisih Rp XXX dengan Total Penjualan! Nominal QRIS + Tunai harus sama dengan Total Penjualan"` dan kunci tombol `SUBMIT`. Jika sudah sama, tampilkan indikator hijau `"Nominal Sesuai (Balance)"`.
6. **Biaya Harian Stand (Diambil dari Uang Tunai):**
   * **g. Biaya 1**: `Keterangan Biaya 1 (Textbox)` + `Nominal Biaya 1 (Angka Currency Rupiah)`
   * **h. Biaya 2**: `Keterangan Biaya 2 (Textbox)` + `Nominal Biaya 2 (Angka Currency Rupiah)`
   * *(Sediakan juga tombol tambah baris biaya jika ada biaya tambahan).*
   * **Box `[AUTOSUM] Total Biaya-Biaya`**: Menjumlahkan seluruh nominal biaya secara otomatis.
   * **Box `[AUTO-SUBTRACT] Sisa Setoran Tunai`**: Menghitung otomatis pengurangan dari `"Uang Tunai" - "Biaya-Biaya"`.
7. **Upload Bukti QRIS:**
   * **Tombol Upload Screenshot Settlement QRIS**: Mendukung ambil foto/galeri dengan *client-side image compression* dan preview gambar.
8. **Laporan Input QTY Item (Angka Bulat):**
   * **1. Cup 12 oz AMK** *(Input Angka)*
   * **2. Cup 22 oz AMK** *(Input Angka)*
   * **3. Cup 16 oz AMK** *(Input Angka)*
   * **4. Cup Kurma** *(Input Angka)*
   * **5. Cup AMKopi** *(Input Angka)*
   * **6. Jumlah PTT** *(Input Angka)*
   * **7. Jumlah Air Mineral** *(Input Angka)*
   * *(Render otomatis item QTY tambahan jika ditambahkan oleh Superadmin).*
9. **Tombol Aksi Bawah:**
   * **`SUBMIT`** — Menyimpan dan mengupload seluruh data yang telah diinput.
   * **`CLEAR DATA`** — Mengosongkan semua form input (dengan konfirmasi).
   * **`KEMBALI`** — Kembali ke menu utama.

---

### MODUL 2: `Form Penjualan` (Penjualan Harian Detail)
Menginput kuantitas (QTY) terjual item per item dengan harga yang otomatis mengikuti definisi harga pada Stand yang dipilih.

**Urutan Input & Logika Menu 2:**
1. **Input Tanggal (Datepicker)** & **Input Stand (Dropdown)**:
   * Otomatis mengambil Tanggal dan Stand dari sesi/data **Menu 1** yang aktif.
   * **Validasi Gatekeeper (Peringatan Merah):** Sistem mengecek apakah data **Menu 1 (`Laporan Harian`)** untuk Tanggal dan Stand tersebut sudah diinput. Jika **BELUM ADA**, tampilkan **Kotak Peringatan Warna Merah**: *"Data Laporan Harian (Menu 1) untuk Stand dan Tanggal ini belum tersedia! Harap segera input di Menu 1 terlebih dahulu."* dan kunci seluruh input di bawahnya.
   * Jika **SUDAH ADA**, tampilkan panel informasi berisi `Target Total Penjualan dari Menu 1 (Rp)` sebagai acuan.
2. **Input Per Kelompok Item (Harga Otomatis Sesuai Stand):**
   Bagi daftar item ke dalam kelompok (gunakan tampilan *Collapsible / Accordion* yang rapi):
   * **Kelompok 1: `"AMK 27 Menu"`**
   * **Kelompok 2: `"Jumbo"`**
   * **Kelompok 3: `"Air Mineral"`**
   * **Kelompok 4: `"AMKOPI"`**
   * **Kelompok 5: `"PTT"`**
   * *(Serta kelompok pengembangan lainnya dari Master Data).*
   * **Format Baris Item**: Pengguna menginput `QTY` masing-masing item, lalu sistem otomatis mengalikan dengan harga stand tersebut.
     * *Contoh tampilan*: `AMK Ori : [Input: 20] pcs | Harga: Rp 10.000 -> Otomatis muncul: 20 x 10.000 = Rp 200.000`.
   * Di akhir setiap kelompok, tampilkan **Autosum Subtotal per Kelompok (Total QTY & Total Rp)**.
3. **Opsi Input `"Unregistered"` (Maksimal 3 Tipe):**
   * Sediakan tombol **`+ Tambah Unregistered`** untuk mencatat item yang terlewat tercatat (maksimal 3 baris/tipe).
   * Setiap baris memiliki input: `Keterangan (opsional)`, `Input QTY (Angka)`, dan `Input Nominal (Angka Currency Rupiah)`.
   * **ATURAN KHUSUS:** Nominal uang pada *Unregistered* diinput secara **manual langsung total rupiahnya TANPA pengali dengan QTY**.
4. **Grand Total & Validasi Akhir Menu 2:**
   * Tampilkan **`GRAND TOTAL MENU 2 (Rp)`** di bagian akhir (`Autosum seluruh kelompok + seluruh nominal Unregistered`).
   * **Aturan Validasi Submit:** Tidak perlu ada validasi QTY ke Menu 1; cukup validasi **Nominal Uang**. `Grand Total Nominal Uang Menu 2` **HARUS SAMA PERSIS** dengan `Total Semua Penjualan di Menu 1` agar tombol `SUBMIT` bisa ditekan. Jika berbeda, tampilkan nominal selisihnya dengan warna merah.
   * Tombol Aksi: **`SUBMIT`**, **`CLEAR DATA`**, **`KEMBALI`**.

---

### MODUL 3: `Form Bahan Baku` (Bahan Baku Harian Detail)
Mengelola pergerakan stok bahan baku harian di stand dengan pola:
**`Stok Awal` $\rightarrow$ `Barang Masuk` $\rightarrow$ `Barang Terpakai` $\rightarrow$ `Barang Rusak` $\rightarrow$ `Stok Akhir`**.

**Urutan Input & Logika Menu 3:**
1. **Input Tanggal (Datepicker)** & **Input Stand (Dropdown)**:
   * Otomatis mengambil data dari Menu 1. Jika data Menu 1 pada Tanggal & Stand tersebut belum diinput, tampilkan **Peringatan Warna Merah** untuk segera input di Menu 1 terlebih dahulu dan kunci form.
2. **Tabel / Daftar Input Bahan Baku (Menggunakan Opsi A):**
   Untuk setiap bahan baku pada Master Bahan Baku, tampilkan:
   * **1. Nama Bahan Baku & Satuan**
   * **2. Stok Awal (`Read-Only`)**: Ditentukan di awal dari Master Data, lalu untuk hari-hari berikutnya otomatis menarik angka **`Stok Akhir`** dari hari sebelumnya pada stand tersebut (atau dari hasil **Stock Opname** terakhir yang sudah divalidasi Superadmin).
   * **3. Barang Masuk (`Input Angka Manual`)**: Jumlah drop-an barang masuk hari ini (default `0`).
   * **4. Barang Terpakai (`Input Angka Manual` + Teks Referensi Menu 1)**:
     * Seluruh item bahan baku (termasuk `PTT` dan bahan baku lainnya) diinput secara **manual** oleh SPG.
     * **ATURAN KHUSUS ITEM TERKAIT MENU 1:** Untuk bagian stok bahan baku yang diambil dari Laporan Harian Menu 1 yaitu **`Cup 12oz`**, **`Cup 16oz`**, **`Cup 22oz`**, **`Cup Kurma`**, **`Cup AMKopi`**, dan **`Air Mineral`** (serta item baru ke depan yang memiliki `Link_Kode_QTY_Menu1`), kolom `Barang Terpakai` **tetap diinput manual oleh SPG, NAMUN angka yang diambil dari Menu 1 WAJIB tertulis jelas di samping kotak inputnya** (contoh badge di samping input: `[Data Menu 1: 68]`). `PTT` tidak menampilkan badge referensi (murni manual).
   * **5. Barang Rusak (`Input Angka Manual`)**: Jumlah bahan/cup rusak atau tumpah (default `0`).
   * **6. Stok Akhir (`Auto-Calculate / Read-Only`)**: Dihitung otomatis oleh sistem dengan rumus:
     $$\text{Stok Akhir} = \text{Stok Awal} + \text{Barang Masuk} - \text{Barang Terpakai} - \text{Barang Rusak}$$
3. **Opsi Stock Opname (Dengan Validasi Superadmin):**
   * Sediakan tombol/mode **`Input Stock Opname`** di mana pengguna dapat mengajukan angka stok fisik hasil perhitungan ulang di stand.
   * Data Stock Opname yang disubmit akan berstatus **`Pending Approval Superadmin`**. Begitu divalidasi (`Approve`) oleh Superadmin, angka Stock Opname tersebut otomatis menjadi **`Stok Awal`** kembali untuk stand tersebut.
4. **Tombol Aksi:** **`SUBMIT`**, **`CLEAR DATA`**, **`KEMBALI`**.

---

## 4. MESIN "REVERSE ANALYTIC CHECK" (`RESEPAMK`) — KONVERSI MENU 2 KE MENU 3

Di halaman Superadmin, bangun modul khusus **"Reverse Analytic & Audit Bahan (`RESEPAMK`)"** yang mengonversi penjualan per item di **Menu 2** menjadi **Pemakaian Bahan Baku Teoritis**, lalu membandingkannya secara langsung dengan **Barang Terpakai Aktual** yang diinput SPG di **Menu 3**.

### A. Daftar 13 Bahan Baku Utama Standar `RESEPAMK`
Pastikan ke-13 bahan baku utama ini terpetakan di dalam sistem:
* **6 Bahan Dasar (Hasil Konversi Batch Dapur):**
  1. `Syrup Biang AMK` (ml)
  2. `Tea Bag` (bag / pcs)
  3. `Gula Pasir` (ml / sendok takar)
  4. `Sirup Premix Peach` (ml)
  5. `Sirup Premix Mocca` (ml)
  6. `Sirup Premix Kiwi` (ml)
* **7 Bahan Tambahan Langsung (Direct Mix / Topping):**
  7. `Creamer` (ml — takaran sendok besar `15 ml`, sendok sedang `7.5 ml`)
  8. `Coffee` (ml — takaran standar `15 ml`)
  9. `Perasa Orange` (ml — takaran 2 sendok kecil = `10 ml`)
  10. `Perasa Lime` (ml — takaran 2 sendok kecil = `10 ml`, atau 1 sendok kecil `5 ml` pada varian 2-in-1 Cream Lime)
  11. `Perasa Guava` (ml — takaran 2 sendok kecil = `10 ml`)
  12. `Oreo` (pcs/keping — standar `1 keping` per cup)
  13. `Lengkeng` (porsi/gram)

### B. Rumus Konversi 3 Lapis (`RESEPAMK` 3-Layer Formula)
Sistem menghitung pemakaian bahan dari penjualan Menu 2 melalui 3 lapisan rumus yang **Parametrik (Dinamis)**:

1. **Lapis 1 (Parameter Volume Saji per Cup - Bisa Diubah Kapan Saja):**
   * Gunakan variabel global `VOL_REG` (Default: **`185 ml`**, tersedia opsi cepat ke **`190 ml`**, atau bisa diketik manual oleh Superadmin menjadi **`170 ml`** atau angka lainnya di masa depan).
   * Untuk menu **Single Base** (misal AMK Ori, AMK Tea Polos, Peach, Mocca, Kiwi): Volume cairan adonan per cup = `100% * VOL_REG`.
   * Untuk menu **Blending 2-in-1**:
     * *Peach Mocca Polos*: `120 ml Peach + 180 ml Mocca` (atau proporsi terhadap `VOL_REG`).
     * *Peach Mocca Cream Lime*: `100 ml Peach + 150 ml Mocca` + `1 sdk Creamer` + `1 sdk Lime`.
     * *Kiwi Mocca Polos*: `160 ml Kiwi + 140 ml Mocca` (atau dengan Cream + Lime: `130 ml Kiwi + 120 ml Mocca` + `1 sdk Creamer` + `1 sdk Lime`).
     * *Peach Kiwi Polos*: `120 ml Peach + 180 ml Kiwi` (atau dengan Cream + Lime: `100 ml Peach + 150 ml Kiwi` + `1 sdk Creamer` + `1 sdk Lime`).
     * *(Semua angka ml atau proporsi `%` terhadap `VOL_REG` dapat diatur oleh Superadmin di tabel Resep).*

2. **Lapis 2 (Rumus Batch Dapur / Adonan Setengah Jadi - Dinamis):**
   * **Batch Tea Pekat (`2.200 ml`)**: `12 bag Tea Bag` + `2.200 ml Air Panas`.
   * **Batch Adonan AMK Dingin (`1.750 ml`)**: `250 ml Sirup Biang AMK` + `1.500 ml Air`.
   * **Batch Adonan AMK Tea (`1.250 ml`)**: `600 ml Tea Pekat` + `250 ml Adonan AMK Dingin` + `100 ml Gula Pasir (7 sdt)` + `400 ml Air`.
   * **Batch Adonan Varian Peach / Mocca / Kiwi (`1.400 ml`)**: `200 ml Sirup Premix (Peach/Mocca/Kiwi)` + `500 ml Tea Pekat` + `700 ml Air`.

3. **Lapis 3 (Kalkulasi Otomatis Koefisien Bahan Mentah per `1 ml` Adonan):**
   Sistem otomatis menurunkan rumus koefisien dari angka di Lapis 2:
   * **Setiap `1 ml` Adonan AMK Dingin** = `(250 / 1750)` = **`0.142857 ml` Sirup Biang AMK**.
   * **Setiap `1 ml` Adonan AMK Tea** =
     * `Adonan AMK Dingin`: `(250 / 1250) = 0.20 ml` $\rightarrow$ `0.20 * (250 / 1750)` = **`0.028571 ml` Sirup Biang AMK**.
     * `Gula Pasir`: `(100 / 1250)` = **`0.08 ml` Gula Pasir** (atau `7 / 1250 = 0.0056 sdt`).
     * `Tea Pekat`: `(600 / 1250) = 0.48 ml` $\rightarrow$ `0.48 * (12 / 2200)` = **`0.002618 bag` Tea Bag**.
   * **Setiap `1 ml` Adonan Varian (Peach / Mocca / Kiwi)** =
     * `Sirup Premix`: `(200 / 1400)` = **`0.142857 ml` Sirup Premix (Peach/Mocca/Kiwi)**.
     * `Tea Pekat`: `(500 / 1400) = 0.357143 ml` $\rightarrow$ `(500 / 1400) * (12 / 2200)` = **`0.001948 bag` Tea Bag**.

### C. Mekanisme Perubahan Resep Masa Depan (`185 ml` -> `170 ml`) & Penambahan Resep Baru (`AMKopi` dll)
1. **Sistem Parameter & Tanggal Efektif (`Effective Date Versioning`)**:
   * Ketika Superadmin mengubah parameter `VOL_REG` (misalnya dari `185 ml` menjadi `170 ml`) atau mengubah komposisi batch dapur, Superadmin memilih **`Tanggal Mulai Berlaku (Effective Date)`**.
   * Laporan sebelum tanggal efektif tetap dihitung dengan rumus lama (`185 ml`), sedangkan laporan mulai tanggal efektif dan seterusnya otomatis dihitung dengan rumus baru (`170 ml`).
2. **Akomodasi Menu yang Belum Ada Resepnya (`AMKopi`) & Ekspansi Menu Baru**:
   * Setiap item di Menu 2 memiliki status resep: **`Active (Sudah Ada Resep)`** atau **`Unmapped (Belum Ada Resep)`**.
   * Saat ini, varian **AMKopi** diberi status default **`Unmapped`** (penjualan uang dan cup tetap masuk di laporan, namun dilewati dari kalkulasi bahan baku cairan agar tidak menimbulkan error).
   * Sediakan fitur **`+ Tambah Bahan Baku Baru`** (untuk menambah bahan ke-14, 15, dst seperti Susu, Biang Kopi, Gula Aren, Matcha), **`+ Tambah Batch Adonan Baru`**, dan **`Form Pengaturan Resep Menu`** (maupun via Upload Excel) sehingga kapan pun Superadmin ingin memasukkan resep **AMKopi** atau menu baru lainnya, cukup memetakan bahan bakunya dan mengubah statusnya menjadi **`Active`**.

### D. Tabel Komparasi Audit Reverse Check (Menu 2 vs Menu 3)
Di halaman Superadmin, tampilkan tabel perbandingan per Stand dan per Rentang Tanggal:
* **Tabel 1 (Kebutuhan Batch Dapur Lapis 1 & 2)**: Menampilkan total ml `Adonan AMK Dingin`, `Adonan AMK Tea`, `Adonan Peach`, `Adonan Mocca`, `Adonan Kiwi`, dan `Tea Pekat` yang terpakai menurut penjualan Menu 2.
* **Tabel 2 (Komparasi Bahan Baku Mentah Menu 2 vs Menu 3)**:
  Kolom: `Kode & Nama Bahan` | `Satuan` | `Pemakaian Teoritis (Konversi Menu 2)` | `Pemakaian Aktual (Input SPG Menu 3)` | `Selisih / Variance (Aktual - Teoritis)` | `% Deviasi` | `Status Audit (Hijau: Wajar <=5%, Kuning: Warning 5-10%, Merah: Anomali >10%)`.

---

## 5. DASHBOARD SUPERADMIN, GENERATOR WA PRIBADI, & EXPORT EXCEL (.XLSX)

### A. Generator Teks Laporan Harian WhatsApp (1-Click Copy)
Sediakan fitur **"Generator Laporan WA"** di Dashboard Superadmin berdasarkan tanggal yang dipilih. Format teks harus **100% identik** dengan contoh pelaporan pribadi berikut (lengkap dengan tombol `Copy Teks WA`):
* Keterangan variabel:
  * `Ck` = QTY `Cup 12 oz AMK` dari Menu 1 (atau QTY `Cup AMKopi` untuk baris AMKopi).
  * `Cb` = QTY `Cup 22 oz AMK` dari Menu 1 (atau QTY `Cup Kurma` pada baris Total Kurma).
  * `Csdng` = QTY `Cup 16 oz AMK` dari Menu 1.
  * `PTT` = QTY `Jumlah PTT` dari Menu 1.
  * Jika suatu stand belum input atau bernilai 0, tampilkan `0` atau kosongkan angka setelah kode cup sesuai contoh.

**Template Output Generator WA:**
```text
TGL [D/M]
 1. WTC : [Nominal_AMK],Ck [qty12],Cb [qty22],Csdng [qty16]
 2. Delta : [Nominal_AMK],Ck [qty12],Cb [qty22]
 3. PA 1 : [Nominal_AMK],Ck [qty12],Cb [qty22]
 4. ITC UG : [Nominal_AMK],Ck [qty12],Cb [qty22]
 5. BG-L2 : [Nominal_AMK],Ck [qty12],Cb [qty22]
 6. ITC FC 2 : [Nominal_AMK],Ck [qty12],Cb [qty22]
 7. KAZA : [Nominal_AMK],Ck [qty12],Cb [qty22],Csdng [qty16]
 8. TP 1 : [Nominal_AMK],Ck [qty12],Cb [qty22]
 9. TP 2 : [Nominal_AMK],Ck [qty12],Cb [qty22],Csdng [qty16]
 10. TP 3 : [Nominal_AMK],Ck [qty12],Cb [qty22]
 11. BG LL : [Nominal_AMK],Ck [qty12],Cb [qty22]
 12. GC : [Nominal_AMK],Ck [qty12],Cb [qty22]

TGL [D/M]
 1. R-1 : [Nominal_AMK],Ck [qty12],Cb [qty22], PTT [qtyPTT]
 2. R-2 : [Nominal_AMK],Ck [qty12],Cb [qty22]
 3. SUNCITY : [Nominal_AMK],Ck [qty12],Cb [qty22]
 4. LIPPO : [Nominal_AMK],Ck [qty12],Cb [qty22]
 5. TRANS : [Nominal_AMK],Ck [qty12],Cb [qty22],Csdng [qty16]
 6. R-4 : [Nominal_AMK],Ck [qty12],Cb [qty22]

TGL [D/M]
 1. PTC : [Nominal_AMK],Ck [qty12],Cb [qty22]
 2. AMKopi R-1 : [Nominal_AMKopi_R1],Ck [qtyKopi_R1]
 3. AMKopi R-2 : [Nominal_AMKopi_R2],Ck [qtyKopi_R2]
 4. AMKopi R-4 : [Nominal_AMKopi_R4],Ck [qtyKopi_R4]
 5. AMKopi TP-1 : [Nominal_AMKopi_TP1],Ck [qtyKopi_TP1]
 6. AMKopi TP-2 : [Nominal_AMKopi_TP2],Ck [qtyKopi_TP2]
 7. AMKopi TP-3 : [Nominal_AMKopi_TP3],Ck [qtyKopi_TP3]
 8. AMKopi GC : [Nominal_AMKopi_GC],Ck [qtyKopi_GC]
 9. AMKopi Delta : [Nominal_AMKopi_Delta],Ck [qtyKopi_Delta]
 10. AMKopi BG-LL : [Nominal_AMKopi_BGLL],Ck [qtyKopi_BGLL]
 11. AMKopi BG-L2 : [Nominal_AMKopi_BGL2],Ck [qtyKopi_BGL2]

 Keterangan :
 Total AMK : [Total Nominal AMK Murni Seluruh Stand]
 Total Kurma : [Total Nominal Kurma Seluruh Stand], Cb [Total Cup Kurma]
 Total AMKopi : [Total Nominal AMKopi Seluruh Stand], Ck [Total Cup AMKopi]
        - Input rekap laporan harian dengan fitur: 