# Initialize Stock (Use Case)

Dokumen ini mendefinisikan use case **Initialize Stock**, yaitu proses memasukkan stok awal ke dalam sistem pada saat pertama kali sistem digunakan atau saat migrasi dari sistem lama.

Use case ini bersifat **operasional awal** dan tidak merepresentasikan pembelian barang dari supplier.

---

## Tujuan Use Case

Initialize Stock bertujuan untuk:
- Menyelaraskan stok fisik dengan stok sistem pada awal penggunaan
- Menyediakan titik awal yang sah dan dapat diaudit untuk Inventory Domain
- Memastikan seluruh perubahan stok setelahnya tercatat secara konsisten

Use case ini menjawab pertanyaan:
- Berapa stok awal produk saat sistem mulai digunakan?

---

## Ruang Lingkup

Use case ini hanya berlaku untuk:
- Pengisian stok awal
- Penyesuaian stok besar saat migrasi data

Use case ini **tidak** digunakan untuk:
- Pembelian barang dari supplier
- Penjualan barang
- Koreksi stok harian

---

## Aktor

- Admin / Operator Gudang

Aktor di sini merepresentasikan pihak yang bertanggung jawab atas kesiapan data awal sistem.

---

## Prasyarat

- Product sudah terdaftar di Catalog Domain
- Satuan produk sudah ditentukan
- Inventory Domain siap menerima Stock Movement

---

## Alur Utama

1. Aktor memilih product yang akan diinisialisasi stoknya
2. Aktor memasukkan jumlah stok fisik awal
3. Sistem memvalidasi bahwa quantity bernilai positif atau nol
4. Sistem mencatat **Stock Movement** dengan:
   - Type: ADJUST atau IN
   - Reason: `INITIAL_STOCK`
5. Sistem menyimpan quantity sebagai stok awal product

---

## Alur Alternatif

### Quantity Nol

- Aktor memasukkan quantity = 0
- Sistem tetap mencatat Stock Movement untuk keperluan audit

---

## Aturan Bisnis

- Initialize Stock hanya boleh dilakukan sekali per product pada fase awal sistem
- Perubahan stok setelah initialize stock harus menggunakan use case lain
- Initialize stock tidak boleh dianggap sebagai pembelian

---

## Dampak ke Domain

- Inventory Domain:
  - Mencatat Stock Movement sebagai baseline
  - Menetapkan stok awal product

- Catalog Domain:
  - Tidak terpengaruh

- Sales Domain:
  - Tidak terpengaruh

---

## Catatan Penting

- Initialize Stock **bukan** histori pembelian
- Tidak ada informasi supplier, harga kulak, atau pembayaran
- Use case ini bersifat *one-time setup*

---

## Prinsip Evolusi

Ketika Procurement Domain diaktifkan:
- Pembelian barang akan menghasilkan Stock Movement dengan reason `PURCHASE`
- Initialize Stock tetap dipertahankan sebagai histori awal sistem

---

## Catatan Penutup

Use case ini memastikan bahwa sistem memulai operasional dari kondisi yang jujur dan terdefinisi dengan baik, tanpa mengasumsikan proses bisnis yang belum diimplementasikan.

