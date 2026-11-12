<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeBatchComponent extends Model
{
    protected $table = 'recipe_batch_components';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'jumlah' => 'float',
        ];
    }
}

