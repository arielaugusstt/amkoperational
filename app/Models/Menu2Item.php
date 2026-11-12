<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu2Item extends Model
{
    protected $table = 'menu2_items';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'harga_default' => 'integer',
            'urutan' => 'integer',
            'status_aktif' => 'boolean',
        ];
    }

    public function standPrices()
    {
        return $this->hasMany(Menu2StandPrice::class, 'menu2_item_id');
    }

    public function recipeMappings()
    {
        return $this->hasMany(RecipeMenuMapping::class, 'menu2_item_id');
    }
}

