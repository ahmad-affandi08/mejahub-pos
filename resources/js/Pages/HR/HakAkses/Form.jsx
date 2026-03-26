import { useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const unique = (items) => Array.from(new Set(items));

const extractCustomPermissions = (permissions, availablePermissions) => {
	const allowed = new Set(availablePermissions);

	return (permissions ?? []).filter((key) => !allowed.has(key));
};

const parseCustomPermissionInput = (value) => {
	return value
		.split(/[,\n]/)
		.map((item) => item.trim())
		.filter(Boolean);
};

export default function Form({ mode, endpoint, initialValues, userOptions, permissionCatalog, onSuccess, onCancel }) {
	const [selectedTemplate, setSelectedTemplate] = useState("");
	const [userSearch, setUserSearch] = useState("");
	const [bulkJabatan, setBulkJabatan] = useState("");

	const availablePermissions = useMemo(() => {
		return (permissionCatalog ?? []).flatMap((group) => (group.items ?? []).map((item) => item.key));
	}, [permissionCatalog]);

	const availablePermissionSet = useMemo(() => new Set(availablePermissions), [availablePermissions]);

	const templateOptions = useMemo(() => {
		const byPrefix = (prefixes) => {
			return availablePermissions.filter((key) => prefixes.some((prefix) => key.startsWith(prefix)));
		};

		const admin = availablePermissions;
		const hr = byPrefix(["hr."]);
		const kasir = byPrefix(["pos.", "meja.", "menu.", "settings.metode-pembayaran.", "settings.profil-toko.", "settings.printer-silent."]);
		const kitchen = byPrefix(["kitchen.", "menu."]);
		const manager = byPrefix(["hr.", "pos.", "meja.", "menu.", "inventory.", "report."]);

		return [
			{ value: "admin", label: "Admin / Owner (semua akses)", permissions: admin },
			{ value: "manager", label: "Manager Outlet", permissions: manager },
			{ value: "kasir", label: "Kasir", permissions: kasir },
			{ value: "kitchen", label: "Kitchen", permissions: kitchen },
			{ value: "hr", label: "HR", permissions: hr },
		].filter((item) => item.permissions.length > 0);
	}, [availablePermissions]);

	const initialPermissionKeys = useMemo(() => {
		return unique((initialValues?.permissions ?? []).filter((key) => availablePermissionSet.has(key)));
	}, [initialValues?.permissions, availablePermissionSet]);

	const initialCustomPermissions = useMemo(() => {
		return extractCustomPermissions(initialValues?.permissions ?? [], availablePermissions).join(", ");
	}, [initialValues?.permissions, availablePermissions]);

	const { data, setData, post, transform, processing, errors } = useForm({
		kode: initialValues?.kode ?? "",
		nama: initialValues?.nama ?? "",
		deskripsi: initialValues?.deskripsi ?? "",
		permission_keys: initialPermissionKeys,
		custom_permissions_text: initialCustomPermissions,
		user_ids: initialValues?.user_ids ?? [],
		is_active: initialValues?.is_active ?? true,
	});

	const filteredUsers = useMemo(() => {
		const keyword = userSearch.trim().toLowerCase();

		if (!keyword) {
			return userOptions;
		}

		return userOptions.filter((user) => {
			const label = `${user.name} ${user.email} ${user.jabatan ?? ""}`.toLowerCase();

			return label.includes(keyword);
		});
	}, [userSearch, userOptions]);

	const selectedPermissionsCount = data.permission_keys.length + parseCustomPermissionInput(data.custom_permissions_text).length;

	const jabatanOptions = useMemo(() => {
		return unique(
			userOptions
				.map((user) => (user.jabatan ?? "").trim())
				.filter(Boolean)
		).sort((a, b) => a.localeCompare(b));
	}, [userOptions]);

	const togglePermission = (permissionKey) => {
		if (data.permission_keys.includes(permissionKey)) {
			setData("permission_keys", data.permission_keys.filter((item) => item !== permissionKey));
			return;
		}

		setData("permission_keys", unique([...data.permission_keys, permissionKey]));
	};

	const toggleModule = (moduleKeys) => {
		const allSelected = moduleKeys.every((key) => data.permission_keys.includes(key));

		if (allSelected) {
			setData("permission_keys", data.permission_keys.filter((key) => !moduleKeys.includes(key)));
			return;
		}

		setData("permission_keys", unique([...data.permission_keys, ...moduleKeys]));
	};

	const toggleUser = (userId) => {
		if (data.user_ids.includes(userId)) {
			setData("user_ids", data.user_ids.filter((id) => id !== userId));
			return;
		}

		setData("user_ids", [...data.user_ids, userId]);
	};

	const applyTemplate = (templateValue) => {
		setSelectedTemplate(templateValue);

		if (!templateValue) {
			return;
		}

		const template = templateOptions.find((item) => item.value === templateValue);

		if (!template) {
			return;
		}

		setData("permission_keys", unique(template.permissions));
	};

	const applyRoleToExistingByJabatan = () => {
		const selectedJabatan = bulkJabatan.trim().toLowerCase();

		if (!selectedJabatan) {
			window.alert("Pilih jabatan dulu untuk apply role massal.");
			return;
		}

		const userIdsByJabatan = userOptions
			.filter((user) => (user.jabatan ?? "").trim().toLowerCase() === selectedJabatan)
			.map((user) => user.id);

		if (!userIdsByJabatan.length) {
			window.alert("Tidak ada user existing dengan jabatan tersebut.");
			return;
		}

		setData("user_ids", unique([...data.user_ids, ...userIdsByJabatan]));
	};

	const submit = (event) => {
		event.preventDefault();

		const basePayload = {
			kode: data.kode,
			nama: data.nama,
			deskripsi: data.deskripsi,
			is_active: data.is_active,
			user_ids: data.user_ids,
			permissions: unique([
				...data.permission_keys,
				...parseCustomPermissionInput(data.custom_permissions_text),
			]),
		};

		const options = {
			preserveScroll: true,
			onSuccess,
		};

		if (mode === "edit" && initialValues?.id) {
			transform(() => ({ ...basePayload, _method: "put" }));
			post(`${endpoint}/${initialValues.id}`, options);
			return;
		}

		transform(() => basePayload);
		post(endpoint, options);
	};

	const selectedUsersText = useMemo(() => {
		if (!data.user_ids.length) return "Belum ada user terpilih";

		return userOptions
			.filter((user) => data.user_ids.includes(user.id))
			.map((user) => `${user.name}${user.jabatan ? ` (${user.jabatan})` : ""}`)
			.join(", ");
	}, [data.user_ids, userOptions]);

	return (
		<form onSubmit={submit} className="space-y-4">
			<div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
				<p className="font-semibold">Panduan singkat: Role vs Jabatan</p>
				<p className="mt-1">Role adalah hak akses menu aplikasi. Jabatan adalah posisi kerja pegawai (contoh: Kasir, Supervisor).</p>
			</div>

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
				<div className="flex items-center justify-between gap-3">
					<label className="text-sm font-medium">Template Role</label>
					<span className="text-xs text-muted-foreground">{selectedPermissionsCount} permission dipilih</span>
				</div>
				<select
					className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
					value={selectedTemplate}
					onChange={(event) => applyTemplate(event.target.value)}
				>
					<option value="">Pilih template (opsional)</option>
					{templateOptions.map((template) => (
						<option key={template.value} value={template.value}>{template.label}</option>
					))}
				</select>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<label className="text-sm font-medium">Permission Akses</label>
					<Button type="button" variant="outline" size="sm" onClick={() => setData("permission_keys", [])}>Reset Pilihan</Button>
				</div>
				<div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border p-3">
					{(permissionCatalog ?? []).map((group) => {
						const moduleKeys = (group.items ?? []).map((item) => item.key);
						const selectedInModule = moduleKeys.filter((key) => data.permission_keys.includes(key)).length;

						return (
							<div key={group.slug} className="rounded-lg border p-2">
								<div className="mb-2 flex items-center justify-between gap-2">
									<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{group.module}</p>
									<Button type="button" variant="outline" size="sm" onClick={() => toggleModule(moduleKeys)}>
										{selectedInModule === moduleKeys.length ? "Hapus Semua" : "Pilih Semua"}
									</Button>
								</div>
								<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
									{(group.items ?? []).map((item) => (
										<label key={item.key} className="flex items-start gap-2 rounded-md border px-2 py-1.5 text-sm">
											<input
												type="checkbox"
												checked={data.permission_keys.includes(item.key)}
												onChange={() => togglePermission(item.key)}
											/>
											<span>{item.label} <span className="text-xs text-muted-foreground">({item.key})</span></span>
										</label>
									))}
								</div>
							</div>
						);
					})}
				</div>
				{errors.permissions ? <p className="text-xs text-destructive">{errors.permissions}</p> : null}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Permission Tambahan (opsional)</label>
				<Input
					value={data.custom_permissions_text}
					onChange={(event) => setData("custom_permissions_text", event.target.value)}
					placeholder="Isi jika ada permission custom, pisah dengan koma"
				/>
				{errors.permissions ? <p className="text-xs text-destructive">{errors.permissions}</p> : null}
			</div>

			<div className="space-y-1.5">
				<label className="text-sm font-medium">Assign User</label>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-center">
					<select
						className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
						value={bulkJabatan}
						onChange={(event) => setBulkJabatan(event.target.value)}
					>
						<option value="">Pilih jabatan untuk apply massal</option>
						{jabatanOptions.map((jabatan) => (
							<option key={jabatan} value={jabatan}>{jabatan}</option>
						))}
					</select>
					<Button type="button" variant="outline" onClick={applyRoleToExistingByJabatan}>
						Apply role ke user existing
					</Button>
				</div>
				<Input
					value={userSearch}
					onChange={(event) => setUserSearch(event.target.value)}
					placeholder="Cari user berdasarkan nama/email/jabatan"
				/>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setData("user_ids", unique([...data.user_ids, ...filteredUsers.map((user) => user.id)]))}
					>
						Pilih Semua Hasil
					</Button>
					<Button type="button" variant="outline" size="sm" onClick={() => setData("user_ids", [])}>Kosongkan</Button>
				</div>
				<div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-2">
					{filteredUsers.map((user) => (
						<label key={user.id} className="flex items-start gap-2 text-sm">
							<input type="checkbox" checked={data.user_ids.includes(user.id)} onChange={() => toggleUser(user.id)} />
							<span>{user.name} ({user.email}) {user.jabatan ? `- ${user.jabatan}` : ""}</span>
						</label>
					))}
				</div>
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
