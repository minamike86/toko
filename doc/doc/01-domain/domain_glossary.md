# Domain Glossary

Dokumen ini berisi definisi resmi istilah-istilah bisnis yang digunakan di seluruh Sistem Jual Beli Terpadu. Tujuan utama glossary ini adalah mencegah ambiguitas bahasa dan memastikan seluruh tim menggunakan istilah yang sama dengan makna yang sama.

Setiap istilah dalam glossary ini bersifat lintas domain kecuali dinyatakan sebaliknya. Perubahan makna istilah yang sudah ada harus dilakukan dengan hati-hati dan idealnya dicatat melalui ADR.

---

## Product

Barang atau layanan yang didefinisikan di Catalog Domain dan dapat dijual oleh sistem.

Product merepresentasikan *apa* yang dijual, bukan *berapa banyak* atau *bagaimana cara menjualnya*.

Product tidak menyimpan stok, histori penjualan, atau informasi transaksi.

---

## Satuan

Ukuran dasar di mana sebuah product dijual dan dicatat.

Contoh:
- pcs
- kg
- liter
- meter

Satuan bersifat deskriptif dan tidak mengandung logika konversi. Jika di masa depan diperlukan konversi satuan (misalnya kg ke gram), hal tersebut akan diperkenalkan sebagai konsep terpisah.

---

## Base Price

Harga jual product saat ini yang digunakan sebagai dasar transaksi.

Base Price adalah nilai final yang disalin (snapshot) ke Order Item saat transaksi dibuat. Perubahan Base Price tidak memengaruhi transaksi yang sudah terjadi.

Base Price bukan hasil perhitungan dinamis dan tidak merepresentasikan harga kulakan atau margin keuntungan.

---

## Stock

Jumlah ketersediaan product dalam satuan tertentu pada suatu waktu.

Stock dikelola oleh Inventory Domain dan tidak disimpan di Catalog Domain.

---

## Stock Movement

Catatan perubahan stock yang mencerminkan penambahan, pengurangan, atau penyesuaian jumlah stock.

Setiap perubahan stock harus tercatat sebagai Stock Movement dengan alasan dan waktu yang jelas.

---

## Order

Representasi transaksi penjualan yang dibuat oleh sistem, baik untuk penjualan online maupun offline.

Order dikelola oleh Sales Domain dan memiliki status yang mencerminkan siklus hidup transaksi.

---

## Order Item

Item individual dalam sebuah Order yang merepresentasikan satu product yang dijual.

Order Item menyimpan snapshot data penting seperti harga dan satuan pada saat transaksi dibuat.

---

## Transaction

Proses bisnis penjualan yang menghasilkan Order dan berdampak pada perubahan stock.

Transaction adalah konsep proses, bukan entity data tunggal.

---

## Active / Inactive

Status yang menunjukkan apakah sebuah product dapat digunakan dalam transaksi penjualan.

Product dengan status Inactive tidak boleh digunakan untuk membuat Order baru.

---

## Catatan Penutup

Glossary ini menjadi referensi utama dalam penulisan dokumentasi domain, use case, dan ADR. Jika sebuah istilah sering digunakan dan berpotensi ambigu, istilah tersebut wajib ditambahkan ke dalam dokumen ini.

