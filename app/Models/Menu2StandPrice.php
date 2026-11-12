<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu2StandPrice extends Model
{
    protected $table = 'menu2_stand_prices';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'harga' => 'integer',
        ];
    }
}

