<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        $this->applyTestingDatabaseFallback();
        $this->guardAgainstUnsafeTestingDatabase();
        parent::setUp();
    }

    private function applyTestingDatabaseFallback(): void
    {
        $currentConnection = getenv('DB_CONNECTION') ?: 'sqlite';

        if ($currentConnection !== 'sqlite' || extension_loaded('pdo_sqlite')) {
            return;
        }

        $fallbackConnection = getenv('TEST_DB_CONNECTION') ?: '';
        $fallbackDatabase = getenv('TEST_DB_DATABASE') ?: '';

        if ($fallbackConnection === '' || $fallbackDatabase === '') {
            $this->markTestSkipped('pdo_sqlite tidak tersedia. Set TEST_DB_CONNECTION dan TEST_DB_DATABASE yang aman (nama DB harus mengandung test).');
        }

        if (!$this->isSafeTestDatabaseName($fallbackDatabase)) {
            $this->markTestSkipped('TEST_DB_DATABASE tidak aman. Gunakan database khusus testing dengan nama yang mengandung test.');
        }

        $this->setEnv('DB_CONNECTION', $fallbackConnection);
        $this->setEnv('DB_HOST', getenv('TEST_DB_HOST') ?: '127.0.0.1');
        $this->setEnv('DB_PORT', getenv('TEST_DB_PORT') ?: '3306');
        $this->setEnv('DB_DATABASE', $fallbackDatabase);
        $this->setEnv('DB_USERNAME', getenv('TEST_DB_USERNAME') ?: '');
        $this->setEnv('DB_PASSWORD', getenv('TEST_DB_PASSWORD') ?: '');
        $this->setEnv('DB_URL', '');
    }

    private function guardAgainstUnsafeTestingDatabase(): void
    {
        $connection = getenv('DB_CONNECTION') ?: 'sqlite';
        $database = getenv('DB_DATABASE') ?: '';

        if ($connection === 'sqlite') {
            return;
        }

        if (!$this->isSafeTestDatabaseName($database)) {
            $this->markTestSkipped('Safety guard aktif: testing diblokir karena DB_DATABASE tidak mengandung test.');
        }
    }

    private function isSafeTestDatabaseName(string $database): bool
    {
        return $database !== '' && str_contains(strtolower($database), 'test');
    }

    private function setEnv(string $key, string $value): void
    {
        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}
