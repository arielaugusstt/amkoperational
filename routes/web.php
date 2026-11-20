<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\OperationalController;
use Illuminate\Support\Facades\Route;

// Authentication Routes
Route::prefix('api')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Operational & SPG Form Routes
    Route::get('/initial-data', [OperationalController::class, 'initialData']);
    Route::get('/status-today', [OperationalController::class, 'todayStatus']);

    Route::get('/menu1/get', [OperationalController::class, 'getMenu1']);
    Route::post('/menu1/submit', [OperationalController::class, 'submitMenu1']);

    Route::get('/menu2/get', [OperationalController::class, 'getMenu2']);
    Route::post('/menu2/submit', [OperationalController::class, 'submitMenu2']);

    Route::get('/menu3/get', [OperationalController::class, 'getMenu3']);
    Route::post('/menu3/submit', [OperationalController::class, 'submitMenu3']);

    Route::post('/stock-opname/submit', [OperationalController::class, 'submitStockOpname']);

    // Superadmin Routes
    Route::get('/admin/dashboard-stats', [AdminController::class, 'dashboardStats']);
    Route::get('/admin/wa-text', [AdminController::class, 'waText']);
    Route::get('/admin/reverse-analytic', [AdminController::class, 'reverseAnalytic']);
    Route::post('/admin/update-recipe-param', [AdminController::class, 'updateRecipeParam']);

    Route::get('/admin/stock-opname', [AdminController::class, 'stockOpnameList']);
    Route::post('/admin/stock-opname/{id}/approve', [AdminController::class, 'approveStockOpname']);
    Route::post('/admin/stock-opname/{id}/reject', [AdminController::class, 'rejectStockOpname']);

    Route::get('/admin/settings', [AdminController::class, 'getSettings']);
    Route::post('/admin/settings', [AdminController::class, 'updateSettings']);
    Route::post('/admin/change-password', [AuthController::class, 'changePassword']);
    Route::post('/admin/delete-operational-data', [AdminController::class, 'deleteOperationalData']);

    // Master Data Routes
    Route::get('/master-data', [MasterDataController::class, 'getFullMaster']);
    Route::post('/master-data/stand', [MasterDataController::class, 'createStand']);
    Route::put('/master-data/stand/{id}', [MasterDataController::class, 'updateStand']);
    Route::delete('/master-data/stand/{id}', [MasterDataController::class, 'destroyStand']);
    Route::post('/master-data/stand/bulk-delete', [MasterDataController::class, 'bulkDestroyStand']);
    Route::post('/master-data/stand/delete-all', [MasterDataController::class, 'destroyAllStands']);

    Route::post('/master-data/spg', [MasterDataController::class, 'createSPG']);
    Route::put('/master-data/spg/{id}', [MasterDataController::class, 'updateSPG']);
    Route::delete('/master-data/spg/{id}', [MasterDataController::class, 'destroySPG']);
    Route::post('/master-data/spg/bulk-delete', [MasterDataController::class, 'bulkDestroySPG']);
    Route::post('/master-data/spg/delete-all', [MasterDataController::class, 'destroyAllSPG']);

    Route::post('/master-data/menu2', [MasterDataController::class, 'createMenu2Item']);
    Route::put('/master-data/menu2/{id}', [MasterDataController::class, 'updateMenu2Item']);
    Route::delete('/master-data/menu2/{id}', [MasterDataController::class, 'destroyMenu2Item']);
    Route::post('/master-data/menu2/bulk-delete', [MasterDataController::class, 'bulkDestroyMenu2Item']);
    Route::post('/master-data/menu2/delete-all', [MasterDataController::class, 'destroyAllMenu2Items']);

    Route::post('/master-data/ingredient', [MasterDataController::class, 'createIngredient']);
    Route::put('/master-data/ingredient/{id}', [MasterDataController::class, 'updateIngredient']);
    Route::delete('/master-data/ingredient/{id}', [MasterDataController::class, 'destroyIngredient']);
    Route::post('/master-data/ingredient/bulk-delete', [MasterDataController::class, 'bulkDestroyIngredient']);
    Route::post('/master-data/ingredient/delete-all', [MasterDataController::class, 'destroyAllIngredients']);

    Route::post('/master-data/menu1/nominal', [MasterDataController::class, 'createMenu1Nominal']);
    Route::put('/master-data/menu1/nominal/{id}', [MasterDataController::class, 'updateMenu1Nominal']);
    Route::delete('/master-data/menu1/nominal/{id}', [MasterDataController::class, 'destroyMenu1Nominal']);
    Route::post('/master-data/menu1/qty', [MasterDataController::class, 'createMenu1Qty']);
    Route::put('/master-data/menu1/qty/{id}', [MasterDataController::class, 'updateMenu1Qty']);
    Route::delete('/master-data/menu1/qty/{id}', [MasterDataController::class, 'destroyMenu1Qty']);
    Route::post('/master-data/menu1/delete-all', [MasterDataController::class, 'destroyAllMenu1']);

    Route::post('/master-data/resep/batch', [MasterDataController::class, 'createBatch']);
    Route::put('/master-data/resep/batch/{id}', [MasterDataController::class, 'updateBatch']);
    Route::delete('/master-data/resep/batch/{id}', [MasterDataController::class, 'destroyBatch']);
    Route::post('/master-data/resep/batch/delete-all', [MasterDataController::class, 'destroyAllBatches']);

    Route::post('/master-data/resep/mapping', [MasterDataController::class, 'createMapping']);
    Route::put('/master-data/resep/mapping/{id}', [MasterDataController::class, 'updateMapping']);
    Route::delete('/master-data/resep/mapping/{id}', [MasterDataController::class, 'destroyMapping']);
    Route::post('/master-data/resep/mapping/bulk-delete', [MasterDataController::class, 'bulkDestroyMapping']);
    Route::post('/master-data/resep/mapping/delete-all', [MasterDataController::class, 'destroyAllMappings']);

    Route::post('/master-data/import', [MasterDataController::class, 'importMasterData']);
    Route::post('/master-data/seed-defaults', [MasterDataController::class, 'seedDefaultMasterData']);
});

// Single Page Application Fallback Route
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
