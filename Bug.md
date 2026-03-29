# Audit Bug & Inkonsistensi Proyek (30 Maret 2026)

Dokumen ini merangkum temuan bug/inkonsistensi yang terverifikasi dari audit statis + command runtime.

## Status Implementasi

- [x] P1 - Registrasi route resource dibatasi ke action yang benar-benar kompatibel.
- [x] P1 - Mismatch signature vs route parameter diminimalkan lewat filter kompatibilitas action ber-parameter.
- [x] P1 - Parameter route distandarkan menjadi `{id}` (anomali `{arus_ka}`, `{hak_akse}`, `{k_d_}` hilang).
- [x] P2 - Validasi `id` di endpoint delete-by-body diperketat (`required|integer|min:1`).
- [x] P2 - Setup testing didokumentasikan (`README.md`) dan template env testing ditambahkan (`.env.testing.example`).

## Ringkasan Eksekutif

- **Kritis**: Registrasi `Route::resource` global mendaftarkan route yang tidak didukung banyak controller (`32` controller, `117` method REST tidak diimplementasikan).
- **Tinggi**: Banyak method `show/edit/update/destroy` dideklarasikan tanpa parameter ID, padahal route resource mengirim parameter path (`/{resource}`), berpotensi `ArgumentCountError`.
- **Tinggi**: Penamaan route-parameter rusak akibat singularisasi (`{arus_ka}`, `{hak_akse}`, `{k_d_}`), rawan mismatch pada binding/kontrak API/frontend.
- **Sedang**: Endpoint hapus berbasis body (`POST .../delete` dan `DELETE ...`) melakukan cast paksa `(int)$id` tanpa validasi numerik eksplisit.
- **Sedang**: Setup testing tidak siap jalan out-of-the-box di environment tanpa `pdo_sqlite`; test suite ter-skip total.
- **Rendah-Sedang**: Konfigurasi TypeScript ada (`tsconfig.json`) tetapi toolchain TypeScript tidak terpasang (`typescript` tidak ada), sehingga pemeriksaan tipe tidak bisa dijalankan.
- **Rendah**: `README.md` masih template Laravel default, tidak merefleksikan kebutuhan setup proyek ini.

---

## 1) [KRITIS] Resource route otomatis mendaftarkan endpoint yang tidak ada implementasinya

### Bukti

- `routes/web.php` mendaftarkan `Route::resource($urlSlug, $resourceClass)` untuk semua module-feature tanpa membatasi action (`only/except`).
- Hasil audit controller menunjukkan **32 Resource controller** tidak lengkap (total **117 method REST hilang**).

### Dampak

- Endpoint yang terdaftar di `route:list` bisa dipanggil, tetapi ketika action tidak ada akan menghasilkan error runtime (BadMethodCall / 500).
- API surface jadi tidak jujur: route terlihat valid padahal action tidak tersedia.

### Contoh konkret

- `Dashboard/Overview` hanya punya `index`, tetapi route berikut tetap didaftarkan: `store/create/show/update/destroy/edit`.
- `Auth/Login` hanya punya `index/store/destroy`, tetapi route `create/show/edit/update` tetap muncul.

### Akar masalah

- Strategi registrasi route generik tidak sinkron dengan kontrak masing-masing Resource.

### Rekomendasi

1. Gunakan `->only([...])`/`->except([...])` per resource.
2. Atau bangun daftar action dari refleksi method controller sebelum mendaftarkan route.

---

## 2) [TINGGI] Signature method tidak selaras dengan route parameter resource

### Bukti

- Banyak `*Resource` mendefinisikan method seperti `show(): RedirectResponse`, `update(): RedirectResponse`, `destroy(): RedirectResponse` **tanpa parameter ID**.
- Sementara route resource untuk action itu menggunakan pola `/{resource}`.

### Dampak

- Ketika endpoint dengan parameter dipanggil, framework mengirim argumen route ke method controller.
- Method tanpa parameter berpotensi memicu `ArgumentCountError` (runtime failure), terutama pada action `show/update/destroy`.

### Contoh area terdampak

- `app/Modules/CRM/DataPelanggan/DataPelangganResource.php`
- `app/Modules/Kitchen/KDS/KDSResource.php`
- `app/Modules/Settings/RecycleBin/RecycleBinResource.php`
- dan banyak resource lain dengan pola sama.

### Rekomendasi

1. Jika action memang tidak dipakai: jangan daftarkan route action tersebut.
2. Jika action dipakai: sesuaikan signature method agar menerima parameter route yang benar.

