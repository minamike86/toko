# Step 5.4 – Operational Identity & Actor Tracking (Execution Plan)

Status: READY FOR IMPLEMENTATION  
Scope: Eksekusi teknis Step 5.4 untuk mutation application layer  
Primary references:
- `Step 5.4 – Operational Identity & Actor Tracking (Implementation Plan).md`
- `mvp_stages_overview.md`
- `audit-trail-policy.md`
- `authorization-boundary.md`

---

## 1. Tujuan Dokumen

Dokumen ini dibuat sebagai **panduan implementasi konkret** untuk Step 5.4 agar percakapan coding berikutnya dapat langsung mengeksekusi perubahan tanpa membuka ulang diskusi scope.

Dokumen ini **bukan pengganti** implementation plan utama.  
Dokumen ini adalah **execution plan** yang memecah pekerjaan menjadi batch implementasi yang aman.

---

## 2. Scope Final Step 5.4

### 2.1 Yang Masuk Scope

- standardisasi `UserRole`
- standardisasi `ActorContext`
- authorization guard di application layer
- perubahan contract mutation agar menerima actor context
- pencatatan `actorId` pada audit trail / metadata mutation
- test unit untuk authorization & actor requirement
- test integration bernilai tinggi bila diperlukan

### 2.2 Yang Tidak Masuk Scope

- OAuth
- login flow kompleks
- JWT refresh
- session management kompleks
- permission per field
- dynamic permission matrix
- role di domain entity
- refactor domain invariant
- redesign audit subsystem total

---

## 3. Prinsip Keras

1. Domain entity tidak mengetahui user atau role.
2. Authorization hanya di application layer.
3. Actor context dipakai untuk kontrol akses dan audit, bukan untuk business rule domain baru.
4. Domain hanya boleh menerima `actorId` sebagai metadata jika memang dibutuhkan oleh contract existing.
5. Jangan memindahkan logic role ke UI.
6. Jangan refactor luar scope.

---

## 4. Target Mutation yang Wajib Disentuh

Mutation minimum yang wajib selaras dengan Step 5.4:

### Sales
- `CreateOrder`
- `CancelOrder`
- `PayCredit`

### Inventory
- `ReceiveStock`
- `AdjustStock`
- `IssueStock` jika ada application use case eksplisit

Catatan:
Jika ada use case mutation lain yang aktif dan relevan secara operasional, evaluasi setelah batch inti selesai.

---

## 5. Standard Contract yang Harus Dibuat Dulu

### 5.1 UserRole

Buat satu source of truth untuk role minimal:

```ts
export type UserRole = "ADMIN" | "SALES" | "WAREHOUSE";
```

Catatan:
- Role lama seperti `KASIR` harus diselaraskan
- Step 5.4 mengikuti role final dari dokumen resmi

### 5.2 ActorContext

```ts
export type ActorContext = {
  actorId: string;
  role: UserRole;
};
```

### 5.3 Authorization Guard

Guard berada di application layer / shared application boundary.

Minimal responsibility:
- memastikan actor ada
- memastikan role actor termasuk allowed roles
- melempar error bermakna bila tidak valid

Contoh kontrak minimal:

```ts
assertActorExists(actor)
assertRole(actor, allowedRoles)
```

---

## 6. Role Matrix MVP

Gunakan matrix sederhana ini sebagai source implementasi awal.

| Use Case | Allowed Roles |
|---|---|
| CreateOrder | ADMIN, SALES |
| CancelOrder | ADMIN |
| PayCredit | ADMIN, SALES |
| ReceiveStock | ADMIN, WAREHOUSE |
| AdjustStock | ADMIN, WAREHOUSE |
| IssueStock (explicit) | ADMIN, WAREHOUSE |

Catatan:
- Jangan menambah matrix kompleks
- Jangan menambah role baru pada Step 5.4
- Reporting dan dashboard bukan fokus mutation pada dokumen ini

---

## 7. Batch Implementasi yang Direkomendasikan

### Batch 1 — Foundation

Tujuan: menyiapkan contract bersama agar mutation berikutnya tidak memakai definisi actor yang liar.

#### File target
- `src/modules/user/domain/UserRole.ts` atau lokasi setara
- `src/shared/system/types/actor-context.ts` atau lokasi setara
- `src/shared/system/application/AuthorizationGuard.ts` atau lokasi setara

#### Output wajib
- `UserRole` final tersedia
- `ActorContext` final tersedia
- `AuthorizationGuard` final tersedia
- belum menyentuh domain entity

#### Validation
- compile pass
- belum ada perubahan perilaku mutation yang aktif

---

### Batch 2 — PayCredit Alignment

Tujuan: menjadikan `PayCredit` sebagai mutation pertama yang sepenuhnya selaras dengan Step 5.4.

#### Kondisi existing
`PayCredit` sudah paling dekat ke target karena sudah punya actor + guard.

#### Perubahan wajib
- ganti role lama ke role final Step 5.4
- ganti tipe actor lokal ke `ActorContext`
- pertahankan authorization di application layer
- tambahkan / selaraskan audit actorId jika hook audit tersedia

#### File target minimum
- `src/modules/sales/application/PayCredit.ts`
- test terkait `PayCredit`
- file guard/actor bila dipakai lokal

