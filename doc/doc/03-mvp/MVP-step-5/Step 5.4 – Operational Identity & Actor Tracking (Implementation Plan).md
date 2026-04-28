# MVP Step 5.4 – Operational Identity & Actor Tracking (Implementation Plan)

**Status:** READY TO IMPLEMENT
**Parent:** MVP Stages Overview (Step 5.4)
**Principle:** Actor tracking adalah concern operasional dan authorization di application layer, bukan rule domain baru.

---

## 1. Tujuan

Menambahkan identitas pengguna minimal untuk akuntabilitas operasional tanpa:

* mengubah invariant domain
* menambahkan IAM kompleks
* memindahkan authorization ke UI
* menjadikan sistem sebagai ERP penuh

Step 5.4 memastikan setiap mutation penting dapat dikaitkan dengan actor yang melakukan aksi.

---

## 2. Precondition (Wajib)

Step 5.4 hanya boleh dimulai jika:

* Step 4 sudah CLOSED
* mutation inventory dan sales sudah stabil
* audit trail policy aktif
* application boundary dan authorization boundary tetap dipatuhi

Jika belum, Step 5.4 ditunda.

---

## 3. Scope

### 3.1 Yang Masuk Scope

* User entity minimal
* Role minimal
* Actor context pada mutation
* Audit trail menyimpan actorId
* Authorization guard di application layer

### 3.2 Yang Tidak Masuk Scope

* OAuth
* SSO
* multi-tenant IAM
* permission matrix kompleks
* role logic di domain entity
* session management kompleks
* approval workflow

---

## 4. Model Minimal

### 4.1 User

Atribut minimal:

* id: string
* name: string
* role: `ADMIN | SALES | WAREHOUSE`
* isActive: boolean
* createdAt: Date
* updatedAt: Date

### 4.2 Actor Context

Setiap mutation application menerima actor context minimal:

* actorId: string
* role: `ADMIN | SALES | WAREHOUSE`

Actor context wajib tervalidasi di application layer sebelum mutation berjalan.

---

## 5. Boundary Rules

### 5.1 Domain Layer

Domain entity:

* tidak mengetahui user
* tidak mengetahui role
* tidak berisi authorization logic

### 5.2 Application Layer

Application layer:

* menerima actor context
* menjalankan authorization guard
* meneruskan actorId ke audit trail

### 5.3 UI Layer

UI:

* tidak menentukan authorization rule
* hanya meneruskan actor context dari session/auth adapter

---

## 6. Role Scope Awal

### ADMIN

Boleh:

* create order
* cancel order
* receive stock
* adjust stock
* pay credit
* akses reporting
* akses dashboard

### SALES

Boleh:

* create order
* pay credit
* akses reporting/dashboard sesuai kebutuhan operasional minimum

### WAREHOUSE

Boleh:

* receive stock
* adjust stock
* lihat dashboard warehouse bila diizinkan

Role detail final harus dijaga sesederhana mungkin pada MVP.

---

## 7. Audit Trail Requirement

Setiap mutation berikut wajib mencatat `actorId`:

* create order
* cancel order
* receive stock
* adjust stock
* issue stock (jika dipanggil eksplisit via application)
* pay credit

Jika actor context tidak tersedia, mutation tidak boleh silently jalan.

---

## 8. Struktur Modul Implementasi

Contoh struktur:

```txt
src/modules/user/
  domain/
    User.ts
    UserRepository.ts
    UserRole.ts
  infrastructure/
    PrismaUserRepository.ts
    InMemoryUserRepository.ts

src/shared/system/
  application/
    AuthorizationGuard.ts
```

Atau mengikuti struktur project saat ini selama boundary tetap sama.

---

## 9. Integration Strategy

### 9.1 Mutation Contract

Use case mutation diubah agar menerima actor context, misalnya:

* `CreateOrder.execute(command, actor)`
* `ReceiveStock.execute(command, actor)`
* `AdjustStock.execute(command, actor)`

### 9.2 Audit Integration

Audit trail policy harus diperluas agar setiap event mutation menyimpan actorId.

### 9.3 Authorization Enforcement

Authorization guard dijalankan sebelum business mutation dilakukan.

---

## 10. Testing Strategy

### 10.1 Unit Test

Wajib menguji:

* actor wajib ada
* role tidak valid ditolak
* unauthorized action gagal sebelum mutation

### 10.2 Integration Test

Wajib menguji:

* mutation sukses bila actor valid
* mutation gagal bila actor tidak punya hak
* audit trail mencatat actorId

### 10.3 Architecture Test

Wajib menjaga:

* tidak ada authorization logic di domain layer
* guard tetap di application layer

---

## 11. Definition of Done

Step 5.4 dianggap selesai jika:

1. User minimal tersedia
2. Role minimal aktif
3. Mutation menerima actor context
4. Authorization guard aktif di application layer
5. Audit trail mencatat actorId
6. Domain entity tidak mengetahui role/user
7. Seluruh test hijau

---

## 12. Risiko Utama

### Risiko A – Authorization Bocor ke UI

Mitigasi:

* semua rule tetap di application layer

### Risiko B – Domain Tercemar Concern User

Mitigasi:

* actor tidak masuk entity domain

### Risiko C – Scope IAM Membengkak

Mitigasi:

* tetap gunakan role minimal
* tolak OAuth/SSO/multi-tenant di MVP

---

## 13. Kesimpulan

Step 5.4 bersifat additive dan operasional.

Tujuannya bukan membuat sistem identitas kompleks,
tetapi memastikan mutation penting memiliki akuntabilitas yang cukup untuk penggunaan nyata.

Step ini harus menjaga tiga hal:

* sederhana
* dapat diaudit
* tidak mencemari domain
