<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaseRecipeItem extends Model
{
    protected $table = 'base_recipe_items';

    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'float',
    ];

    public function baseRecipe()
    {
        return $this->belongsTo(BaseRecipe::class, 'base_recipe_id');
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }

    public function childBaseRecipe()
    {
        return $this->belongsTo(BaseRecipe::class, 'child_base_recipe_id');
    }
}
