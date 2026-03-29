import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PaginationSelect({ currentPage = 1, lastPage = 1, total = 0, onPageChange = () => {} }) {
    const [value, setValue] = useState(currentPage);

    useEffect(() => setValue(currentPage), [currentPage]);

    const handleGo = () => {
        const p = Math.max(1, Math.min(lastPage, Number(value) || 1));
        if (p !== currentPage) onPageChange(p);
    };

    return (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Halaman {currentPage} dari {lastPage} | Total {total} data</span>

            <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
                    Sebelumnya
                </Button>

                <input
                    aria-label="Pilih halaman"
                    type="number"
                    min={1}
                    max={lastPage}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-20 rounded-md border px-2 py-1 text-sm"
                />

                <Button variant="default" size="sm" onClick={handleGo}>
                    Go
                </Button>

                <Button variant="outline" size="sm" disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)}>
                    Berikutnya
                </Button>
            </div>
        </div>
    );
}
