<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuPrice extends Model
{
    protected $table = 'menu_prices';

    protected $guarded = ['id'];

    protected $casts = [
        'price' => 'integer',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'menu_id');
    }
}
