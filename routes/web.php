<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

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
                }
            }
        }
    }
}
