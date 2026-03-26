<?php

namespace App\Modules\Auth\Login;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Modules\Auth\Login\LoginCollection;
use App\Modules\Auth\Login\LoginService;

class LoginResource extends Controller
{
    public function __construct(private readonly LoginService $service)
    {
    }

    public function index(): Response|RedirectResponse
    {
        if (auth()->check()) {
            return redirect($this->resolveRedirectUrl());
        }

        return Inertia::render('Auth/Login', LoginCollection::guestPayload());
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $remember = (bool) ($payload['remember'] ?? false);

        $this->service->attempt([
            'email' => $payload['email'],
            'password' => $payload['password'],
        ], $remember, $request);

        return redirect($this->resolveRedirectUrl());
    }

    public function destroy(Request $request, ?int $id = null): RedirectResponse
    {
        $this->service->logout($request);

        return redirect('/auth/login');
    }

    private function resolveRedirectUrl(): string
    {
        $user = auth()->user();

        if (!$user) {
            return '/dashboard/overview';
        }

        $isStaff = $user->hakAkses()
            ->where('is_active', true)
            ->where('kode', 'staff')
            ->exists();

        if ($isStaff) {
            return '/hr/e-absensi';
        }

        return '/dashboard/overview';
    }
}
