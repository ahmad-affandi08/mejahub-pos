<?php
namespace App\Modules\Report\LaporanHeatmap;
class LaporanHeatmapCollection { public static function toDashboard(array $d): array { return ['heatmap'=>$d['heatmap']??[],'max_count'=>$d['max_count']??0,'peak'=>$d['peak']??[],'hourly_totals'=>$d['hourly_totals']??[],'days'=>$d['days']??[]]; } }
