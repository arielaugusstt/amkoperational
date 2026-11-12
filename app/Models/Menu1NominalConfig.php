<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu1NominalConfig extends Model
{
    protected $table = 'menu1_nominal_configs';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status_aktif' => 'boolean',
            'urutan' => 'integer',
        ];
    }
}

