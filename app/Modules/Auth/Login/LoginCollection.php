<?php

namespace App\Modules\Auth\Login;

class LoginCollection
{
    public static function guestPayload(): array
    {
        return [
            'status' => session('status'),
        ];
    }
}
