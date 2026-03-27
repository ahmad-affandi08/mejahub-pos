<?php

namespace App\Modules\Finance\Hutang;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class HutangResource extends Controller
{
    protected $service;

    public function __construct(HutangService $service)
    {
        $this->service = $service;
    }

    /**
     * Menampilkan halaman list Hutang.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status']);
        $hutangs = $this->service->listHutang($filters);

        return Inertia::render('Finance/Hutang/Index', [
            'data' => HutangCollection::toIndex($hutangs),
            'filters' => $filters,
        ]);
    }

    /**
     * Menyimpan data pembayaran cicilan.
     */
    public function storePayment(Request $request, $id)
    {
        $request->validate([
            'nominal_bayar' => 'required|numeric|min:1',
            'metode_pembayaran' => 'required|string',
            'tanggal_bayar' => 'required|date',
        ]);

        $hutang = HutangEntity::findOrFail($id);

        try {
            $this->service->storePayment($hutang, $request->all());
            return redirect()->back()->with('success', 'Pembayaran hutang berhasil dicatat.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
