<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeMenuMapping extends Model
{
    protected $table = 'recipe_menu_mappings';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'nilai_takaran' => 'float',
        ];
    }
}

