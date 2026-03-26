import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
	const { data, setData, post, transform, processing, errors, reset } = useForm({
		no_identitas: initialValues?.no_identitas ?? "",
		nama: initialValues?.nama ?? "",
		jabatan: initialValues?.jabatan ?? "",
		nomor_telepon: initialValues?.nomor_telepon ?? "",
		alamat: initialValues?.alamat ?? "",
		email: initialValues?.email ?? "",
		password: "",
		is_active: initialValues?.is_active ?? true,
	});

	const submit = (event) => {
		event.preventDefault();

		const options = {
			preserveScroll: true,
			onSuccess: () => {
				reset("password");
				onSuccess?.();
			},
		};

		if (mode === "edit" && initialValues?.id) {
			transform((payload) => ({ ...payload, _method: "put" }));
			post(`${endpoint}/${initialValues.id}`, options);
			return;
		}

		transform((payload) => payload);
		post(endpoint, options);
	};

	return (
		<form onSubmit={submit} className="space-y-4">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div className="space-y-1.5">
					<label className="text-sm font-medium">No Identitas</label>
					<Input
						value={data.no_identitas}
						onChange={(event) => setData("no_identitas", event.target.value)}
						placeholder="Contoh: EMP-0001"
					/>
					{errors.no_identitas ? <p className="text-xs text-destructive">{errors.no_identitas}</p> : null}
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium">Nama Pegawai</label>
					<Input
						value={data.nama}
						onChange={(event) => setData("nama", event.target.value)}
						placeholder="Nama lengkap"
						required
					/>
					{errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div className="space-y-1.5">
					<label className="text-sm font-medium">Jabatan</label>
					<Input
						value={data.jabatan}
						onChange={(event) => setData("jabatan", event.target.value)}
						placeholder="Kasir / Supervisor"
					/>
					{errors.jabatan ? <p className="text-xs text-destructive">{errors.jabatan}</p> : null}
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium">Nomor Telepon</label>
					<Input
						value={data.nomor_telepon}
						onChange={(event) => setData("nomor_telepon", event.target.value)}
						placeholder="08xxxxxxxxxx"
					/>
					{errors.nomor_telepon ? <p className="text-xs text-destructive">{errors.nomor_telepon}</p> : null}
				</div>
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Alamat</label>
				<Input
					value={data.alamat}
					onChange={(event) => setData("alamat", event.target.value)}
					placeholder="Alamat pegawai"
				/>
				{errors.alamat ? <p className="text-xs text-destructive">{errors.alamat}</p> : null}
			</div>

			<div className="rounded-xl border border-dashed p-3">
				<p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Data Auth</p>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div className="space-y-1.5">
						<label className="text-sm font-medium">Email Login</label>
						<Input
							type="email"
							value={data.email}
							onChange={(event) => setData("email", event.target.value)}
							placeholder="pegawai@mejahub.local"
						/>
						{errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium">Password Login</label>
						<Input
							type="password"
							value={data.password}
							onChange={(event) => setData("password", event.target.value)}
							placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
						/>
						{errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
					</div>
				</div>
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

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
				<Button type="submit" disabled={processing}>
					{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}
				</Button>
			</DialogFooter>
		</form>
	);
}
