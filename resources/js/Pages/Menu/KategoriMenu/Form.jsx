import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, initialValues, onSuccess, onCancel, endpoint }) {
	const { data, setData, post, put, processing, errors, reset } = useForm({
		kode: initialValues?.kode ?? "",
		nama: initialValues?.nama ?? "",
		deskripsi: initialValues?.deskripsi ?? "",
		urutan: initialValues?.urutan ?? 0,
		is_active: initialValues?.is_active ?? true,
	});

	const submit = (event) => {
		event.preventDefault();

		const options = {
			preserveScroll: true,
			onSuccess: () => {
				reset();
				onSuccess?.();
			},
		};

		if (mode === "edit" && initialValues?.id) {
			put(`${endpoint}/${initialValues.id}`, options);
			return;
		}

		post(endpoint, options);
	};

	return (
		<form onSubmit={submit} className="space-y-4">
			<div className="space-y-1.5">
				<label className="text-sm font-medium">Kode</label>
				<Input
					value={data.kode}
					onChange={(event) => setData("kode", event.target.value)}
					placeholder="Contoh: MKN"
				/>
				{errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Nama Kategori</label>
				<Input
					value={data.nama}
					onChange={(event) => setData("nama", event.target.value)}
					placeholder="Contoh: Makanan"
					required
				/>
				{errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Deskripsi</label>
				<Input
					value={data.deskripsi}
					onChange={(event) => setData("deskripsi", event.target.value)}
					placeholder="Catatan singkat kategori"
				/>
				{errors.deskripsi ? <p className="text-xs text-destructive">{errors.deskripsi}</p> : null}
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<label className="text-sm font-medium">Urutan</label>
					<Input
						type="number"
						min={0}
						value={data.urutan}
						onChange={(event) => setData("urutan", Number(event.target.value || 0))}
					/>
					{errors.urutan ? <p className="text-xs text-destructive">{errors.urutan}</p> : null}
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium">Status</label>
					<select
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
						value={data.is_active ? "1" : "0"}
						onChange={(event) => setData("is_active", event.target.value === "1")}
					>
						<option value="1">Aktif</option>
						<option value="0">Nonaktif</option>
					</select>
					{errors.is_active ? <p className="text-xs text-destructive">{errors.is_active}</p> : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
				<Button type="submit" disabled={processing}>
					{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
				</Button>
			</DialogFooter>
		</form>
	);
}
