<?php

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

                $urlSlug = $moduleSlug . '/' . $featureSlug;

                $routeName = $moduleSlug . '.' . $featureSlug;

                $resourceRoute = Route::resource($urlSlug, $resourceClass)
                    ->parameters([$urlSlug => 'id'])
                    ->names($routeName);

                if (Str::lower($moduleName) === 'auth' && method_exists($resourceClass, 'destroy')) {
                    Route::delete($urlSlug, [$resourceClass, 'destroy'])
                        ->name($routeName . '.logout');

                    Route::get($moduleSlug . '/logout', [$resourceClass, 'destroy'])
                        ->name($moduleSlug . '.logout');
                }

                if (Str::lower($moduleName) !== 'auth') {
                    $permissionKey = $moduleSlug . '.' . $featureSlug . '.access';

                    $resourceRoute->middleware(['auth', 'permission:' . $permissionKey]);

                    if (method_exists($resourceClass, 'storeBulk')) {
                        Route::post($urlSlug . '/bulk', [$resourceClass, 'storeBulk'])
                            ->middleware(['auth', 'permission:' . $permissionKey])
                            ->name($routeName . '.bulk');
                    }

                    Route::post($urlSlug . '/delete', function (Request $request) use ($resourceClass) {
                        $id = (string) $request->input('id', '');

                        if (trim($id) === '') {
                            abort(422, 'Parameter id wajib diisi.');
                        }

                        return app($resourceClass)->destroy((int) $id);
                    })
                        ->middleware(['auth', 'permission:' . $permissionKey])
                        ->name($routeName . '.delete');

                    Route::delete($urlSlug, function (Request $request) use ($resourceClass) {
                        $id = (string) $request->input('id', '');

                        if (trim($id) === '') {
                            abort(422, 'Parameter id wajib diisi.');
                        }

                        return app($resourceClass)->destroy((int) $id);
                    })
                        ->middleware(['auth', 'permission:' . $permissionKey])
                        ->name($routeName . '.destroy-by-body');
                }
            }
        }
    }
}
