<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/menu/kategori-menu');
    }

    return redirect('/auth/login');
});


$modulesPath = app_path('Modules');

if (File::exists($modulesPath)) {
    $modules = File::directories($modulesPath);

    foreach ($modules as $module) {
        $moduleName = basename($module);

        $features = File::directories($module);

        foreach ($features as $feature) {
            $featureName = basename($feature);

            $resourceClass = "App\\Modules\\{$moduleName}\\{$featureName}\\{$featureName}Resource";

            if (File::exists($feature . '/' . $featureName . 'Resource.php')) {

                $urlSlug = Str::kebab($moduleName) . '/' . Str::kebab($featureName);

                $routeName = Str::kebab($moduleName) . '.' . Str::kebab($featureName);

                $resourceRoute = Route::resource($urlSlug, $resourceClass)
                    ->parameters([$urlSlug => 'id'])
                    ->names($routeName);

                if (Str::lower($moduleName) !== 'auth') {
                    $resourceRoute->middleware('auth');
                }
            }
        }
    }
}
