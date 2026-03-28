# Modul Penggunaan Aplikasi Mejahub POS

Dokumen ini adalah panduan penggunaan aplikasi untuk operasional harian.

Dokumen ini tidak membahas instalasi atau setup teknis server.

## 1. Gambaran Umum

Mejahub POS adalah aplikasi operasional restoran/kafe yang mencakup:

- POS transaksi
- HR (pegawai, shift, absensi, penggajian)
- Inventory
- CRM
- Finance
- Report
- Settings

Setiap menu akan terlihat sesuai hak akses user.

## 2. Cara Login dan Navigasi Dasar

### 2.1 Login

1. Buka halaman login.
2. Masukkan email dan password pegawai.
3. Klik Login.

Catatan:

- Jika menu yang Anda cari tidak muncul, kemungkinan role/hak akses akun Anda belum diberikan.

### 2.2 Struktur Layout

- Sidebar kiri: daftar modul utama.
- Header atas: judul halaman aktif.
- Konten utama: tabel data, form, filter, aksi.

### 2.3 Pola Tombol Umum di Hampir Semua Menu

- Tambah: membuka form data baru.
- Edit: mengubah data terpilih.
- Hapus: menghapus data (biasanya diminta konfirmasi).
- Search: mencari data pada tabel.
- Sebelumnya/Berikutnya: pindah halaman data (pagination).
- Export Excel/PDF: unduh laporan.

## 3. Alur Penggunaan Harian (Ringkas)

### 3.1 Alur Kasir

1. Buka Shift (isi kas awal).
2. Proses pesanan dan pembayaran.
3. Jika perlu, lakukan split bill/gabung meja/void/refund sesuai kebijakan.
4. Tutup Shift (isi kas aktual dan cek selisih).

### 3.2 Alur Supervisor/Manager

1. Cek Dashboard Overview.
2. Pantau Absensi dan Jadwal Shift.
3. Approval pengajuan izin/cuti/tukar shift (dari E-Absensi jika role mengizinkan).
4. Cek report harian/mingguan.

### 3.3 Alur Admin HR

1. Kelola Data Pegawai dan Hak Akses.
2. Definisikan Pengaturan Shift.
3. Generate Jadwal Shift.
4. Atur Pengaturan Gaji.
5. Generate Penggajian.

## 4. Panduan Per Modul

## 4A. Dashboard

### Dashboard > Overview

Fungsi:

- Ringkasan operasional dan performa.
- Export ringkasan ke Excel/PDF jika tersedia.

Cara pakai:

1. Buka Dashboard > Overview.
2. Atur filter periode (jika ada).
3. Tinjau KPI.
4. Gunakan Export bila diperlukan.

## 4B. POS

### POS > Buka Shift

Fungsi:

- Memulai operasional kasir.

Cara pakai:

1. Buka POS > Buka Shift.
2. Isi Kas Awal.
3. Isi Catatan Buka (opsional).
4. Klik Buka Shift.

Catatan:

- Jika sudah ada shift aktif, tombol bisa dinonaktifkan.

### POS > Pesanan Masuk

Fungsi:

- Kelola order yang berjalan.

Cara pakai:

1. Pilih meja/pesanan.
2. Tambah item menu.
3. Simpan pesanan.
4. Pantau status pesanan.

### POS > Pembayaran

Fungsi:

- Menyelesaikan transaksi.

Cara pakai:

1. Pilih pesanan yang akan dibayar.
2. Pilih metode pembayaran.
3. Konfirmasi nominal.
4. Simpan pembayaran.

Catatan:

- Pastikan shift sudah dibuka sebelum proses pembayaran.

### POS > Split Bill

Fungsi:

- Memecah tagihan satu pesanan ke beberapa pembayaran.

Cara pakai:

1. Pilih pesanan.
2. Pilih item yang dipisah.
3. Simpan hasil split.

### POS > Gabung Meja

Fungsi:

- Menggabungkan transaksi dari beberapa meja.

Cara pakai:

1. Pilih meja sumber.
2. Pilih meja tujuan.
3. Konfirmasi penggabungan.

### POS > Void Pesanan dan Refund Pesanan

Fungsi:

- Koreksi transaksi sesuai otorisasi.

