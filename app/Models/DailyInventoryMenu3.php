<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyInventoryMenu3 extends Model
{
    protected $table = 'daily_inventories_menu3';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'inventory_items' => 'array',
        ];
    }

    public function stand()
    {
        return $this->belongsTo(MasterStand::class, 'stand_id');
    }
}

