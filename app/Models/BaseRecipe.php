<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaseRecipe extends Model
{
    protected $table = 'base_recipes';

    protected $guarded = ['id'];

    protected $casts = [
        'yield_ml' => 'float',
    ];

    public function items()
    {
        return $this->hasMany(BaseRecipeItem::class, 'base_recipe_id');
    }
}
