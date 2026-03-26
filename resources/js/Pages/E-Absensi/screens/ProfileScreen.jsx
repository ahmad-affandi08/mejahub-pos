import { router } from "@inertiajs/react";
import { Camera, ChevronRight, LocateFixed, PencilLine, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function ProfileScreen({ profile }) {
    const [cameraAllowed, setCameraAllowed] = useState(false);
    const [locationAllowed, setLocationAllowed] = useState(false);
    const [permissionInfo, setPermissionInfo] = useState("");

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

                setCameraAllowed(cameraPermission.state === "granted");
                setLocationAllowed(geolocationPermission.state === "granted");
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
            setCameraAllowed(false);
            setPermissionInfo("Akses kamera dimatikan di aplikasi. Untuk mencabut izin penuh, ubah dari pengaturan browser.");
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setPermissionInfo("Browser tidak mendukung akses kamera.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            setCameraAllowed(true);
            setPermissionInfo("Akses kamera berhasil diaktifkan.");
        } catch {
            setCameraAllowed(false);
            setPermissionInfo("Izin kamera ditolak. Silakan aktifkan melalui pengaturan browser.");
        }
    };

    const requestLocationPermission = (enabled) => {
        if (!enabled) {
            setLocationAllowed(false);
            setPermissionInfo("Akses lokasi dimatikan di aplikasi. Untuk mencabut izin penuh, ubah dari pengaturan browser.");
            return;
        }

        if (!navigator.geolocation) {
            setPermissionInfo("Browser tidak mendukung akses lokasi.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            () => {
                setLocationAllowed(true);
                setPermissionInfo("Akses lokasi berhasil diaktifkan.");
            },
            () => {
                setLocationAllowed(false);
                setPermissionInfo("Izin lokasi ditolak. Silakan aktifkan melalui pengaturan browser.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
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

            {permissionInfo ? (
                <section className="rounded-2xl border border-[#dfd9ec] bg-[#f7f4ff] px-3 py-2 text-xs text-[#5b5370]">
                    {permissionInfo}
                </section>
            ) : null}

            <section>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#7a7385]">PENGATURAN AKUN</p>
                <div className="mt-3 overflow-hidden rounded-2xl bg-[#efece7]">
                    <button type="button" className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-[#e9e4dd]">
                        <span className="inline-flex items-center gap-3">
                            <span className="rounded-2xl bg-[#e5e1da] p-2"><PencilLine className="h-5 w-5 text-[#565061]" /></span>
                            <span className="text-base font-semibold text-[#1a1626]">Ubah Profil</span>
                        </span>
                        <ChevronRight className="h-5 w-5 text-[#8f899f]" />
                    </button>
                    <div className="h-px bg-[#ddd7e2]" />
                    <button type="button" className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-[#e9e4dd]">
                        <span className="inline-flex items-center gap-3">
                            <span className="rounded-2xl bg-[#e5e1da] p-2"><RotateCcw className="h-5 w-5 text-[#565061]" /></span>
                            <span className="text-base font-semibold text-[#1a1626]">Ubah Kata Sandi</span>
                        </span>
                        <ChevronRight className="h-5 w-5 text-[#8f899f]" />
                    </button>
                </div>
            </section>

            <section className="rounded-2xl bg-[#e8e3f1] p-3 text-xs text-[#68627a]">
                <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2b0f66]" /> Tim dukungan aktif untuk shift pagi.</p>
            </section>

            <button
                type="button"
                onClick={() => router.visit("/auth/logout")}
                className="w-full rounded-2xl bg-[#fbe4e2] px-4 py-3 text-sm font-semibold text-[#9e1111]"
            >
                Logout
            </button>
        </div>
    );
}
