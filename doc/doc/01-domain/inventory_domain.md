# Inventory Domain

Dokumen ini mendefinisikan domain Inventory dalam Sistem Jual Beli Terpadu. Inventory Domain bertanggung jawab penuh atas **keadaan kuantitatif produk** dan seluruh perubahan yang terjadi terhadap stok dari waktu ke waktu.

Inventory tidak mendefinisikan produk dan tidak mengelola transaksi penjualan. Domain ini fokus pada konsistensi jumlah dan jejak perubahan stok.

---

## Tujuan Domain

Inventory Domain bertujuan untuk:
- Menjaga jumlah stok produk tetap konsisten dan tidak bernilai negatif
- Mencatat seluruh perubahan stok secara eksplisit dan dapat diaudit
- Menjadi sumber kebenaran tunggal untuk ketersediaan barang

Inventory menjawab pertanyaan:
- Berapa jumlah stok produk saat ini?
- Kenapa stok berubah?
- Kapan perubahan stok terjadi?

---

## Konsep Utama

### Stock

Stock merepresentasikan jumlah ketersediaan suatu Product pada suatu waktu.

Atribut Konseptual:
- Product ID (referensi ke Catalog)
- Quantity

Catatan:
- Stock tidak menyimpan nama produk, satuan, atau harga
- Stock hanya mengetahui Product ID dan jumlah

---

### Stock Movement

Stock Movement merepresentasikan satu kejadian perubahan stok.

Setiap perubahan stok **wajib** tercatat sebagai Stock Movement.

Atribut Konseptual:
- Stock Movement ID
- Product ID
- Type (IN | OUT | ADJUST)
- Quantity (selalu bernilai positif)
- Reason
- Occurred At

---

## Aturan Bisnis (Invariants)

Aturan berikut wajib dijaga oleh Inventory Domain:

1. **Stok tidak boleh negatif**  
   Setiap pengurangan stok harus divalidasi agar quantity akhir tidak bernilai negatif.

2. **Perubahan stok selalu melalui movement**  
   Tidak boleh ada perubahan quantity tanpa Stock Movement.

3. **Quantity movement harus bernilai positif**  
   Arah perubahan ditentukan oleh Type (IN, OUT, ADJUST), bukan oleh tanda quantity.

4. **Stock Movement bersifat immutable**  
   Movement yang sudah tercatat tidak boleh diubah atau dihapus.

---

## Perilaku Utama (Domain Behaviors)

Inventory Domain menyediakan perilaku berikut:

- Receive Stock (IN)  
  Menambahkan quantity ke stok produk dengan alasan yang jelas.

- Issue Stock (OUT)  
  Mengurangi quantity stok produk dengan validasi stok mencukupi.

- Adjust Stock (ADJUST)  
  Menyesuaikan quantity stok karena koreksi fisik atau kesalahan pencatatan.

Inventory Domain tidak menyediakan perilaku untuk:
- Menentukan harga
- Menentukan kelayakan produk dijual (active/inactive)
- Membuat atau mengelola transaksi penjualan

---

## Batasan dan Interaksi Domain

Inventory Domain:
- Mereferensikan Product ID dari Catalog
- Tidak membaca atribut lain dari Product
- Tidak memodifikasi data Catalog

Permintaan perubahan stok berasal dari:
- Application layer (misalnya setelah Order dibayar)
- Proses internal Inventory (misalnya koreksi fisik)

Inventory tidak mengetahui konteks bisnis di balik permintaan tersebut.

---

## Contoh Skenario

### Skenario Normal

Gudang menerima 100 unit produk (IN). Quantity stok bertambah dan Stock Movement tercatat.

### Skenario Penjualan

Order berhasil dibayar. Application layer meminta pengurangan stok (OUT). Inventory memvalidasi stok mencukupi lalu mencatat movement.

### Skenario Edge Case

Permintaan pengurangan stok melebihi quantity tersedia. Inventory harus menolak operasi tersebut.

---

## Prinsip Evolusi

- Penambahan fitur seperti multi-gudang atau lokasi penyimpanan dilakukan sebagai ekstensi domain
- Inventory tetap menjadi satu-satunya sumber kebenaran jumlah stok
- Perubahan besar pada cara pengelolaan stok wajib dicatat melalui ADR

---

## Catatan Penutup

Jika sebuah data atau aturan menjawab pertanyaan "berapa banyak" dan "kenapa berubah", maka ia milik Inventory. Jika ia menjawab pertanyaan lain, maka ia bukan milik Inventory.

