# Prisma Schema Notes

Dokumen ini menjelaskan **peran, batasan, dan interpretasi arsitektural** dari file `schema.prisma` dalam Sistem Jual Beli Terpadu.

Dokumen ini **BUKAN dokumentasi domain**, **BUKAN kontrak bisnis**, dan **BUKAN sumber kebenaran aturan**. Ia ada untuk mencegah salah tafsir bahwa skema database = model domain.

---

## 1. Tujuan Dokumen

`schema.prisma` digunakan untuk:
- mendefinisikan struktur penyimpanan data
- mendukung query dan reporting
- menyediakan fondasi persistence untuk domain

Dokumen ini dibuat untuk:
- menjelaskan kenapa field tertentu ada
- menjelaskan kenapa struktur tertentu **sengaja sederhana**
- mencegah kebocoran logika bisnis ke database layer

Jika terjadi konflik antara:
- domain document
- use case document
- schema.prisma

maka **domain document yang menang**.

---

## 2. Prinsip Umum Skema Database

Prinsip yang digunakan saat menulis schema:

1. **Database menyimpan fakta, bukan aturan**  
   Aturan bisnis ditegakkan di domain layer, bukan lewat constraint kompleks.

2. **Field database ≠ properti domain**  
   Tidak semua field akan muncul sebagai attribute entity domain.

3. **Skema mendukung histori dan audit**  
   Struktur dipilih agar data masa lalu dapat dibaca ulang dengan jujur.

4. **Schema boleh berubah tanpa mengubah domain**  
   Selama kontrak repository tidak berubah.

---

## 3. Sales Domain – Representasi Persistence

### Model: Order

Tujuan tabel ini:
- menyimpan **fakta transaksi penjualan**
- mendukung reporting berbasis status dan waktu

Catatan penting:
- `status` disimpan sebagai string, bukan enum domain
- validasi transisi status **TIDAK** dilakukan di database
- `totalAmount` dan `outstandingAmount` disimpan untuk:
  - reporting
  - audit histori

Index:
- `status` → reporting
- `createdAt` → reporting periodik

Database **tidak menjamin**:
- status valid
- konsistensi outstanding amount

Semua itu adalah tanggung jawab domain.

---

### Model: OrderItem

Tujuan tabel ini:
- menyimpan snapshot item penjualan

Kenapa snapshot disimpan:
- histori transaksi harus tetap benar
- perubahan produk tidak mengubah masa lalu

Catatan:
- `productNameSnapshot`, `unitSnapshot`, `unitPriceSnapshot` bersifat immutable
- database tidak mencegah perubahan, tetapi **aplikasi tidak boleh mengubahnya**

---

## 4. Inventory Domain – Representasi Persistence

### Model: InventoryItem

Tujuan tabel ini:
- menyimpan **kondisi stok saat ini** (point-in-time)

Catatan penting:
- tabel ini **BUKAN histori**
- hanya ada satu record per product

Aturan bisnis:
- stok tidak boleh negatif

Aturan ini **TIDAK ditegakkan** di database,
melainkan di domain Inventory.

Index:
- `quantity` → reporting stok rendah

---

### Model: StockMovement

Tujuan tabel ini:
- menyimpan **histori perubahan stok**

Karakteristik:
- append-only
- tidak boleh diubah atau dihapus

Field penting:
- `type` → IN | OUT | ADJUST (string)
- `quantity` selalu positif
- `reason` bersifat deskriptif

Database **tidak memahami makna** type atau reason.
Makna ada di domain dan use case.

Index:
- `productId`
- `referenceId`
- `occurredAt`

---

## 5. Tentang Enum dan String

Semua enum domain disimpan sebagai `String` di database.

Alasan:
- mencegah coupling domain ↔ database
- memudahkan migrasi
- menghindari schema churn saat domain berevolusi

Validasi enum **selalu dilakukan di domain**, bukan Prisma.

---

## 6. Reporting dan Schema

Pada MVP Step 3:
- reporting membaca langsung dari tabel ini
- database view diperbolehkan
- tidak ada write melalui reporting

Schema ini **secara sadar** mendukung:
- join sederhana
- agregasi
- histori

Tanpa:
- snapshot periodik
- period locking

---

## 7. Yang Sengaja Tidak Dilakukan

Schema ini **TIDAK**:
- menegakkan invariant domain
- mengandung trigger bisnis
- menyimpan audit trail operasional
- membedakan internal vs fiscal reporting

Kebutuhan tersebut ditangani oleh:
- domain layer
- application layer
- atau domain future (Accounting)

---

## 8. Aturan Perubahan Schema

Perubahan schema:

- BOLEH dilakukan jika:
  - tidak mengubah kontrak repository
  - tidak mengubah makna domain

- WAJIB melalui ADR jika:
  - memengaruhi reporting
  - memengaruhi histori
  - berpotensi breaking terhadap Step 1 / 2

---

## 9. Ringkasan

`schema.prisma` adalah:
- alat persistence
- fondasi query
- bukan model bisnis

Jika muncul dorongan untuk:
> "menaruh sedikit logic di schema"

itu tanda desain sedang bocor.

Dokumen ini adalah pagar agar hal itu tidak terjadi.

