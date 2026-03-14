High Priority (paling berpengaruh operasional)

Merge Table belum ada: transfer meja sudah ada, split bill sudah ada, refund sudah ada, tapi gabung 2 meja/order belum ada.
WA e-receipt belum “webhook automation”: sekarang masih generate link WA manual (bagus untuk MVP), belum kirim otomatis via provider API + status delivery.
Customer Facing Display (CFD) belum ada: belum ada layar khusus yang menampilkan cart realtime + QRIS untuk pelanggan.
Waiter mobile app flow belum terpisah: role WAITER ada, tapi belum ada pengalaman “captain order” dedicated (UI/alur kerja spesifik waiter).
Medium Priority

Inventory unit conversion engine: unit enum sudah ada, recipe/stock movement ada, tapi konversi otomatis beli kg/liter → konsumsi gram/ml belum terlihat sebagai engine jelas.
Wastage/spoilage workflow UI: tipe WASTE ada, tapi alur input terbuang yang terstruktur (reason, approval, report khusus) masih perlu dipertegas.
Low stock alert proaktif: sudah ada low-stock query/dashboard count, tapi belum ada alert center/notifikasi aktif yang “nendang”.
Low Priority / Enhancement

KDS SLA lebih kuat: timer urgent >15 menit sudah ada (good), tapi belum ada escalation level, suara/notifikasi, dan ringkasan SLA analytics.
Optimistic UI dengan React Query: belum kelihatan pattern optimistic update; sekarang mostly refresh-based via socket.
Saran roadmap next (urutan paling efektif)

Sprint A: Merge Table + WA webhook otomatis
Sprint B: CFD + Waiter dedicated flow
Sprint C: Inventory conversion + Wastage module + alert center
