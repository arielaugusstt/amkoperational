<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOpnameRequest extends Model
{
    protected $table = 'stock_opname_requests';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'opname_items' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function stand()
    {
        return $this->belongsTo(MasterStand::class, 'stand_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

