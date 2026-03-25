<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        $this->applyTestingDatabaseFallback();
        parent::setUp();
    }

    private function applyTestingDatabaseFallback(): void
    {
        $currentConnection = getenv('DB_CONNECTION') ?: 'sqlite';

        if ($currentConnection !== 'sqlite' || extension_loaded('pdo_sqlite')) {
            return;
        }

        $fallbackConnection = getenv('TEST_DB_CONNECTION') ?: '';

        if ($fallbackConnection === '') {
            $this->markTestSkipped('pdo_sqlite tidak tersedia. Set TEST_DB_CONNECTION dkk untuk fallback database testing.');
        }

        $this->setEnv('DB_CONNECTION', $fallbackConnection);
        $this->setEnv('DB_HOST', getenv('TEST_DB_HOST') ?: '127.0.0.1');
        $this->setEnv('DB_PORT', getenv('TEST_DB_PORT') ?: '3306');
        $this->setEnv('DB_DATABASE', getenv('TEST_DB_DATABASE') ?: '');
        $this->setEnv('DB_USERNAME', getenv('TEST_DB_USERNAME') ?: '');
        $this->setEnv('DB_PASSWORD', getenv('TEST_DB_PASSWORD') ?: '');
        $this->setEnv('DB_URL', '');
    }

    private function setEnv(string $key, string $value): void
    {
        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}
