# Create Supplier

### Status  
CANONICAL USE CASE DOCUMENT

---

## Tujuan

Use case ini digunakan untuk membuat **Supplier** baru sebagai identitas operasional procurement.

Use case ini bertanggung jawab untuk:

- memvalidasi actor dan role
- memvalidasi konflik identitas supplier dasar
- membentuk entity `Supplier`
- menyimpan supplier baru ke repository

Use case ini **tidak**:

- membuat purchase order
- menyentuh Inventory
- menyentuh Sales
- mengaktifkan payable
- mengubah histori procurement

---

## Posisi dalam Sistem

Use case ini berada di Application Layer Procurement.

Use case ini adalah entry point resmi untuk menambahkan supplier baru ke domain Procurement.

Jika terjadi konflik:
- `procurement_domain.md` menang untuk invariant domain
- dokumen Step 6 implementation plan menang untuk scope Step 6

---

## Aktor yang Diizinkan

Allowed roles:

- `ADMIN`

Role berikut tidak diizinkan:

- `SALES`
- `WAREHOUSE`

Authorization wajib dilakukan di application layer sebelum mutasi dijalankan.

---

## Input

Input minimal:

- `storeName: string`
- `salesName?: string | null`
- `phone?: string | null`
- `notes?: string | null`
- `actor`
  - `actorId: string`
  - `role: UserRole`

---

## Output

Output minimal:

- `id`
- `storeName`
- `salesName`
- `phone`
- `notes`
- `isActive`
- `createdAt`

Nilai output awal wajib:

- `isActive = true`

---

## Preconditions

Sebelum eksekusi, kondisi berikut harus benar:

- actor valid
- role actor diizinkan
- `storeName` valid
- belum ada supplier lain dengan `storeName` yang sama pada kontrak repository yang dipakai

---

## Main Flow

1. Validasi actor dan role.
2. Cari supplier existing berdasarkan `storeName`.
3. Jika supplier dengan nama toko yang sama sudah ada, eksekusi gagal.
4. Bentuk entity `Supplier` baru.
5. Set nilai awal:
   - `id` dari repository
   - `isActive = true`
   - `createdAt = waktu eksekusi`
6. Simpan supplier ke repository.
7. Kembalikan DTO hasil create.

---

## Postconditions

Jika sukses:

- satu supplier baru tersimpan
- supplier baru aktif (`isActive = true`)
- supplier memiliki `id` yang sah
- supplier dapat dipakai untuk `CreatePurchaseOrder`

---

## Invariant yang Harus Dijaga

Use case ini wajib menjaga invariant berikut:

- `storeName` tidak boleh kosong
- `id` supplier harus valid
- `isActive` awal wajib `true`
- contact info opsional harus dinormalisasi ke bentuk null jika kosong
- supplier baru tidak boleh langsung dianggap inactive

---

## Failure Cases

### 1. Actor tidak valid atau role tidak diizinkan

Hasil:
- request ditolak
- repository save tidak dipanggil

### 2. `storeName` invalid

Hasil:
- request ditolak oleh invariant domain
- supplier tidak dibuat

### 3. Supplier dengan `storeName` yang sama sudah ada

Hasil:
- request ditolak
- supplier baru tidak dibuat

---

## Boundary Rules

Use case ini:

- hanya boleh bergantung pada `SupplierRepository`
- tidak boleh menyentuh PurchaseOrder
- tidak boleh menyentuh Inventory
- tidak boleh menyentuh Sales
- tidak boleh menaruh authorization di domain

---

## Side Effects

Side effect yang sah:

- persistence supplier baru

Side effect yang dilarang:

- pembuatan purchase order otomatis
- perubahan ke inventory
- perubahan ke reporting write-side
- aktivasi payable / accounting

---

## Testing Focus

Application test minimal:

- create supplier sukses saat actor valid dan `storeName` valid
- reject jika actor bukan `ADMIN`
- reject jika `storeName` kosong
- reject jika `storeName` sudah ada
- memastikan repository save dipanggil sekali saat sukses

Integration test minimal:

- supplier benar-benar tersimpan
- `isActive` awal = `true`
- field opsional disimpan sesuai normalisasi

---

## Out of Scope

Use case ini tidak mencakup:

- penggabungan supplier duplikat
- histori performa supplier
- supplier scoring
- hutang supplier
- payment pembelian
- purchase order creation otomatis

---

## Kesimpulan

`CreateSupplier` adalah entry point resmi untuk menambahkan supplier baru sebagai identitas operasional Procurement.

Use case ini sengaja sempit dan hanya bertugas mencatat supplier secara sah sebelum dipakai pada use case procurement lain.

