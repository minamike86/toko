# SOP Operasional Harian – Mode UMKM (Lean Ops)

**Location:**  
`/docs/08-operations/sop-operasional-harian.md`

**Status:** READY – Operational Discipline Baseline

Dokumen ini mendefinisikan prosedur operasional harian untuk memastikan:

- Tidak ada transaksi tanpa pencatatan sistem
- Tidak ada perubahan stok tanpa jejak
- Tidak ada selisih kas tanpa investigasi
- Sistem digunakan secara disiplin oleh seluruh pengguna

Dokumen ini bersifat operasional dan tidak mengubah domain atau aturan bisnis.

---

# 1. SOP Buka Toko

Dilakukan pada awal shift.

## Checklist:

1. Login menggunakan akun masing-masing (dilarang berbagi akun).
2. Pastikan tanggal dan waktu sistem benar.
3. Pastikan sistem tidak dalam Maintenance Mode.
4. Periksa:
   - Low Stock Report
   - Credit Outstanding
5. Catat saldo kas awal di laci.

Jika sistem menampilkan error, transaksi tidak boleh dimulai sebelum masalah jelas.

---

# 2. SOP Transaksi Penjualan

## Aturan Wajib:

- Semua penjualan harus dicatat melalui sistem.
- Tidak diperbolehkan mencatat manual untuk diinput nanti.
- Harga tidak boleh diubah tanpa otorisasi Admin.
- Transaksi kredit wajib memiliki identitas pelanggan yang jelas.

## Jika Salah Input:

- Gunakan fitur Cancel Order.
- Buat ulang transaksi yang benar.
- Dilarang mengubah database secara langsung.

---

# 3. SOP Pembayaran Piutang (Pay Credit)

1. Pastikan order berstatus outstanding.
2. Masukkan nominal pembayaran sesuai uang diterima.
3. Konfirmasi jumlah sebelum submit.
4. Simpan bukti pembayaran jika diperlukan.

Dilarang:

- Mengurangi outstanding secara manual.
- Menghapus transaksi lama.

---

# 4. SOP Terima Barang (Receive Stock)

1. Cocokkan barang fisik dengan nota supplier.
2. Input quantity sesuai jumlah fisik.
3. Jangan melakukan estimasi.
4. Simpan nota minimal 1 bulan.

Jika nota tidak tersedia:

- Gunakan origin ADJUSTMENT.
- Catat alasan penyesuaian.

---

# 5. SOP Stock Opname Ringan (Harian Cepat)

Dilakukan untuk 5–10 produk fast moving.

Langkah:

1. Bandingkan stok fisik dengan sistem.
2. Jika ada selisih:
   - Gunakan fitur Adjust Stock.
   - Catat alasan.
3. Dilarang mengubah database langsung.

Stock opname penuh dapat dilakukan secara berkala (bulanan atau triwulan).

---

# 6. SOP Tutup Toko

Dilakukan setiap akhir shift.

## A. Rekap Sistem

- Total Sales hari ini
- Total Cash
- Total Credit

## B. Hitung Kas Fisik

Bandingkan kas fisik dengan total cash di sistem.

Jika terdapat selisih:

- Catat nominal selisih
- Laporkan kepada Admin/Owner
- Jangan diabaikan

## C. Simpan Kas

- Pisahkan modal dan keuntungan
- Jangan mencampur uang pribadi dengan uang usaha

---

# 7. SOP Backup Berkala

Minimal dilakukan:

- Sebelum migration besar
- Secara rutin sesuai kebijakan backup

Langkah:

1. Jalankan `npm run db:backup`
2. Pastikan file backup terbentuk
3. Verifikasi ukuran file masuk akal

Restore harus pernah diuji pada environment non-production.

---

# 8. SOP Jika Terjadi Error Sistem

1. Catat pesan error.
2. Ambil screenshot jika perlu.
3. Jangan lanjutkan transaksi yang gagal.
4. Laporkan kepada Admin atau penanggung jawab sistem.

Dilarang:

- Mengubah data langsung di database.
- Menghapus data untuk “memperbaiki” kesalahan.

---

# 9. SOP Kontrol Owner (Mingguan)

Owner wajib melakukan pengecekan:

- Credit Outstanding
- Produk Low Stock
- Total penjualan mingguan
- Selisih kas (jika ada)

Tujuannya untuk memastikan sistem digunakan secara disiplin.

---

# 10. Aturan Emas

1. Semua transaksi masuk sistem.
2. Semua perubahan stok melalui sistem.
3. Semua selisih dicatat dan dijelaskan.
4. Tidak ada edit langsung database.
5. Tidak ada berbagi akun.

---

# Penutup

SOP ini memastikan sistem tidak hanya benar secara teknis, tetapi juga digunakan dengan disiplin.

Konsistensi operasional lebih penting daripada kompleksitas fitur.

Dokumen ini berlaku sampai sistem memasuki fase scale-up atau perubahan operasional besar.