Cara pakai:

1. Pilih transaksi.
2. Isi alasan void/refund.
3. Simpan.

Catatan:

- Gunakan sesuai SOP internal dan approval.

### POS > Tutup Shift

Fungsi:

- Mengakhiri operasional kasir.

Cara pakai:

1. Buka POS > Tutup Shift.
2. Cek ringkasan kas (cash dan non-cash).
3. Isi Kas Aktual.
4. Isi Catatan Tutup (opsional).
5. Klik Tutup Shift.

Catatan:

- Sistem menampilkan preview selisih sebelum submit.

## 4C. Menu

Submenu:

- Kategori Menu
- Data Menu
- Varian Menu
- Modifier Menu
- Paket Menu

Alur rekomendasi pengisian master menu:

1. Isi Kategori Menu.
2. Isi Data Menu.
3. Tambah Varian/Modifier bila perlu.
4. Bentuk Paket Menu jika dibutuhkan.

Tips:

- Gunakan nama menu konsisten agar report akurat.

## 4D. Meja

Submenu:

- Area Meja
- Data Meja
- Reservasi Meja

Alur:

1. Buat Area Meja.
2. Tambah Data Meja per area.
3. Kelola reservasi harian.

## 4E. Kitchen

Submenu:

- Tiket Dapur
- Status Masak
- KDS

Tujuan:

- Menjembatani order dari POS ke dapur.
- Update progres masak secara realtime.

## 4F. Inventory

Submenu:

- Supplier
- Bahan Baku
- Purchase Order
- Penerimaan Barang
- Opname Stok
- Transfer Stok
- Mutasi Stok
- Manajemen Waste
- Resep BOM

Alur inti inventory:

1. Input Supplier.
2. Input Bahan Baku.
3. Buat Purchase Order.
4. Lakukan Penerimaan Barang.
5. Atur Resep BOM agar konsumsi stok otomatis lebih akurat.
6. Lakukan Opname berkala.
7. Catat Waste untuk pengendalian biaya.

## 4G. HR

Submenu:

- Data Pegawai
- Hak Akses
- Pengaturan Shift
- Jadwal Shift
- Absensi
- Komisi
- Pengaturan Gaji
- Penggajian

### HR > Data Pegawai

Fungsi:

- Master akun karyawan.

Cara pakai:

1. Tambah pegawai baru.
2. Pastikan email valid untuk login.
3. Isi jabatan sesuai struktur organisasi.

### HR > Hak Akses

Fungsi:

- Mengatur role dan permission menu.

Cara pakai:

1. Buat role.
2. Pilih permission modul yang diizinkan.
3. Pasangkan role ke pegawai.

Catatan:

- Sidebar hanya menampilkan menu sesuai permission.

### HR > Pengaturan Shift

Fungsi:

- Master shift kerja.

Cara pakai:

1. Tambah shift.
2. Isi nama shift, jam masuk, jam keluar.
3. Simpan.

### HR > Jadwal Shift

Fungsi:

- Menyusun jadwal harian per pegawai.

Cara pakai manual:

1. Klik Tambah Jadwal.
2. Pilih Pegawai.
3. Pilih Shift.
4. Pilih Tanggal.
5. Simpan.

Cara pakai generate massal:

1. Klik Generate Jadwal.
2. Isi tanggal mulai dan tanggal selesai.
3. Pilih hari kerja.
4. Pilih daftar pegawai.
5. Atur skip existing:
    - Ya: jadwal yang sudah ada tidak diganti.
    - Tidak (replace): jadwal existing diganti.
6. Klik Generate Jadwal.

Export jadwal:

1. Isi rentang tanggal dari dan sampai di area export.
2. Klik Export Excel atau Export PDF.

### HR > Absensi

Fungsi:

- Kelola data absensi dari aplikasi staff dan input manual.

Cara pakai:

1. Cek data absensi harian.
2. Tambah/edit jika diperlukan oleh kebijakan.

### HR > Komisi

Fungsi:

- Kelola data komisi pegawai.

### HR > Pengaturan Gaji

Fungsi:

- Menyimpan template gaji pokok dan kebijakan payroll per pegawai.

Cara pakai:

