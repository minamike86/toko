# MVP Step 1 – Core Transaction

Dokumen ini mendefinisikan secara eksplisit ruang lingkup **MVP Step 1** untuk Sistem Jual Beli Terpadu. Dokumen ini berfungsi sebagai **pengunci implementasi**, agar pengembangan tidak melebar sebelum fondasi sistem benar-benar stabil.

Dokumen ini **tidak mendefinisikan ulang domain atau use case**, melainkan **merangkum apa saja yang WAJIB sudah berjalan** berdasarkan dokumen di folder `/docs`.

---

## Tujuan Utama

MVP Step 1 bertujuan membuktikan bahwa sistem mampu:
- Menangani transaksi penjualan secara benar
- Menjaga konsistensi stok
- Mencatat fakta bisnis tanpa kebohongan data

Jika tujuan ini belum tercapai, **tidak boleh melanjutkan ke MVP Step berikutnya**.

---

## Cakupan Fungsional

### 1. Catalog

Fitur yang harus tersedia:
- Membuat dan mengelola product
- Menentukan satuan produk
- Menentukan base price (harga jual)
- Mengaktifkan / menonaktifkan product

Rujukan:
- `catalog-domain.md`

---

### 2. Inventory

Fitur yang harus tersedia:
- Inisialisasi stok awal
- Penambahan stok manual
- Penyesuaian stok (koreksi)
- Pengurangan stok akibat penjualan

Rujukan:
- `inventory-domain.md`
- `initialize-stock.md`
- `receive-stock.md`
- `adjust-stock.md`

---

### 3. Sales

Fitur yang harus tersedia:
- Pembuatan order
- Penjualan tunai (cash)
- Penjualan hutang (credit)
- Pembatalan order

Rujukan:
- `sales-domain.md`
- `create-order.md`
- `cancel-order.md`

---

## Aturan Domain yang WAJIB Dijaga

- Product tidak menyimpan stok
- Inventory tidak menyimpan harga
- Sales tidak mengubah stok secara langsung
- Snapshot data transaksi bersifat immutable
- Stok berkurang hanya saat order PAID atau ON_CREDIT

Rujukan:
- `ddd-boundaries.md`

---

## Yang Sengaja TIDAK Termasuk

MVP Step 1 **tidak mencakup**:
- Pajak
- Diskon / promo
- Multi-gudang
- Accounting / laporan keuangan
- Reporting lanjutan
- Integrasi eksternal

Fitur-fitur di atas **bukan ditolak**, tetapi **ditunda secara sadar**.

---

## Definisi Selesai (Definition of Done)

MVP Step 1 dianggap selesai jika:
- Seluruh use case inti dapat dijalankan tanpa melanggar domain
- Transaksi memengaruhi stok dengan benar
- Tidak ada logic bisnis di UI atau infrastructure
- Test use case utama lulus (cash, credit, cancel)

---

## Prinsip Implementasi

- Ikuti struktur folder DDD
- Gunakan application layer sebagai orkestrator
- Jangan menambah aturan bisnis baru tanpa dokumen
- Gunakan `implementation-lock-notes.md` untuk kontinuitas kerja

---

## Catatan Penutup

Dokumen ini adalah **penjaga fokus**. Jika muncul ide fitur yang menarik namun tidak tercakup di sini, maka fitur tersebut **bukan bagian MVP Step 1**, dan harus menunggu fase berikutnya.

