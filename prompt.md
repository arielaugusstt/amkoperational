# PENAMBAHAN MENU BARU SUPERADMIN: "BUSINESS INTELLIGENCE, PIVOT CENTER & EXACT EXCEL EXPORT (OMS & PRES)"

**INSTRUKSI PENTING:** Jangan merubah, menghapus, atau mengganggu fitur, form input SPG (Menu 1, 2, 3), Master Data, maupun modul yang sudah ada. Tambahkan **1 Menu Navigasi Baru** di sidebar Superadmin bernama **"BI & Pivot Center"** yang berisi dashboard analitik menyeluruh, 8 tabel matriks pivot interaktif, dan tombol export Excel presisi tinggi.

---

## 1. DASHBOARD ANALITIK KOMPREHENSIF (DRILL-DOWN SEMUA INPUT)
Di dalam halaman **"BI & Pivot Center"**, sediakan Filter Periode (`Bulan & Tahun`, `Rentang Tanggal`, dan `Filter Outlet/Stand`) serta sajikan 5 panel analisa mendalam yang mengolah seluruh data dari Menu 1, Menu 2, Menu 3, dan Reverse Analytic:

1. **Analisa Per Lini & Kategori Omzet**:
   * Perbandingan kontribusi dan tren harian: `AMK Murni`, `AMKopi`, `Kurma`, `PTT`, `Air Mineral`, dan `Penjualan Lain`.
   * *Average Revenue Per Cup (ARPC)* per outlet (`Total Omzet / Total Cup`).
2. **Analisa Per Menu & Varian (Dari Menu 2 Detail)**:
   * Peringkat Top & Bottom Menu (Qty & Rupiah) untuk kelompok *AMK 27 Menu*, *Jumbo*, *AMKopi*, *PTT*, dan *Air Mineral*.
   * *Product-Outlet Matrix*: Menunjukkan menu paling laris di masing-masing outlet.
   * Rekap item `Unregistered` yang sering diinput SPG per outlet.
3. **Analisa Keuangan, QRIS & Audit Biaya**:
   * Rekap perbandingan `QRIS` vs `Tunai Kotor` vs `Total Biaya` vs `Sisa Setoran Tunai Bersih` per outlet.
   * Rasio Biaya Operasional terhadap Omzet (`Cost-to-Revenue %`) dengan penanda merah jika biaya harian outlet melebihi batas wajar (>3%), lengkap dengan rincian keterangan Biaya 1 & Biaya 2 serta tombol preview foto Settlement QRIS.
4. **Analisa Produktivitas & Korelasi SPG (People Analytics)**:
   * Rekap total hari kerja (`Masuk`), hari libur (`Off`), daftar outlet yang pernah dijaga, total omzet yang ditangani, serta rata-rata omzet per shift untuk masing-masing nama SPG.
5. **Analisa Kesehatan Stok, Barang Rusak & Reverse Yield (Dari Menu 3 & RESEPAMK)**:
   * Peringkat `Barang Rusak / Reject` terbanyak per outlet dan per SPG.
   * Ringkasan selisih (*variance*) pemakaian bahan baku teoritis vs aktual.

---

## 2. TABEL MATRIKS PIVOT KALENDER INTERAKTIF (TGL 1 S/D 31)
Buat komponen tabel pivot dengan **Kolom Kiri Terkunci (Sticky Left Columns: `#`, `Kode & Nama Outlet/SPG`, `Total Bulanan`)** dan kolom kanan memanjang dari **`Tgl 1` s/d `Tgl 31`** (lengkap dengan nama hari `Mon–Sun`, di mana kolom hari Minggu/Weekend otomatis ter-highlight merah, serta baris `Total Bawah` yang terjumlah otomatis).

