# Catalog Domain

Dokumen ini mendefinisikan domain Catalog dalam Sistem Jual Beli Terpadu (Online, Offline, dan Gudang). Catalog bertanggung jawab untuk mendeskripsikan produk yang dijual dan menjaga aturan bisnis yang melekat pada produk, tanpa mencampurkan tanggung jawab stok (Inventory) atau transaksi (Sales).

Dokumen ini menjadi acuan utama saat menambahkan atau mengubah aturan terkait produk.

---

## Tujuan Domain

Catalog Domain bertujuan untuk menyediakan satu sumber kebenaran terkait informasi produk yang dapat digunakan oleh domain lain dalam sistem.

Domain ini fokus pada *apa* yang dijual dan *dalam satuan apa* produk dijual, bukan *berapa banyak* atau *bagaimana cara menjualnya*.

---

## Konsep Utama

### Product(Entity)

Product merepresentasikan barang atau layanan yang dapat dijual oleh sistem.

Atribut Konseptual:

- Product ID (unik)
- Name (nama produk)
- SKU (kode unik internal, jika digunakan)
- Satuan (misalnya: pcs, kg, liter, meter)
- Base Price (harga jual saat ini)
- Status (Active / Inactive)

Catatan:

- Product tidak menyimpan stok.
- Product tidak menyimpan histori penjualan.
- Product tidak menyimpan diskon atau promo (itu concern terpisah, ditambahkan di tahap lebih lanjut jika dibutuhkan).

---

## Aturan Bisnis (Invariants)

Aturan berikut wajib ditegakkan oleh domain (bukan UI atau database):

1. Identitas unik
- Product harus memiliki Product ID yang unik.

2. Satuan wajib dan jelas
- Product harus memiliki satuan yang valid dan tidak ambigu (contoh: “pcs”, “kg”, “liter”).
- Satuan adalah deskripsi dasar, bukan sistem konversi.

3. Harga jual saat ini harus valid
- Base Price harus lebih besar dari nol.

4. Produk nonaktif tidak boleh dijual
- Product dengan status Inactive tidak boleh dipakai untuk membuat transaksi penjualan baru.

5. Harga transaksi adalah snapshot
- Perubahan Base Price tidak mengubah transaksi yang sudah terjadi. (Snapshot harga terjadi di Sales Domain pada Order Item.)

Aturan-aturan ini wajib ditegakkan di level domain, bukan di UI atau database.

---

## Perilaku Utama (Domain Behaviors)

Catalog Domain menyediakan perilaku berikut:
- Create Product
Membuat produk baru dengan atribut wajib: name, satuan, base price, status (default Active atau sesuai kebijakan).

- Update Product Info
Mengubah atribut deskriptif produk (misalnya nama, SKU, satuan) dengan tetap mematuhi invariants.

- Change Product Price
Mengubah Base Price (harga jual saat ini) dengan validasi harga > 0.
Perubahan ini tidak memengaruhi histori transaksi.

- Activate / Deactivate Product
Mengaktifkan atau menonaktifkan produk.

Catalog Domain tidak menyediakan perilaku untuk:

- penambahan/pengurangan stok
- perhitungan total transaksi
- pencatatan histori penjualan

---

## Batasan Domain

Catalog Domain:
- Tidak mengetahui keberadaan Inventory Domain
- Tidak mengetahui keberadaan Sales Domain
- Tidak memicu perubahan domain lain secara langsung

Domain lain boleh:

- membaca data produk dari Catalog (melalui application layer)
- mengambil snapshot harga dan satuan untuk kebutuhan transaksi
- Interaksi dengan domain lain dilakukan melalui application layer.

---

## Contoh Skenario

### Skenario Normal

Admin membuat produk “Beras Premium” dengan satuan “kg”, harga 15.000, status Active. Produk dapat digunakan dalam transaksi penjualan.

### Skenario Edge Case

- Admin mencoba membuat produk dengan harga 0 → ditolak.
- Admin menonaktifkan produk, lalu kasir mencoba menjualnya → transaksi harus menolak item tersebut.
- Admin mengubah harga produk → transaksi lama tidak berubah karena harga sudah menjadi snapshot di Order Item.

---

## Prinsip Evolusi

1. Penambahan atribut baru pada Product harus diuji: apakah atribut tersebut mendeskripsikan produk, atau sebenarnya milik Inventory/Sales.

2. Jika kebutuhan muncul untuk:
- multi-satuan (misalnya kg dan gram) atau konversi satuan,
- promo/discount,
- harga berbasis aturan (cost + margin),

maka fitur tersebut ditambahkan sebagai konsep terpisah (extension) dan wajib melalui mekanisme dokumen (ADR + update domain/use case) sesuai SOP.


---

## Catatan Penutup

Aturan praktis untuk menentukan kepemilikan fitur:
Jika aturan tersebut menjelaskan “produk itu apa” (nama, identitas, satuan, status, harga jual saat ini), maka itu milik Catalog. Jika menjelaskan “jumlahnya berapa” atau “bagaimana dijualnya”, itu bukan milik Catalog.

