<?php

use App\Modules\Inventory\BahanBaku\BahanBakuResource;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Http\Request;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/dashboard/overview');
    }

    return redirect('/auth/login');
});

Route::get('/login', function () {
    return redirect('/auth/login');
})->name('login');


$modulesPath = app_path('Modules');

$resourceActions = ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'];
$actionsWithRouteParam = ['show', 'edit', 'update', 'destroy'];

$hasAction = static function (string $resourceClass, string $action): bool {
    return method_exists($resourceClass, $action);
};

$isRouteParamCompatible = static function (string $resourceClass, string $action) use ($actionsWithRouteParam): bool {
    if (!method_exists($resourceClass, $action)) {
        return false;
    }

    if (!in_array($action, $actionsWithRouteParam, true)) {
        return true;
    }

    try {
        $method = new \ReflectionMethod($resourceClass, $action);
    } catch (\Throwable) {
        return false;
    }

    $routeBindableCount = 0;

    foreach ($method->getParameters() as $parameter) {
        $type = $parameter->getType();

        if ($type instanceof \ReflectionNamedType && !$type->isBuiltin()) {
            continue;
        }

        $routeBindableCount++;
    }

    return $routeBindableCount >= 1;
};

if (File::exists($modulesPath)) {
    $modules = File::directories($modulesPath);

    foreach ($modules as $module) {
        $moduleName = basename($module);

        $features = File::directories($module);

        foreach ($features as $feature) {
            $featureName = basename($feature);
            $moduleSlug = Str::kebab(Str::lower($moduleName));
            $featureSlug = Str::kebab($featureName);

            $resourceClass = "App\\Modules\\{$moduleName}\\{$featureName}\\{$featureName}Resource";

            if (File::exists($feature . '/' . $featureName . 'Resource.php')) {

                    $availableActions = array_values(array_filter(
                        $resourceActions,
                        static fn (string $action): bool => $isRouteParamCompatible($resourceClass, $action)
                    ));

                    if ($availableActions === []) {
                        continue;
                    }

                $urlSlug = $moduleSlug . '/' . $featureSlug;

                $routeName = $moduleSlug . '.' . $featureSlug;

                    $resourceKey = Str::afterLast($urlSlug, '/');

                    $isAuthModule = Str::lower($moduleName) === 'auth';

                    if ($isAuthModule) {
                        // Auth module only needs index/store resource routes; logout is handled explicitly below.
                        $availableActions = array_values(array_intersect($availableActions, ['index', 'store']));
                    }

                    if ($availableActions === []) {
                        continue;
                    }

                $resourceRoute = Route::resource($urlSlug, $resourceClass)
                        ->only($availableActions)
                        ->parameters([$resourceKey => 'id'])
                        ->names($routeName);

                    if ($isAuthModule && $hasAction($resourceClass, 'destroy')) {
                        Route::delete($urlSlug, [$resourceClass, 'destroy'])
                            ->name($routeName . '.logout');

                        Route::get($moduleSlug . '/logout', [$resourceClass, 'destroy'])
                            ->name($moduleSlug . '.logout');
                    }

                    if (!$isAuthModule) {
                        $permissionKey = $moduleSlug . '.' . $featureSlug . '.access';

                        $resourceRoute->middleware(['auth', 'permission:' . $permissionKey]);

                        if ($hasAction($resourceClass, 'storeBulk')) {
                            Route::post($urlSlug . '/bulk', [$resourceClass, 'storeBulk'])
                                ->middleware(['auth', 'permission:' . $permissionKey])
                                ->name($routeName . '.bulk');
                        }

                        if ($hasAction($resourceClass, 'storePayment')) {
                            Route::post($urlSlug . '/{id}/payment', [$resourceClass, 'storePayment'])
                                ->middleware(['auth', 'permission:' . $permissionKey])
                                ->name($routeName . '.payment');
                        }

                        if (in_array('destroy', $availableActions, true)) {
                            Route::post($urlSlug . '/delete', function (Request $request) use ($resourceClass) {
                                $validated = $request->validate([
                                    'id' => ['required', 'integer', 'min:1'],
                                ]);

                                return app($resourceClass)->destroy((int) $validated['id']);
                            })
                                ->middleware(['auth', 'permission:' . $permissionKey])
                                ->name($routeName . '.delete');

                            Route::delete($urlSlug, function (Request $request) use ($resourceClass) {
                                $validated = $request->validate([
                                    'id' => ['required', 'integer', 'min:1'],
                                ]);

                                return app($resourceClass)->destroy((int) $validated['id']);
                            })
                                ->middleware(['auth', 'permission:' . $permissionKey])
                                ->name($routeName . '.destroy-by-body');
                        }
                    }
                }
            }
        }
    }

Route::middleware(['auth', 'permission:inventory.bahan-baku.access'])->group(function () {
    Route::get('inventory/bahan-baku/export/pdf', [BahanBakuResource::class, 'exportPdf'])
        ->name('inventory.bahan-baku.export-pdf');

    Route::get('inventory/bahan-baku/export/excel', [BahanBakuResource::class, 'exportExcel'])
        ->name('inventory.bahan-baku.export-excel');
});
