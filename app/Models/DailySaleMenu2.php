<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailySaleMenu2 extends Model
{
    protected $table = 'daily_sales_menu2';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'items_sold' => 'array',
            'unregistered_items' => 'array',
            'grand_total' => 'integer',
        ];
    }

    public function stand()
    {
        return $this->belongsTo(MasterStand::class, 'stand_id');
    }
}

