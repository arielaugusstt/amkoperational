<?php

namespace App\Services;

use App\Models\BaseRecipe;
use App\Models\DailyInventoryMenu3;
use App\Models\DailySaleMenu2;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Outlet;
use Illuminate\Support\Collection;

class ReverseAnalyticsService
{
    /**
     * Calculate 3-Layer Recursive BOM from an array of sold items.
     *
     * Supported input formats for $soldItems:
     * 1. [ ['menu_id' => 1, 'qty' => 70], ... ]
     * 2. [ ['sort_order' => 1, 'qty' => 70], ... ]
     * 3. [ ['name' => 'AMK', 'qty' => 70], ... ]
     * 4. [ 1 => 70, 10 => 10 ] (key = sort_order or menu_id, value = qty)
     */
    public function calculateFromItems(array $soldItems, ?string $priceTier = 'all_outlet', array $actualUsageMap = []): array
    {
        $allIngredients = Ingredient::where('is_active', true)
            ->orderBy('dashboard_tier')
            ->orderBy('display_order')
            ->get();

        $allBaseRecipes = BaseRecipe::with('items')->get()->keyBy('id');
        $allMenus = Menu::with(['recipeItems', 'prices', 'cupIngredient'])->orderBy('sort_order')->get();

        $menusById = $allMenus->keyBy('id');
        $menusBySortOrder = $allMenus->keyBy('sort_order');
        $menusByName = $allMenus->keyBy(fn ($m) => strtolower(trim($m->name)));

        // Initialize accumulators with high precision floats
        $usageRaw = [];
        $usageByCategory = [];
        foreach ($allIngredients as $ing) {
            $usageRaw[$ing->id] = 0.0;
            $usageByCategory[$ing->id] = [
                'amk_murni' => 0.0,
                'amkopi' => 0.0,
                'kurma' => 0.0,
                'kemasan' => 0.0,
            ];
        }

        $baseAdonanMl = [];
        foreach ($allBaseRecipes as $br) {
            $baseAdonanMl[$br->code] = [
                'code' => $br->code,
                'nama' => $br->name,
                'volume_ml' => 0.0,
            ];
        }

        $salesByCategory = [
            'amk_murni' => ['qty' => 0, 'omzet' => 0],
            'amkopi'    => ['qty' => 0, 'omzet' => 0],
            'kurma'     => ['qty' => 0, 'omzet' => 0],
            'kemasan'   => ['qty' => 0, 'omzet' => 0],
        ];

        $totalSalesQty = 0;
        $totalOmzet = 0;

        // Normalize $soldItems
        foreach ($soldItems as $key => $entry) {
            $menu = null;
            $qty = 0.0;
            $unitPrice = null;

            if (is_numeric($entry)) {
                // Format: [ sort_order => qty ]
                $qty = (float)$entry;
                $menu = $menusBySortOrder->get((int)$key) ?? $menusById->get((int)$key);
            } elseif (is_array($entry)) {
                $qty = (float)($entry['qty'] ?? $entry['quantity'] ?? 0);
                if (!empty($entry['menu_id'])) {
                    $menu = $menusById->get((int)$entry['menu_id']);
                } elseif (!empty($entry['menu2_item_id'])) {
                    $menu = $menusById->get((int)$entry['menu2_item_id']) ?? $menusBySortOrder->get((int)$entry['menu2_item_id']);
                } elseif (!empty($entry['sort_order'])) {
                    $menu = $menusBySortOrder->get((int)$entry['sort_order']);
                } elseif (!empty($entry['name']) || !empty($entry['nama_item'])) {
                    $lookupName = strtolower(trim($entry['name'] ?? $entry['nama_item']));
                    $menu = $menusByName->get($lookupName);
                }
                if (isset($entry['harga']) || isset($entry['price'])) {
                    $unitPrice = (int)($entry['harga'] ?? $entry['price']);
                }
            }

            if (!$menu || $qty <= 0) {
                continue;
            }

            $reportCat = $menu->report_category ?: 'amk_murni';
            if (!isset($salesByCategory[$reportCat])) {
                $salesByCategory[$reportCat] = ['qty' => 0, 'omzet' => 0];
            }

            if ($unitPrice === null) {
                $unitPrice = $menu->getPriceForTier($priceTier ?? 'all_outlet') ?? 0;
            }

            $subtotal = (int)round($qty * $unitPrice);
            $salesByCategory[$reportCat]['qty'] += (int)$qty;
            $salesByCategory[$reportCat]['omzet'] += $subtotal;
            $totalSalesQty += (int)$qty;
            $totalOmzet += $subtotal;

            // 1. Add 1 pcs Cup if menu has cup_ingredient_id
            if ($menu->cup_ingredient_id && isset($usageRaw[$menu->cup_ingredient_id])) {
                $usageRaw[$menu->cup_ingredient_id] += $qty;
                $usageByCategory[$menu->cup_ingredient_id][$reportCat] += $qty;
            }

            // 2. Resolve Menu Recipe Items (Layer 3 -> Layer 2 -> Layer 1)
            foreach ($menu->recipeItems as $recipeItem) {
                $neededQty = $qty * (float)$recipeItem->quantity;

                if ($recipeItem->ingredient_id && isset($usageRaw[$recipeItem->ingredient_id])) {
                    $usageRaw[$recipeItem->ingredient_id] += $neededQty;
                    $usageByCategory[$recipeItem->ingredient_id][$reportCat] += $neededQty;
                } elseif ($recipeItem->base_recipe_id) {
                    $this->resolveBaseRecipeRecursive(
                        (int)$recipeItem->base_recipe_id,
                        $neededQty,
                        $reportCat,
                        $allBaseRecipes,
                        $usageRaw,
                        $usageByCategory,
                        $baseAdonanMl,
                        0
                    );
                }
            }
        }

        // Format ingredients results
        $ingredientsResult = [];
        $tier1Highlights = [];
        $tier2Details = [];
        $table2Audit = [];

        foreach ($allIngredients as $ing) {
            $rawVal = $usageRaw[$ing->id] ?? 0.0;
            $roundedVal = round($rawVal, 2);

            $convFactor = $ing->conversion_factor ? (float)$ing->conversion_factor : null;
            $convUnit = $ing->conversion_unit;
            $convertedVal = ($convFactor && $convFactor > 0) ? round($rawVal / $convFactor, 2) : null;

            $catBreakdownRaw = $usageByCategory[$ing->id] ?? [
                'amk_murni' => 0.0,
                'amkopi' => 0.0,
                'kurma' => 0.0,
                'kemasan' => 0.0,
            ];
            $catBreakdownRounded = [
                'amk_murni' => round($catBreakdownRaw['amk_murni'], 2),
                'amkopi'    => round($catBreakdownRaw['amkopi'], 2),
                'kurma'     => round($catBreakdownRaw['kurma'], 2),
                'kemasan'   => round($catBreakdownRaw['kemasan'], 2),
            ];

            // Build human-readable display string per UI specification
            $displayPrimary = number_format($roundedVal, 2, ',', '.') . ' ' . $ing->base_unit;
            $displaySecondary = null;

            if ($convUnit === 'botol' && $convFactor == 1500) {
                $displaySecondary = number_format($convertedVal, 2, ',', '.') . ' botol';
                $displayPrimary = number_format($roundedVal, 2, ',', '.') . ' ml (' . $displaySecondary . ')';
            } elseif ($ing->base_unit === 'gram' && $convUnit === 'kg' && $convFactor == 1000) {
                if ($rawVal >= 1000) {
                    $displaySecondary = number_format($convertedVal, 2, ',', '.') . ' kg';
                    $displayPrimary = $displaySecondary . ' (' . number_format($roundedVal, 2, ',', '.') . ' g)';
                } else {
                    $displayPrimary = number_format($roundedVal, 2, ',', '.') . ' g';
                }
            } elseif (in_array($ing->base_unit, ['pcs', 'buah', 'keping'])) {
                $displayPrimary = number_format($roundedVal, 0, ',', '.') . ' ' . $ing->base_unit;
            }

            $aktualVal = round((float)($actualUsageMap[$ing->code] ?? $actualUsageMap[$ing->id] ?? 0.0), 2);
            $selisih = round($aktualVal - $roundedVal, 2);
            $deviasiPercent = $roundedVal > 0
                ? round((abs($selisih) / $roundedVal) * 100, 1)
                : ($aktualVal > 0 ? 100.0 : 0.0);

            $badgeColor = 'green';
            $statusLabel = 'Hijau (Wajar <=5%)';
            if ($deviasiPercent > 10.0) {
                $badgeColor = 'red';
                $statusLabel = 'Merah (Anomali >10%)';
            } elseif ($deviasiPercent > 5.0) {
                $badgeColor = 'yellow';
                $statusLabel = 'Kuning (Warning 5.1%-10%)';
            }

            $itemData = [
                'id' => $ing->id,
                'code' => $ing->code,
                'kode_bahan' => $ing->code,
                'name' => $ing->name,
                'nama_bahan_baku' => $ing->name,
                'category' => $ing->category,
                'dashboard_tier' => $ing->dashboard_tier,
                'base_unit' => $ing->base_unit,
                'satuan' => $ing->base_unit,
                'raw_quantity' => $rawVal,
                'quantity' => $roundedVal,
                'teoritis' => $roundedVal,
                'teoritis_desc' => $displaySecondary,
                'conversion_unit' => $convUnit,
                'conversion_factor' => $convFactor,
                'converted_quantity' => $convertedVal,
                'formatted_display' => $displayPrimary,
                'notes' => $ing->notes,
                'density_g_per_ml' => $ing->density_g_per_ml,
                'breakdown_by_category' => $catBreakdownRounded,
                'aktual' => $aktualVal,
                'selisih' => $selisih,
                'deviasi_percent' => $deviasiPercent,
                'badge_color' => $badgeColor,
                'status' => $statusLabel,
            ];

            $ingredientsResult[$ing->code] = $itemData;
            if ($ing->dashboard_tier === 1) {
                $tier1Highlights[] = $itemData;
            } else {
                $tier2Details[] = $itemData;
            }
            $table2Audit[] = $itemData;
        }

        // Cross-validation: Total 4 Gelas + Le Minerale == Total Qty Penjualan
        $cup12Amk    = (int)round($ingredientsResult['CUP_12_AMK']['raw_quantity'] ?? 0);
        $cup12Amkopi = (int)round($ingredientsResult['CUP_12_AMKOPI']['raw_quantity'] ?? 0);
        $cup16Amk    = (int)round($ingredientsResult['CUP_16_AMK']['raw_quantity'] ?? 0);
        $cup22Amk    = (int)round($ingredientsResult['CUP_22_AMK']['raw_quantity'] ?? 0);
        $leMinerale  = (int)round($ingredientsResult['LE_MINERALE']['raw_quantity'] ?? 0);

        $totalFourCups = $cup12Amk + $cup12Amkopi + $cup16Amk + $cup22Amk;
        $totalPackagingQty = $totalFourCups + $leMinerale;

        $table1Batches = array_values(array_map(function ($b) {
            return [
                'code' => $b['code'],
                'nama' => $b['nama'],
                'volume_ml' => round($b['volume_ml'], 2),
            ];
        }, $baseAdonanMl));

        return [
            'ingredients' => $ingredientsResult,
            'tier1_highlights' => $tier1Highlights,
            'tier2_details' => $tier2Details,
            'sales_by_category' => $salesByCategory,
            'total_sales_qty' => $totalSalesQty,
            'total_omzet' => $totalOmzet,
            'cup_validation' => [
                'cup_12_amk' => $cup12Amk,
                'cup_12_amkopi' => $cup12Amkopi,
                'cup_16_amk' => $cup16Amk,
                'cup_22_amk' => $cup22Amk,
                'total_four_cups' => $totalFourCups,
                'le_minerale' => $leMinerale,
                'total_packaging_qty' => $totalPackagingQty,
                'total_sales_qty' => $totalSalesQty,
                'is_valid' => $totalPackagingQty === $totalSalesQty,
            ],
            'table1_batch_needs' => $table1Batches,
            'table2_audit_comparison' => $table2Audit,
        ];
    }

