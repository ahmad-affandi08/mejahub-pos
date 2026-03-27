<?php
namespace App\Modules\Report\LaporanPerformaMenu;
class LaporanPerformaMenuCollection { public static function toDashboard(array $d): array { return ['best_sellers'=>$d['best_sellers']??[],'dead_stock'=>$d['dead_stock']??[],'ticket_size'=>$d['ticket_size']??[],'diskon'=>$d['diskon']??[]]; } }
