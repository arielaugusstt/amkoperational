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

    // Master Data Routes
    Route::get('/master-data', [MasterDataController::class, 'getFullMaster']);
    Route::post('/master-data/stand', [MasterDataController::class, 'createStand']);
    Route::put('/master-data/stand/{id}', [MasterDataController::class, 'updateStand']);
    Route::post('/master-data/spg', [MasterDataController::class, 'createSPG']);
    Route::put('/master-data/spg/{id}', [MasterDataController::class, 'updateSPG']);
    Route::post('/master-data/menu2', [MasterDataController::class, 'createMenu2Item']);
    Route::put('/master-data/menu2/{id}', [MasterDataController::class, 'updateMenu2Item']);
    Route::post('/master-data/ingredient', [MasterDataController::class, 'createIngredient']);
    Route::put('/master-data/ingredient/{id}', [MasterDataController::class, 'updateIngredient']);
    Route::post('/master-data/import', [MasterDataController::class, 'importMasterData']);
});

// Single Page Application Fallback Route
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
