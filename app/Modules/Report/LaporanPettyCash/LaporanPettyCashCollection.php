<?php
namespace App\Modules\Report\LaporanPettyCash;
class LaporanPettyCashCollection { public static function toDashboard(array $d): array { return ['summary'=>$d['summary']??[],'expense_by_category'=>$d['expense_by_category']??[],'petty_cash_details'=>$d['petty_cash_details']??[]]; } }
