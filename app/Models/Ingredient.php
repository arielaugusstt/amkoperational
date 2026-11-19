<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $table = 'ingredients';

    protected $guarded = ['id'];

    protected $casts = [
        'dashboard_tier' => 'integer',
        'conversion_factor' => 'float',
        'density_g_per_ml' => 'float',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'kode_bahan',
        'nama_bahan_baku',
        'kategori_bahan',
        'satuan',
        'urutan',
        'status_aktif',
    ];

    public function getKodeBahanAttribute()
    {
        return $this->code;
    }

    public function getNamaBahanBakuAttribute()
    {
        return $this->name;
    }

    public function getKategoriBahanAttribute()
    {
        return $this->category;
    }

    public function getSatuanAttribute()
    {
        return $this->base_unit;
    }

    public function getUrutanAttribute()
    {
        return $this->display_order;
    }

    public function getStatusAktifAttribute()
    {
        return $this->is_active;
    }
}
