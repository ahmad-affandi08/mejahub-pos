import { ArrowLeft, CircleUserRound } from "lucide-react";

export default function MobileTopBar({ title, subtitle, onBack, showBack = true }) {
    return (
        <div className="flex w-full items-center justify-between gap-3 rounded-b-3xl bg-[#2a0b63] px-4 py-3 shadow-[0_10px_20px_rgba(42,11,99,0.28)]">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
                    aria-label="Kembali"
                >
                    {showBack ? <ArrowLeft className="h-6 w-6" /> : <span className="h-6 w-6" />}
                </button>
                <div>
                    <p className="font-[ui-rounded] text-3xl leading-none text-background">{title}</p>
                    {subtitle ? <p className="mt-1 text-[10px] tracking-[0.2em] text-[#c8bcdd]">{subtitle}</p> : null}
                </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-white/15">
                <CircleUserRound className="h-6 w-6 text-white" />
            </div>
        </div>
    );
}