    /**
     * Recursive BOM resolver for Layer 2 Base Recipes (supports nested child_base_recipe_id).
     */
    protected function resolveBaseRecipeRecursive(
        int $baseRecipeId,
        float $volumeNeededMl,
        string $reportCategory,
        Collection $allBaseRecipes,
        array &$usageRaw,
        array &$usageByCategory,
        array &$baseAdonanMl,
        int $depth = 0
    ): void {
        if ($depth > 10 || $volumeNeededMl <= 0) {
            return;
        }

        /** @var BaseRecipe|null $baseRecipe */
        $baseRecipe = $allBaseRecipes->get($baseRecipeId);
        if (!$baseRecipe || (float)$baseRecipe->yield_ml <= 0) {
            return;
        }

        if (isset($baseAdonanMl[$baseRecipe->code])) {
            $baseAdonanMl[$baseRecipe->code]['volume_ml'] += $volumeNeededMl;
        }

        $factor = $volumeNeededMl / (float)$baseRecipe->yield_ml;

        foreach ($baseRecipe->items as $item) {
            $componentQty = $factor * (float)$item->quantity;

            if ($item->ingredient_id && isset($usageRaw[$item->ingredient_id])) {
                $usageRaw[$item->ingredient_id] += $componentQty;
                $usageByCategory[$item->ingredient_id][$reportCategory] += $componentQty;
            } elseif ($item->child_base_recipe_id) {
                $this->resolveBaseRecipeRecursive(
                    (int)$item->child_base_recipe_id,
                    $componentQty,
                    $reportCategory,
                    $allBaseRecipes,
                    $usageRaw,
                    $usageByCategory,
                    $baseAdonanMl,
                    $depth + 1
                );
            }
        }
    }

