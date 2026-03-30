<?php

namespace App\Support;

class PaymentMethodCatalog
{
    public const SETTINGS_TYPE_CODES = [
        'cash',
        'digital',
        'card',
        'transfer',
        'ewallet',
        'other',
    ];

    public const FINANCE_METHOD_CODES = [
        'kas',
        'bank',
        'petty_cash',
    ];

    public const POS_REFUND_METHOD_CODES = [
        'cash',
        'transfer',
        'qris',
        'debit',
        'credit',
    ];

    /**
     * Alias lintas modul agar data lama/beragam tetap terbaca konsisten.
     */
    private const FINANCE_METHOD_ALIASES = [
        'cash' => 'kas',
        'tunai' => 'kas',
        'kas' => 'kas',
        'petty_cash' => 'petty_cash',
        'bank' => 'bank',
        'transfer' => 'bank',
        'transfer_bank' => 'bank',
        'ewallet' => 'bank',
        'qris' => 'bank',
        'debit' => 'bank',
        'credit' => 'bank',
    ];

    public static function inRule(array $codes): string
    {
        return 'in:' . implode(',', $codes);
    }

    public static function normalizeFinanceMethod(string|null $method, string $fallback = 'kas'): string
    {
        $value = strtolower(trim((string) $method));

        if ($value === '') {
            return $fallback;
        }

        return self::FINANCE_METHOD_ALIASES[$value] ?? $fallback;
    }

    public static function resolveFinanceAccountByMethod(string|null $method): string
    {
        $normalized = self::normalizeFinanceMethod($method);

        return in_array($normalized, ['kas', 'petty_cash'], true) ? 'kas' : 'bank';
    }
}
