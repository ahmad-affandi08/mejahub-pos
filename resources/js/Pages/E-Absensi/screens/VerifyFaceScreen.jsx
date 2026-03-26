import { BadgeCheck, Camera, CircleDot, MapPin, ShieldCheck } from "lucide-react";

const steps = [
    { key: "confirm", label: "KONFIRMASI" },
    { key: "face", label: "WAJAH" },
    { key: "location", label: "LOKASI" },
    { key: "finish", label: "SELESAI" },
];

export default function VerifyFaceScreen({ onSubmitSuccess, onSubmitFailed, processing = false }) {
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
                <div className="relative h-72 rounded-[20px] bg-[url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&h=1200&fit=crop')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/38" />
                    <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed border-white/70" />
                    <div className="absolute left-4 top-4 h-6 w-6 border-l-4 border-t-4 border-[#e8d8ff]" />
                    <div className="absolute right-4 top-4 h-6 w-6 border-r-4 border-t-4 border-[#e8d8ff]" />
                    <div className="absolute bottom-4 left-4 h-6 w-6 border-b-4 border-l-4 border-[#e8d8ff]" />
                    <div className="absolute bottom-4 right-4 h-6 w-6 border-b-4 border-r-4 border-[#e8d8ff]" />
                </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-[#ece8e3] p-4">
                    <p className="text-[10px] tracking-[0.2em] text-[#403b51]">JARAK</p>
                    <p className="mt-1.5 text-xl text-[#19823f]">3.5m</p>
                </div>
                <div className="rounded-3xl bg-[#ece8e3] p-4">
                    <p className="text-[10px] tracking-[0.2em] text-[#403b51]">ZONA</p>
                    <p className="mt-1.5 text-sm font-semibold text-[#2f006d]">DI DALAM RADIUS (10m)</p>
                </div>
            </div>

            <div className="rounded-2xl border border-[#e2deea] bg-[#f5f4f8] px-4 py-3 text-[#1a1725]">
                <p className="inline-flex items-center gap-2 text-xs"><MapPin className="h-4 w-4 text-[#2f006d]" /> KOORDINAT SAAT INI</p>
                <p className="mt-1 font-mono text-xs">Lat: -6.2088, Lon: 106.8456</p>
            </div>

            <button
                type="button"
                onClick={onSubmitSuccess}
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22005f] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(34,0,95,0.3)]"
            >
                <Camera className="h-5 w-5" />
                {processing ? "MENGIRIM..." : "AMBIL FOTO & KIRIM"}
            </button>
            <button
                type="button"
                onClick={onSubmitFailed}
                className="w-full rounded-2xl bg-[#f1d0cd] px-5 py-2.5 text-sm font-semibold text-[#9e1111]"
            >
                Simulasikan gagal radius
            </button>

            <p className="inline-flex items-center gap-2 text-xs text-[#6d6778]"><ShieldCheck className="h-4 w-4 text-[#2f006d]" />Pemeriksaan liveness dan validasi geofence aktif.</p>
        </div>
    );
}
