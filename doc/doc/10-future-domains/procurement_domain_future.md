# Procurement Domain (Future)

Dokumen ini mendefinisikan **Procurement Domain** sebagai *future domain* dalam Sistem Jual Beli Terpadu. Domain ini **belum diimplementasikan** pada fase MVP awal dan ditulis sebagai persiapan konseptual untuk fase pengembangan berikutnya.

Status dokumen ini adalah **perencanaan**, bukan representasi sistem aktif.

---

## Tujuan Domain

Procurement Domain bertujuan untuk mengelola proses **pengadaan barang dari pihak luar (supplier/tempat kulaan)** dan menjadi sumber kebenaran untuk histori pembelian barang.

Domain ini akan menjawab pertanyaan:
- Dari mana barang dibeli?
- Kapan barang dibeli?
- Berapa harga kulak barang?
- Berapa jumlah barang yang dibeli?
- Apakah ada kewajiban pembayaran ke supplier?

Procurement Domain **tidak** bertanggung jawab atas penjualan ke pelanggan.

---

## Posisi dalam Sistem

Procurement Domain berada di sisi *supply* dan terpisah dari domain operasional inti (Catalog, Inventory, Sales).

Hubungan tingkat tinggi:
- Procurement menghasilkan **penambahan stok**
- Inventory mencatat **perubahan jumlah stok**
- Sales tidak mengetahui proses procurement

Catatan:
Pemisahan antara stok hasil pengadaan (procurement) dan stok awal/legacy
diatur secara eksplisit dalam ADR terpisah mengenai klasifikasi asal stok.
Procurement Domain hanya bertanggung jawab atas stok dengan asal PURCHASE,
dan tidak merepresentasikan stok legacy yang tidak memiliki histori kulaan.


Procurement tidak menggantikan proses *initialize stock* yang digunakan pada fase awal sistem.

---

## Konsep Utama (Konseptual)

### Supplier

Pihak eksternal tempat barang dibeli.

Atribut konseptual:
- Supplier ID
- Nama Toko
- Nama Sales
- Contact Information
- Status (Active / Inactive)

Catatan:
- **Nama Toko** merepresentasikan entitas bisnis supplier.
- **Nama Sales** merepresentasikan kontak person yang menangani transaksi.
- Perubahan nama sales tidak mengubah histori pembelian yang sudah terjadi.

---

### Purchase Order

Purchase Order merepresentasikan satu kejadian pembelian barang dari supplier.

Atribut konseptual:
- Purchase Order ID
- Supplier ID
- Status (CREATED | RECEIVED | CANCELED)
- Total Cost
- Created At

---

### Purchase Item

Item individual dalam Purchase Order.

Atribut konseptual:
- Product ID
- Quantity
- Unit Cost
- Subtotal Cost

---

## Aturan Konseptual (Future Rules)

Aturan berikut **belum aktif**, tetapi dipertimbangkan untuk fase implementasi:

- Pembelian barang menghasilkan penambahan stok melalui Inventory Domain
- Harga kulak disimpan di Procurement, bukan di Inventory
- Perubahan stok akibat pembelian dicatat sebagai Stock Movement dengan reason "PURCHASE"
- Procurement tidak mengubah histori penjualan

---

## Interaksi dengan Inventory (Future)

- Procurement **meminta** penambahan stok ke Inventory setelah barang diterima
- Inventory tetap menjadi satu-satunya sumber kebenaran jumlah stok
- Inventory tidak menyimpan detail supplier atau harga kulak

---

## Hal yang Sengaja Tidak Ditangani Sekarang

Domain ini **belum** mencakup:
- Hutang ke supplier
- Pembayaran pembelian
- Retur pembelian
- Reorder otomatis
- Perhitungan profit

Fitur-fitur tersebut akan dipertimbangkan secara bertahap melalui ADR pada fase selanjutnya.

---

## Kriteria Aktivasi Domain

Procurement Domain dipertimbangkan untuk diimplementasikan ketika:
- Sistem membutuhkan perhitungan profit yang akurat
- Histori pembelian perlu dicatat secara sistematis
- Jumlah supplier bertambah dan perlu dikelola

Secara roadmap, domain ini relevan pada **MVP Step 3 atau Step 4**.

---

## Prinsip Evolusi

- Procurement Domain akan diperkenalkan sebagai domain baru, bukan ekstensi Inventory
- Implementasi domain ini tidak boleh merusak histori stok dan penjualan yang sudah ada
- Aktivasi domain wajib melalui ADR

---

## Catatan Penutup

Dokumen ini bertujuan sebagai *design placeholder* untuk mencegah desain bocor pada domain aktif. Selama domain ini belum diimplementasikan, seluruh penambahan stok di luar penjualan dilakukan melalui mekanisme initialize stock atau penyesuaian manual yang terdokumentasi.

Referensi Arsitektur:
Transisi dari stok legacy ke stok hasil pengadaan diatur melalui ADR
“Stock Origin Classification & Legacy Inventory Separation”.

ADR tersebut mendefinisikan bahwa:
- stok legacy diakui sebagai stok tanpa histori kulaan,
- procurement tidak digunakan untuk merekonstruksi histori pembelian yang tidak pernah tercatat,
- dan histori pengadaan hanya berlaku sejak Procurement Domain diaktifkan secara resmi.
