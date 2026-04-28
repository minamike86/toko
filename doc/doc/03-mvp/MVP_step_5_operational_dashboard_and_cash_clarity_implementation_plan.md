# MVP Step 5 – Operational Dashboard & Cash Clarity (Implementation Plan)

**Status:** READY TO IMPLEMENT  
**Parent:** MVP Stages Overview (Step 5)  
**Principle:** Dashboard = komposisi dari Reporting. Bukan domain baru.

---

## 1. Tujuan Step 5

Menyediakan tampilan operasional harian untuk owner/admin tanpa:
- menambah aturan bisnis baru
- melakukan query langsung ke write-model
- mengubah state domain

Output Step 5 harus membaca kebenaran yang sudah disediakan Step 3 dan Step 4, bukan menciptakan kebenaran baru.

---

## 2. Precondition (Wajib)

Step 5 hanya boleh dimulai jika prasyarat ini terpenuhi:

### 2.1 Variant & Reporting Alignment
- Reporting inventory berbasis `variantId`.
- Tidak ada fallback implisit ke product-level.
- Exit criteria dual-read telah terpenuhi dan fallback dihapus.

### 2.2 Inventory Consistency Guard
- Reconciliation spec aktif di integration test.
- Tidak ada mismatch snapshot vs movement.
- Tidak ada auto-repair atau rekonstruksi stok di reporting.

Jika prasyarat gagal, Step 5 ditunda.

---

## 3. Scope Step 5

Step 5 terdiri dari dua deliverable utama:

### 3.1 Warehouse Dashboard (Read-only)
Menjawab pertanyaan:
- Total variant aktif
- Stok saat ini per variant
- Item low stock
- Ringkasan stok per product (agregasi eksplisit dari variant)

### 3.2 Cash Clarity View (Read-only)
Menjawab:
- Total kas masuk per periode
- Daftar payment event kronologis
- Outstanding kredit (snapshot saat query)
- Relasi sederhana order ↔ payment

Tidak termasuk:
- Accounting
- Aging piutang
- Pajak
- Costing

---

## 4. Arsitektur & Boundary

### 4.1 Dashboard Tidak Boleh Query DB Langsung
UI dan route Next.js dilarang:
- menggunakan Prisma
- menulis SQL
- membaca tabel domain langsung

Dashboard hanya boleh memanggil application layer reporting.

### 4.2 Dashboard Tidak Boleh Memuat Rule Bisnis
Tidak boleh ada:
- rekonsiliasi stok
- interpretasi status baru
- fallback identity
- rule derivatif yang bukan milik reporting

Jika diperlukan perhitungan baru, tambahkan di reporting layer terlebih dahulu.

---

## 5. Struktur Modul Implementasi

Tambahkan modul:

```
src/modules/dashboard/
  application/
    get-warehouse-dashboard.ts
    get-cash-clarity-dashboard.ts
  dto/
    warehouse-dashboard.dto.ts
    cash-clarity.dto.ts
```

Modul dashboard hanya orkestrasi antar reporting application.
Tidak boleh memiliki query sendiri.

---

## 6. Kontrak DTO

### 6.1 WarehouseDashboardDTO

- asOf: Date
- totalVariants: number
- lowStockCount: number
- items: Array<{
    variantId: string
    sku: string
    productName: string
    variantName: string
    currentStockQuantity: number
    lowStockThreshold: number
    isLowStock: boolean
  }>

`isLowStock` dihitung langsung dari quantity dan threshold tanpa rule tambahan.

---

### 6.2 CashClarityDTO

- period: { from: Date, to: Date }
- cashInTotal: number
- paymentEvents: Array<{
    paymentId: string
    occurredAt: Date
    amount: number
    method: string
    orderId: string
  }>
- outstandingTotal: number
- outstandingOrders: Array<{
    orderId: string
    createdAt: Date
    totalAmount: number
    outstandingAmount: number
  }>

Tidak ada accrual, tidak ada pajak, tidak ada aging.

---

## 7. UI Routes

Contoh rute:
- `/app/app/dashboard/warehouse`
- `/app/app/dashboard/cash`

Halaman hanya memanggil `src/modules/dashboard/application/*`.

---

## 8. Performance Guardrail

### 8.1 Deterministic Ordering
Semua list wajib memiliki ordering eksplisit.

### 8.2 Pagination
Payment event dan dataset besar wajib memiliki pagination atau limit eksplisit.

Tidak diperbolehkan mengambil seluruh dataset tanpa batas.

---

## 9. Testing Strategy

### 9.1 Unit Test (Dashboard Layer)
- Menguji orkestrasi dan mapping DTO.
- Tidak menguji aturan bisnis.

### 9.2 Integration Test
- Seluruh agregasi diuji di reporting layer.
- Dashboard test memastikan pemanggilan reporting benar.

---

## 10. Definition of Done – Step 5

Step 5 dianggap selesai jika:

1. Warehouse Dashboard menampilkan stok per variant dan low stock yang benar.
2. Cash Clarity menampilkan payment kronologis dan total kas masuk.
3. Outstanding kredit konsisten dengan reporting.
4. Tidak ada query DB langsung dari dashboard.
5. Tidak ada rule bisnis baru di UI.
6. Seluruh test hijau.

---

## Penutup

Step 5 tidak membuat sistem lebih kompleks.
Step 5 membuat sistem lebih terlihat.

Visibilitas hanya sejujur data yang dibacanya.