1. Tambah template per pegawai.
2. Atur parameter potongan/tunjangan lembur sesuai kebijakan.

### HR > Penggajian

Fungsi:

- Generate payroll dari rekap absensi.

Cara generate otomatis:

1. Klik Generate Otomatis.
2. Tentukan periode payroll.
3. Review parameter dan nominal.
4. Simpan hasil generate.

## 4H. E-Absensi Mobile Karyawan

Endpoint halaman:

- HR > E-Absensi (mobile experience).

Fungsi:

- Absensi masuk/pulang.
- Histori absensi.
- Kalender status hadir/izin/sakit/alpha.
- Pengajuan izin, cuti, tukar shift.

Alur absensi:

1. Buka tab Home.
2. Klik aksi absensi.
3. Izinkan akses kamera/lokasi bila diminta.
4. Ambil foto (jika kebijakan mewajibkan).
5. Kirim absensi.

Catatan penting:

- Jika belum ada shift aktif hari ini, absensi ditolak.
- Jika geofence aktif dan lokasi di luar radius, absensi ditolak.

Alur pengajuan:

1. Buka tab Requests.
2. Pilih jenis pengajuan (izin/cuti/tukar shift).
3. Isi tanggal dan alasan.
4. Lampirkan file jika diperlukan.
5. Submit.

## 4I. CRM

Submenu:

- Data Pelanggan
- Membership
- Poin Loyalty

Tujuan:

- Mengelola data pelanggan dan retensi.

## 4J. Finance

Submenu:

- Arus Kas
- Hutang
- Petty Cash
- Pengeluaran

Alur ringkas:

1. Catat transaksi kas kecil dan pengeluaran.
2. Pantau arus kas.
3. Pantau hutang supplier.

## 4K. Report

Submenu utama laporan:

- Penjualan
- Keuangan
- Hutang
- Petty Cash
- Performa Menu
- Pajak
- Shift
- Stok
- Waste
- Opname Selisih
- Void Refund
- Heatmap

Cara pakai report:

1. Buka report yang dibutuhkan.
2. Atur filter periode.
3. Klik Export Excel atau Export PDF.

## 4L. Settings

Submenu:

- Profil Toko
- Metode Pembayaran
- Konfigurasi Pajak
- Printer Silent
- Recycle Bin

Urutan pengisian awal yang disarankan:

1. Profil Toko.
2. Metode Pembayaran.
3. Konfigurasi Pajak.
4. Printer Silent.

## 5. Rekomendasi SOP Operasional

Sebelum buka toko:

1. Pastikan data menu aktif.
2. Cek stok bahan baku penting.
3. Pastikan kasir membuka shift.
4. Pastikan jadwal shift karyawan sudah dibuat.

Saat operasional:

1. Pantau pesanan dan pembayaran.
2. Catat pengeluaran kas kecil saat terjadi.
3. Pantau tiket dapur.

Setelah tutup toko:

1. Tutup shift kasir.
2. Review absensi harian.
3. Review dashboard dan report singkat.

## 6. Troubleshooting Singkat

Menu tidak muncul:

- Cek role dan permission di Hak Akses.

Tidak bisa absen:

- Pastikan ada jadwal shift aktif hari ini.
- Pastikan izin kamera/lokasi aktif.
- Pastikan berada di area radius jika geofence aktif.

Tidak bisa proses pembayaran:

- Pastikan shift kasir sudah dibuka.

Export tidak sesuai periode:

- Pastikan filter tanggal/periode sudah benar sebelum klik export.

## 7. Kontrol Akses dan Tanggung Jawab

- Admin: setting master, role, payroll, konfigurasi sistem.
- Manager/Supervisor: monitoring harian, validasi operasional, review report.
- Kasir: POS harian (buka, transaksi, tutup shift).
- Staff: absensi, pengajuan, eksekusi tugas operasional.

## 8. Penutup

Jika Anda baru pertama memakai aplikasi, jalankan urutan ini:

1. Login.
2. Pelajari sidebar dan menu yang tersedia untuk akun Anda.
3. Coba alur harian sesuai peran Anda.
4. Gunakan report untuk validasi hasil operasional.

Dokumen ini dapat diperbarui seiring penambahan fitur baru.

