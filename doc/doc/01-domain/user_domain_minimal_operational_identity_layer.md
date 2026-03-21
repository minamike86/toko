# User Domain Minimal – Operational Identity Layer

**Location Recommendation:**
`/docs/01-domain/user-domain.md`

Dokumen ini mendefinisikan desain minimal untuk User Domain yang bertujuan menyediakan identitas operasional tanpa melanggar DDD Boundaries yang telah dikunci.

Dokumen ini bersifat operasional dan additive terhadap MVP Step 5.

---

## 1. Tujuan

Menyediakan identitas pengguna minimal untuk:

- Mencatat siapa membuat order
- Mencatat siapa menerima stock
- Mencatat siapa melakukan adjustment
- Menerapkan kontrol akses sederhana

Tanpa:

- Mengubah domain inti (Sales, Inventory, Procurement)
- Menambahkan aturan bisnis baru
- Membuat sistem authentication kompleks

---

## 2. Posisi Arsitektural

User Domain berada di sisi operasional (application boundary).

Struktur relasi:

Application Layer
→ Authorization Guard
→ Use Case
→ Domain Entity

User tidak menjadi aggregate yang memengaruhi domain lain.

Sales, Inventory, dan Procurement hanya menerima `actorId` sebagai metadata.

---

## 3. Entity Minimal

### User

Field minimal:

- id: EntityId
- name: string
- role: UserRole (enum)
- isActive: boolean
- createdAt: Date
- updatedAt: Date

Tidak mencakup:

- Permission granular
- Hierarki role kompleks
- Multi-tenant
- Password reset workflow kompleks

---

## 4. Role Enum

```ts
export enum UserRole {
  ADMIN = "ADMIN",
  SALES = "SALES",
  WAREHOUSE = "WAREHOUSE",
}
```

Definisi operasional:

ADMIN
- Full akses operasional

SALES
- CreateOrder
- CancelOrder (opsional terbatas)
- PayCredit
- Tidak boleh AdjustStock

WAREHOUSE
- ReceiveStock
- AdjustStock
- Tidak boleh CreateOrder
- Tidak boleh PayCredit

Role enforcement hanya di Application Layer.

---

## 5. Actor Context Pattern

Setiap use case mutation wajib menerima:

```ts
execute(input: InputDTO, actor: ActorContext)
```

```ts
export interface ActorContext {
  id: EntityId
  role: UserRole
}
```

Domain entity hanya menerima `actorId` sebagai metadata.

Contoh:

```ts
Order.create(input, actor.id)
StockMovement.create(..., actor.id)
```

Domain entity tidak boleh menerima role.

---

## 6. Authorization Guard (Application Layer Only)

Authorization berada di layer application.

Contoh kontrak:

```ts
export interface AuthorizationPolicy {
  canCreateOrder(role: UserRole): boolean
  canReceiveStock(role: UserRole): boolean
  canAdjustStock(role: UserRole): boolean
  canPayCredit(role: UserRole): boolean
}
```

Guard wajib:

- Mengecek role sebelum mutation terjadi
- Throw ForbiddenError jika tidak valid
- Tidak melakukan side effect sebelum validasi

---

## 7. Struktur Folder (src/modules)

Direkomendasikan:

```
src/modules/user/
  domain/
    User.ts
    UserRole.ts
    UserRepository.ts
  application/
    CreateUser.ts
    ActivateUser.ts
    DeactivateUser.ts
    AuthorizationPolicy.ts
    AuthorizationGuard.ts
  infrastructure/
    PrismaUserRepository.ts
```

User Domain tidak boleh mengimpor Sales atau Inventory.

Sales dan Inventory tidak boleh mengimpor User entity.

Interaksi hanya melalui ActorContext.

---

## 8. Audit Integration

Setiap mutation mencatat:

- createdBy
- updatedBy
- canceledBy
- receivedBy
- adjustedBy

AuditTrail tetap berada di shared layer.
User Domain hanya menyediakan identity yang sah.

---

## 9. Non-Goals

User Domain Minimal tidak mencakup:

- OAuth
- JWT refresh flow kompleks
- Permission per field
- Dynamic role management
- CRM

---

## 10. Definition of Done

User Domain Minimal dianggap selesai jika:

- Semua mutation menerima ActorContext
- Semua mutation mencatat actorId
- Authorization guard aktif
- Tidak ada role logic di domain entity
- Architecture test tetap hijau

---

Dokumen ini memastikan login minimal dan actor tracking tetap konsisten dengan DDD Boundaries dan tidak mengubah domain inti sistem.

