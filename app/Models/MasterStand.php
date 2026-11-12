<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterStand extends Model
{
    protected $table = 'master_stands';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'punya_amkopi' => 'boolean',
            'tampilkan_csdng_wa' => 'boolean',
            'tampilkan_ptt_wa' => 'boolean',
            'status_aktif' => 'boolean',
            'urutan_tampil' => 'integer',
            'urutan_amkopi_wa' => 'integer',
        ];
    }
}

