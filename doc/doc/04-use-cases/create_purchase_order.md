# Create Purchase Order

### Status  
CANONICAL USE CASE DOCUMENT

---

## Tujuan

Use case ini digunakan untuk membuat **PurchaseOrder** baru terhadap supplier yang aktif.

Use case ini bertanggung jawab untuk:

- memvalidasi actor dan role
- memvalidasi supplier
- mengambil snapshot variant dari Catalog
- membentuk `PurchaseItem`
- membentuk `PurchaseOrder` status `CREATED`
- menyimpan aggregate procurement

Use case ini **tidak**:

- menambah stok
- membuat stock movement
- menyentuh Inventory
- menghitung costing lanjutan
- mengaktifkan payable atau accounting

---

## Posisi dalam Sistem

Use case ini berada di Application Layer Procurement.

Use case ini adalah entry point resmi untuk pembuatan purchase order.

Jika terjadi konflik:
- `procurement_domain.md` menang untuk invariant domain
- dokumen Step 6 implementation plan menang untuk boundary dan scope Step 6

---

## Aktor yang Diizinkan

Allowed roles:

- `ADMIN`
- `WAREHOUSE`

Role berikut tidak diizinkan:

- `SALES`

Authorization wajib dilakukan di application layer sebelum mutasi dijalankan.

---

## Input

Input minimal:

- `supplierId: string`
- `items[]`
  - `variantId: string`
  - `quantity: number`
  - `unitCost: number`
- `actor`
  - `actorId: string`
  - `role: UserRole`

---

## Output

Output minimal:

- `id`
- `supplierId`
- `status`
- `createdAt`
- `createdBy`
- `totalQuantity`
- `totalCost`
- `items[]`

Status output awal wajib:

- `CREATED`

---

## Preconditions

Sebelum eksekusi, kondisi berikut harus benar:

- actor valid
- role actor diizinkan
- supplier ada
- supplier aktif
- minimal satu item tersedia
- seluruh variant pada input valid dan aktif
- tidak ada duplicate `variantId` dalam satu purchase order

---

## Main Flow

1. Validasi actor dan role.
2. Validasi input item tidak kosong.
3. Ambil `Supplier` berdasarkan `supplierId`.
4. Jika supplier tidak ditemukan, eksekusi gagal.
5. Validasi supplier masih aktif.
6. Kumpulkan seluruh `variantId` dari input.
7. Pastikan tidak ada duplicate `variantId`.
8. Ambil snapshot variant dari `CatalogSnapshotPort`.
9. Validasi semua variant ditemukan.
10. Validasi semua variant aktif.
11. Buat `purchaseOrderId` baru dari repository.
12. Untuk setiap input item, bentuk `PurchaseItem` menggunakan:
    - `purchaseOrderId`
    - snapshot product / variant / unit
    - `quantity`
    - `unitCost`
13. Bentuk aggregate `PurchaseOrder` dengan status awal `CREATED`.
14. Simpan `PurchaseOrder` ke repository.
15. Kembalikan DTO hasil create.

---

## Postconditions

Jika sukses:

- satu `PurchaseOrder` baru tersimpan
- semua `PurchaseItem` tersimpan di dalam aggregate yang sama
- status order = `CREATED`
- `createdBy = actor.actorId`
- belum ada perubahan ke inventory
- belum ada stock movement
- belum ada `receivedAt`, `receivedBy`, `canceledAt`, `canceledBy`

---

## Invariant yang Harus Dijaga

Use case ini wajib menjaga invariant berikut:

- `PurchaseOrder` harus punya minimal satu item
- tidak boleh ada duplicate `variantId` dalam satu order
- `quantity` harus integer positif
- `unitCost` harus integer non-negatif
- `subtotalCost = quantity × unitCost`
- snapshot product / variant / unit tidak boleh kosong
- supplier inactive tidak boleh dipakai untuk order baru

---

## Failure Cases

### 1. Actor tidak valid atau role tidak diizinkan

Hasil:
- request ditolak
- repository procurement tidak dipanggil

### 2. Supplier tidak ditemukan

Hasil:
- request ditolak
- order tidak dibuat

### 3. Supplier inactive

Hasil:
- request ditolak
- order tidak dibuat

### 4. Item kosong

Hasil:
- request ditolak
- order tidak dibuat

### 5. Duplicate variant dalam satu order

Hasil:
- request ditolak
- order tidak dibuat

### 6. Variant tidak ditemukan di catalog snapshot

Hasil:
- request ditolak
- order tidak dibuat

### 7. Variant inactive

Hasil:
- request ditolak
- order tidak dibuat

### 8. Quantity atau unitCost invalid

Hasil:
- request ditolak oleh invariant domain
- order tidak dibuat

---

## Boundary Rules

Use case ini:

- boleh membaca Catalog melalui `CatalogSnapshotPort`
- boleh menyimpan aggregate procurement
- tidak boleh memanggil Inventory boundary
- tidak boleh membuat stock movement
- tidak boleh mengubah Sales
- tidak boleh menghitung payable / accounting

---

## Side Effects

Side effect yang sah:

- persistence `PurchaseOrder`
- persistence `PurchaseItem` sebagai child entity

Side effect yang dilarang:

- perubahan quantity inventory
- pembuatan movement inventory
- perubahan reporting write-side

---

## Relasi dengan Use Case Lain

Use case ini adalah prasyarat untuk:

- `ReceivePurchaseOrder`
- `CancelPurchaseOrder`

Hanya order dengan status `CREATED` yang boleh diteruskan ke dua use case tersebut.

---

## Testing Focus

Application test minimal:

- create order sukses saat actor valid, supplier aktif, dan semua variant valid
- reject jika supplier tidak ditemukan
- reject jika supplier inactive
- reject jika item kosong
- reject jika duplicate variant
- reject jika variant tidak ditemukan
- reject jika variant inactive
- memastikan persistence dipanggil sekali

Integration test minimal:

- order dan item tersimpan benar
- snapshot tersimpan benar
- total quantity dan total cost konsisten
- tidak ada perubahan inventory

---

## Out of Scope

Use case ini tidak mencakup:

- receive barang
- cancel setelah receive
- payable supplier
- purchase payment
- tax pembelian
- costing lanjutan
- return pembelian

---

## Kesimpulan

`CreatePurchaseOrder` adalah entry point resmi untuk membuat histori pembelian baru secara sah di domain Procurement.

Use case ini hanya mencatat niat pembelian dan detail item pembelian.

Use case ini belum menambah stok dan tidak membuka side effect ke Inventory.

