import { useForm } from "@inertiajs/react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Form({ mode, endpoint, initialValues, userOptions, onSuccess, onCancel }) {
	const { data, setData, post, put, processing, errors } = useForm({
		kode: initialValues?.kode ?? "",
		nama: initialValues?.nama ?? "",
		deskripsi: initialValues?.deskripsi ?? "",
		permissions_text: (initialValues?.permissions ?? []).join(", "),
		user_ids: initialValues?.user_ids ?? [],
		is_active: initialValues?.is_active ?? true,
	});

	const submit = (event) => {
		event.preventDefault();

		const payload = {
			kode: data.kode,
			nama: data.nama,
			deskripsi: data.deskripsi,
			is_active: data.is_active,
			user_ids: data.user_ids,
			permissions: data.permissions_text
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean),
		};

		const options = {
			preserveScroll: true,
			onSuccess,
			data: payload,
		};

		if (mode === "edit" && initialValues?.id) {
			put(`${endpoint}/${initialValues.id}`, options);
			return;
		}

		post(endpoint, options);
	};

	const selectedUsersText = useMemo(() => {
		if (!data.user_ids.length) return "Belum ada user terpilih";

		return userOptions
			.filter((user) => data.user_ids.includes(user.id))
			.map((user) => user.name)
			.join(", ");
	}, [data.user_ids, userOptions]);

	return (
		<form onSubmit={submit} className="space-y-4">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div className="space-y-1.5">
					<label className="text-sm font-medium">Kode Role</label>
					<Input
						value={data.kode}
						onChange={(event) => setData("kode", event.target.value)}
						placeholder="Contoh: kasir"
						required
					/>
					{errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium">Nama Role</label>
					<Input
						value={data.nama}
						onChange={(event) => setData("nama", event.target.value)}
						placeholder="Contoh: Kasir Outlet"
						required
					/>
					{errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
				</div>
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Deskripsi</label>
				<Input
					value={data.deskripsi}
					onChange={(event) => setData("deskripsi", event.target.value)}
					placeholder="Deskripsi singkat role"
				/>
				{errors.deskripsi ? <p className="text-xs text-destructive">{errors.deskripsi}</p> : null}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Permission Keys (pisahkan koma)</label>
				<Input
					value={data.permissions_text}
					onChange={(event) => setData("permissions_text", event.target.value)}
					placeholder="menu.kategori-menu.access, hr.data-pegawai.access"
				/>
				{errors.permissions ? <p className="text-xs text-destructive">{errors.permissions}</p> : null}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Assign User</label>
				<select
					multiple
					className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
					value={data.user_ids.map(String)}
					onChange={(event) => {
						const values = Array.from(event.target.selectedOptions).map((option) => Number(option.value));
						setData("user_ids", values);
					}}
				>
					{userOptions.map((user) => (
						<option key={user.id} value={user.id}>
							{user.name} ({user.email})
						</option>
					))}
				</select>
				<p className="text-xs text-muted-foreground">{selectedUsersText}</p>
				{errors.user_ids ? <p className="text-xs text-destructive">{errors.user_ids}</p> : null}
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
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
				<Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
			</DialogFooter>
		</form>
	);
}
