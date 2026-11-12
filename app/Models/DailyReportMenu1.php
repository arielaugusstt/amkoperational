<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReportMenu1 extends Model
{
    protected $table = 'daily_reports_menu1';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'spg_list' => 'array',
            'nominal_per_kategori' => 'array',
            'penjualan_tambahan' => 'array',
            'biaya_harian' => 'array',
            'qty_per_item' => 'array',
            'total_semua_penjualan' => 'integer',
            'nominal_qris' => 'integer',
            'nominal_tunai' => 'integer',
            'total_biaya' => 'integer',
            'sisa_setoran_tunai' => 'integer',
        ];
    }

    public function stand()
    {
        return $this->belongsTo(MasterStand::class, 'stand_id');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}