Sediakan **8 Tab Switcher** untuk mengganti isi matriks pivot secara instan:
1. **Tab 1: `Pivot Omzet (Gabungan & Lini)`** — Menampilkan nominal omzet harian per outlet. Pada mode Gabungan, tampilkan angka total di atas dan sub-angka berwarna oranye di bawahnya untuk omzet AMKopi (contoh: `964.000` dengan sub-teks `+Kopi 236.000`), serta dropdown filter untuk melihat khusus `Semua Lini`, `AMK Murni`, `AMKopi`, `Kurma`, `PTT`, atau `Air Mineral`.
2. **Tab 2: `Pivot Cup 12 oz (AMK)`** — Matriks harian `Cup 12 oz AMK` per outlet + `% porsi` terhadap total cup outlet.
3. **Tab 3: `Pivot Cup 22 oz (AMK)`** — Matriks harian `Cup 22 oz AMK` per outlet + `% porsi`.
4. **Tab 4: `Pivot Cup 16 oz (AMK)`** — Matriks harian `Cup 16 oz AMK` per outlet + `% porsi`.
5. **Tab 5: `Pivot Cup 12 oz AMKopi`** — Matriks harian `Cup AMKopi` per outlet + nominal omzet AMKopi.
6. **Tab 6: `Pivot Jadwal & Omzet Nama SPG`** — Baris ke bawah adalah **Daftar Nama Seluruh SPG**. Di setiap kotak tanggal (`Tgl 1–31`) tampilkan **2 baris informasi**: Baris atas = `Kode Outlet` tempat SPG jaga hari itu (misal `R-2`, `TP-1`), Baris bawah = `Nominal Omzet` outlet tersebut hari itu. Kolom Total Bulanan menampilkan `Total Hari Masuk`, `Total Omzet`, dan `Rata-rata Omzet/Shift`.
7. **Tab 7: `Pivot QRIS & Setoran Tunai`** — Matriks harian `Nominal QRIS` (atas) dan `Sisa Tunai Bersih` (bawah) per outlet.
8. **Tab 8: `Pivot Biaya Operasional`** — Matriks harian `Total Biaya` per outlet dengan tooltip rincian keterangan biayanya.

---

## 3. FITUR EXPORT EXCEL PRESISI TINGGI (`OMS.XLSX` & `PRES.XLSX`)
Gunakan library `xlsx` (atau `exceljs` jika mendukung styling sel, border, merge cells, background fill, dan rumus Excel asli `=SUM` / `=AVERAGEIF`) untuk menyediakan **3 Tombol Export Excel** di halaman ini agar hasil unduhannya **100% TEPAT SEPERTI TEMPLATE EXCEL OPERASIONAL**:

### A. Tombol 1: `Export Excel Omzet Bulanan (Format OMS.xlsx)`
Hasilkan file `.xlsx` dengan struktur baris, kolom, warna, dan rumus yang identik dengan format `oms okt.xlsx`:
* **Kolom A & Kolom B**: Dual kolom `Kode Outlet` (keduanya menampilkan kode outlet yang sama secara berdampingan).
* **Baris 1 (Top Summary Row — Background Kuning)**: Total Omzet Harian per tanggal `1..31` di atas baris header tanggal.
* **Baris 2 (Header Tanggal `1` s/d `31` — Kolom `C` s/d `AG`)**: Angka `1` sampai `31` sesuai kalender bulan yang dipilih, dengan **fill warna merah/merah muda pada kolom tanggal hari Sabtu dan Minggu**.
* **Urutan Baris Outlet (Wajib Persis Berurutan)**:
  * **Blok 1 (23 Outlet Utama)**: `R-1`, `R-2`, `R-4`, `R-5`, `CITO`, `trans`, `Lippo`, `PA-1`, `ITC-UG`, `BG-L2`, `ITC-FC2`, `TP`, **`AMK PREMIUM`** *(seluruh baris ini diberi background fill biru muda/cyan)*, `TP-3`, `BG-LL`, `BG-GL`, `BG-LG`, `WTC`, `SUNCITY`, `RAMAYANA`, `DTC-L4`, `delta`, `gc`.
  * **Baris Subtotal Blok 1 (Background Kuning/Biru)**: Rumus Excel `=SUM(C4:C26)` di setiap kolom tanggal.
  * **Baris Mandiri**: `ptc`.
  * **Blok 2 (10 Outlet AMKopi)**: `AMKopi R-1`, `AMKopi R-2`, `AMKopi R-4`, `AMKopi TP-1`, `AMKopi TP-2`, `AMKopi TP-3`, `AMKopi GC`, `AMKopi Delta`, `AMKopi BG-LL`, `AMKopi BG-L2`.
  * **Baris Subtotal AMKopi (Background Oranye Muda)**: Rumus Excel `=SUM(...)` untuk ke-10 baris AMKopi.
  * **Baris Grand Total Bawah (Background Kuning)**: Rumus penjumlahan `Subtotal Blok 1 + PTC + Subtotal AMKopi`.
