# SOP Transisi dari Nota Manual ke Sistem Digital – Mode UMKM (Lean Ops)

**Location:**  
`/docs/08-operations/sop-transisi-manual-ke-digital.md`

**Status:** READY – Cutover Procedure

Dokumen ini mendefinisikan prosedur resmi transisi dari pencatatan manual (nota kertas / buku) ke sistem digital.

Tujuan utama:

- Tidak ada data hilang saat perpindahan
- Tidak ada stok menjadi tidak akurat
- Tidak ada selisih kas akibat periode transisi
- Tidak ada dua sistem berjalan permanen

Dokumen ini bersifat operasional dan tidak mengubah aturan domain atau sistem.

---

# 1. Penentuan Tanggal Cutover

Wajib menentukan satu tanggal resmi sebagai awal penggunaan sistem digital penuh.

Contoh:

> 1 Maret 2026 = Hari pertama seluruh transaksi masuk sistem.

Aturan:

- Sebelum tanggal tersebut → sistem manual berlaku.
- Mulai tanggal tersebut → semua transaksi wajib digital.
- Tidak diperbolehkan mencampur sistem secara permanen.

Tanggal cutover harus diumumkan kepada seluruh pihak terkait.

---

# 2. Persiapan Sebelum Cutover (H-3 sampai H-1)

## 2.1 Stock Opname Penuh

Langkah:

1. Hitung fisik seluruh barang.
2. Catat jumlah nyata di gudang/laci.
3. Gunakan fitur Initialize Stock atau Initial Entry sebagai baseline.

Aturan:

- Jangan menggunakan angka dari buku lama tanpa cek fisik.
- Angka hasil stock opname menjadi sumber kebenaran awal sistem.

---

## 2.2 Saldo Kas Awal

1. Hitung kas fisik.
2. Catat sebagai saldo kas awal di sistem.
3. Simpan catatan referensi manual.

---

## 2.3 Piutang Lama

Pisahkan antara:

- Piutang sebelum sistem
- Piutang setelah sistem

Opsi Lean:

- Input sebagai outstanding awal dengan catatan referensi manual, atau
- Simpan dalam daftar terpisah (Excel) dan tidak dicampur dengan transaksi baru.

Tidak disarankan menginput ulang seluruh histori transaksi lama kecuali benar-benar diperlukan.

---

# 3. Prosedur Hari Cutover (Hari H)

Mulai hari ini:

- Semua penjualan wajib masuk sistem.
- Semua perubahan stok wajib melalui sistem.
- Tidak ada pencatatan manual untuk transaksi normal.

Jika sistem mengalami gangguan:

1. Catat sementara di kertas.
2. Masukkan ke sistem di hari yang sama sebelum tutup toko.
3. Jangan menunda ke hari berikutnya.

---

# 4. Masa Adaptasi (1–2 Minggu Pertama)

Fase ini paling berisiko terhadap kesalahan.

Aturan tambahan:

- Tutup kas harian wajib dilakukan.
- Cek stok fast moving setiap hari.
- Owner memeriksa dashboard setiap malam.
- Selisih sekecil apa pun harus dicatat.

Kesalahan diperbolehkan terjadi, tetapi tidak boleh diabaikan.

---

# 5. Larangan Keras Selama Transisi

- Tidak menjalankan dua sistem secara permanen.
- Tidak mengedit database secara langsung untuk menyamakan dengan buku lama.
- Tidak memasukkan ulang seluruh histori lama tanpa kebutuhan jelas.
- Tidak menunda input transaksi lebih dari satu hari.

---

# 6. Kriteria Sistem Siap untuk Cutover

Transisi hanya boleh dilakukan jika:

- Create Order stabil.
- Cancel Order mengembalikan stok dengan benar.
- Receive/Adjust Stock berfungsi.
- Reporting dasar (sales & stok) dapat dipercaya.
- Backup sudah aktif dan pernah diuji.

Jika salah satu belum stabil, cutover harus ditunda.

---

# 7. Risiko Umum Transisi

Risiko yang sering terjadi:

1. Kasir masih menulis manual karena kebiasaan.
2. Stok awal tidak akurat.
3. Piutang lama tercampur dengan transaksi baru.
4. Owner tidak melakukan review rutin.

Mitigasi utama adalah disiplin terhadap tanggal cutover dan SOP harian.

---

# 8. Prinsip Dasar Transisi

1. Satu tanggal kebenaran.
2. Satu sumber data.
3. Tidak ada edit manual database.
4. Semua transaksi tercatat di sistem.
5. Semua selisih ditelusuri.

---

# Penutup

Transisi ke sistem digital bukan hanya perubahan alat, tetapi perubahan kebiasaan.

Keberhasilan transisi ditentukan oleh disiplin operasional, bukan kompleksitas fitur.

Dokumen ini berlaku sampai seluruh transaksi manual sepenuhnya dihentikan dan sistem digital menjadi satu-satunya sumber kebenaran.

