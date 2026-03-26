import { LocateOff, MapPinned, RotateCcw } from "lucide-react";

export default function FailedRadiusScreen({ onRetry, onBackHome }) {
    return (
        <div className="space-y-4">
            <section className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[28px] bg-[#f2d0ce] text-[#c71616] shadow-[0_12px_20px_rgba(163,22,22,0.18)]">
                    <LocateOff className="h-12 w-12" />
                </div>
                <h2 className="mt-4 text-3xl font-black text-[#161320]">Gagal Absen</h2>
                <p className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full bg-[#f4cbc7] px-3 py-1.5 text-xs text-[#a61212]">
                    Anda berada 150m di luar radius kerja.
                </p>
            </section>

            <div className="overflow-hidden rounded-2xl bg-[#8ecacf] p-3">
                <div className="flex h-32 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_center,#f7d08a_4%,#f0e5c3_38%,#c9ddb8_75%)]">
                    <MapPinned className="h-14 w-14 text-[#d94141]" />
                </div>
                <span className="mt-3 inline-block rounded-full bg-[#f2efea] px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#444054]">DI LUAR ZONA</span>
            </div>

            <div className="rounded-2xl bg-[#ece8e3] p-4">
                <p className="text-[10px] tracking-[0.2em] text-[#5e596e]">LOKASI SAAT INI</p>
                <p className="mt-2 text-base text-[#161320]">Jl. Sudirman No. 45, Karet Tengsin, Tanah Abang, Jakarta Pusat, 10220</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] tracking-[0.2em] text-[#5e596e]">LATITUDE</p>
                        <p className="mt-1 font-mono text-base text-[#161320]">-6.2146 S</p>
                    </div>
                    <div>
                        <p className="text-[10px] tracking-[0.2em] text-[#5e596e]">LONGITUDE</p>
                        <p className="mt-1 font-mono text-base text-[#161320]">106.8213 E</p>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onRetry}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22005f] px-6 py-3 text-sm font-semibold text-white"
            >
                COBA LAGI
                <RotateCcw className="h-5 w-5" />
            </button>
            <button
                type="button"
                onClick={onBackHome}
                className="w-full rounded-2xl bg-[#e7e4df] px-6 py-3 text-sm font-semibold text-[#191622]"
            >
                KEMBALI KE BERANDA
            </button>
        </div>
    );
}
