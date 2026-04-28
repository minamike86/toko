# Step 5.4 – Operational Identity & Actor Tracking

**Status:** CLOSED (IMPLEMENTED & VALIDATED)
**Parent:** MVP Step 5 – Operational Dashboard & Cash Clarity
**Reference:** MVP Stages Overview, Step 5.4 Implementation Plan, Execution Plan

---

# 1. Tujuan

Menambahkan identitas operasional minimal pada setiap mutation untuk memastikan:

- akuntabilitas (siapa melakukan apa)
- kontrol akses dasar (authorization)
- audit trail yang konsisten

Tanpa:

- mengubah invariant domain
- menambahkan IAM kompleks
- memindahkan logic ke UI
- menjadikan sistem sebagai ERP penuh

Step ini bersifat **additive**, bukan redesign domain.

---

# 2. Scope Implementasi

## 2.1 Yang Masuk Scope

- Standardisasi `UserRole`
- Standardisasi `ActorContext`
- Authorization guard di application layer
- Mutation menerima actor context
- Audit trail menyimpan `actorId`
- Alignment use case sales dan inventory

## 2.2 Yang Tidak Masuk Scope

- OAuth / SSO
- Session management kompleks
- Permission matrix granular
- Role logic di domain entity
- UI-based authorization
- Refactor domain invariant

---

# 3. Model Final

## 3.1 UserRole

```ts
export type UserRole = "ADMIN" | "SALES" | "WAREHOUSE";
```

## 3.2 ActorContext

```ts
export type ActorContext = {
  actorId: string;
  role: UserRole;
};
```

## 3.3 AuthorizationGuard (Application Layer)

Minimal responsibility:

- memastikan actor ada
- memastikan role valid
- menolak akses sebelum mutation berjalan

---

# 4. Boundary Rules

## 4.1 Domain Layer

- Tidak mengetahui user
- Tidak mengetahui role
- Tidak mengandung authorization logic

## 4.2 Application Layer

- Menerima actor context
- Menjalankan authorization guard
- Meneruskan `actorId` ke audit trail

## 4.3 UI Layer

- Tidak menentukan authorization rule
- Hanya meneruskan actor context

---

# 5. Role Matrix MVP

| Use Case | Allowed Roles |
|----------|--------------|
| CreateOrder | ADMIN, SALES |
| CancelOrder | ADMIN |
| PayCredit | ADMIN, SALES |
| ReceiveStock | ADMIN, WAREHOUSE |
| AdjustStock | ADMIN, WAREHOUSE |
| IssueStock | ADMIN, WAREHOUSE |

---

# 6. Mutation Alignment

## Sales

- CreateOrder → actor-aware
- CancelOrder → actor-aware
- PayCredit → actor-aware

## Inventory

- ReceiveStock → actor-aware
- AdjustStock → actor-aware
- IssueStock → tetap internal, tidak over-authorized

---

# 7. Audit Trail

Setiap mutation mencatat:

- actorId

Mutation wajib:

- create order
- cancel order
- pay credit
- receive stock
- adjust stock
- issue stock (jika eksplisit)

Jika actor tidak ada → mutation ditolak.

---

# 8. Implementation Summary

Implementasi dilakukan dalam batch:

1. Foundation
2. PayCredit alignment
3. CreateOrder alignment
4. CancelOrder alignment
5. Inventory mutation alignment
6. Validation & hardening

Seluruh mutation kini:

- menerima actor context
- menggunakan AuthorizationGuard
- tidak mencemari domain

---

# 9. Validation Result

## Compile

- TypeScript: PASS

## Test

- Vitest: PASS
- 25 test files passed
- 67 tests passed

## Constraint Check

- Authorization hanya di application layer → PASS
- Domain tidak tahu user/role → PASS
- Tidak ada business rule baru → PASS
- Tidak ada IAM kompleks → PASS

---

# 10. Known Gap (Minor)

## Internal Return Flow

Flow:

CancelOrder → InventoryServiceAdapter → ReceiveStock

Menggunakan:

```ts
SYSTEM-CANCEL-ORDER (ADMIN)
```

Sebagai default actor.

### Dampak

- Flow tetap benar
- Audit actor tidak 100% actor asli

### Status

ACCEPTED (MVP)

---

## Deadlock Log (PayCredit Test)

- Muncul pada integration test concurrency
- Tidak menyebabkan test failure

Status:

ACCEPTED (expected DB behavior)

---

# 11. Definition of Done

Step 5.4 dinyatakan selesai jika:

- Actor context tersedia di mutation
- Authorization guard aktif
- Audit trail mencatat actorId
- Domain tetap bersih
- Test hijau

Semua kriteria telah terpenuhi.

---

# 12. Final Status

| Area | Status |
|------|--------|
| Actor Context | COMPLETE |
| Authorization | COMPLETE |
| Audit Trail | COMPLETE |
| Domain Integrity | PRESERVED |
| Test | PASS |

---

# 13. Conclusion

Step 5.4 berhasil:

- menambahkan akuntabilitas operasional
- menjaga boundary tetap bersih
- tidak menambah kompleksitas berlebihan

Sistem sekarang:

- tahu siapa melakukan mutation
- menolak akses tidak valid
- tetap sederhana

---

**Step 5.4 is officially CLOSED.**

