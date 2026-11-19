<?php

namespace Database\Seeders;

use App\Models\Outlet;
use Illuminate\Database\Seeder;

class OutletSeeder extends Seeder
{
    public function run(): void
    {
        $outlets = [
            ['kode_stand' => 'WTC',     'nama_stand' => 'WTC Surabaya',         'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 1,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => true,  'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'Delta',   'nama_stand' => 'Delta Plaza',          'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 2,  'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'PA-1',    'nama_stand' => 'Plaza Atom 1',         'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 3,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'ITC-UG',  'nama_stand' => 'ITC Mega Grosir UG',   'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 4,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'BG-L2',   'nama_stand' => 'BG Junction L2',       'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 5,  'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'ITC-FC2', 'nama_stand' => 'ITC Food Court 2',     'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 6,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'KAZA',    'nama_stand' => 'Kaza City Mall',       'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 7,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => true,  'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'TP-1',    'nama_stand' => 'Tunjungan Plaza 1',    'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 8,  'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'tp1',        'is_premium' => false],
            ['kode_stand' => 'TP-2',    'nama_stand' => 'Tunjungan Plaza 2',    'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 9,  'punya_amkopi' => true,  'tampilkan_csdng_wa' => true,  'tampilkan_ptt_wa' => false, 'price_tier' => 'tp2',        'is_premium' => true],
            ['kode_stand' => 'TP-3',    'nama_stand' => 'Tunjungan Plaza 3',    'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 10, 'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'BG-LL',   'nama_stand' => 'BG Junction LL',       'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 11, 'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'GC',      'nama_stand' => 'Grand City Mall',      'wilayah_laporan' => 'Utara',   'blok_wa' => 'Blok 1', 'urutan_tampil' => 12, 'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'R-1',     'nama_stand' => 'Royal Plaza 1',        'wilayah_laporan' => 'Selatan', 'blok_wa' => 'Blok 2', 'urutan_tampil' => 1,  'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => true,  'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'R-2',     'nama_stand' => 'Royal Plaza 2',        'wilayah_laporan' => 'Selatan', 'blok_wa' => 'Blok 2', 'urutan_tampil' => 2,  'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'SNCT',    'nama_stand' => 'Suncity Mall',         'wilayah_laporan' => 'Selatan', 'blok_wa' => 'Blok 2', 'urutan_tampil' => 3,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'LIPPO',   'nama_stand' => 'Lippo Plaza Sidoarjo', 'wilayah_laporan' => 'Selatan', 'blok_wa' => 'Blok 2', 'urutan_tampil' => 4,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'TRANS',   'nama_stand' => 'Trans Icon Mall',      'wilayah_laporan' => 'Selatan', 'blok_wa' => 'Blok 2', 'urutan_tampil' => 5,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => true,  'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'R-4',     'nama_stand' => 'Royal Plaza 4',        'wilayah_laporan' => 'Selatan', 'blok_wa' => 'Blok 2', 'urutan_tampil' => 6,  'punya_amkopi' => true,  'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'all_outlet', 'is_premium' => false],
            ['kode_stand' => 'PTC',     'nama_stand' => 'Pakuwon Trade Center', 'wilayah_laporan' => 'Barat',   'blok_wa' => 'Blok 3', 'urutan_tampil' => 1,  'punya_amkopi' => false, 'tampilkan_csdng_wa' => false, 'tampilkan_ptt_wa' => false, 'price_tier' => 'ptc',        'is_premium' => false],
        ];

        foreach ($outlets as $outlet) {
            Outlet::updateOrCreate(
                ['kode_stand' => $outlet['kode_stand']],
                array_merge($outlet, ['status_aktif' => true])
            );
        }
    }
}
