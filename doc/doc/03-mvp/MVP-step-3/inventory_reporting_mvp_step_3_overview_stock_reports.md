# Inventory Reporting – MVP Step 3

**Status:** DESIGN FINAL – READY TO LOCK  
**Scope:** Internal Reporting (Read-Only)  
**MVP Phase:** Step 3 – Reporting

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan desain **Inventory Reporting** pada **MVP Step 3 – Reporting**.

Inventory Reporting bertujuan memberikan visibilitas operasional mengenai:

> *Kondisi stok saat ini dan histori pergerakan stok, tanpa mengubah atau menafsirkan ulang logika inventory.*

Dokumen ini bersifat **observasional murni** dan **tidak membuka kembali** kontrak domain Inventory pada MVP Step 1 & Step 2.

---

## 2. Prinsip Keras Inventory Reporting

Inventory Reporting pada Step 3 mengikuti prinsip berikut:

- **Read-only** (tidak ada mutasi)
- **Point-in-time truth** (kondisi saat query dijalankan)
- **Berbasis fakta domain (InventoryItem) untuk snapshot** dan **fakta StockMovement untuk histori**, tanpa interpretasi tambahan
- **Tidak melakukan costing atau valuasi**

Inventory Reporting **BUKAN**:
- sistem costing
- laporan valuasi persediaan
- laporan akuntansi

Jika suatu kebutuhan memerlukan:
- FIFO / LIFO
- harga pokok
- nilai inventori

maka kebutuhan tersebut **BUKAN scope MVP Step 3**.

---

## 3. Jenis Laporan Inventory (Step 3)

Pada MVP Step 3, Inventory Reporting mencakup **tiga laporan inti**:

1. **InventorySnapshotReport**
2. **InventoryMovementHistoryReport**
3. **LowStockReport**

Masing-masing laporan berdiri sendiri dan **tidak saling bergantung**.

---

## 4. InventorySnapshotReport (Baseline Read Model)

### 4.1 Tujuan

Memberikan gambaran:

> *Jumlah stok setiap produk pada saat laporan diakses.*

---

### 4.1.a Status Arsitektural – Baseline Read Model

InventorySnapshotReport adalah baseline read model resmi untuk kondisi stok saat ini.

Baseline berarti:

- Snapshot ini adalah representasi tunggal kondisi stok saat query dijalankan.
- Reporting tidak menghitung ulang stok dari StockMovement.
- Reporting tidak melakukan rekonsiliasi atau validasi domain.
- Snapshot ini membaca current state yang sudah dijaga oleh Inventory Domain.

InventorySnapshotReport tidak:
- Menjumlahkan ulang movement.
- Melakukan verifikasi konsistensi.
- Menyimpulkan kesalahan operasional.

Jika suatu hari ditemukan ketidaksesuaian stok, investigasi harus dilakukan pada domain Inventory dan histori StockMovement. 
Reporting tidak bertanggung jawab memvalidasi atau mengoreksi data tersebut.

Snapshot bersifat observasional, bukan validator.


---

### 4.2 Definisi Data

Setiap baris merepresentasikan **satu produk**.

Field wajib:

- `productId`
- `productNameSnapshot`
- `currentStockQuantity`

Catatan:
- Data diambil dari kondisi InventoryItem terakhir
- Tidak ada histori

---

### 4.3 Hal yang Tidak Dilakukan

- Tidak menghitung stok rata-rata
- Tidak menampilkan histori perubahan
- Tidak melakukan estimasi kebutuhan restock

---

### 4.4 Larangan Rekonstruksi dari Movement

InventorySnapshotReport tidak boleh:

- Menghitung stok dengan SUM(IN) - SUM(OUT).
- Menghasilkan saldo berjalan.
- Membandingkan snapshot dengan movement untuk validasi.

Rekonstruksi stok dari movement adalah concern domain atau audit lanjutan,
bukan reporting Step 3.

Jika reporting melakukan rekonstruksi, maka reporting telah berubah
menjadi domain terselubung.

---

## 5. InventoryMovementHistoryReport

### 5.1 Tujuan

Memberikan histori eksplisit mengenai:

> *Setiap perubahan stok yang pernah terjadi, beserta alasannya.*

