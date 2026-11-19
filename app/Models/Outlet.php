<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Outlet extends Model
{
    protected $table = 'outlets';

    protected $guarded = ['id'];

    protected $casts = [
        'punya_amkopi' => 'boolean',
        'tampilkan_csdng_wa' => 'boolean',
        'tampilkan_ptt_wa' => 'boolean',
        'is_premium' => 'boolean',
        'status_aktif' => 'boolean',
    ];
}
