import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Form({ values, state, onChange, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Kas Awal</label>
                <Input
                    type="number"
                    min="0"
                    value={values.kasAwal}
                    onChange={(event) => onChange("kasAwal", event.target.value)}
                    required
                />
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Catatan Buka</label>
                <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={values.catatan}
                    onChange={(event) => onChange("catatan", event.target.value)}
                />
            </div>
            <Button type="submit" className="w-full" disabled={state.hasActiveShift}>Buka Shift</Button>
        </form>
    );
}
