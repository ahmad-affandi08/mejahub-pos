<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect('/auth/login', 303);
        }

        $roles = $user->hakAkses()->where('is_active', true)->with('permissions')->get();

        // Bootstrap-safe mode: if no role assigned yet, allow access.
        if ($roles->isEmpty()) {
            return $next($request);
        }

        $keys = $roles
            ->flatMap(fn ($role) => $role->permissions->pluck('permission_key'))
            ->filter()
            ->unique()
            ->values();

        // Bootstrap-safe mode: if user already has roles but permissions are not configured yet,
        // do not lock the user out of pages.
        if ($keys->isEmpty()) {
            return $next($request);
        }

        if ($keys->contains($permission) || $keys->contains('*')) {
            return $next($request);
        }

        abort(403, 'Anda tidak memiliki hak akses untuk halaman ini.');
    }
}