## 9. Skenario Implementasi Nyata: Coffee Shop Masih Pakai Majoo

Bagian ini menjawab kondisi Anda saat ini:

- Toko sudah berjalan sejak Februari.
- POS transaksi harian masih di Majoo.
- Mejahub dipakai untuk operasional manajemen: stok, pembelian, biaya, shift, absensi, penggajian, dan laporan manajerial.

### 9.1 Prinsip Operasional (Mode Hybrid)

Karena POS belum dipindah ke Mejahub, maka:

1. Sumber data penjualan harian = Majoo.
2. Sumber data operasional internal = Mejahub.
3. Fokus Mejahub saat ini:
    - Inventory control.
    - HR (shift, absensi, payroll).
    - Finance (pengeluaran, petty cash, hutang).
    - Consolidated report manajemen (dengan input penjualan dari Majoo).

Artinya Mejahub berjalan sebagai sistem kontrol operasional dan keuangan internal, bukan kasir transaksi utama.

### 9.2 Data yang Harus Diinput Setiap Hari

Minimal data harian yang wajib masuk ke Mejahub:

1. Rekap penjualan harian dari Majoo.
2. Pengeluaran harian (bahan baku + operasional).
3. Absensi karyawan.
4. Jika ada barang masuk, input penerimaan barang.

### 9.3 SOP Penjualan (Ambil dari Majoo, Input ke Mejahub)

Setiap akhir hari (atau awal hari berikutnya):

1. Ambil laporan penjualan dari Majoo untuk tanggal tersebut.
2. Catat angka utama:
    - Omzet kotor.
    - Jumlah transaksi.
    - Metode bayar (cash/non-cash jika tersedia).
    - Diskon/void/refund (jika ada).
3. Input angka rekap tersebut ke modul report/keuangan yang digunakan sebagai sumber monitoring internal.
4. Simpan bukti dokumen (PDF/screenshot Majoo) sebagai arsip harian.

Catatan penting:

- Jangan campur data antar tanggal.
- Tetapkan jam cut-off harian tetap (misalnya 23:59 atau jam tutup toko).

### 9.4 SOP Pengeluaran: Ada Invoice dan Tanpa Invoice

Kasus Anda sangat umum. Solusinya bukan menunggu sempurna, tapi standarisasi pencatatan.

#### A. Jika ada invoice/nota

1. Input ke Pengeluaran atau Petty Cash.
2. Isi nominal, tanggal, kategori biaya, supplier/vendor.
3. Upload lampiran invoice/foto nota.
4. Tandai status bukti: Lengkap.

#### B. Jika tidak ada invoice

1. Tetap wajib dicatat pada hari yang sama.
2. Isi minimal field wajib:
    - Tanggal.
    - Nominal.
    - Kategori biaya.
    - Penanggung jawab pembelian.
    - Alasan tidak ada invoice.
3. Lampirkan bukti alternatif (jika ada):
    - Foto barang.
    - Screenshot chat/transfer.
    - Catatan internal yang disetujui atasan.
4. Tandai status bukti: Tanpa Invoice.

Saran kebijakan internal:

- Buat batas maksimal nilai transaksi tanpa invoice (contoh: di atas nominal tertentu wajib approval manager).
- Lakukan review mingguan khusus transaksi tanpa invoice.

### 9.5 SOP Bahan Baku dan Stok

Agar food cost terkontrol meskipun POS masih di Majoo:

1. Masterkan bahan baku dan supplier terlebih dulu.
2. Setiap pembelian bahan baku, input ke Purchase Order/Penerimaan Barang (sesuai alur yang dipakai).
3. Catat waste harian/berkala.
4. Lakukan opname berkala (misal mingguan).
5. Bandingkan:
    - Stok teoritis.
    - Stok fisik.
    - Selisih opname.

### 9.6 SOP Shift, Absensi, dan Payroll

1. Susun shift mingguan/bulanan di Jadwal Shift.
2. Pastikan semua staff punya shift aktif (agar absensi tidak gagal).
3. Pantau absensi harian (hadir, izin, sakit, alpha, terlambat).
4. Di akhir periode, generate payroll dari rekap absensi.
5. Review hasil payroll sebelum finalisasi pembayaran.

