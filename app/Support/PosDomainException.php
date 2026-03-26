<?php

namespace App\Support;

use RuntimeException;

class PosDomainException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly int $status = 422,
    ) {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }
}
