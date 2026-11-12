<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeGlobalParam extends Model
{
    protected $table = 'recipe_global_params';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'nilai_param' => 'float',
            'status_aktif' => 'boolean',
        ];
    }
}

