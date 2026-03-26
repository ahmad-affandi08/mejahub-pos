<?php

namespace App\Modules\Settings\PrinterSilent;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrinterSilentResource extends Controller
{
	public function __construct(private readonly PrinterSilentService $service)
	{
	}

	public function index(Request $request): Response
	{
		$search = trim((string) $request->query('search', ''));
		$perPage = (int) $request->query('per_page', 10);

		$perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
		$paginator = $this->service->paginate($search, $perPage);

		return Inertia::render('Settings/PrinterSilent/Index', [
			'printerSilent' => PrinterSilentCollection::toIndex($paginator),
			'filters' => [
				'search' => $search,
				'per_page' => $perPage,
			],
			'flashMessage' => [
				'success' => $request->session()->get('success'),
			],
		]);
	}

	public function store(Request $request): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['required', 'string', 'max:30', 'unique:settings_printer_silent,kode'],
			'nama' => ['required', 'string', 'max:120'],
			'tipe_printer' => ['required', 'string', 'in:kitchen,cashier,bar,receipt,other'],
			'connection_type' => ['required', 'string', 'in:network,usb,bluetooth'],
			'ip_address' => ['nullable', 'string', 'max:60'],
			'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
			'device_name' => ['nullable', 'string', 'max:120'],
			'paper_size' => ['nullable', 'string', 'max:20'],
			'copies' => ['nullable', 'integer', 'min:1', 'max:10'],
			'auto_print_order' => ['nullable', 'boolean'],
			'auto_print_payment' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
			'is_default' => ['nullable', 'boolean'],
			'keterangan' => ['nullable', 'string'],
		]);

		$payload['port'] = isset($payload['port']) ? (int) $payload['port'] : null;
		$payload['copies'] = (int) ($payload['copies'] ?? 1);
		$payload['paper_size'] = $payload['paper_size'] ?? '80mm';
		$payload['auto_print_order'] = (bool) ($payload['auto_print_order'] ?? true);
		$payload['auto_print_payment'] = (bool) ($payload['auto_print_payment'] ?? true);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);

		$this->service->create($payload);

		return redirect()
			->route('settings.printer-silent.index')
			->with('success', 'Konfigurasi printer berhasil ditambahkan.');
	}

	public function update(Request $request, int $id): RedirectResponse
	{
		$payload = $request->validate([
			'kode' => ['required', 'string', 'max:30', 'unique:settings_printer_silent,kode,' . $id],
			'nama' => ['required', 'string', 'max:120'],
			'tipe_printer' => ['required', 'string', 'in:kitchen,cashier,bar,receipt,other'],
			'connection_type' => ['required', 'string', 'in:network,usb,bluetooth'],
			'ip_address' => ['nullable', 'string', 'max:60'],
			'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
			'device_name' => ['nullable', 'string', 'max:120'],
			'paper_size' => ['nullable', 'string', 'max:20'],
			'copies' => ['nullable', 'integer', 'min:1', 'max:10'],
			'auto_print_order' => ['nullable', 'boolean'],
			'auto_print_payment' => ['nullable', 'boolean'],
			'is_active' => ['nullable', 'boolean'],
			'is_default' => ['nullable', 'boolean'],
			'keterangan' => ['nullable', 'string'],
		]);

		$payload['port'] = isset($payload['port']) ? (int) $payload['port'] : null;
		$payload['copies'] = (int) ($payload['copies'] ?? 1);
		$payload['paper_size'] = $payload['paper_size'] ?? '80mm';
		$payload['auto_print_order'] = (bool) ($payload['auto_print_order'] ?? true);
		$payload['auto_print_payment'] = (bool) ($payload['auto_print_payment'] ?? true);
		$payload['is_active'] = (bool) ($payload['is_active'] ?? true);
		$payload['is_default'] = (bool) ($payload['is_default'] ?? false);

		$this->service->update($id, $payload);

		return redirect()
			->route('settings.printer-silent.index')
			->with('success', 'Konfigurasi printer berhasil diperbarui.');
	}

	public function destroy(int $id): RedirectResponse
	{
		$this->service->delete($id);

		return redirect()
			->route('settings.printer-silent.index')
			->with('success', 'Konfigurasi printer berhasil dihapus.');
	}

	public function create(): RedirectResponse
	{
		return redirect()->route('settings.printer-silent.index');
	}

	public function show(): RedirectResponse
	{
		return redirect()->route('settings.printer-silent.index');
	}

	public function edit(): RedirectResponse
	{
		return redirect()->route('settings.printer-silent.index');
	}
}
