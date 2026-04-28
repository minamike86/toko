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

Step 5 terdiri dari:

- Dashboard Logic (5.1–5.3)
- Operational Identity (5.4)
- Dashboard Presentation (5.5)

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
- Source of truth inventory pada dashboard tetap berada di level `variantId`.
- Setiap agregasi per product bersifat tampilan eksplisit yang diturunkan dari data per variant,
- bukan fallback ke product-level dan bukan identity operasional baru.

### 3.2 Cash Clarity View (Read-only)

`cashInTotal` didefinisikan sebagai jumlah seluruh payment event yang terjadi di dalam periode query.
Nilai ini tidak dihitung dari total order, tidak berasal dari outstanding delta, dan tidak melakukan accrual.

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
    unit: string
    currentStockQuantity: number
    lowStockThreshold: number
    isLowStock: boolean
  }>

`isLowStock` sepenuhnya mengikuti hasil reporting low stock.

Dashboard tidak menghitung ulang, tidak menginfer, dan tidak
mendefinisikan ulang kondisi low stock dalam bentuk apa pun.

`unit` merepresentasikan satuan deskriptif item stok
(misalnya pcs, kg, liter, meter) untuk kebutuhan tampilan operasional.

Dashboard tidak menurunkan, mengonversi, atau menginterpretasikan unit.
UI hanya menampilkan nilai unit sebagaimana disediakan oleh DTO.

---

### 6.1.1 Low Stock Threshold Source

Untuk MVP Step 5, `lowStockThreshold`:

- dikonfigurasi dan dimiliki oleh **reporting layer**
- diterapkan secara konsisten ke seluruh variant
- menjadi satu-satunya dasar penentuan kondisi low stock

Dashboard:

- tidak menentukan threshold
- tidak melakukan perbandingan `currentStockQuantity <= threshold`
- hanya membaca hasil akhir dari reporting

Konsekuensi:

- belum ada threshold per product
- belum ada threshold per variant
- tidak ada logika low stock di dashboard layer
- seluruh definisi low stock berada di reporting

Jika threshold granular dibutuhkan di masa depan:

- harus menjadi perubahan eksplisit pada reporting layer
- tidak boleh diinfer atau diimplementasikan diam-diam di dashboard

---

### 6.2 CashClarityDTO

- period: { from: Date, to: Date }
- cashInTotal: number
- paymentEvents: Array<{
    paymentId: string
    paymentDate: Date
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

Contoh rute UI dashboard dapat berupa:

- `/dashboard`

Struktur route final mengikuti delivery layer,
namun seluruh halaman wajib hanya memanggil
`src/modules/dashboard/application/*`.

---

## 8. Performance Guardrail

### 8.1 Deterministic Ordering

Semua list wajib memiliki ordering eksplisit.

### 8.2 Pagination

Payment event dan dataset besar wajib memiliki pagination atau limit eksplisit.

Tidak diperbolehkan mengambil seluruh dataset tanpa batas.

Default pagination awal untuk payment events pada MVP:

- default limit: 50
- maksimum limit: 100

Jika parameter pagination tidak diberikan, sistem wajib menggunakan default limit.

## 9. Dashboard Presentation (Step 5.5)

Dashboard Presentation adalah finalisasi Step 5 yang menyajikan
hasil dashboard dalam bentuk UI operasional.

### Tujuan

- Menyediakan visibilitas operasional untuk owner/admin
- Tidak menambah rule bisnis
- Tidak menjadi source of truth baru

### Scope

- SC1 – Owner Operational Dashboard
- Summary cards:
  - totalVariants
  - lowStockCount
  - cashInTotal
  - outstandingTotal
- Low stock section
- Cash clarity section
- Outstanding section

### Boundary

- UI hanya memanggil:
  - getWarehouseDashboard()
  - getCashClarityDashboard()
- UI tidak boleh:
  - query DB langsung
  - import Prisma
  - menghitung ulang data
  - menambah rule bisnis

### Data Rule

- Semua data berasal dari dashboard DTO
- UI hanya melakukan:
  - formatting
  - rendering

### State

- loading
- empty
- error

### Constraint Tambahan

- Low stock harus terlihat tanpa interaksi tambahan
- Outstanding harus terlihat langsung
- Tidak boleh menyembunyikan kondisi kritis

---

## 10. Testing Strategy

### 10.1 Unit Test (Dashboard Layer)

- Menguji orkestrasi dan mapping DTO.
- Tidak menguji aturan bisnis.

### 10.2 Integration Test

- Seluruh agregasi diuji di reporting layer.
- Dashboard test memastikan pemanggilan reporting benar.

---

## 11. Definition of Done – Step 5

Step 5 dianggap selesai jika:

1. Warehouse Dashboard menampilkan stok per variant dan low stock yang benar.
2. Cash Clarity menampilkan payment kronologis dan total kas masuk.
3. Outstanding kredit konsisten dengan reporting.
4. Tidak ada query DB langsung dari dashboard.
5. Tidak ada rule bisnis baru di UI.
6. Seluruh test hijau.
7. Dashboard UI tersedia dan dapat digunakan owner/admin.
8. UI hanya menggunakan dashboard application layer.
9. Tidak ada query database langsung dari UI.
10. Tidak ada business rule baru di UI.

---

## Penutup

Step 5 tidak membuat sistem lebih kompleks.
Step 5 membuat sistem lebih terlihat.

Step 5.4 Operational Identity & Actor Tracking didokumentasikan terpisah
agar boundary dashboard tetap ramping dan tidak bercampur dengan concern actor/audit.

Dashboard Presentation (Step 5.5) harus mengikuti seluruh constraint
yang ditetapkan dalam dokumen ini dan tidak boleh melanggar boundary
reporting → dashboard → UI.

Dokumen ini mencakup implementasi Step 5.1–5.3 (Dashboard Logic)
dan menjadi dasar untuk Step 5.5 Dashboard Presentation (UI).

Visibilitas hanya sejujur data yang dibacanya.