### 9.7 Rekonsiliasi Harian yang Wajib (Kunci Kontrol)

Setiap hari, lakukan check sederhana ini:

1. Penjualan (Majoo) sudah masuk ke Mejahub.
2. Total pengeluaran hari itu sudah dicatat.
3. Seluruh transaksi tanpa invoice sudah diberi alasan.
4. Absensi hari itu lengkap.

Jika salah satu belum lengkap, status hari tersebut dianggap belum closing administrasi.

### 9.8 Rekonsiliasi Mingguan/Bulanan (Untuk Owner)

Review mingguan:

1. Tren penjualan.
2. Total pembelian bahan baku.
3. Total pengeluaran operasional.
4. Rasio biaya terhadap penjualan.
5. Daftar transaksi tanpa invoice.

Review bulanan:

1. Laba rugi internal (berdasarkan data yang tersedia).
2. Performa payroll vs penjualan.
3. Selisih stok dan waste.
4. Rencana perbaikan minggu berikutnya.

### 9.9 Cara Menangani Data Historis Sejak Februari

Karena toko sudah berjalan, lakukan backfill bertahap:

1. Prioritas 1: input rekap penjualan per hari dari Majoo (minimal omzet + transaksi).
2. Prioritas 2: input pengeluaran besar dulu (bahan baku utama, sewa, gaji, utilitas).
3. Prioritas 3: lengkapi detail kecil secara bertahap.

Tips backfill:

- Kerjakan per minggu, jangan langsung per bulan.
- Gunakan format tanggal konsisten.
- Beri tag/catatan "backfill" pada data lama agar mudah audit.

### 9.10 Kapan POS Mejahub Mulai Diaktifkan

POS Mejahub sebaiknya diaktifkan setelah:

1. Master menu dan harga stabil.
2. Metode pembayaran dan pajak sudah valid.
3. Tim kasir sudah training.
4. Simulasi 3-7 hari tanpa selisih besar.

Sebelum itu, mode hybrid (Majoo untuk transaksi + Mejahub untuk kontrol operasional) adalah strategi yang aman.

### 9.11 Ringkasan Keputusan Praktis

Untuk kondisi Anda sekarang, keputusan terbaik:

1. Tetap gunakan Majoo untuk transaksi kasir sementara.
2. Gunakan Mejahub penuh untuk HR, inventory, pengeluaran, dan payroll.
3. Wajib input rekap penjualan Majoo harian ke Mejahub.
4. Catat semua pengeluaran, termasuk yang tanpa invoice, dengan aturan bukti alternatif.
5. Terapkan checklist rekonsiliasi harian agar data tidak bolong.

## 10. Checklist Kerja 14 Hari (Kondisi Invoice Belum Lengkap + Belum Pernah Opname)

Bagian ini adalah rencana eksekusi cepat agar operasional langsung tertata tanpa menunggu data historis sempurna.

### 10.1 Tujuan 14 Hari

1. Menutup kebocoran pencatatan mulai hari ini.
2. Membuat stok awal baseline yang valid.
3. Menjalankan kontrol harian yang ringan tapi konsisten.
4. Menampilkan analisa HPP dan warning yang bisa langsung ditindak.

### 10.2 Prinsip Kerja

1. Mulai hari ini wajib disiplin input harian.
2. Data lama dibenahi bertahap, prioritas nominal terbesar.
3. Semua data tanpa invoice tetap dicatat dengan status bukti.
4. Keputusan operasional harian didasarkan pada data terbaik yang tersedia.

### 10.3 Definisi Status Bukti Pengeluaran

Gunakan status ini di catatan internal Finance:

1. Lengkap: ada invoice/nota.
2. Parsial: tidak ada nota, tapi ada bukti alternatif (transfer/chat/foto barang).
3. Tanpa Bukti: hanya catatan nominal dan keterangan pembelian.

### 10.4 Checklist Harian (Wajib)

Gunakan checklist ini setiap hari tanpa jeda.

#### A. Sebelum Buka Toko (10-15 menit)

1. Cek jadwal shift hari ini di HR > Jadwal Shift.
2. Pastikan kasir yang bertugas sudah siap buka shift.
3. Cek bahan baku kritikal (kopi, susu, gula, cup, tutup) secara visual cepat.
4. Catat potensi kekurangan untuk pembelian hari ini.

