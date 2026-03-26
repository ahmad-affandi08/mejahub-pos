import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Form({ mode, endpoint, initialValues, onSuccess, onCancel }) {
    const { data, setData, post, transform, processing, errors, reset } = useForm({
        kode: initialValues?.kode ?? "",
        nama: initialValues?.nama ?? "",
        tipe_printer: initialValues?.tipe_printer ?? "kitchen",
        connection_type: initialValues?.connection_type ?? "network",
        ip_address: initialValues?.ip_address ?? "",
        port: initialValues?.port ?? 9100,
        device_name: initialValues?.device_name ?? "",
        paper_size: initialValues?.paper_size ?? "80mm",
        copies: initialValues?.copies ?? 1,
        auto_print_order: initialValues?.auto_print_order ?? true,
        auto_print_payment: initialValues?.auto_print_payment ?? true,
        is_default: initialValues?.is_default ?? false,
        is_active: initialValues?.is_active ?? true,
        keterangan: initialValues?.keterangan ?? "",
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
        };

        if (mode === "edit" && initialValues?.id) {
            transform((payload) => ({ ...payload, _method: "put" }));
            post(`${endpoint}/${initialValues.id}`, options);
            return;
        }

        transform((payload) => payload);
        post(endpoint, options);
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Kode</label>
                    <Input value={data.kode} onChange={(event) => setData("kode", event.target.value)} required />
                    {errors.kode ? <p className="text-xs text-destructive">{errors.kode}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Printer</label>
                    <Input value={data.nama} onChange={(event) => setData("nama", event.target.value)} required />
                    {errors.nama ? <p className="text-xs text-destructive">{errors.nama}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tipe Printer</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.tipe_printer} onChange={(event) => setData("tipe_printer", event.target.value)}>
                        <option value="kitchen">Kitchen</option>
                        <option value="cashier">Cashier</option>
                        <option value="bar">Bar</option>
                        <option value="receipt">Receipt</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Connection</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.connection_type} onChange={(event) => setData("connection_type", event.target.value)}>
                        <option value="network">Network</option>
                        <option value="usb">USB</option>
                        <option value="bluetooth">Bluetooth</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">IP Address</label>
                    <Input value={data.ip_address} onChange={(event) => setData("ip_address", event.target.value)} />
                    {errors.ip_address ? <p className="text-xs text-destructive">{errors.ip_address}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Port</label>
                    <Input type="number" min="1" max="65535" value={data.port} onChange={(event) => setData("port", event.target.value)} />
                    {errors.port ? <p className="text-xs text-destructive">{errors.port}</p> : null}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Device Name</label>
                    <Input value={data.device_name} onChange={(event) => setData("device_name", event.target.value)} />
                    {errors.device_name ? <p className="text-xs text-destructive">{errors.device_name}</p> : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Paper Size</label>
                    <Input value={data.paper_size} onChange={(event) => setData("paper_size", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Copies</label>
                    <Input type="number" min="1" max="10" value={data.copies} onChange={(event) => setData("copies", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Default</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_default ? "1" : "0"} onChange={(event) => setData("is_default", event.target.value === "1")}>
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Auto Print Order</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.auto_print_order ? "1" : "0"} onChange={(event) => setData("auto_print_order", event.target.value === "1")}>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Auto Print Payment</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.auto_print_payment ? "1" : "0"} onChange={(event) => setData("auto_print_payment", event.target.value === "1")}>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={data.is_active ? "1" : "0"} onChange={(event) => setData("is_active", event.target.value === "1")}>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Keterangan</label>
                <Textarea value={data.keterangan} onChange={(event) => setData("keterangan", event.target.value)} rows={2} />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
            </DialogFooter>
        </form>
    );
}
