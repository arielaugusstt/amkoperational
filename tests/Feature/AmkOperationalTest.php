<?php

namespace Tests\Feature;

use App\Models\DailyReportMenu1;
use App\Models\MasterStand;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AmkOperationalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }
    public function test_login_spg_and_admin_works(): void
    {
        $res = $this->postJson('/api/login', [
            'username' => 'spg1',
            'password' => '1234',
        ]);
        $res->assertStatus(200);
        $res->assertJsonPath('success', true);
        $res->assertJsonPath('user.role', 'spg');

        $resAdmin = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);
        $resAdmin->assertStatus(200);
        $resAdmin->assertJsonPath('success', true);
        $resAdmin->assertJsonPath('user.role', 'superadmin');
    }

    public function test_initial_data_returns_stands_and_menus(): void
    {
        $user = User::where('role', 'spg')->first();
        $res = $this->actingAs($user)->getJson('/api/initial-data');
        $res->assertStatus(200);
        $res->assertJsonStructure(['stands', 'spg_list', 'menu1_nominals', 'menu1_qtys', 'menu2_items', 'menu2_prices', 'ingredients']);
    }

    public function test_menu1_payment_balance_validation(): void
    {
        $user = User::where('role', 'spg')->first();
        $stand = MasterStand::first();

        // Failure case: total 1,000,000 but qris 500,000 + tunai 400,000 (selisih 100,000)
        $failRes = $this->actingAs($user)->postJson('/api/menu1/submit', [
            'stand_id' => $stand->id,
            'tanggal' => '2026-11-12',
            'spg_list' => [$user->id],
            'nominal_per_kategori' => ['NOM_AMK' => 1000000],
            'total_semua_penjualan' => 1000000,
            'nominal_qris' => 500000,
            'nominal_tunai' => 400000,
        ]);
        $failRes->assertStatus(422);

        // Success case: total 1,000,000 and qris 600,000 + tunai 400,000
        $successRes = $this->actingAs($user)->postJson('/api/menu1/submit', [
            'stand_id' => $stand->id,
            'tanggal' => '2026-11-12',
            'spg_list' => [$user->id],
            'nominal_per_kategori' => [
                'NOM_AMK' => 800000,
                'NOM_KURMA' => 100000,
                'NOM_AMKOPI' => 100000,
            ],
            'total_semua_penjualan' => 1000000,
            'nominal_qris' => 600000,
            'nominal_tunai' => 400000,
            'biaya_harian' => [['keterangan' => 'Es Batu', 'nominal' => 20000]],
            'total_biaya' => 20000,
            'sisa_setoran_tunai' => 380000,
            'qty_per_item' => [
                'QTY_CUP_12' => 50,
                'QTY_CUP_22' => 20,
                'QTY_CUP_16' => 10,
                'QTY_CUP_KURMA' => 5,
                'QTY_CUP_KOPI' => 5,
            ]
        ]);
        $successRes->assertStatus(200);
        $successRes->assertJsonPath('success', true);
    }

    public function test_menu2_gatekeeper_and_balance_check(): void
    {
        $user = User::where('role', 'spg')->first();
        $stand2 = MasterStand::skip(1)->first();

        // Stand 2 has no Menu 1 for tomorrow: should fail gatekeeper
        $gatekeeperFail = $this->actingAs($user)->postJson('/api/menu2/submit', [
            'stand_id' => $stand2->id,
            'tanggal' => '2026-11-15',
            'items_sold' => [['menu2_item_id' => 1, 'qty' => 10, 'harga' => 10000, 'subtotal' => 100000]],
            'grand_total' => 500000,
        ]);
        $gatekeeperFail->assertStatus(422);
        $gatekeeperFail->assertJsonFragment(['message' => 'Data Laporan Harian (Menu 1) untuk Stand dan Tanggal ini belum tersedia! Harap segera input di Menu 1 terlebih dahulu.']);
    }

    public function test_reverse_analytic_and_wa_generator(): void
    {
        $admin = User::where('role', 'superadmin')->first();

        $waRes = $this->actingAs($admin)->getJson('/api/admin/wa-text?tanggal=2026-11-12');
        $waRes->assertStatus(200);
        $waRes->assertJsonStructure(['tanggal', 'text']);
        $this->assertStringContainsString('TGL', $waRes->json('text'));
        $this->assertStringContainsString('Total AMK', $waRes->json('text'));

        $revRes = $this->actingAs($admin)->getJson('/api/admin/reverse-analytic?stand_id=all&start_date=2026-11-12&end_date=2026-11-12');
        $revRes->assertStatus(200);
        $revRes->assertJsonStructure(['table1_batch_needs', 'table2_audit_comparison']);
    }
}