    /**
     * Compute Reverse Analytics for a specific outlet (or 'all') and date range.
     */
    public function compute($standId = 'all', ?string $startDate = null, ?string $endDate = null): array
    {
        $startDate = $startDate ?: date('Y-m-d');
        $endDate = $endDate ?: $startDate;

        $salesQuery = DailySaleMenu2::whereBetween('tanggal', [$startDate, $endDate]);
        $invQuery = DailyInventoryMenu3::whereBetween('tanggal', [$startDate, $endDate]);

        $priceTier = 'all_outlet';
        if ($standId && $standId !== 'all') {
            $salesQuery->where('stand_id', $standId);
            $invQuery->where('stand_id', $standId);
            $outlet = Outlet::find($standId);
            if ($outlet) {
                $priceTier = $outlet->price_tier;
            }
        }

        $salesRecords = $salesQuery->get();
        $invRecords = $invQuery->get();

        $soldItems = [];
        foreach ($salesRecords as $sale) {
            foreach (($sale->items_sold ?? []) as $item) {
                $soldItems[] = $item;
            }
        }

        $actualUsageMap = [];
        foreach ($invRecords as $inv) {
            foreach (($inv->inventory_items ?? []) as $item) {
                $code = $item['kode_bahan'] ?? $item['code'] ?? null;
                $id = $item['ingredient_id'] ?? null;
                $used = (float)($item['barang_terpakai'] ?? 0);
                if ($code) {
                    $actualUsageMap[$code] = ($actualUsageMap[$code] ?? 0.0) + $used;
                }
                if ($id) {
                    $actualUsageMap[$id] = ($actualUsageMap[$id] ?? 0.0) + $used;
                }
            }
        }

        $result = $this->calculateFromItems($soldItems, $priceTier, $actualUsageMap);
        $result['stand_id'] = $standId;
        $result['start_date'] = $startDate;
        $result['end_date'] = $endDate;

        return $result;
    }

