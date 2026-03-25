# Product Requirements Document (PRD) - Mejahub POS & F&B System

## 1. Ikhtisar Proyek

- **Nama Proyek:** Mejahub
- **Tipe:** Sistem Point of Sale (POS) dan Manajemen F&B skala Enterprise (Multi-modul).
- **Tech Stack Utama:** Laravel (Backend), React.js (.jsx murni, bukan TypeScript), Inertia.js (Bridge), Vite (Bundler), MySQL.
- **Tech Stack UI:** Tailwind CSS v4 (Zero-config), Shadcn UI (Mesin: Radix UI).

## 2. Aturan Arsitektur Backend (SANGAT KETAT)

Proyek ini **TIDAK** menggunakan struktur standar MVC Laravel (seperti `app/Http/Controllers`). Proyek ini menggunakan arsitektur **Action-Domain-Responder (ADR)**. Semua logika _backend_ berada di dalam folder: `app/Modules/<NamaModul>/<NamaFitur>/`.

Setiap folder `<NamaFitur>` **WAJIB** memiliki 4 file ini:

1.  **`<NamaFitur>Entity.php` (Model):** Berfungsi murni sebagai Eloquent Model Laravel.
2.  **`<NamaFitur>Service.php` (Logika Bisnis):** Semua proses perhitungan, mutasi database, dan pihak ketiga wajib di sini.
3.  **`<NamaFitur>Resource.php` (Controller):** Menerima request HTTP, memanggil `Service`, lalu mengembalikan `Inertia::render()` atau HTTP Redirect.
4.  **`<NamaFitur>Collection.php` (Format Data):** Mem-filter/memformat respons data dari Entity sebelum dikirim ke frontend React.

## 3. Aturan Database & Relasi (PERHATIAN KHUSUS)

- **Aturan Relasi:** Relasi tabel **HANYA** diatur pada level kode menggunakan fungsi Eloquent Laravel (`belongsTo`, `hasMany`, dll) di dalam file `...Entity.php`.
- **LARANGAN KERAS:** **DILARANG** menggunakan Foreign Key Constraint di tingkat database/migration (misalnya dilarang menggunakan `$table->foreignId('...')->constrained()`).
- **Format Kolom ID:** Cukup gunakan `$table->unsignedBigInteger('kategori_id');` biasa tanpa relasi fisik di _migration_ demi performa dan fleksibilitas _soft-delete_.

## 4. Aturan Routing (Dynamic Auto-Discovery)

- **Jangan menulis route manual** di `routes/web.php`. Sistem sudah memiliki skrip Auto-Discovery.
- URL dan Name Route akan otomatis dibuat berdasarkan nama folder (Kebab Case).
- _Contoh:_ File `app/Modules/Menu/DataMenu/DataMenuResource.php` otomatis memiliki route resource URL `/menu/data-menu` dan route name `menu.data-menu.*`.

## 5. Aturan Arsitektur Frontend (React + Shadcn + Tailwind v4)

- **Tailwind v4:** Menggunakan `@tailwindcss/vite`. Tidak ada file `tailwind.config.js`. CSS global hanya ada di `resources/css/app.css` (`@import "tailwindcss";`).
- **Shadcn UI:** Komponen UI murni (button, dialog, dll) ada di `resources/js/Components/ui/`. **Dilarang** mengubah logika bisnis di dalam folder ini.
- **Komponen Rakitan:** Buat komponen spesifik aplikasi (seperti `POSCart.jsx`, `Sidebar.jsx`) di `resources/js/Components/Shared/`.
- **Layouts:** Gunakan folder `resources/js/Layouts/` untuk kerangka halaman (`POSLayout.jsx`, `DashboardLayout.jsx`).
- **Pages (Cermin Backend):** Letakkan tampilan UI utama di `resources/js/Pages/<NamaModul>/<NamaFitur>/Index.jsx` agar rutenya sinkron dengan `Inertia::render()`.

## 6. Daftar Modul Backend yang Sudah Tersedia

AI Agent hanya perlu mengisi _file_ kosong yang sudah terstruktur di folder ini:

- `Menu`: KategoriMenu, DataMenu, VarianMenu, ModifierMenu, PaketMenu
- `Meja`: AreaMeja, DataMeja, ReservasiMeja
- `POS`: BukaShift, TutupShift, PesananMasuk, SplitBill, GabungMeja, Pembayaran, VoidPesanan, RefundPesanan
- `Kitchen`: TiketDapur, StatusMasak, KDS
- `Inventory`: Supplier, BahanBaku, ResepBOM, PurchaseOrder, PenerimaanBarang, OpnameStok, TransferStok, ManajemenWaste
- `HR`: DataPegawai, HakAkses, Absensi, Komisi
- `CRM`: DataPelanggan, PoinLoyalty, Membership
- `Finance`: ArusKas, PettyCash, Pengeluaran
- `Report`: LaporanPenjualan, LaporanStok, LaporanShift, LaporanPajak
- `Settings`: ProfilToko, MetodePembayaran, KonfigurasiPajak, PrinterSilent

## 7. Instruksi Tugas Pertama untuk AI Agent

**Status Saat Ini:** Folder backend, routing dinamis, dan setup frontend (Vite+Tailwind+Shadcn) sudah selesai. File komponen Shadcn sudah diunduh semua. **Database MySQL belum di-setup.**

**TUGASMU (Kerjakan Secara Berurutan):**

1.  **Setup Database:** Buatkan instruksi untuk mengatur `.env` agar terkoneksi ke database lokal `mejahub-pos`.
2.  **Migration Pertama:** Buat file _migration_ untuk fitur `KategoriMenu` dan `DataMenu` dengan mematuhi aturan TANPA Foreign Key (Poin #3).
3.  **Koding Backend (CRUD Kategori):** Isi logika kode di dalam 4 file `app/Modules/Menu/KategoriMenu/` (`Entity`, `Service`, `Collection`, `Resource`).
4.  **Koding Frontend (React):** Buat file `resources/js/Pages/Menu/KategoriMenu/Index.jsx`. Gunakan komponen Shadcn (`Table`, `Button`, `Dialog` untuk form tambah data) untuk menampilkan UI yang modern dan memanggil endpoint backend via Inertia.