* **Kolom Ringkasan Kanan (Setelah Tanggal `31`)**:
  * `Kolom AH` (**`TOTAL`**): Rumus `=SUM(C..:AG..)` untuk tiap baris outlet.
  * `Kolom AI` (**`RATA-RATA`**): Rumus `=IFERROR(AVERAGEIF(C..:AG.., ">0"), 0)` untuk tiap baris outlet.
  * `Kolom AJ`: Kolom ulang `Kode Outlet` di sisi paling kanan.
* **Format Angka**: Pemisah ribuan tanpa desimal (`#,##0`), sel kosong/nol ditampilkan `-` atau kosong rapi.

### B. Tombol 2: `Export Excel Presensi & Omzet SPG (Format PRES.xlsx)`
Hasilkan file `.xlsx` dengan struktur matriks SPG 2-baris bertumpuk (*stacked rows*) yang identik dengan format `pres okt.xlsx`:
* **Header Tabel**:
  * `Kolom A`: **`NO`**
  * `Kolom B`: **`NAMA SPG`**
  * `Kolom C s/d AG`: Tanggal **`1` s/d `31`** (dengan highlight merah pada kolom hari Sabtu & Minggu).
  * `Kolom AH`: **`TOTAL MASUK`**
  * `Kolom AI`: **`TOTAL OFF`**
  * `Kolom AJ`: **`TOTAL OMZET`**
  * `Kolom AK`: **`RATA-RATA / SHIFT`**
* **Struktur 2 Baris per 1 Orang SPG**:
  * Setiap 1 SPG menggunakan **2 baris Excel berturut-turut** (misal Baris 4 dan Baris 5 untuk SPG #1):
    * Merge vertikal sel `NO` (`A4:A5`), `NAMA SPG` (`B4:B5`), `TOTAL MASUK` (`AH4:AH5`), `TOTAL OFF` (`AI4:AI5`), `TOTAL OMZET` (`AJ4:AJ5`), dan `RATA-RATA` (`AK4:AK5`).
    * **Baris Atas (`C4:AG4`)**: Diisi **Kode Stand/Outlet** tempat SPG tersebut bertugas pada tanggal `1..31` (diambil dari input SPG 1–5 pada Menu 1). Jika tidak bertugas, biarkan kosong.
    * **Baris Bawah (`C5:AG5`)**: Diisi **Nominal Omzet** outlet tersebut pada tanggal `1..31` (format angka `#,##0`).
  * **Rumus Kolom Kanan per SPG**:
    * `TOTAL MASUK` (`AH4`): `=COUNTA(C4:AG4)`
    * `TOTAL OFF` (`AI4`): `=31-AH4` (sesuai jumlah hari dalam bulan tersebut)
    * `TOTAL OMZET` (`AJ4`): `=SUM(C5:AG5)`
    * `RATA-RATA / SHIFT` (`AK4`): `=IFERROR(AJ4/AH4, 0)`
* **Footer Tabel Bawah**:
  * Baris **`TOTAL SPG MASUK / HARI`**: Rumus hitung jumlah SPG aktif per tanggal `1..31`.
  * Baris **`TOTAL OMZET / HARI`**: Rumus total omzet per tanggal `1..31`.

### C. Tombol 3: `Export Excel Pivot Aktif (Cup 12oz / 22oz / 16oz / AMKopi)`
Menyediakan tombol cepat untuk mengunduh tab pivot mana pun yang sedang dibuka di layar (termasuk Matriks Cup 12 oz, Cup 22 oz, Cup 16 oz, Cup AMKopi, QRIS, dan Biaya) dalam format matriks kalender `1–31` yang rapi dan siap cetak.