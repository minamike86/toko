# Update Supplier Status

### Status  
CANONICAL USE CASE DOCUMENT

---

## Tujuan

Use case ini digunakan untuk mengubah status aktif supplier pada domain Procurement.

Use case ini bertanggung jawab untuk:

- memvalidasi actor dan role
- memuat `Supplier`
- mengaktifkan atau menonaktifkan supplier
- menyimpan perubahan status supplier

Use case ini **tidak**:

- mengubah histori purchase order lama
- menghapus supplier
- memindahkan purchase order ke supplier lain
- menyentuh Inventory atau Sales

---

## Posisi dalam Sistem

Use case ini berada di Application Layer Procurement.

Use case ini adalah entry point resmi untuk mengelola apakah supplier masih boleh dipakai untuk pembelian baru.

Jika terjadi konflik:
- `procurement_domain.md` menang untuk invariant domain
- dokumen Step 6 implementation plan menang untuk scope Procurement MVP

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

- `supplierId: string`
- `isActive: boolean`
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

---

## Preconditions

Sebelum eksekusi, kondisi berikut harus benar:

- actor valid
- role actor diizinkan
- supplier ada

---

## Main Flow

1. Validasi actor dan role.
2. Ambil `Supplier` berdasarkan `supplierId`.
3. Jika supplier tidak ditemukan, eksekusi gagal.
4. Jika `isActive = true`, panggil `activate()`.
5. Jika `isActive = false`, panggil `deactivate()`.
6. Simpan perubahan supplier ke repository.
7. Kembalikan DTO hasil update.

---

## Postconditions

Jika sukses:

- status aktif supplier berubah sesuai input
- perubahan tersimpan di repository
- histori purchase order lama tidak berubah
- aturan create purchase order berikutnya mengikuti status supplier terbaru

---

## Invariant yang Harus Dijaga

Use case ini wajib menjaga invariant berikut:

- supplier harus ada sebelum diubah
- perubahan status supplier tidak boleh mengubah histori procurement lama
- supplier inactive tidak boleh dipakai untuk purchase order baru
- supplier active boleh dipakai kembali untuk purchase order baru

---

## Failure Cases

### 1. Actor tidak valid atau role tidak diizinkan

Hasil:
- request ditolak
- repository save tidak dipanggil

### 2. Supplier tidak ditemukan

Hasil:
- request ditolak
- tidak ada perubahan yang disimpan

---

## Boundary Rules

Use case ini:

- hanya boleh bergantung pada `SupplierRepository`
- tidak boleh mengubah `PurchaseOrder`
- tidak boleh mengubah Inventory
- tidak boleh mengubah Sales
- tidak boleh memindahkan authorization ke domain

---

## Side Effects

Side effect yang sah:

- perubahan status aktif supplier pada persistence

Side effect yang dilarang:

- perubahan quantity inventory
- perubahan histori purchase order lama
- pembuatan atau pembatalan purchase order otomatis
- perubahan reporting write-side

---

## Dampak Status Supplier

### Saat supplier aktif (`isActive = true`)

- supplier boleh dipakai untuk `CreatePurchaseOrder`

### Saat supplier inactive (`isActive = false`)

- supplier tidak boleh dipakai untuk `CreatePurchaseOrder`
- histori purchase lama tetap valid dan tidak berubah

---

## Testing Focus

Application test minimal:

- activate supplier sukses saat actor valid
- deactivate supplier sukses saat actor valid
- reject jika actor bukan `ADMIN`
- reject jika supplier tidak ditemukan
- memastikan repository save dipanggil saat sukses

Integration test minimal:

- perubahan `isActive` benar-benar tersimpan
- supplier inactive ditolak oleh `CreatePurchaseOrder` pada alur terpisah
- histori purchase lama tetap tidak berubah

---

## Out of Scope

Use case ini tidak mencakup:

- delete supplier
- merge supplier
- rename histori purchase lama
- hutang supplier
- payment pembelian
- scoring supplier

---

## Kesimpulan

`UpdateSupplierStatus` adalah entry point resmi untuk mengelola apakah supplier masih dapat dipakai untuk pembelian baru.

Use case ini hanya mengubah status aktif supplier dan tidak boleh menimbulkan side effect ke domain lain.

