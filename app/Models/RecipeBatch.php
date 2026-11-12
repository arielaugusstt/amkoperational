<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeBatch extends Model
{
    protected $table = 'recipe_batches';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'volume_batch_ml' => 'float',
            'status_aktif' => 'boolean',
        ];
    }

    public function components()
    {
        return $this->hasMany(RecipeBatchComponent::class, 'recipe_batch_id');
    }
}

