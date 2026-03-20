# Sales Domain

Dokumen ini mendefinisikan domain Sales dalam Sistem Jual Beli Terpadu. Sales Domain bertanggung jawab atas **kejadian penjualan sebagai fakta bisnis**, termasuk pembentukan order, perhitungan nilai transaksi, serta pengelolaan status transaksi sepanjang siklus hidupnya.

Sales Domain tidak mengelola stok dan tidak mendefinisikan produk. Domain ini berfokus pada *apa yang dijual, berapa nilainya saat itu, dan bagaimana status transaksi tersebut*.

---

## Tujuan Domain

Sales Domain bertujuan untuk:
- Mencatat transaksi penjualan secara konsisten dan jujur
- Menentukan nilai transaksi pada saat kejadian penjualan
- Mengelola siklus hidup transaksi penjualan, termasuk penjualan tunai dan hutang
- Menjadi sumber kebenaran historis untuk data penjualan

Sales menjawab pertanyaan:
- Apa yang dijual?
- Berapa jumlah yang dijual?
- Berapa nilai transaksi pada saat itu?
- Apakah transaksi sudah dibayar atau masih hutang?
- Status transaksi saat ini apa?

---

## Konsep Utama

### Order

Order merepresentasikan satu kejadian penjualan.

Atribut Konseptual:
- Order ID
- Order Type (ONLINE | OFFLINE)
- Status (CREATED | ON_CREDIT | PAID | CANCELED | FAILED)
- Total Amount
- Outstanding Amount
- Created At
- Created By (User ID, metadata audit)

Order adalah entity inti dalam Sales Domain dan bersifat historis.

---

### Order Item

Order Item merepresentasikan satu produk yang dijual dalam sebuah Order.

Atribut Konseptual:
- Order Item ID
- Product ID
- Product Name (snapshot)
- Satuan (snapshot)
- Unit Price (snapshot dari Base Price)
- Quantity
- Subtotal

Order Item menyimpan snapshot data produk pada saat transaksi dibuat untuk menjaga konsistensi histori.

---

## Status Order dan Maknanya

- **CREATED**  
  Order baru dibuat, belum ada pembayaran dan belum berdampak ke stok.

- **ON_CREDIT**  
  Barang telah diserahkan kepada pelanggan, stok sudah berkurang, tetapi pembayaran belum diterima sepenuhnya.

- **PAID**  
  Pembayaran telah diterima penuh dan transaksi selesai secara finansial.

- **CANCELED**  
  Order dibatalkan. Jika pembatalan terjadi setelah stok berkurang, stok harus dikembalikan.

- **FAILED**  
  Order gagal diproses karena kondisi tertentu (misalnya stok tidak mencukupi).

---

## Aturan Bisnis (Invariants)

Aturan berikut wajib ditegakkan oleh Sales Domain:

1. **Order harus memiliki minimal satu Order Item**  
   Order tanpa item tidak valid.

2. **Snapshot data bersifat immutable**  
   Data produk di Order Item tidak berubah meskipun Catalog berubah.

3. **Quantity harus bernilai positif**  
   Order Item dengan quantity nol atau negatif tidak valid.

4. **Total Amount adalah hasil penjumlahan seluruh Subtotal**  
   Total dihitung pada saat order dibuat atau diperbarui.

5. **Outstanding Amount bernilai nol jika dan hanya jika status PAID**

6. **Status Order harus mengikuti siklus yang diizinkan**

---

## Siklus Hidup Order

Urutan status yang diperbolehkan:

- CREATED → PAID  
- CREATED → ON_CREDIT  
- CREATED → CANCELED  
- ON_CREDIT → PAID  
- ON_CREDIT → CANCELED  
- PAID → CANCELED (dengan konsekuensi pengembalian stok)

Transisi di luar alur ini dianggap tidak valid.

---

## Perilaku Utama (Domain Behaviors)

Sales Domain menyediakan perilaku berikut:

- Create Order  
  Membuat order baru dengan satu atau lebih order item.

- Calculate Order Total  
  Menghitung subtotal dan total amount.

- Mark Order as Paid  
  Menandai order sebagai PAID dan mengatur outstanding amount menjadi nol.

- Mark Order as Credit  
  Menandai order sebagai ON_CREDIT dan menetapkan outstanding amount.

- Cancel Order  
  Membatalkan order sesuai status saat ini.

Sales Domain tidak menyediakan perilaku untuk:
- Mengubah stok secara langsung
- Mengelola piutang detail (jatuh tempo, cicilan, bunga)
- Menentukan hak akses pengguna

---

## Interaksi dengan Inventory

- Sales **meminta** perubahan stok melalui application layer
- Inventory **memutuskan** apakah permintaan valid
- Stok dikurangi saat:
  - Order berstatus PAID, atau
  - Order berstatus ON_CREDIT (barang keluar)

Sales Domain tidak mengetahui detail implementasi Inventory.

---

## Contoh Skenario

### Penjualan Tunai

Order dibuat (CREATED) → dibayar (PAID) → stok dikurangi → transaksi selesai.

### Penjualan Hutang

Order dibuat (CREATED) → ditandai ON_CREDIT → stok dikurangi → pembayaran diterima kemudian → status PAID.

### Edge Case

Order ON_CREDIT dibatalkan → stok dikembalikan → order berstatus CANCELED.

---

## Prinsip Evolusi

- Manajemen piutang lanjutan merupakan domain terpisah (Accounting / AR)
- Penambahan pajak, diskon, atau cicilan wajib melalui ADR
- Sales Domain tetap fokus pada kejujuran fakta transaksi

---

## Catatan Penutup

Jika sebuah aturan menjelaskan nilai transaksi, status pembayaran, dan fakta penjualan, maka ia milik Sales. Jika ia menjelaskan produk atau stok, maka ia bukan.

