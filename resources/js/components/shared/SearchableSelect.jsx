import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Pilih opsi",
    searchPlaceholder = "Cari...",
    emptyText = "Data tidak ditemukan",
    disabled = false,
    className,
    triggerClassName,
}) {
    const [open, setOpen] = useState(false);

    const normalizedOptions = useMemo(
        () =>
            (options || []).map((option) => ({
                value: String(option.value ?? ""),
                label: option.label ?? "",
                keywords: option.keywords ?? "",
            })),
        [options],
    );

    const selected = normalizedOptions.find((option) => option.value === String(value ?? ""));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "h-9 w-full justify-between rounded-lg border-input bg-transparent px-3 text-sm font-normal hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-foreground",
                        triggerClassName,
                    )}
                >
                    <span className="truncate text-left">{selected?.label || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className={cn("w-(--radix-popover-trigger-width) p-0", className)} align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        {normalizedOptions.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={`${option.label} ${option.keywords} ${option.value}`}
                                onSelect={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", selected?.value === option.value ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{option.label}</span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
