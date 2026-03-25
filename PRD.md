# Product Requirements Document (PRD) - Mejahub POS & F&B System

## 1. Ikhtisar Proyek

- **Nama Proyek:** Mejahub
- **Deskripsi:** Sistem Point of Sale (POS) dan Manajemen F&B skala Enterprise yang mencakup manajemen meja, inventaris (resep/BOM), dapur (KDS), HR, keuangan, dan pengaturan _printer silent_.
- **Tech Stack:** Laravel (Backend), React.js (Frontend), Inertia.js (Bridge), Vite (Bundler), MySQL (Database).

## 2. Aturan Arsitektur Backend (SANGAT KETAT)

Proyek ini **TIDAK** menggunakan struktur standar MVC Laravel (seperti `app/Http/Controllers`). Proyek ini menggunakan arsitektur **Action-Domain-Responder (ADR) / Use-Case Driven** yang terinspirasi dari standar SIMRS Enterprise.

Semua logika _backend_ berada di dalam folder: `app/Modules/<NamaModul>/<NamaFitur>/`

Setiap folder `<NamaFitur>` **WAJIB** memiliki 4 file ini:

1.  **`<NamaFitur>Entity.php` (Model):** Berfungsi murni sebagai Eloquent Model Laravel.
2.  **`<NamaFitur>Service.php` (Logika Bisnis):** Semua proses logika yang kompleks (perhitungan, simpan database, pihak ketiga) wajib ditaruh di sini.
3.  **`<NamaFitur>Resource.php` (Controller/HTTP Handler):** Bertugas menerima request (termasuk validasi sederhana), memanggil `Service`, lalu mengembalikan `Inertia::render()` atau HTTP Redirect. Class ini akan dibaca oleh _Dynamic Routing_.
4.  **`<NamaFitur>Collection.php` (Format Data):** Berfungsi sebagai `ResourceCollection` Laravel untuk mem-filter dan memformat respons data dari Entity sebelum dikirim ke frontend React.

_Catatan untuk AI:_ Jangan pernah membuat controller di `app/Http/Controllers`. Selalu gunakan `...Resource.php` di dalam folder modul masing-masing.

## 3. Aturan Database & Relasi (PERHATIAN KHUSUS)

- **Aturan Relasi:** Relasi tabel **HANYA** diatur pada level kode menggunakan fungsi Eloquent Laravel (`belongsTo`, `hasMany`, dll) di dalam file `...Entity.php`.
- **LARANGAN KERAS:** **DILARANG** menggunakan Foreign Key Constraint di tingkat database/migration (misalnya dilarang menggunakan `$table->foreignId('...')->constrained()`).
- **Format Kolom ID:** Cukup gunakan `$table->unsignedBigInteger('kategori_id');` biasa tanpa relasi fisik di _migration_. Hal ini untuk memastikan kecepatan transaksi _database_ tinggi dan fleksibilitas _soft-delete_.

## 4. Aturan Routing (Dynamic Auto-Discovery)

- Kamu tidak perlu menulis URL route secara manual di `routes/web.php`.
- Sistem sudah memiliki skrip Dynamic Routing yang membaca folder `app/Modules`.
- URL _endpoint_ akan otomatis dibuat berdasarkan nama folder (Kebab Case).
    - _Contoh:_ Folder `Menu/DataMenu/DataMenuResource.php` akan otomatis menghasilkan route _resource_ dengan URL `/menu/data-menu` dan penamaan route `menu.data-menu.*`.

## 5. Aturan Frontend (React + Inertia)

- Letakkan semua tampilan UI di dalam folder `resources/js/Pages/<NamaModul>/<NamaFitur>/`.
- Gunakan _Functional Components_ React dengan React Hooks (`useState`, `useEffect`).
- Selalu gunakan komponen bawaan Inertia.js (`<Link>`, `useForm`, `router`) untuk navigasi dan submit data agar bersifat SPA (Single Page Application).

## 6. Daftar Modul yang Tersedia

Struktur folder _backend_ ini sudah dibuat. AI Agent hanya perlu mengisi _file_ kosong yang ada di dalamnya:

- `Menu` (KategoriMenu, DataMenu, VarianMenu, ModifierMenu, PaketMenu)
- `Meja` (AreaMeja, DataMeja, ReservasiMeja)
- `POS` (BukaShift, TutupShift, PesananMasuk, SplitBill, GabungMeja, Pembayaran, VoidPesanan, RefundPesanan)
- `Kitchen` (TiketDapur, StatusMasak, KDS)
- `Inventory` (Supplier, BahanBaku, ResepBOM, PurchaseOrder, PenerimaanBarang, OpnameStok, TransferStok, ManajemenWaste)
- `HR` (DataPegawai, HakAkses, Absensi, Komisi)
- `CRM` (DataPelanggan, PoinLoyalty, Membership)
- `Finance` (ArusKas, PettyCash, Pengeluaran)
- `Report` (LaporanPenjualan, LaporanStok, LaporanShift, LaporanPajak)
- `Settings` (ProfilToko, MetodePembayaran, KonfigurasiPajak, PrinterSilent)

## 7. Status Saat Ini & Instruksi Tugas Pertama untuk AI

**Status Saat Ini:**

- Folder _backend_ sudah selesai.
- Routing dinamis sudah berjalan.
- **Database BELUM ADA dan BELUM DI-SETUP.** File `.env` masih bawaan _default_.

**Tugas Pertama (Step-by-Step yang harus dilakukan AI):**

1.  **Setup Database:** Pandu user untuk membuat _database_ MySQL lokal (misal: `mejahub_db`) dan atur koneksinya di `.env`.
2.  **Migration Pertama:** Buat file _migration_ untuk fitur `KategoriMenu` dan `DataMenu` (ingat aturan SANGAT KETAT poin #3: Jangan gunakan FK constraint).
3.  **Koding Backend:** Isi kode di dalam 4 file `app/Modules/Menu/KategoriMenu/` (`Entity`, `Service`, `Collection`, `Resource`) untuk membuat fitur CRUD sederhana.
4.  **Setup Frontend Dasar:** Buat file React di `resources/js/Pages/Menu/KategoriMenu/Index.jsx` dan setup `vite.config.js` / `app.jsx` agar aplikasi Inertia bisa langsung diakses di _browser_.
