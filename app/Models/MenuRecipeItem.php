<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuRecipeItem extends Model
{
    protected $table = 'menu_recipe_items';

    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'float',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'menu_id');
    }

    public function baseRecipe()
    {
        return $this->belongsTo(BaseRecipe::class, 'base_recipe_id');
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
