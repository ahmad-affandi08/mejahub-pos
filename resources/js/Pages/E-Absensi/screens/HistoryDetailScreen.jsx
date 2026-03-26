import { ShieldCheck } from "lucide-react";

export default function HistoryDetailScreen({ record }) {
    if (!record) {
        return null;
    }

    return (
        <div className="space-y-4">
            <section>
                <p className="text-[10px] tracking-[0.2em] text-[#666072]">REFERENSI LOG</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                    <h2 className="text-3xl font-black leading-tight text-[#120d21]">{record.reference}</h2>
                    <span className="rounded-full bg-[#fb8f56] px-3 py-1 text-xs font-semibold text-[#552108]">TERVERIFIKASI</span>
                </div>
                <p className="mt-1 text-base text-[#3f3a4d]">
                    <span className="font-semibold text-[#2f006d]">{record.employeeName || "Karyawan"}</span>
                    <span className="mx-2 text-[#cac2d7]">•</span>
                    {record.employeeRole || "Staff"}
                </p>
            </section>

            <section className="grid grid-cols-[110px_1fr] gap-3">
                <div className="relative overflow-hidden rounded-3xl bg-[#1a1528]">
                    <img src={record.image} alt="Foto absen" className="h-40 w-full object-cover" />
                    <span className="absolute right-2 top-2 rounded-xl bg-[#0d0822] px-2 py-1 font-mono text-xs text-white">{record.score}</span>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-[90px_1fr] gap-2 text-sm">
                        <span className="tracking-[0.2em] text-[#4f4a5f]">JENIS</span>
                        <span className="text-right text-base text-[#181522]">{record.type}</span>
                        <span className="tracking-[0.2em] text-[#4f4a5f]">METODE</span>
                        <span className="text-right text-base text-[#181522]">{record.method}</span>
                        <span className="tracking-[0.2em] text-[#4f4a5f]">SUMBER</span>
                        <span className="text-right text-base text-[#181522]">{record.source}</span>
                    </div>
                    <div className="rounded-3xl bg-[#efebe5] p-3">
                        <p className="inline-flex items-center gap-2 text-sm text-[#151221]">
                            <ShieldCheck className="h-4 w-4 text-[#2f006d]" />
                            <span className="font-semibold">CEK LIVENESS</span>
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#1b1627]">{record.verifier}</p>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-[#efebe5] p-4">
                    <p className="text-[10px] tracking-[0.2em] text-[#4f4a5f]">TANGGAL</p>
                    <p className="mt-1.5 font-mono text-lg text-[#12101e]">{record.dateLong}</p>
                </div>
                <div className="rounded-3xl bg-[#efebe5] p-4">
                    <p className="text-[10px] tracking-[0.2em] text-[#4f4a5f]">WAKTU</p>
                    <p className="mt-1.5 font-mono text-lg text-[#12101e]">{record.time}</p>
                </div>
            </section>

            <section className="rounded-3xl bg-[#d9d5d1] p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-[#151221]">Data Lokasi</h3>
                    <span className="rounded-full bg-[#ece8e3] px-3 py-1 text-xs text-[#5e596e]">{record.radius}</span>
                </div>
                <p className="mt-2 text-[10px] tracking-[0.2em] text-[#5f5970]">ALAMAT RESMI</p>
                <p className="mt-1 text-base text-[#151220]">{record.location}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#efebe5] p-3">
                        <p className="text-[10px] tracking-[0.2em] text-[#5f5970]">LATITUDE</p>
                        <p className="mt-1 font-mono text-base text-[#151220]">{record.latitude}</p>
                    </div>
                    <div className="rounded-2xl bg-[#efebe5] p-3">
                        <p className="text-[10px] tracking-[0.2em] text-[#5f5970]">LONGITUDE</p>
                        <p className="mt-1 font-mono text-base text-[#151220]">{record.longitude}</p>
                    </div>
                </div>
                <div className="mt-3 h-28 rounded-2xl bg-[linear-gradient(135deg,#5ab9c4,#2f8fa1)]" />
            </section>
        </div>
    );
}
