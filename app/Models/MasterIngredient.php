<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterIngredient extends Model
{
    protected $table = 'master_ingredients';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_resep_amk_core' => 'boolean',
            'status_aktif' => 'boolean',
            'urutan' => 'integer',
        ];
    }

    public function standStocks()
    {
        return $this->hasMany(StandIngredientStock::class, 'ingredient_id');
    }
}

