<?php

namespace App\Modules\Settings\RecycleBin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecycleBinEntity extends Model
{
	use HasFactory;

	protected $table = 'recycle_bin_virtual';

	public $timestamps = false;

	protected $guarded = [];
}
