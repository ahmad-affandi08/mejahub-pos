# Product Requirements Document (PRD): MejaHub

**Sistem Cloud POS & Ekosistem F&B 100% Paperless**

## 1. Informasi Dokumen

- **Nama Produk:** MejaHub
- **Versi:** 1.0.0 (MVP & Core Enterprise Features)
- **Target Industri:** Food & Beverage (F&B) - Kafe, Restoran, _Quick Service_, _Dine-in_.
- **Tech Stack Utama:** Next.js (App Router), Tailwind CSS, shadcn/ui, Prisma ORM, MySQL.

---

## 2. Visi Produk

MejaHub adalah sistem POS mutakhir yang menghilangkan ketergantungan pada kertas secara absolut dalam operasional F&B. Dari pelanggan duduk hingga pesanan disajikan dan dibayar, seluruh alur informasi mengalir secara digital dan _real-time_. MejaHub menjembatani interaksi antara pelanggan (QR Ordering), Pelayan (_Mobile Waiter_), Dapur (KDS), dan Kasir dalam satu ekosistem yang tersinkronisasi.

---

## 3. Arsitektur Sistem & Infrastruktur

- **Frontend/Backend:** Next.js 14+ (App Router). Penggunaan Server Actions untuk mutasi data sederhana dan API Routes untuk integrasi eksternal.
- **Database:** MySQL (Relasional). Sangat cocok untuk integritas data transaksi keuangan dan _inventory_ kompleks.
- **ORM:** Prisma. Dipilih untuk _type-safety_ end-to-end dan kemudahan migrasi skema.
- **Real-time Engine:** Integrasi WebSocket (misal: Socket.io, Pusher, atau Soketi) esensial untuk memicu pembaruan layar di dapur (KDS) dan kasir tanpa perlu _refresh_ (polling).
- **UI/UX:** Tailwind CSS + shadcn/ui. Menyediakan komponen _headless_ yang _accessible_ dan sangat _customizable_ untuk berbagai ukuran layar (Mobile, Tablet POS, Monitor KDS).
- **State Management:** Zustand (untuk global state keranjang kasir) dan React Query (untuk _caching_ dan _fetching_ data _real-time_).
- **Deployment Target:** Siap di-deploy pada lingkungan berbasis Linux (misal: AlmaLinux/Ubuntu) menggunakan Docker containerisasi untuk Next.js dan MySQL, memastikan skalabilitas di VPS atau Bare-metal server.

---

## 4. Aktor & Role-Based Access Control (RBAC)

Sistem ini menggunakan hierarki akses granular:

1. **Super Admin / Owner:** Akses penuh lintas cabang, analitik bisnis, dan pengaturan sistem inti.
2. **Branch Manager:** Manajemen stok cabang, laporan _shift_, dan void pesanan tingkat lanjut.
3. **Cashier (Kasir):** Akses modul POS utama, manajemen meja, pembayaran, dan _refund_ terbatas.
4. **Waiter (Pelayan):** Akses via _mobile web-app_ untuk mengambil pesanan langsung di meja pelanggan (Captain Order).
5. **Kitchen / Bar Staff:** Akses khusus ke _Kitchen Display System_ (KDS) untuk mengubah status masakan.
6. **Customer (Pelanggan):** Akses _read-only_ & _order-only_ via pemindaian QR Code meja (Self-Ordering).

---

## 5. Kebutuhan Fungsional Ekosistem (Functional Requirements)

### A. Core POS & Table Management (Kasir & Waiter)

- **Visual Table Mapping:** _Layout_ meja interaktif berbasis grid. Status warna: Kosong (Hijau), Terisi (Merah), Menunggu Makanan (Kuning), Minta Bill (Biru).
- **Order Management Complexities:** * Mendukung *Split Bill\* (bayar per item atau dibagi rata).
  - _Merge Table_ (menggabungkan meja jika rombongan bertambah).
  - _Transfer Table_ (pindah meja beserta seluruh histori pesanannya).
- **Modifiers & Variants:** Mendukung _Single-choice_ (misal: Level Pedas 1-5) dan _Multiple-choice_ (misal: Tambah Topping Boba, Keju).
- **Dynamic Tax & Service Charge:** Perhitungan Pajak Restoran (PB1 10%) dan _Service Charge_ yang bisa diatur per tipe pesanan (_Dine-in_ vs _Takeaway_).

### B. Paperless Engine (Fitur Kunci)

- **QR Self-Ordering (Customer Facing):** * Meja memiliki QR Code unik dinamis. Pelanggan *scan*, buka e-Menu, pesan, dan pesanan langsung masuk ke sistem kasir untuk di-Approve (mencegah *spam\*) sebelum diteruskan ke dapur.
- **Smart Kitchen Display System (KDS):**
  - **Station Routing:** Minuman dikirim ke layar Monitor Bar, Makanan dikirim ke Monitor Dapur.
  - **Interactive Flow:** Koki menekan layar (sentuh/klik) untuk mengubah status dari `Incoming` -> `Cooking` -> `Ready to Serve`.
  - **Bump Timer:** Indikator waktu (SLA) per pesanan. Jika pesanan > 15 menit, tiket digital berubah warna menjadi merah berkedip.