#### Acceptance
- `PayCredit` menerima actor context standar
- `ADMIN` dan `SALES` diizinkan
- actor wajib ada
- unauthorized actor ditolak sebelum mutation

---

### Batch 3 — CreateOrder Alignment

Tujuan: memindahkan `CreateOrder` dari contract lama `createdBy` menuju actor-aware contract Step 5.4.

#### Perubahan wajib
- `execute(command, actor)` atau contract setara yang eksplisit
- authorization guard dijalankan sebelum mutation
- role allowed: `ADMIN`, `SALES`
- metadata domain tetap hanya menerima `actorId`, bukan role penuh
- jangan masukkan actor ke entity domain selain metadata id

#### File target minimum
- `src/modules/sales/application/CreateOrder.ts`
- `CreateOrderDTO.ts` bila masih menjadi input contract aktif
- test `CreateOrder`

#### Catatan penting
Jika `createdBy` masih dibutuhkan untuk persistence snapshot / audit metadata,
isi nilainya dari `actor.actorId`, bukan dari input liar terpisah.

---

### Batch 4 — CancelOrder Alignment

Tujuan: menyelaraskan `CancelOrder` ke Step 5.4 dan memformalkan actorId pada audit trail.

#### Perubahan wajib
- ganti input `canceledBy: string` menjadi actor context standar
- authorization guard dijalankan di awal
- role allowed: `ADMIN`
- audit trail menyimpan `actorId`
- logging boleh tetap non-blocking

#### File target minimum
- `src/modules/sales/application/CancelOrder.ts`
- test `CancelOrder`

#### Catatan
Metadata audit final harus menggunakan istilah yang konsisten:
- boleh simpan `actorId`
- hindari proliferasi field semantik paralel seperti `canceledBy`, `paidBy`, dll jika bisa diseragamkan

---

### Batch 5 — Inventory Mutation Alignment

Tujuan: menyelaraskan mutation inventory aktif dengan actor context Step 5.4.

#### Target minimum
- `ReceiveStock`
- `AdjustStock`
- `IssueStock` bila explicit application use case tersedia

#### Perubahan wajib
- actor context wajib ada
- authorization guard dijalankan di application layer
- role allowed sesuai matrix MVP
- audit actorId dicatat jika audit hook tersedia

#### Catatan keras
- jangan pindahkan authorization ke Inventory domain
- jangan ubah invariant stok
- jangan refactor InventoryService di luar kebutuhan actor passing

---

### Batch 6 — Validation & Hardening

Tujuan: memastikan seluruh mutation inti telah konsisten.

#### Validasi wajib
- actor wajib ada pada seluruh mutation inti
- unauthorized role ditolak di application layer
- domain entity tidak mengimpor actor/user/guard
- audit trail menyimpan actorId pada mutation yang diwajibkan
- test hijau

#### Test minimum
- unit test actor missing
- unit test unauthorized role
- unit test authorized role success path
- architecture/boundary assertion bila tersedia

---

## 8. Mapping Per File yang Direkomendasikan

### Foundation
- `UserRole.ts`
- `actor-context.ts`
- `AuthorizationGuard.ts`

### Sales
- `PayCredit.ts`
- `CreateOrder.ts`
- `CreateOrderDTO.ts` bila contract masih aktif
- `CancelOrder.ts`

### Inventory
- `ReceiveStock.ts`
- `AdjustStock.ts`
- `IssueStock.ts` bila ada

### Supporting tests
- `PayCredit.test.ts`
- `CreateOrder.test.ts`
- `CancelOrder.test.ts`
- inventory mutation tests terkait
- architecture/boundary tests bila perlu

---

## 9. Aturan Refactor

### Boleh
- rename actor contract agar konsisten
- ubah signature use case mutation
- tambahkan authorization guard call
- ubah test agar mengikuti contract baru
- selaraskan audit metadata ke `actorId`

### Tidak Boleh
- mengubah invariant domain
- menambah role di domain entity
- memindahkan guard ke UI
- membuat IAM system penuh
- refactor reporting/dashboard di Step 5.4
- menambah business rule baru yang tidak tertulis di dokumen sumber

---

## 10. Output yang Diharapkan pada Percakapan Coding Berikutnya

Jika implementasi dimulai di percakapan berikutnya, gunakan urutan output ini:

1. Audit existing mutation contracts
2. Daftar file yang akan diubah per batch
3. Implementasi Batch 1 dulu
4. Validasi Batch 1
5. Lanjut Batch 2 dan seterusnya secara bertahap
6. Catatan deviasi jika ada
7. Status akhir per batch: PASS / PASS WITH MINOR GAP / BLOCKED

---

## 11. Rekomendasi Eksekusi Awal

Mulai dari urutan ini:

1. Foundation
2. `PayCredit`
3. `CreateOrder`
4. `CancelOrder`
5. Inventory mutations
6. Validation full

Alasan:
- `PayCredit` sudah paling dekat ke target Step 5.4
- risiko boundary paling kecil
- bisa dijadikan pola untuk mutation lain

---

## 12. Status

READY FOR EXECUTION IN NEXT CONVERSATION

Dokumen ini dapat dipakai sebagai sumber eksekusi sekunder.
Jika ada konflik, implementation plan resmi Step 5.4 tetap menang.

