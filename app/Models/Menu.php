<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'menus';

    protected $guarded = ['id'];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'nama_item',
        'kelompok_menu',
        'kode_item',
        'urutan',
        'status_aktif',
    ];

    public function cupIngredient()
    {
        return $this->belongsTo(Ingredient::class, 'cup_ingredient_id');
    }

    public function prices()
    {
        return $this->hasMany(MenuPrice::class, 'menu_id');
    }

    public function recipeItems()
    {
        return $this->hasMany(MenuRecipeItem::class, 'menu_id');
    }

    public function getPriceForTier(string $tier): ?int
    {
        $priceObj = $this->prices->firstWhere('price_tier', $tier);
        return $priceObj ? $priceObj->price : null;
    }

    public function getNamaItemAttribute()
    {
        return $this->name;
    }

    public function getKelompokMenuAttribute()
    {
        $labels = [
            'amk_reguler' => '1. AMK Reguler',
            'amk_jumbo' => '2. AMK Jumbo',
            'amk_premium' => '3. AMK Premium',
            'amkopi' => '4. AMKopi',
            'amk_kurma' => '5. AMK Kurma',
            'kemasan' => '6. Kemasan',
        ];
        return $labels[$this->menu_group] ?? $this->menu_group;
    }

    public function getKodeItemAttribute()
    {
        return 'MENU_' . str_pad((string)$this->sort_order, 2, '0', STR_PAD_LEFT);
    }

    public function getUrutanAttribute()
    {
        return $this->sort_order;
    }

    public function getStatusAktifAttribute()
    {
        return $this->is_active;
    }
}