- **Digital e-Receipt:** * Kasir memasukkan nomor WA pelanggan. Sistem memicu *webhook\* ke penyedia WhatsApp API (resmi/unofficial) mengirimkan pesan berisi rincian pesanan dan tautan PDF struk.
- **Customer Facing Display (CFD):** Menampilkan keranjang belanja _real-time_ dan _generate_ QRIS statis/dinamis langsung di layar yang menghadap pelanggan.

### C. Advanced Inventory & COGS

- **Bill of Materials (BoM) / Manajemen Resep:**
  - Contoh: Penjualan 1 "Kopi Susu Gula Aren" otomatis memotong stok: Kopi 15gr, Susu 100ml, Gula Aren 20ml, Cup Plastik 1 pcs.
- **Raw Material Management:** Pencatatan stok dalam berbagai satuan (Beli dalam Kilogram/Liter, dipotong dalam Gram/Mililiter). Sistem otomatis melakukan konversi.
- **Wastage & Spoilage Log:** Pencatatan bahan terbuang (misal: telur pecah) tanpa memengaruhi data pendapatan, tetapi memotong nilai aset.
- **Low Stock Alerts:** Notifikasi visual di _dashboard_ admin jika bahan baku menyentuh batas minimum (_Reorder Point_).

### D. Cash Management & Shift (Kasir)

- **Blind Server Closing:** Saat tutup _shift_, kasir wajib menghitung dan menginput uang fisik yang ada di laci **tanpa** melihat total perhitungan sistem. Ini mencegah manipulasi uang kembalian.
- **Cash Flow Log:** Pencatatan kas masuk (modal awal, tambah kembalian) dan kas keluar (beli es batu dadakan, bayar parkir) di tengah _shift_.

---

## 6. Kebutuhan Non-Fungsional & Keamanan (NFR)

### A. Security & Penetration Resistances

_Karena menangani data transaksi finansial, keamanan sistem setara standar audit wajib diterapkan:_

- **Input Validation & Sanitization:** Melindungi semua _endpoints_ API Next.js dari SQL Injection dan XSS. Prisma ORM sudah menangani _parameterized queries_ secara _default_, namun validasi _payload_ dengan **Zod** sangat diwajibkan sebelum masuk ke Prisma.
- **Authentication:** Menggunakan JWT (NextAuth.js) dengan rotasi _refresh token_. _Password_ di-_hash_ menggunakan _bcrypt_ atau _Argon2_.
- **Rate Limiting:** Mengimplementasikan _rate limiting_ pada API pemesanan (terutama dari QR Pelanggan) untuk mencegah serangan DDoS atau spam pesanan palsu.
- **Audit Trail:** Setiap aktivitas krusial (void transaksi, hapus barang, tutup _shift_) dicatat dalam tabel `AuditLog` beserta ID User, _timestamp_, dan IP Address.

### B. Performance & Reliability

- **Query Optimization:** Penggunaan _index_ yang tepat di MySQL (terutama pada kolom `orderId`, `status`, dan `createdAt`) untuk memastikan KDS me-load data di bawah 300ms.
- **Optimistic UI Updates:** Menggunakan kemampuan React Query agar UI kasir dan KDS langsung merespons saat diklik, sambil menunggu konfirmasi sinkronisasi dari _database_ di latar belakang.

---

## 7. Desain Arsitektur Data (Prisma Schema Blueprint)

Untuk mewujudkan kerumitan di atas, struktur _database_ perlu dinormalisasi. Berikut adalah gambaran entitas utamanya:

- **Tabel Master:** `User`, `Role`, `Branch`, `Table` (Meja).
- **Tabel Katalog:** `Category`, `Product`, `ProductVariant`, `ModifierGroup`, `Modifier`.
- **Tabel Transaksi:** \* `Order` (Status: OPEN, PAID, CANCELLED).
  - `OrderItem` (Menyimpan harga _snapshot_ saat dibeli, relasi ke produk, status masakan di dapur: PENDING, COOKING, READY, SERVED).
- **Tabel Inventory:** `Ingredient`, `Recipe` (Mapping Product ke Ingredient), `StockMovement` (Log mutasi IN/OUT/WASTE).
- **Tabel Keuangan:** `Payment`, `Shift`, `CashDrawerTransaction`.

---

## 8. Rencana Implementasi (Roadmap)

1. **Sprint 1 (Foundation):** Setup Next.js, Schema Prisma MySQL, Auth & RBAC, Master Data (Produk, Kategori, Meja).
2. **Sprint 2 (Core Transaction):** Cart Engine, Perhitungan Pajak/Diskon, Proses Order, API Manajemen Stok Dasar.
3. **Sprint 3 (The Paperless Engine):** UI KDS (Dapur) dengan _auto-refresh_, Integrasi Webhook WhatsApp API (Struk Digital), QR Order Customer Flow.
4. **Sprint 4 (Advanced Logic & Security):** Bill of Materials (Resep), Shift Management (Blind Closing), Audit Logs, dan Security Hardening.