#### B. Saat Operasional Berjalan

1. Semua pembelian/pengeluaran langsung dicatat ke Finance > Pengeluaran/Petty Cash.
2. Setiap input pengeluaran wajib isi:
   tanggal, nominal, kategori, penanggung jawab, status bukti.
3. Jika barang masuk, input ke Inventory > Penerimaan Barang di hari yang sama.
4. Jika ada waste, catat ke Inventory > Manajemen Waste.

#### C. Setelah Tutup Toko (15-20 menit)

1. Ambil laporan penjualan harian dari POS eksternal.
2. Upload ke Report > Import Penjualan.
3. Buka analisa HPP dan cek 3 area:
   Top Margin Terendah, warning belum mapping menu, warning BOM belum lengkap.
4. Cek Finance: pastikan seluruh pengeluaran hari itu sudah masuk.
5. Cek HR > Absensi: pastikan status hadir/izin/sakit sudah lengkap.
6. Tandai hari sebagai Selesai Administrasi jika 4 hal ini lengkap:
   penjualan, pengeluaran, absensi, penerimaan barang/waste (jika ada).

### 10.5 Agenda Mingguan (Wajib)

Lakukan setiap akhir minggu (30-60 menit):

1. Review total omzet mingguan vs total pengeluaran.
2. Review daftar transaksi status Parsial dan Tanpa Bukti.
3. Review 10 warning omzet terbesar pada:
   belum terpetakan menu dan belum ada BOM.
4. Tetapkan target perbaikan minggu depan:
   minimal 10 menu terlaris harus sudah mapping + BOM valid.

### 10.6 Rencana Eksekusi 14 Hari

#### Hari 1-3 (Stabilisasi)

1. Tetapkan tanggal cut-off administrasi (hari mulai disiplin penuh).
2. Terapkan checklist harian penuh.
3. Lakukan opname baseline untuk bahan baku utama.
4. Catat stok fisik hasil hitung sebagai titik awal valid.

#### Hari 4-7 (Kontrol Data Besar)

1. Backfill pengeluaran nominal terbesar 1 bulan terakhir.
2. Labeli semua transaksi lama dengan status bukti.
3. Rapikan kategori pengeluaran agar laporan konsisten.
4. Update master supplier dan bahan baku yang sering dipakai.

#### Hari 8-10 (Akurasi HPP)

1. Fokus pada menu omzet terbesar dari Import Penjualan.
2. Mapping nama produk file ke Data Menu yang benar.
3. Lengkapi Resep BOM untuk menu prioritas.
4. Pastikan harga beli terakhir bahan baku terisi.

#### Hari 11-14 (Penguatan SOP)

1. Kurangi warning missing mapping dan missing BOM minimal 50%.
2. Terapkan review harian Top Margin Terendah dengan minimum omzet.
3. Buat keputusan aksi:
   update harga jual, update porsi, negosiasi bahan baku, atau kurangi waste.
4. Lakukan evaluasi 14 hari dan tetapkan SOP tetap bulanan.

### 10.7 Format Catatan Internal yang Disarankan

Gunakan format singkat ini agar tim tidak bingung:

1. Pengeluaran tanpa invoice:
   Tanggal | Kategori | Nominal | Penanggung Jawab | Status Bukti | Catatan.
2. Hasil closing harian:
   Tanggal | Penjualan Masuk | Pengeluaran Masuk | Absensi Lengkap | Stok/Waste Tercatat | Status Hari.
3. Action list mingguan:
   Item Warning | Omzet Dampak | Aksi | PIC | Target Tanggal.

### 10.8 KPI Sederhana untuk Monitoring Owner

Pantau KPI ini setiap minggu:

1. Persentase pengeluaran berstatus Lengkap.
2. Jumlah transaksi status Tanpa Bukti.
3. Jumlah warning missing mapping.
4. Jumlah warning missing BOM.
5. Margin estimasi mingguan dari rekap harian.

Target realistis awal:

1. Minggu 1: data harian disiplin 80%.
2. Minggu 2: warning utama turun minimal 30-50%.
3. Bulan berikutnya: operasional stabil dengan closing harian konsisten.
