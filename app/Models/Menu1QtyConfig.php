<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu1QtyConfig extends Model
{
    protected $table = 'menu1_qty_configs';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status_aktif' => 'boolean',
            'urutan' => 'integer',
        ];
    }
}

