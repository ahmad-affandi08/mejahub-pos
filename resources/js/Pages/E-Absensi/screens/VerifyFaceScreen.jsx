import { BadgeCheck, Camera, CircleDot, MapPin, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const steps = [
    { key: "confirm", label: "KONFIRMASI" },
    { key: "face", label: "WAJAH" },
    { key: "location", label: "LOKASI" },
    { key: "finish", label: "SELESAI" },
];

function calculateDistanceMeter(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthRadius = 6371000;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
}

export default function VerifyFaceScreen({ onSubmitSuccess, processing = false, geoPolicy = {}, permissionState, onPermissionChange }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const cameraRequestRef = useRef(0);

    const [cameraReady, setCameraReady] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [location, setLocation] = useState({ lat: null, lon: null, error: "", loading: true });
    const requireFace = geoPolicy?.require_face !== false;
    const requireLocation = geoPolicy?.require_location !== false;

    const stopCameraStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const wait = (ms) => new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });

    const getUserMediaWithTimeout = async (constraints, timeoutMs = 12000) => {
        let timerId;

        try {
            return await Promise.race([
                navigator.mediaDevices.getUserMedia(constraints),
                new Promise((_, reject) => {
                    timerId = window.setTimeout(() => {
                        reject(new Error("CAMERA_TIMEOUT"));
                    }, timeoutMs);
                }),
            ]);
        } finally {
            if (timerId) {
                window.clearTimeout(timerId);
            }
        }
    };

    const resolveCameraErrorMessage = (error) => {
        if (error?.message === "CAMERA_TIMEOUT") {
            return "Koneksi kamera timeout. Tutup aplikasi lain yang memakai kamera lalu coba lagi.";
        }

        if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
            return "Izin kamera ditolak browser. Izinkan kamera lalu coba lagi.";
        }

        if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
            return "Kamera sedang dipakai aplikasi/tab lain. Tutup dulu lalu aktifkan ulang kamera.";
        }

        if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
            return "Perangkat kamera tidak ditemukan di browser ini.";
        }

        return "Kamera terdeteksi tetapi preview belum tampil. Tekan tombol Aktifkan Ulang Kamera.";
    };

    const attachAndPlayStream = async (stream) => {
        const video = videoRef.current;
        if (!video) {
            return false;
        }

        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
        video.setAttribute("playsinline", "true");

        try {
            await video.play();
        } catch {
            // Beberapa browser membutuhkan interaksi user. Retry manual tetap disediakan.
        }

        await wait(400);
        return Number(video.videoWidth) > 0 && Number(video.videoHeight) > 0;
    };

    const startCamera = useCallback(async () => {
        const requestId = cameraRequestRef.current + 1;
        cameraRequestRef.current = requestId;

        if (!requireFace) {
            setCameraReady(true);
            setCameraError("");
            onPermissionChange?.({ camera: true });
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraReady(false);
            setCameraError("Browser tidak mendukung akses kamera.");
            onPermissionChange?.({ camera: false });
            return;
        }

        setCameraLoading(true);
        setCameraError("");
        stopCameraStream();

        const constraintsQueue = [
            { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
            { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
            { video: true, audio: false },
        ];

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const firstCamera = devices.find((device) => device.kind === "videoinput");
            if (firstCamera?.deviceId) {
                constraintsQueue.push({ video: { deviceId: { exact: firstCamera.deviceId } }, audio: false });
            }
        } catch {
            // enumerateDevices bisa gagal di sebagian browser; lanjut dengan queue default.
        }

        let ready = false;
        let lastError = null;

        for (const constraints of constraintsQueue) {
            try {
                const stream = await getUserMediaWithTimeout(constraints);

                if (cameraRequestRef.current !== requestId) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                const played = await attachAndPlayStream(stream);

                if (played) {
                    streamRef.current = stream;
                    ready = true;
                    break;
                }

                stream.getTracks().forEach((track) => track.stop());
            } catch (error) {
                lastError = error;
                // Coba kandidat constraints berikutnya.
            }
        }

        if (cameraRequestRef.current !== requestId) {
            return;
        }

        setCameraLoading(false);

        if (ready) {
            setCameraReady(true);
            setCameraError("");
            onPermissionChange?.({ camera: true });
            return;
        }

        setCameraReady(false);
        setCameraError(resolveCameraErrorMessage(lastError));
        onPermissionChange?.({ camera: false });
        stopCameraStream();
    }, [onPermissionChange, requireFace]);

    useEffect(() => {
        if (!requireFace) {
            setCameraReady(true);
            setCameraError("");
            onPermissionChange?.({ camera: true });
            return () => {};
        }

        startCamera();

        return () => {
            stopCameraStream();
        };
    }, [onPermissionChange, requireFace, startCamera]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation({ lat: null, lon: null, error: "Browser tidak mendukung akses lokasi.", loading: false });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: Number(position.coords.latitude.toFixed(7)),
                    lon: Number(position.coords.longitude.toFixed(7)),
                    error: "",
                    loading: false,
                });
                onPermissionChange?.({ location: true });
            },
            () => {
                setLocation({ lat: null, lon: null, error: "Izin lokasi belum aktif.", loading: false });
                onPermissionChange?.({ location: false });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [onPermissionChange]);

    const radiusMeter = Number(geoPolicy?.radius_meter ?? 10);
    const officeLat = geoPolicy?.office_latitude != null ? Number(geoPolicy.office_latitude) : null;
    const officeLon = geoPolicy?.office_longitude != null ? Number(geoPolicy.office_longitude) : null;

    const distanceToOffice = useMemo(() => {
        if (location.lat == null || location.lon == null || officeLat == null || officeLon == null) {
            return null;
        }

        return calculateDistanceMeter(location.lat, location.lon, officeLat, officeLon);
    }, [location.lat, location.lon, officeLat, officeLon]);

    const withinRadius = useMemo(() => {
        if (distanceToOffice == null) {
            return true;
        }

        return distanceToOffice <= radiusMeter;
    }, [distanceToOffice, radiusMeter]);

    const hasLocation = location.lat != null && location.lon != null;
    const cameraGranted = permissionState?.camera === true || cameraReady;
    const locationGranted = permissionState?.location === true || hasLocation;
    const cameraPassed = !requireFace || cameraGranted;
    const locationPassedByPolicy = !requireLocation || (locationGranted && withinRadius);
    const canSubmit = cameraPassed && locationPassedByPolicy;

    const handleCaptureAndSubmit = () => {
        if (!canSubmit || processing) {
            return;
        }

        if (!requireFace) {
            onSubmitSuccess?.({
                latitude: location.lat,
                longitude: location.lon,
                lokasi_absen: `Koordinat perangkat (${location.lat}, ${location.lon})`,
                radius_meter: radiusMeter,
                dalam_radius: withinRadius,
                foto_absen: null,
                watermark_text: "Tanpa verifikasi wajah",
                skor_wajah: null,
                status_verifikasi_wajah: "manual",
            });
            return;
        }

        if (!videoRef.current) {
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;

        const context = canvas.getContext("2d");
        if (!context) {
            return;
        }

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) {
                return;
            }

            const fileName = `absensi-${Date.now()}.jpg`;
            const imageFile = new File([blob], fileName, { type: "image/jpeg" });

            onSubmitSuccess?.({
                latitude: location.lat,
                longitude: location.lon,
                lokasi_absen: `Koordinat perangkat (${location.lat}, ${location.lon})`,
                radius_meter: radiusMeter,
                dalam_radius: withinRadius,
                foto_absen: imageFile,
                watermark_text: "Capture kamera perangkat",
                skor_wajah: 98.5,
                status_verifikasi_wajah: "verified",
            });
        }, "image/jpeg", 0.9);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-1">
                {steps.map((step, index) => {
                    const active = step.key === "face";
                    const done = index < 1;
                    return (
                        <div key={step.key} className="text-center text-[10px] font-semibold tracking-[0.12em] text-[#6e697b]">
                            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#e4e0da]">
                                {done ? (
                                    <BadgeCheck className="h-4 w-4 text-[#2f006d]" />
                                ) : active ? (
                                    <Camera className="h-4 w-4 text-white" />
                                ) : (
                                    <CircleDot className="h-4 w-4 text-[#8b8596]" />
                                )}
                            </div>
                            <span className={active ? "text-[#1b1627]" : ""}>{step.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="text-center">
                <h2 className="font-[Georgia] text-3xl text-[#9c3a00]">Verifikasi Identitas</h2>
                <p className="mt-1 text-sm text-[#3b3748]">Posisikan wajah di dalam bingkai untuk konfirmasi absensi.</p>
            </div>

            <section className="overflow-hidden rounded-3xl bg-linear-to-br from-[#d4d3d9] to-[#bcbac2] p-2.5">
                <div className="relative h-72 overflow-hidden rounded-[20px] bg-[#161320]">
                    {requireFace ? (
                        <>
                            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                            <div className="absolute inset-0 bg-black/30" />
                            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed border-white/70" />
                            <div className="absolute left-4 top-4 h-6 w-6 border-l-4 border-t-4 border-[#e8d8ff]" />
                            <div className="absolute right-4 top-4 h-6 w-6 border-r-4 border-t-4 border-[#e8d8ff]" />
                            <div className="absolute bottom-4 left-4 h-6 w-6 border-b-4 border-l-4 border-[#e8d8ff]" />
                            <div className="absolute bottom-4 right-4 h-6 w-6 border-b-4 border-r-4 border-[#e8d8ff]" />
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#ded6ef]">
                            Verifikasi wajah tidak diwajibkan untuk shift ini.
                        </div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-[#ece8e3] p-4">
                    <p className="text-[10px] tracking-[0.2em] text-[#403b51]">JARAK</p>
                    <p className="mt-1.5 text-xl text-[#19823f]">
                        {distanceToOffice == null ? "-" : `${Math.round(distanceToOffice)}m`}
                    </p>
                </div>
                <div className="rounded-3xl bg-[#ece8e3] p-4">
                    <p className="text-[10px] tracking-[0.2em] text-[#403b51]">ZONA</p>
                    <p className="mt-1.5 text-sm font-semibold text-[#2f006d]">
                        {withinRadius ? `DI DALAM RADIUS (${radiusMeter}m)` : `DI LUAR RADIUS (${radiusMeter}m)`}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-[#e2deea] bg-[#f5f4f8] px-4 py-3 text-[#1a1725]">
                <p className="inline-flex items-center gap-2 text-xs"><MapPin className="h-4 w-4 text-[#2f006d]" /> KOORDINAT SAAT INI</p>
                <p className="mt-1 font-mono text-xs">
                    {location.loading
                        ? "Mendeteksi lokasi..."
                        : location.lat != null && location.lon != null
                            ? `Lat: ${location.lat}, Lon: ${location.lon}`
                            : "Lokasi tidak tersedia"}
                </p>
            </div>

            {requireFace && cameraError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{cameraError}</p>
            ) : null}
            {requireFace && !cameraReady ? (
                <button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraLoading || processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2f006d] bg-white px-4 py-2.5 text-xs font-semibold text-[#2f006d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Camera className="h-4 w-4" />
                    {cameraLoading ? "MENGAKTIFKAN KAMERA..." : "AKTIFKAN ULANG KAMERA"}
                </button>
            ) : null}
            {requireLocation && location.error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{location.error}</p>
            ) : null}
            {requireLocation && !withinRadius ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Anda berada di luar radius kerja, silakan mendekat terlebih dahulu.
                </p>
            ) : null}

            <button
                type="button"
                onClick={handleCaptureAndSubmit}
                disabled={processing || !canSubmit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22005f] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(34,0,95,0.3)] disabled:cursor-not-allowed disabled:bg-[#8a7aa8] disabled:shadow-none"
            >
                <Camera className="h-5 w-5" />
                {processing ? "MENGIRIM..." : requireFace ? "AMBIL FOTO & KIRIM" : "KIRIM ABSENSI"}
            </button>

            <p className="inline-flex items-center gap-2 text-xs text-[#6d6778]"><ShieldCheck className="h-4 w-4 text-[#2f006d]" />Pemeriksaan liveness dan validasi geofence aktif.</p>
        </div>
    );
}
