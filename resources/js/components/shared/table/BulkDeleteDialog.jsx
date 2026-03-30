import { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";

import { Button } from "@/components/ui/button";

export function useBulkDeleteSelection(endpoint, items = []) {
    const normalizedItems = useMemo(() => {
        return items
            .map((item) => {
                const id = Number(item?.id);
                if (!Number.isFinite(id) || id <= 0) {
                    return null;
                }

                const label = [
                    item?.kode,
                    item?.nama,
                    item?.judul,
                    item?.title,
                    item?.nomor,
                ].find((value) => typeof value === "string" && value.trim() !== "") ?? `ID ${id}`;

                return { id, label };
            })
            .filter(Boolean);
    }, [items]);

    const [selectedIds, setSelectedIds] = useState([]);

    const rowIds = useMemo(() => normalizedItems.map((item) => item.id), [normalizedItems]);
    const selectedMap = useMemo(() => new Set(selectedIds), [selectedIds]);
    const allCurrentSelected = rowIds.length > 0 && rowIds.every((id) => selectedMap.has(id));

    useEffect(() => {
        const rowSet = new Set(rowIds);
        setSelectedIds((prev) => prev.filter((id) => rowSet.has(id)));
    }, [rowIds]);

    const toggleRow = (id) => {
        const normalized = Number(id);
        if (!Number.isFinite(normalized) || normalized <= 0) {
            return;
        }

        if (selectedMap.has(normalized)) {
            setSelectedIds((prev) => prev.filter((itemId) => itemId !== normalized));
            return;
        }

        setSelectedIds((prev) => [...prev, normalized]);
    };

    const toggleAllCurrent = () => {
        if (allCurrentSelected) {
            setSelectedIds((prev) => prev.filter((id) => !rowIds.includes(id)));
            return;
        }

        setSelectedIds((prev) => {
            const merged = new Set(prev);
            rowIds.forEach((id) => merged.add(id));
            return Array.from(merged);
        });
    };

    const submitDelete = () => {
        if (!selectedIds.length) {
            window.alert("Pilih minimal 1 data untuk dihapus.");
            return;
        }

        if (!window.confirm(`Hapus ${selectedIds.length} data terpilih?`)) {
            return;
        }

        router.post(`${endpoint}/delete`, {
            ids: selectedIds,
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    return {
        selectedIds,
        selectedMap,
        rowIds,
        allCurrentSelected,
        toggleRow,
        toggleAllCurrent,
        submitDelete,
    };
}

export function BulkDeleteHeaderCheckbox({ bulkDelete }) {
    return (
        <th className="w-12 text-center align-middle">
            <input
                type="checkbox"
                checked={bulkDelete.allCurrentSelected}
                onChange={bulkDelete.toggleAllCurrent}
            />
        </th>
    );
}

export function BulkDeleteRowCheckbox({ bulkDelete, rowId }) {
    const normalized = Number(rowId);
    const checked = bulkDelete.selectedMap.has(normalized);

    return (
        <td className="text-center align-middle">
            <input
                type="checkbox"
                checked={checked}
                onChange={() => bulkDelete.toggleRow(normalized)}
            />
        </td>
    );
}

export default function BulkDeleteDialog({
    bulkDelete,
    endpoint,
    items = [],
    triggerLabel = "Hapus Terpilih",
    disabled = false,
}) {
    const internalBulkDelete = useBulkDeleteSelection(endpoint, items);
    const activeBulkDelete = bulkDelete ?? internalBulkDelete;

    return (
        <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={disabled || activeBulkDelete.rowIds.length === 0 || activeBulkDelete.selectedIds.length === 0}
            onClick={activeBulkDelete.submitDelete}
        >
            {triggerLabel} ({activeBulkDelete.selectedIds.length})
        </Button>
    );
}