---

### 5.1.a Status Arsitektural – Arsip Kejadian

InventoryMovementHistoryReport adalah arsip eksplisit kejadian perubahan stok.

Report ini:

- Merepresentasikan data StockMovement apa adanya.
- Tidak menggabungkan movement.
- Tidak menghitung saldo berjalan.
- Tidak menyimpulkan anomali.

Movement history adalah catatan fakta,
bukan alat analisis.

Jika diperlukan analisis (running balance, costing, shrinkage detection),
maka itu adalah domain atau modul terpisah di fase berikutnya.

---

### 5.2 Definisi Data

Setiap baris merepresentasikan **satu Stock Movement**.

Field wajib:

- `productId`
- `productNameSnapshot`
- `movementDate` (occurredAt)
- `movementType` (IN | OUT | ADJUST)
- `quantity`
- `origin` (INITIAL_STOCK | PROCUREMENT | ADJUSTMENT | UNKNOWN)

Catatan:
- Quantity selalu bernilai positif
- Arah ditentukan oleh movementType

---

### 5.3 Filter yang Didukung

- Tanggal movement (from / to)
- ProductId (opsional)

Filter bersifat query-time.

---

### 5.4 Hal yang Tidak Dilakukan

- Tidak mengelompokkan costing
- Tidak menggabungkan movement
- Tidak menyimpulkan kesalahan operasional

---

## 5.5 Hubungan antara Snapshot dan Movement

InventorySnapshotReport dan InventoryMovementHistoryReport adalah dua read model terpisah dengan tanggung jawab berbeda:

- Snapshot menjawab: "Berapa stok saat ini?"
- Movement menjawab: "Apa saja perubahan yang pernah terjadi?"

Snapshot tidak bergantung pada movement saat query.
Movement tidak menjamin konsistensi matematis snapshot.

Keduanya bersifat observasional dan tidak saling memverifikasi.

---

## 6. LowStockReport

### 6.1 Tujuan

Memberikan peringatan operasional mengenai:

> *Produk dengan stok berada di bawah atau sama dengan threshold.*

---

### 6.2 Definisi Low Stock

Suatu produk dianggap **low stock jika**:

```
currentStockQuantity <= lowStockThreshold
```

Catatan penting:
- Threshold adalah **konfigurasi sistem** (write concern)
- Reporting hanya membaca nilai threshold terakhir
- Perubahan threshold **WAJIB memiliki audit trail**
- Reporting tidak menyimpan histori perubahan threshold dan tidak merekonstruksi kondisi low stock di masa lalu.

---

### 6.3 Definisi Data

Field wajib:

- `productId`
- `productNameSnapshot`
- `currentStockQuantity`
- `lowStockThreshold`

---

### 6.4 Hal yang Tidak Dilakukan

- Tidak menyarankan jumlah restock
- Tidak melakukan forecasting
- Tidak mengunci status low stock historis

---

## 7. Arsitektur & Boundary Reporting

Inventory Reporting berada di:

```
src/modules/reporting/
```

Mengikuti struktur resmi:

```
reporting/
  application/
  queries/
  dto/
```

Larangan keras:
- Tidak ada import domain Inventory
- Tidak ada entity atau invariant
- Tidak ada reuse use case mutasi

---

## 8. Dampak terhadap MVP Sebelumnya

Inventory Reporting:

- **NON-BREAKING** terhadap MVP Step 1
- **NON-BREAKING** terhadap MVP Step 2
- Tidak mengubah Inventory Domain
- Tidak menambah aturan bisnis baru

---

## 9. Definition of Done (Desain)

Inventory Reporting dianggap selesai secara desain jika:

1. Seluruh laporan read-only
2. Tidak ada costing atau valuasi
3. Low stock bersifat mekanis & auditable
4. Histori movement jujur & utuh
5. Seluruh prinsip Step 3 dipatuhi

---

## 10. Catatan Penutup

Inventory Reporting pada Step 3 berfokus pada **kejujuran data**, bukan optimasi.

Laporan ini memastikan:
- stok terlihat apa adanya
- perubahan dapat ditelusuri
- tidak ada interpretasi tersembunyi

Optimasi dan costing adalah urusan fase berikutnya.

