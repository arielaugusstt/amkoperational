<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Outlet;
use App\Services\ReverseAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReverseAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected ReverseAnalyticsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->service = app(ReverseAnalyticsService::class);
    }

    /**
     * Uji 1 (70x #1 AMK Reguler):
     * SB = 1800.00 ml (1.20 botol), Air Putih = 10800.00 ml, CUP_12_AMK = 70 pcs.
     */
    public function test_uji_1_70x_amk_reguler(): void
    {
        $result = $this->service->calculateFromItems([
            ['sort_order' => 1, 'qty' => 70],
        ]);

        $ing = $result['ingredients'];

        $this->assertEquals(1800.00, $ing['SIRUP_AMK']['quantity']);
        $this->assertEquals(1.20, $ing['SIRUP_AMK']['converted_quantity']);
        $this->assertEquals(10800.00, $ing['AIR_PUTIH']['quantity']);
        $this->assertEquals(70, $ing['CUP_12_AMK']['quantity']);
        $this->assertTrue($result['cup_validation']['is_valid']);
        $this->assertEquals(70, $result['cup_validation']['total_packaging_qty']);
    }

    /**
     * Uji 2 (10x #10 AMK Tea Cream — uji nested BASE_AMK_TEA):
     * SB = 45.92 ml, Gula Pasir = 218.57 g, Creamer = 75.00 g, Teh = 3.86 bag, Air Putih = 1625.51 ml, CUP_12_AMK = 10 pcs.
     */
    public function test_uji_2_10x_amk_tea_cream_nested_base_amk_tea(): void
    {
        $result = $this->service->calculateFromItems([
            ['sort_order' => 10, 'qty' => 10],
        ]);

        $ing = $result['ingredients'];

        $this->assertEquals(45.92, $ing['SIRUP_AMK']['quantity']);
        $this->assertEquals(218.57, $ing['GULA_PASIR']['quantity']);
        $this->assertEquals(75.00, $ing['CREAMER']['quantity']);
        $this->assertEquals(3.86, $ing['TEH']['quantity']);
        $this->assertEquals(1625.51, $ing['AIR_PUTIH']['quantity']);
        $this->assertEquals(10, $ing['CUP_12_AMK']['quantity']);
        $this->assertTrue($result['cup_validation']['is_valid']);
    }

    /**
     * Uji 3 (10x #36 AMK Lite Cream + 4x #53 AMK Kurma + 10x #47 AMKopi — uji nested BASE_LITE & lintas kategori):
     * Total SB = 393.06 ml (0.26 botol) [AMK: 153.06 ml, Kurma: 40.00 ml, AMKopi: 200.00 ml],
     * CUP_22_AMK = 14 pcs, CUP_12_AMKOPI = 10 pcs, Fruktose = 321.43 ml, Creamer = 112.50 g,
     * Sirup Kurma = 1.00 botol, Biang Arabica = 750.00 ml, Total Air Putih = 4935.51 ml.
     */
    public function test_uji_3_nested_base_lite_and_cross_category_aggregation(): void
    {
        $result = $this->service->calculateFromItems([
            ['sort_order' => 36, 'qty' => 10], // AMK Lite Cream
            ['sort_order' => 53, 'qty' => 4],  // AMK Kurma
            ['sort_order' => 47, 'qty' => 10], // AMKopi (Air Mata Kopi)
        ], 'tp2');

        $ing = $result['ingredients'];

        // Total SB = 393.06 ml (0.26 botol)
        $this->assertEquals(393.06, $ing['SIRUP_AMK']['quantity']);
        $this->assertEquals(0.26, $ing['SIRUP_AMK']['converted_quantity']);

        // Breakdown SB by category: [AMK: 153.06 ml, Kurma: 40.00 ml, AMKopi: 200.00 ml]
        $this->assertEquals(153.06, $ing['SIRUP_AMK']['breakdown_by_category']['amk_murni']);
        $this->assertEquals(40.00, $ing['SIRUP_AMK']['breakdown_by_category']['kurma']);
        $this->assertEquals(200.00, $ing['SIRUP_AMK']['breakdown_by_category']['amkopi']);

        // Cups & Ingredients
        $this->assertEquals(14, $ing['CUP_22_AMK']['quantity']);
        $this->assertEquals(10, $ing['CUP_12_AMKOPI']['quantity']);
        $this->assertEquals(321.43, $ing['FRUKTOSE']['quantity']);
        $this->assertEquals(112.50, $ing['CREAMER']['quantity']);
        $this->assertEquals(1.00, $ing['SIRUP_KURMA']['quantity']);
        $this->assertEquals(750.00, $ing['BIANG_ARABICA']['quantity']);
        $this->assertEquals(4935.51, $ing['AIR_PUTIH']['quantity']);

        // Omzet separation check
        $this->assertEquals(110000, $result['sales_by_category']['amk_murni']['omzet']); // 10 * 11000
        $this->assertEquals(48000, $result['sales_by_category']['kurma']['omzet']);      // 4 * 12000
        $this->assertEquals(120000, $result['sales_by_category']['amkopi']['omzet']);    // 10 * 12000

        // Packaging cross-validation (14 + 10 = 24 == 24 total qty sold)
        $this->assertTrue($result['cup_validation']['is_valid']);
        $this->assertEquals(24, $result['cup_validation']['total_packaging_qty']);
    }

    /**
     * Uji 4 (Pricing & Filter Outlet):
     * TP-1 memuat Peach Cream = 6500;
     * PTC memuat Peach Jumbo = 8000 tanpa AMKopi;
     * TP-2 memuat AMK Premium = 13000, AMKopi = 12000, AMK Kurma = 12000.
     * Serta pastikan "AMK Blackcookies" sudah dihapus total.
     */
    public function test_uji_4_pricing_and_outlet_filtering(): void
    {
        // Legacy "AMK Blackcookies" must not exist
        $this->assertDatabaseMissing('menus', ['name' => 'AMK Blackcookies']);
        $this->assertEquals(54, Menu::count());
        $this->assertEquals(19, Outlet::count());

        // 1. TP-1: Peach Cream = 6500
        $tp1Menus = $this->service->getMenusForOutlet('TP-1');
        $peachCreamTp1 = $tp1Menus->firstWhere('name', 'Peach Cream');
        $this->assertNotNull($peachCreamTp1);
        $this->assertEquals(6500, $peachCreamTp1->outlet_price);
        $this->assertNull($tp1Menus->firstWhere('name', 'AMK Premium'));

        // 2. PTC: Peach Jumbo = 8000, tanpa AMKopi
        $ptcMenus = $this->service->getMenusForOutlet('PTC');
        $peachJumboPtc = $ptcMenus->firstWhere('name', 'Peach Jumbo');
        $this->assertNotNull($peachJumboPtc);
        $this->assertEquals(8000, $peachJumboPtc->outlet_price);
        $this->assertEquals(0, $ptcMenus->where('menu_group', 'amkopi')->count());

        // 3. TP-2: AMK Premium = 13000, AMKopi = 12000, AMK Kurma = 12000, tanpa AMK Reguler/Jumbo (#1-34)
        $tp2Menus = $this->service->getMenusForOutlet('TP-2');
        $amkPremiumTp2 = $tp2Menus->firstWhere('name', 'AMK Premium');
        $amkopiTp2 = $tp2Menus->firstWhere('name', 'AMKopi (Air Mata Kopi)');
        $amkKurmaTp2 = $tp2Menus->firstWhere('name', 'AMK Kurma');

        $this->assertNotNull($amkPremiumTp2);
        $this->assertEquals(13000, $amkPremiumTp2->outlet_price);

        $this->assertNotNull($amkopiTp2);
        $this->assertEquals(12000, $amkopiTp2->outlet_price);

        $this->assertNotNull($amkKurmaTp2);
        $this->assertEquals(12000, $amkKurmaTp2->outlet_price);

        $this->assertEquals(0, $tp2Menus->whereIn('menu_group', ['amk_reguler', 'amk_jumbo'])->count());
        $this->assertEquals(20, $tp2Menus->count()); // 12 Premium (#35-46) + 6 AMKopi (#47-52) + 2 Kurma/Kemasan (#53-54)
    }
}
