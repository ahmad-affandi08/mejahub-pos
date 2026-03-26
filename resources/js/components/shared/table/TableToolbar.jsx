import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TableToolbar({
    searchValue,
    searchPlaceholder,
    onSubmit,
    flashMessage,
    flashType = "success",
    rightContent = null,
}) {
    const flashClassName =
        flashType === "error"
            ? "rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
            : "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700";

    return (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <form onSubmit={onSubmit} className="flex w-full max-w-md gap-2">
                <Input name="search" defaultValue={searchValue} placeholder={searchPlaceholder} />
                <Button variant="outline" type="submit">Cari</Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
                {flashMessage ? (
                    <p className={flashClassName}>
                        {flashMessage}
                    </p>
                ) : null}
                {rightContent}
            </div>
        </div>
    );
}
