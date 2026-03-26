import { router, useForm } from "@inertiajs/react";
import { Camera, ChevronRight, LocateFixed, PencilLine, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function ProfileScreen({ profile, permissionState, onPermissionChange, onNotify }) {
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const profileForm = useForm({
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        nomor_telepon: profile?.nomor_telepon ?? "",
        alamat: profile?.alamat ?? "",
    });

    const passwordForm = useForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    const cameraAllowed = useMemo(() => permissionState?.camera === true, [permissionState]);
    const locationAllowed = useMemo(() => permissionState?.location === true, [permissionState]);

    useEffect(() => {
        let mounted = true;

        const syncPermissionState = async () => {
            if (!navigator.permissions?.query) {
                return;
            }

            try {
                const [cameraPermission, geolocationPermission] = await Promise.all([
                    navigator.permissions.query({ name: "camera" }),
                    navigator.permissions.query({ name: "geolocation" }),
                ]);

                if (!mounted) return;

                onPermissionChange?.({
                    camera: cameraPermission.state === "granted",
                    location: geolocationPermission.state === "granted",
                });
            } catch {
                // Permissions API tidak selalu tersedia di semua browser mobile.
            }
        };

        syncPermissionState();

        return () => {
            mounted = false;
        };
    }, []);

    const requestCameraPermission = async (enabled) => {
        if (!enabled) {
            onPermissionChange?.({ camera: false });
            onNotify?.({
                type: "info",
                title: "Informasi Kamera",
                message: "Akses kamera dimatikan di aplikasi. Untuk mencabut izin penuh, ubah dari pengaturan browser.",
            });
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            onNotify?.({
                type: "error",
                title: "Kamera Tidak Didukung",
                message: "Browser tidak mendukung akses kamera.",
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            onPermissionChange?.({ camera: true });
            onNotify?.({ type: "success", title: "Berhasil", message: "Akses kamera berhasil diaktifkan." });
        } catch {
            onPermissionChange?.({ camera: false });
            onNotify?.({
                type: "error",
                title: "Izin Ditolak",
                message: "Izin kamera ditolak. Silakan aktifkan melalui pengaturan browser.",
            });
        }
    };

    const requestLocationPermission = (enabled) => {
        if (!enabled) {
            onPermissionChange?.({ location: false });
            onNotify?.({
                type: "info",
                title: "Informasi Lokasi",
                message: "Akses lokasi dimatikan di aplikasi. Untuk mencabut izin penuh, ubah dari pengaturan browser.",
            });
            return;
        }

        if (!navigator.geolocation) {
            onNotify?.({
                type: "error",
                title: "Lokasi Tidak Didukung",
                message: "Browser tidak mendukung akses lokasi.",
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            () => {
                onPermissionChange?.({ location: true });
                onNotify?.({ type: "success", title: "Berhasil", message: "Akses lokasi berhasil diaktifkan." });
            },
            () => {
                onPermissionChange?.({ location: false });
                onNotify?.({
                    type: "error",
                    title: "Izin Ditolak",
                    message: "Izin lokasi ditolak. Silakan aktifkan melalui pengaturan browser.",
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const submitProfile = (event) => {
        event.preventDefault();

        profileForm.transform((data) => ({
            mode: "profile_update",
            ...data,
        }));

        profileForm.post("/hr/e-absensi", {
            preserveScroll: true,
            onSuccess: () => {
                setShowProfileForm(false);
                onNotify?.({
                    type: "success",
                    title: "Berhasil",
                    message: "Profil berhasil diperbarui.",
                });
            },
            onError: (errors) => {
                const firstError = Object.values(errors ?? {}).find((value) => value);
                onNotify?.({
                    type: "error",
                    title: "Ubah Profil Gagal",
                    message: firstError ? (Array.isArray(firstError) ? firstError[0] : firstError) : "Perubahan profil gagal diproses.",
                });
            },
        });
    };

    const submitPassword = (event) => {
        event.preventDefault();

        passwordForm.transform((data) => ({
            mode: "change_password",
            ...data,
        }));

        passwordForm.post("/hr/e-absensi", {
            preserveScroll: true,
            onSuccess: () => {
                setShowPasswordForm(false);
                passwordForm.reset();
                onNotify?.({
                    type: "success",
                    title: "Berhasil",
                    message: "Kata sandi berhasil diperbarui.",
                });
            },
            onError: (errors) => {
                const firstError = Object.values(errors ?? {}).find((value) => value);
                onNotify?.({
                    type: "error",
                    title: "Ubah Kata Sandi Gagal",
                    message: firstError ? (Array.isArray(firstError) ? firstError[0] : firstError) : "Perubahan kata sandi gagal diproses.",
                });
            },
        });
    };

    return (
        <div className="space-y-4">
            <section className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-3xl bg-[#161125] shadow-lg">
                    <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                    <span className="absolute -bottom-3 right-2 rounded-full bg-[#fb8f56] px-3 py-1 text-xs font-bold text-[#57230a]">{profile.badge}</span>
                </div>
                <h2 className="mt-4 text-2xl font-black text-[#16131f]">{profile.name}</h2>
                <p className="mt-1 text-base text-[#4d4a59]">{profile.role}</p>
                <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#e4e0db] px-3 py-1.5 font-mono text-xs tracking-[0.14em] text-[#3f3a4c]">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {profile.shiftLabel}
                </span>
            </section>

            <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#efece7] p-3.5">
                    <Camera className="h-5 w-5 text-[#05011a]" />
                    <p className="mt-3 text-lg font-bold text-[#161320]">Akses Kamera</p>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.18em] text-[#6a6478]">{cameraAllowed ? "AKTIF" : "NONAKTIF"}</span>
                        <Switch checked={cameraAllowed} onCheckedChange={requestCameraPermission} aria-label="Akses kamera" />
                    </div>
                </div>
                <div className="rounded-2xl bg-[#efece7] p-3.5">
                    <LocateFixed className="h-5 w-5 text-[#05011a]" />
                    <p className="mt-3 text-lg font-bold text-[#161320]">Akses Lokasi</p>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.18em] text-[#6a6478]">{locationAllowed ? "AKTIF" : "NONAKTIF"}</span>
                        <Switch checked={locationAllowed} onCheckedChange={requestLocationPermission} aria-label="Akses lokasi" />
                    </div>
                </div>
            </section>

            <section>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#7a7385]">PENGATURAN AKUN</p>
                <div className="mt-3 overflow-hidden rounded-2xl bg-[#efece7]">
                    <button
                        type="button"
                        onClick={() => setShowProfileForm((prev) => !prev)}
                        className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-[#e9e4dd]"
                    >
                        <span className="inline-flex items-center gap-3">
                            <span className="rounded-2xl bg-[#e5e1da] p-2"><PencilLine className="h-5 w-5 text-[#565061]" /></span>
                            <span className="text-base font-semibold text-[#1a1626]">Ubah Profil</span>
                        </span>
                        <ChevronRight className="h-5 w-5 text-[#8f899f]" />
                    </button>
                    {showProfileForm ? (
                        <form onSubmit={submitProfile} className="space-y-3 border-t border-[#ddd7e2] px-4 py-4">
                            <div>
                                <label className="text-xs font-semibold text-[#6a6478]">Nama</label>
                                <input
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={(event) => profileForm.setData("name", event.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-[#d8d1e3] bg-white px-3 text-sm outline-none"
                                    required
                                />
                                {profileForm.errors.name ? <p className="mt-1 text-xs text-rose-600">{profileForm.errors.name}</p> : null}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#6a6478]">Email</label>
                                <input
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(event) => profileForm.setData("email", event.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-[#d8d1e3] bg-white px-3 text-sm outline-none"
                                />
                                {profileForm.errors.email ? <p className="mt-1 text-xs text-rose-600">{profileForm.errors.email}</p> : null}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#6a6478]">Nomor Telepon</label>
                                <input
                                    type="text"
                                    value={profileForm.data.nomor_telepon}
                                    onChange={(event) => profileForm.setData("nomor_telepon", event.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-[#d8d1e3] bg-white px-3 text-sm outline-none"
                                />
                                {profileForm.errors.nomor_telepon ? <p className="mt-1 text-xs text-rose-600">{profileForm.errors.nomor_telepon}</p> : null}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#6a6478]">Alamat</label>
                                <textarea
                                    rows={3}
                                    value={profileForm.data.alamat}
                                    onChange={(event) => profileForm.setData("alamat", event.target.value)}
                                    className="mt-1 w-full rounded-xl border border-[#d8d1e3] bg-white px-3 py-2 text-sm outline-none"
                                />
                                {profileForm.errors.alamat ? <p className="mt-1 text-xs text-rose-600">{profileForm.errors.alamat}</p> : null}
                            </div>
                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="h-10 w-full rounded-xl bg-[#22005f] text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {profileForm.processing ? "Menyimpan..." : "Simpan Profil"}
                            </button>
                        </form>
                    ) : null}
                    <div className="h-px bg-[#ddd7e2]" />
                    <button
                        type="button"
                        onClick={() => setShowPasswordForm((prev) => !prev)}
                        className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-[#e9e4dd]"
                    >
                        <span className="inline-flex items-center gap-3">
                            <span className="rounded-2xl bg-[#e5e1da] p-2"><RotateCcw className="h-5 w-5 text-[#565061]" /></span>
                            <span className="text-base font-semibold text-[#1a1626]">Ubah Kata Sandi</span>
                        </span>
                        <ChevronRight className="h-5 w-5 text-[#8f899f]" />
                    </button>
                    {showPasswordForm ? (
                        <form onSubmit={submitPassword} className="space-y-3 border-t border-[#ddd7e2] px-4 py-4">
                            <div>
                                <label className="text-xs font-semibold text-[#6a6478]">Kata Sandi Saat Ini</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(event) => passwordForm.setData("current_password", event.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-[#d8d1e3] bg-white px-3 text-sm outline-none"
                                    required
                                />
                                {passwordForm.errors.current_password ? <p className="mt-1 text-xs text-rose-600">{passwordForm.errors.current_password}</p> : null}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#6a6478]">Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.new_password}
                                    onChange={(event) => passwordForm.setData("new_password", event.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-[#d8d1e3] bg-white px-3 text-sm outline-none"
                                    required
                                />
                                {passwordForm.errors.new_password ? <p className="mt-1 text-xs text-rose-600">{passwordForm.errors.new_password}</p> : null}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#6a6478]">Konfirmasi Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.new_password_confirmation}
                                    onChange={(event) => passwordForm.setData("new_password_confirmation", event.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-[#d8d1e3] bg-white px-3 text-sm outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="h-10 w-full rounded-xl bg-[#22005f] text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {passwordForm.processing ? "Menyimpan..." : "Simpan Kata Sandi"}
                            </button>
                        </form>
                    ) : null}
                </div>
            </section>

            <section className="rounded-2xl bg-[#e8e3f1] p-3 text-xs text-[#68627a]">
                <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2b0f66]" /> Tim dukungan aktif untuk shift pagi.</p>
            </section>

            <button
                type="button"
                onClick={() => router.get("/auth/logout")}
                className="w-full rounded-2xl bg-[#fbe4e2] px-4 py-3 text-sm font-semibold text-[#9e1111]"
            >
                Logout
            </button>
        </div>
    );
}
