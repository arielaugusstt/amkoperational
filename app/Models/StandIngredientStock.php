<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StandIngredientStock extends Model
{
    protected $table = 'stand_ingredient_stocks';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'stok_awal_master' => 'float',
            'stok_terkini' => 'float',
        ];
    }
}