    /**
     * Filter and return available Menus for a given Outlet (by ID, kode_stand, or Outlet instance),
     * ordered strictly by sort_order 1..54 with resolved price for the outlet's price_tier.
     */
    public function getMenusForOutlet(Outlet|string|int $outletInput): Collection
    {
        if ($outletInput instanceof Outlet) {
            $outlet = $outletInput;
        } elseif (is_numeric($outletInput)) {
            $outlet = Outlet::findOrFail($outletInput);
        } else {
            $outlet = Outlet::where('kode_stand', $outletInput)->firstOrFail();
        }

        $tier = $outlet->price_tier ?: 'all_outlet';

        $menus = Menu::with(['prices', 'cupIngredient', 'recipeItems'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return $menus->filter(function (Menu $menu) use ($outlet, $tier) {
            // 1. Check if sold in this outlet's price tier
            $price = $menu->getPriceForTier($tier);
            if ($price === null) {
                return false;
            }

            // 2. Check premium outlet rules:
            // TP-2 (is_premium = true) only sells #35-46 (amk_premium), #47-52 (amkopi), #53-54 (amk_kurma, kemasan)
            // Regular outlets (is_premium = false) do not sell amk_premium
            if ($outlet->is_premium && in_array($menu->menu_group, ['amk_reguler', 'amk_jumbo'])) {
                return false;
            }
            if (!$outlet->is_premium && $menu->menu_group === 'amk_premium') {
                return false;
            }

            // 3. Check AMKopi availability on outlet
            if ($menu->menu_group === 'amkopi' && !$outlet->punya_amkopi) {
                return false;
            }

            return true;
        })->map(function (Menu $menu) use ($tier) {
            $price = $menu->getPriceForTier($tier);
            $menu->outlet_price = $price;
            $menu->harga_default = $price;
            return $menu;
        })->values();
    }
}
