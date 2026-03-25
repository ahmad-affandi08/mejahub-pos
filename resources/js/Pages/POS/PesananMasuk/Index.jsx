import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import POSLayout from "@/layouts/POSLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Form from "@/Pages/POS/PesananMasuk/Form";

const currency = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export default function Index({ menus, meja, orders, filters, flashMessage }) {
    const endpoint = "/pos/pesanan-masuk";
    const [search, setSearch] = useState(filters?.search ?? "");
    const [selectedMeja, setSelectedMeja] = useState("");
    const [namaPelanggan, setNamaPelanggan] = useState("");
    const [catatan, setCatatan] = useState("");
    const [cart, setCart] = useState([]);

    const filteredMenus = useMemo(() => {
        if (!search.trim()) return menus;

        const q = search.toLowerCase();
        return menus.filter((item) => item.nama.toLowerCase().includes(q));
    }, [menus, search]);

    const subtotal = useMemo(
        () => cart.reduce((acc, item) => acc + (item.harga * item.qty), 0),
        [cart]
    );

    const addToCart = (menu) => {
        setCart((prev) => {
            const idx = prev.findIndex((item) => item.data_menu_id === menu.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
                return next;
            }

            return [
                ...prev,
                {
                    data_menu_id: menu.id,
                    nama_menu: menu.nama,
                    harga: Number(menu.harga || 0),
                    qty: 1,
                    catatan: "",
                },
            ];
        });
    };

    const updateQty = (menuId, delta) => {
        setCart((prev) => prev
            .map((item) => item.data_menu_id === menuId
                ? { ...item, qty: Math.max(1, item.qty + delta) }
                : item
            ));
    };

    const removeItem = (menuId) => {
        setCart((prev) => prev.filter((item) => item.data_menu_id !== menuId));
    };

    const setItemNote = (menuId, note) => {
        setCart((prev) => prev
            .map((item) => item.data_menu_id === menuId
                ? { ...item, catatan: note }
                : item
            ));
    };

    const submitOrder = () => {
        if (!cart.length) {
            window.alert("Keranjang masih kosong.");
            return;
        }

        router.post(endpoint, {
            data_meja_id: selectedMeja ? Number(selectedMeja) : null,
            nama_pelanggan: namaPelanggan || null,
            catatan: catatan || null,
            status: "submitted",
            items: cart.map((item) => ({
                data_menu_id: item.data_menu_id,
                qty: item.qty,
                catatan: item.catatan || null,
            })),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setCatatan("");
                setNamaPelanggan("");
                setSelectedMeja("");
            },
        });
    };

    const updateStatus = (orderId, status) => {
        router.put(`${endpoint}/${orderId}`, { status }, { preserveScroll: true });
    };

    return (
        <POSLayout title="Pesanan Masuk">
            <Head title="POS - Pesanan Masuk" />

            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
                <section className="rounded-3xl border border-orange-100 bg-white/95 p-4 shadow-sm md:p-6">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Kasir</p>
                            <h2 className="text-xl font-semibold text-slate-900">Menu Aktif</h2>
                        </div>

                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari menu..."
                            className="max-w-sm"
                        />
                    </div>

                    {flashMessage?.success ? (
                        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {flashMessage.success}
                        </p>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredMenus.map((menu) => (
                            <button
                                key={menu.id}
                                type="button"
                                onClick={() => addToCart(menu)}
                                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm"
                            >
                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                    {menu.kategori_nama || "Tanpa Kategori"}
                                </p>
                                <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900">{menu.nama}</h3>
                                <p className="mt-3 text-sm font-semibold text-orange-700">{currency.format(menu.harga || 0)}</p>
                            </button>
                        ))}
                    </div>
                </section>

                <Form
                    meja={meja}
                    cart={cart}
                    subtotal={subtotal}
                    selectedMeja={selectedMeja}
                    namaPelanggan={namaPelanggan}
                    catatan={catatan}
                    onSelectMeja={setSelectedMeja}
                    onChangeNamaPelanggan={setNamaPelanggan}
                    onChangeCatatan={setCatatan}
                    onDecreaseQty={(menuId) => updateQty(menuId, -1)}
                    onIncreaseQty={(menuId) => updateQty(menuId, 1)}
                    onRemoveItem={removeItem}
                    onChangeItemNote={setItemNote}
                    onSubmit={submitOrder}
                />
            </div>

            <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Pesanan Aktif</h2>
                    <p className="text-xs text-slate-500">Draft dan submitted ditampilkan di sini</p>
                </div>

                <div className="overflow-auto">
                    <table className="w-full min-w-180 text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-2">Kode</th>
                                <th className="py-2">Meja</th>
                                <th className="py-2">Pelanggan</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Total</th>
                                <th className="py-2 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b last:border-b-0">
                                    <td className="py-2 font-medium">{order.kode}</td>
                                    <td className="py-2">{order.meja_nama || "-"}</td>
                                    <td className="py-2">{order.nama_pelanggan || "-"}</td>
                                    <td className="py-2">
                                        <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-2">{currency.format(order.total)}</td>
                                    <td className="py-2 text-right">
                                        <div className="inline-flex gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={() => updateStatus(order.id, "paid")}>Bayar</Button>
                                            <Button type="button" size="sm" variant="destructive" onClick={() => updateStatus(order.id, "void")}>Void</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </POSLayout>
    );
}
