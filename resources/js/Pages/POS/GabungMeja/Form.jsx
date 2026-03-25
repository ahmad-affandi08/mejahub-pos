import { Button } from "@/components/ui/button";

export default function Form({ values, state, onChange, onToggleSource, onSubmit }) {
    return (
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Form Gabung Meja</h3>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Catatan</label>
                    <textarea
                        className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={values.catatan}
                        onChange={(event) => onChange("catatan", event.target.value)}
                        placeholder="Contoh: Tamu pindah ke meja utama"
                    />
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pilih Pesanan Sumber</p>
                    <div className="mt-2 max-h-60 space-y-2 overflow-auto pr-1">
                        {state.sourceCandidates.length ? state.sourceCandidates.map((item) => (
                            <label key={item.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={values.sourceIds.includes(item.id)}
                                    onChange={() => onToggleSource(item.id)}
                                />
                                <span className="font-medium">{item.kode}</span>
                                <span className="text-slate-500">{item.nama_pelanggan || "-"}</span>
                            </label>
                        )) : (
                            <p className="text-sm text-slate-500">Pilih target dulu untuk melihat sumber.</p>
                        )}
                    </div>
                </div>

                <Button className="w-full" onClick={onSubmit} disabled={!values.targetId}>Proses Gabung</Button>
            </div>
        </aside>
    );
}
