# Domain Overview

Dokumen ini memberikan gambaran tingkat tinggi mengenai domain bisnis utama dalam Sistem Jual Beli Terpadu. Tujuannya adalah menyamakan pemahaman sebelum detail domain, use case, dan implementasi teknis dibuat.

Dokumen ini bersifat ringkas dan stabil. Perubahan hanya dilakukan jika terjadi perubahan arah bisnis yang signifikan.

---

## Gambaran Umum Domain

Sistem ini dibagi menjadi beberapa domain terpisah untuk menjaga kejelasan tanggung jawab, konsistensi aturan bisnis, dan kemudahan evolusi sistem.

Domain utama pada fase MVP adalah:
- Catalog Domain
- Inventory Domain
- Sales Domain

Masing-masing domain memiliki aturan bisnis sendiri dan tidak saling bergantung secara langsung pada level implementasi.

---

## Catalog Domain

Tanggung Jawab:
- Mendefinisikan barang yang dijual
- Menyediakan informasi produk yang dapat digunakan oleh domain lain

Konsep Utama:
- Product

Aturan Tingkat Tinggi:
- Produk memiliki identitas unik
- Produk memiliki harga dasar
- Produk dapat dinonaktifkan dan tidak dapat dijual jika tidak aktif

Batasan:
- Catalog tidak menyimpan stok
- Catalog tidak mengetahui transaksi penjualan

---

## Inventory Domain

Tanggung Jawab:
- Mengelola ketersediaan barang
- Menjaga konsistensi stok
- Mencatat setiap perubahan stok

Konsep Utama:
- Stock
- Stock Movement

Aturan Tingkat Tinggi:
- Stok tidak boleh bernilai negatif
- Setiap perubahan stok harus tercatat sebagai movement

Batasan:
- Inventory tidak mengetahui detail penjualan
- Inventory tidak melakukan perhitungan harga

---

## Sales Domain

Tanggung Jawab:
- Mengelola proses penjualan
- Menentukan total transaksi
- Mengatur status transaksi

Konsep Utama:
- Order
- Order Item

Aturan Tingkat Tinggi:
- Order harus memiliki minimal satu item
- Harga pada order bersifat snapshot pada waktu transaksi
- Order yang dibatalkan tidak boleh memengaruhi stok

Batasan:
- Sales tidak menyimpan data stok
- Sales tidak mengubah data produk

---

## Hubungan Antar Domain

- Sales membaca data dari Catalog
- Sales meminta perubahan stok ke Inventory
- Inventory tidak mengetahui siapa peminta perubahan

Komunikasi antar domain dilakukan melalui application layer, bukan melalui referensi langsung antar entity.

---

## Prinsip Evolusi Domain

- Domain dapat diperluas dengan aturan baru tanpa mengubah tanggung jawab utamanya
- Fitur baru harus dipetakan ke domain yang tepat sebelum implementasi
- Perubahan besar pada domain wajib didokumentasikan melalui ADR

---

## Catatan Penutup

Dokumen ini menjadi referensi utama untuk menentukan di mana sebuah aturan bisnis atau fitur seharusnya ditempatkan. Jika sebuah fitur sulit dipetakan ke salah satu domain di atas, kemungkinan desain fitur tersebut perlu ditinjau ulang.