---

## 3) [TINGGI] Parameter route menjadi rusak karena singularisasi otomatis

### Bukti

Hasil `route:list` menunjukkan placeholder parameter yang tidak natural/terpotong:

- `finance/arus-kas/{arus_ka}` (harusnya stabil seperti `{id}` atau `{arus_kas}`)
- `hr/hak-akses/{hak_akse}`
- `kitchen/k-d-s/{k_d_}`

Ini terjadi karena:

- route resource didaftarkan dengan slug bahasa Indonesia/akronim,
- singularisasi default Laravel (inflector bahasa Inggris) memodifikasi nama segment,
- override `->parameters([$urlSlug => 'id'])` tidak efektif karena key yang dipakai adalah full path (`module/feature`), bukan segment resource terakhir.

### Dampak

- Kontrak URL tidak konsisten dan membingungkan.
- Potensi mismatch route-model binding dan integrasi frontend/API client.

### Rekomendasi

1. Gunakan nama resource tunggal sebagai key pada `parameters`, bukan full path.
2. Standarkan parameter ke `{id}` untuk semua resource jika tidak memakai binding model by name.

---

## 4) [SEDANG] Endpoint delete-by-body kurang validasi numerik ID

### Bukti

Di `routes/web.php`, route:

- `POST {slug}/delete`
- `DELETE {slug}`

mengambil `id` dari body, lalu langsung cast `(int) $id` setelah hanya cek tidak kosong.

### Dampak

- Input non-numeric seperti `"abc"` lolos cek kosong dan berubah menjadi `0`.
- Menyebabkan perilaku tidak eksplisit (mis. delete id `0` / `findOrFail(0)` / error yang tidak ramah).

### Rekomendasi

1. Validasi `id` sebagai integer positif sebelum invoke `destroy`.
2. Pertimbangkan hapus route delete-by-body jika sudah ada `DELETE /{id}` yang benar.

---

## 5) [SEDANG] Test suite tidak berjalan di environment ini (semua skip)

### Bukti

- Menjalankan `php artisan test --testsuite=Feature` menghasilkan skip dengan pesan:
	`pdo_sqlite tidak tersedia... Set TEST_DB_CONNECTION dan TEST_DB_DATABASE...`
- `tests/TestCase.php` memang melakukan skip saat fallback DB test tidak diisi.

### Dampak

- Risiko regressi tinggi karena quality gate utama (Feature test) tidak mengeksekusi assertion di banyak skenario kritikal POS.

### Rekomendasi

1. Sediakan `.env.testing.example` dengan nilai aman (`TEST_DB_DATABASE` mengandung `test`).
2. Tambahkan dokumentasi setup test environment.
3. Opsional: CI wajibkan set test DB agar tidak silently skipped.

---

## 6) [RENDAH-SEDANG] Konfigurasi TypeScript tidak operasional

### Bukti

- `tsconfig.json` ada dan meng-include `resources/js/**/*`.
- Namun `package.json` tidak memiliki dependency `typescript` dan tidak ada script type-check.
- `npx tsc --noEmit` gagal karena compiler tidak terpasang.

### Dampak

- Developer mengira ada type safety padahal tidak ada pemeriksaan tipe yang benar-benar berjalan.

### Rekomendasi

1. Jika ingin TS check: install `typescript` dan tambahkan script `type-check`.
2. Jika proyek full JS: hapus `tsconfig.json` agar tidak menyesatkan.

---

## 7) [RENDAH] Dokumentasi proyek belum sesuai kondisi nyata

### Bukti

- `README.md` masih konten default Laravel, tidak menjelaskan:
	- arsitektur module-based,
	- requirement env test,
	- command setup/build/test khusus proyek.

### Dampak

- Onboarding lambat, konfigurasi sering salah, dan bug environment berulang.

### Rekomendasi

1. Perbarui README dengan langkah setup lengkap backend/frontend/testing.

---

## Prioritas Perbaikan Disarankan

1. **P1**: Perbaiki registrasi route resource (batasi action sesuai method nyata).
2. **P1**: Benahi signature action yang menerima parameter route.
3. **P1**: Standarisasi route parameter naming (`id` atau nama baku yang tidak disingularisasi otomatis).
4. **P2**: Perketat validasi `id` di delete-by-body route.
5. **P2**: Rapikan setup test DB + dokumentasi agar test benar-benar jalan.
