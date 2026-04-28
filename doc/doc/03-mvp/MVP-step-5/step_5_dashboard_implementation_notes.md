# MVP Step 5 – Operational Dashboard (Phase 5.1–5.3)

## 1. Context & Scope

Dokumen ini mendefinisikan implementasi:

- Step 5.1 – Warehouse Dashboard  
- Step 5.2 – Cash Clarity Dashboard  
- Step 5.3 – Performance Preparation (implicit readiness)

Dokumen ini mencakup implementasi Step 5.1–5.3 (Dashboard Logic)
dan tidak mencakup:

- Step 5.4 Operational Identity & Actor Tracking
- Step 5.5 Dashboard Presentation (UI)

Kedua step tersebut didokumentasikan secara terpisah
untuk menjaga boundary tetap bersih.

---

## Constraint Utama

- Dashboard = pure composition dari reporting  
- Tidak boleh query DB langsung  
- Tidak boleh import Prisma  
- Tidak boleh menambah business rule  
- Tidak boleh fallback identity  
- reporting harus menjamin tidak ada duplicate variantId
- dashboard tidak boleh melakukan deduplication

### Identity Rule

- Reporting harus menjamin `variantId` tidak null
- Jika null → fail fast di query layer
- Dashboard tidak boleh menerima variantId null

### Timestamp Rule

- `asOf` adalah timestamp layer dashboard
- Tidak digunakan untuk business logic
- Boleh `new Date()` atau di-inject dari luar
- asOf boleh dihasilkan oleh dashboard, tetapi tidak boleh digunakan dalam logika apapun
- bila diperlukan untuk test, asOf dapat di-inject dari caller

### Behavior Rule

- Dashboard tidak boleh melakukan filtering tambahan  
- Dashboard tidak boleh mengubah makna data  
- Hanya boleh:
  - mapping
  - agregasi ringan (count, sum)
- Dokumen ini adalah target design dan implementation notes untuk dashboard, bukan dokumen perubahan reporting.
- Dashboard harus tetap valid walaupun data kosong
- Empty array adalah output yang valid
- Tidak boleh throw error hanya karena tidak ada data

---

## Ordering Contract

- Inventory snapshot → `variantId asc`  
- Low stock → `quantity asc`, `variantId asc`  
- Payment history → `paymentDate asc` (stable)  
- Outstanding → `createdAt asc`  

Catatan:
`createdAt` berasal dari `orderDate` pada reporting dan ditranslasikan di application layer.

---

## 2. Dependency Audit (Reporting Layer)

### Inventory Reporting

Digunakan oleh Warehouse Dashboard:

  1. getInventorySnapshotReport()

    - Output: list snapshot inventory

  1. getInventoryLowStockReport(threshold: number)

    - Output: list item dengan stok rendah

Kebutuhan Step 5:

- Harus berbasis variantId (bukan productId)
- Sudah deterministic ordering

---

### Cash Reporting

Digunakan oleh Cash Clarity:

  1. getCreditPaymentHistoryReport({ from, to })

    - Output:
      - details[]
      - summary.totalPaidAmount

  2. getCreditOutstandingReport({ from, to })

    - Output:
      - details[]
      - summary.totalOutstandingAmount

Karakteristik:

- Sudah deterministic
- Sudah tidak mengandung business logic
- getInventoryLowStockReport harus menggunakan threshold yang sama dengan dashboard
- definisi low stock tidak boleh berbeda antara reporting dan dashboard
- dashboard tidak boleh menghitung ulang low stock
- threshold low stock harus ditentukan di satu sumber (single source of truth)
- dashboard dan reporting harus menggunakan nilai threshold yang sama
- perubahan threshold harus mempengaruhi keduanya secara konsisten

---

## 3. Warehouse Dashboard Design

### DTO

File:
`src/modules/dashboard/dto/warehouse-dashboard.dto.ts`

```ts
export type WarehouseDashboardItemDTO = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  currentStockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
};

export type WarehouseDashboardDTO = {
  asOf: Date;
  totalVariants: number;
  lowStockCount: number;
  items: WarehouseDashboardItemDTO[];
};
```

Catatan:
Snippet ini adalah target final.
Tidak boleh digunakan sebelum reporting menyediakan:

- sku
- productName
- variantName
  
---

### Application

File:
`src/modules/dashboard/application/get-warehouse-dashboard.ts`

```ts
import { getInventorySnapshotReport } from "@/modules/reporting/application/get-inventory-snapshot-report";
import { getInventoryLowStockReport } from "@/modules/reporting/application/get-inventory-low-stock-report";
import type { WarehouseDashboardDTO } from "../dto/warehouse-dashboard.dto";

const LOW_STOCK_THRESHOLD = 10;

export async function getWarehouseDashboard(): Promise<WarehouseDashboardDTO> {
  const snapshot = await getInventorySnapshotReport();
  const lowStock = await getInventoryLowStockReport(LOW_STOCK_THRESHOLD);

  const lowStockSet = new Set(lowStock.map((i) => i.variantId));

  const items = snapshot.map((row) => ({
    variantId: row.variantId,
    sku: row.sku,
    productName: row.productName,
    variantName: row.variantName,
    currentStockQuantity: row.currentStockQuantity,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    isLowStock: lowStockSet.has(row.variantId),
  }));

  return {
    asOf: new Date(),
    totalVariants: items.length,
    lowStockCount: lowStock.length,
    items,
  };
}
```

Catatan:

- Tidak ada business rule baru
- Tidak ada DB access
- Tidak ada mutation
- low stock count harus dihitung berdasarkan unique variantId

---

## 4. Cash Clarity Dashboard Design

### DTO

File:
`src/modules/dashboard/dto/cash-clarity.dto.ts`

```ts
export type CashClarityDTO = {
  period: {
    from: Date;
    to: Date;
  };
  cashInTotal: number;
  paymentEvents: {
    paymentId: string;
    orderId: string;
    paymentDate: Date;
    amount: number;
    method: string;
  }[];
  outstandingTotal: number;
  outstandingOrders: {
  orderId: string;
  createdAt: Date;
  totalAmount: number;
  outstandingAmount: number;
}[];
};
```

Catatan:
DTO ini adalah target final Step 5.
Field berikut belum tersedia di reporting existing:

- paymentId
- method
- createdAt (naming alignment)

Dashboard tidak boleh mengisi field ini sendiri

---

### Application

File:
`src/modules/dashboard/application/get-cash-clarity-dashboard.ts`

```ts
import { getCreditPaymentHistoryReport } from "@/modules/reporting/application/get-credit-payment-history-report";
import { getCreditOutstandingReport } from "@/modules/reporting/application/get-credit-outstanding-report";
import type { CashClarityDTO } from "../dto/cash-clarity.dto";

export async function getCashClarityDashboard(params: {
  from: Date;
  to: Date;
}): Promise<CashClarityDTO> {
  const payment = await getCreditPaymentHistoryReport(params);
  const outstanding = await getCreditOutstandingReport(params);

  const paymentEvents = payment.details.map((d) => ({
    paymentId: d.paymentId,
    orderId: d.orderId,
    paymentDate: d.paymentDate,
    amount: d.paidAmount,
    method: d.method,
  }));

  const cashInTotal = paymentEvents.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const outstandingOrders = outstanding.details.map((d) => ({
    orderId: d.orderId,
    createdAt: d.createdAt,
    totalAmount: d.totalAmount,
    outstandingAmount: d.outstandingAmount,
  }));

  return {
    period: params,
    cashInTotal,
    paymentEvents,
    outstandingTotal: outstanding.summary.totalOutstandingAmount,
    outstandingOrders,
  };
}
```

Catatan:

- Semua data dari reporting
- Deterministic ordering mengikuti reporting
- Tidak ada logic tambahan
- Implementation ini valid setelah reporting adjustment selesai.
- summary.totalPaidAmount harus konsisten dengan hasil agregasi detail
- dashboard menggunakan detail sebagai source of truth untuk cashInTotal
- range waktu harus konsisten antara reporting dan dashboard
- definisi from/to (inclusive/exclusive) harus sama
- timezone harus konsisten

---

## 5. Performance Preparation (Step 5.3)

Prinsip:

- Dashboard tidak menambah query baru
- Tidak ada N+1
- Performance sepenuhnya tergantung reporting
- perubahan contract reporting harus dianggap breaking change untuk dashboard
- perubahan harus melalui update dokumen ini

Checklist:

- Reporting sudah menggunakan index
- Sorting sudah deterministic
- Tidak ada N+1 di dashboard
- Tidak ada loop async berulang

---

## 6. Definition of Done

Warehouse Dashboard:

- Menampilkan semua variant
- Low stock akurat
- Tidak ada fallback identity  
- Deterministic ordering  
- item dashboard memuat variantId, sku, productName, variantName, currentStockQuantity, lowStockThreshold, isLowStock

Cash Clarity:

- cashInTotal = sum(payment events)
- outstanding sesuai reporting
- ordering deterministic
- paymentEvents memuat paymentId, orderId, paymentDate, amount, method
- outstandingOrders memuat orderId, createdAt, totalAmount, outstandingAmount

Global:

- Tidak ada Prisma di dashboard
- Tidak ada query baru
- Tidak ada mutation
- Semua data dari reporting
- Tidak ada field yang diisi dari luar reporting (no synthetic data)

---

## 7. Open Dependency

Agar implementasi valid:

Inventory reporting harus menyediakan:

- variantId
- sku
- productName
- variantName

Cash reporting harus menyediakan:

- paymentId
- method
- output outstanding dengan createdAt sebagai field final

Jika belum tersedia:
→ implementasi dashboard tidak boleh dilakukan
→ harus diselesaikan di reporting layer terlebih dahulu

---

## 8. Reporting Gap Analysis untuk Step 5

Analisis ini mengunci apa saja yang sudah siap dan apa saja yang masih kurang sebelum dashboard diimplementasikan.

### 8.1 Warehouse Dashboard

#### Sudah tersedia dari reporting

- `productId`
- `variantId`
- `currentStockQuantity`
- deterministic ordering pada inventory snapshot
- deterministic ordering pada low stock report

#### Belum tersedia dari reporting

- `sku`
- `productName`
- `variantName`

#### Dampak

Warehouse Dashboard final belum bisa membentuk DTO Step 5 secara utuh hanya dari reporting yang ada sekarang.

#### Keputusan

- Tambahan field di atas harus disediakan lebih dulu oleh reporting layer. Dashboard tidak boleh menambah query sendiri untuk mengambil nama produk, nama varian, atau SKU.
- Akibatnya snippet dashboard di section 3/4 adalah target final, bukan implementasi yang langsung valid pada reporting existing.

---

### 8.2 Cash Clarity Dashboard

#### Sudah tersedia dari reporting

Payment history:

- `orderId`
- `paymentDate`
- `orderDate`
- `orderType`
- `totalAmount`
- `paidAmount`

Outstanding report:

- `orderId`
- `orderDate`
- `orderType`
- `totalAmount`
- `outstandingAmount`
- summary total outstanding

#### Belum tersedia dari reporting

Untuk payment events final Step 5:

- `paymentId`
- `method`

Untuk outstanding output final Step 5:

- penyelarasan nama field `orderDate` menjadi `createdAt` bila contract Step 5 ingin literal sama

#### Dampak

Cash Clarity secara struktur hampir siap, tetapi belum memenuhi contract final Step 5 secara literal.

#### Keputusan

- Penyesuaian contract harus dilakukan di reporting layer, bukan di dashboard layer.
- Akibatnya snippet dashboard di section 3/4 adalah target final, bukan implementasi yang langsung valid pada reporting existing.

---

## 9. Reporting Adjustment Plan

Sebelum implementasi dashboard, lakukan penyesuaian reporting berikut.

### 9.1 Inventory Snapshot Report

Target tambahan field:

- `sku`
- `productName`
- `variantName`

Target DTO akhir minimum:

```ts
export type InventorySnapshotReportRow = {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  currentStockQuantity: number;
};
```

Catatan:

- tetap reporting-only
- tetap deterministic
- variantId adalah mandatory field dan tidak boleh null pada semua output reporting
- tidak ada fallback identity

---

### 9.2 Inventory Low Stock Report

Target tambahan field minimum:

- opsional: `sku`
- opsional: `productName`
- opsional: `variantName`

Catatan:
Untuk dashboard Step 5, field tambahan di low stock report tidak wajib jika snapshot report sudah lengkap, karena low stock report dapat digunakan terutama untuk membentuk set low-stock berdasarkan `variantId`.

---

### 9.3 Credit Payment History Report

Target tambahan field:

- `paymentId`
- `method`

Target DTO event minimum:

```ts
export type CreditPaymentHistoryDetailDTO = {
  paymentId: string;
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  method: string;
};
```

---

### 9.4 Credit Outstanding Report

Penyesuaian minimum:

- pastikan `orderDate` secara kontrak setara dengan `createdAt`
- bila perlu, rename field di DTO agar konsisten dengan dokumen Step 5
- Pada reporting existing, createdAt dapat ditranslasikan dari orderDate di application reporting layer sebelum dashboard mengonsumsinya.

Target DTO minimum:

```ts
export type CreditOutstandingDetailDTO = {
  orderId: string;
  createdAt: Date;
  orderType: string;
  totalAmount: number;
  outstandingAmount: number;
};
```

---

## 10. Urutan Kerja yang Direkomendasikan

1. rapikan contract reporting inventory
2. rapikan contract reporting cash clarity
3. validasi contract output reporting final
4. validasi deterministic ordering tetap aman
5. baru implementasi dashboard application + DTO
6. Dashboard tidak boleh diimplementasikan sebelum langkah 1–4 selesai.
7. baru test integrasi Step 5

---

## 11. Dokumen Implementasi Perubahan Reporting Step 5

Bagian ini memecah perubahan reporting yang dibutuhkan sebelum dashboard diimplementasikan.

### 11.1 Tujuan

Menyelaraskan contract reporting agar Step 5 dashboard dapat diimplementasikan tanpa:

- query baru di dashboard
- import Prisma di dashboard
- fallback identity
- improvisasi data di application dashboard
- dashboard tidak boleh mengisi field yang tidak disediakan oleh reporting
- semua field harus berasal langsung dari reporting layer
- Dashboard tidak boleh mengubah nilai data dari reporting
- Tidak boleh ada normalisasi, fallback, atau penyesuaian nilai
- Semua nilai harus diteruskan apa adanya dari reporting
- Dashboard hanya boleh mengambil data melalui reporting application
- Tidak boleh mengakses data melalui module lain selain reporting
- Dashboard tidak boleh melakukan perhitungan ulang terhadap data reporting
- Semua perhitungan harus berasal dari reporting layer
- Dashboard hanya boleh melakukan agregasi sederhana (count, sum)

---

### 11.2 File yang Perlu Diubah

#### Inventory

1. `src/modules/reporting/queries/inventory-snapshot.query.ts`
2. `src/modules/reporting/dto/inventory-snapshot-report.dto.ts`
3. `src/modules/reporting/application/get-inventory-snapshot-report.ts`

#### Cash

1. `src/modules/reporting/queries/credit-payment-history.query.ts`
2. `src/modules/reporting/dto/credit-payment-history.dto.ts`
3. `src/modules/reporting/application/get-credit-payment-history-report.ts`
4. `src/modules/reporting/dto/credit-outstanding.dto.ts`
5. `src/modules/reporting/application/get-credit-outstanding-report.ts`

---

## 12. Perubahan Detail per File

### 12.1 inventory-snapshot.query.ts

#### Tujuan

Menambahkan metadata presentasi minimum agar dashboard warehouse dapat dibentuk langsung dari reporting.

#### Tambahan field target

- `variantId`
- `productId`
- `sku`
- `productName`
- `variantName`
- `quantity`

#### Prinsip

- tetap pure reporting query
- tetap deterministic ordering by `variantId asc`
- tidak ada fallback untuk variant null
- query harus menjamin variantId selalu ada (non-null)
- jika data tidak memenuhi, query harus gagal (bukan mengembalikan null)

#### Bentuk hasil target

```ts
export type InventorySnapshotRow = {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
};
```

---

### 12.2 inventory-snapshot-report.dto.ts

#### Tujuan

Menyelaraskan output reporting application dengan kebutuhan Warehouse Dashboard.

#### Bentuk DTO target

```ts
export type InventorySnapshotReportRow = {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  currentStockQuantity: number;
};
```

Catatan:

- DTO ini mengasumsikan semua field sudah tersedia dari query layer dan tidak boleh diisi ulang di application layer.

---

### 12.3 get-inventory-snapshot-report.ts

#### Tujuan

Mapping hasil query ke DTO final tanpa menambah rule bisnis.

#### Aturan mapping

- `quantity -> currentStockQuantity`
- field lain diteruskan apa adanya
- hanya diperbolehkan transformasi struktural (rename field)
- tidak boleh ada perubahan nilai atau logic tambahan

---

### 12.4 credit-payment-history.query.ts

#### Tujuan

Menambahkan field agar Cash Clarity dapat menampilkan event pembayaran sesuai kontrak Step 5.

#### Tambahan field target

- `paymentId`
- `method`
- `orderId`
- `paymentDate`
- `orderDate`
- `orderType`
- `totalAmount`
- `paidAmount`

#### Prinsip

- tetap order by `paidAt asc`
- wajib menggunakan ordering deterministik:
  paidAt asc, id asc
- tidak menambah business rule

#### Bentuk hasil target

```ts
export type CreditPaymentHistoryRow = {
  paymentId: string;
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  method: string;
};
```

---

### 12.5 credit-payment-history.dto.ts

#### Tujuan

Menyelaraskan DTO reporting dengan kebutuhan cash event dashboard.

#### Bentuk DTO target

```ts
export type CreditPaymentHistoryDetailDTO = {
  paymentId: string;
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  method: string;
};
```

Summary tetap boleh dipertahankan:

```ts
export type CreditPaymentHistorySummaryDTO = {
  totalPaidAmount: number;
  totalPaidOrders: number;
};
```

---

### 12.6 get-credit-payment-history-report.ts

#### Tujuan

Mapping row query menjadi DTO tanpa menambah aturan baru.

#### Aturan mapping

- `id -> paymentId`
- `method -> method`
- total summary tetap hasil reduce dari `paidAmount`
- id yang digunakan harus berasal dari payment entity, bukan order

---

### 12.7 credit-outstanding.dto.ts

#### Tujuan

Menyelaraskan nama field dengan kontrak Step 5.

#### Bentuk DTO target

```ts
export type CreditOutstandingDetailDTO = {
  orderId: string;
  createdAt: Date;
  orderType: string;
  totalAmount: number;
  outstandingAmount: number;
};
```

#### Catatan

- output DTO wajib menggunakan `createdAt`
- penggunaan `orderDate` hanya boleh di layer query, tidak boleh bocor ke DTO

---

### 12.8 get-credit-outstanding-report.ts

#### Tujuan

Mapping `orderDate` dari query ke `createdAt` pada DTO/application output bila query belum diubah.

#### Aturan mapping

- query boleh tetap mengembalikan `orderDate`
- application reporting boleh menjadi titik translasi ke `createdAt`
- mapping harus selalu: orderDate -> createdAt
- tidak boleh ada field orderDate di output akhir
- summary tetap sama

---

## 13. Acceptance Criteria Perubahan Reporting

### Inventory

- snapshot report mengandung `variantId`, `productId`, `sku`, `productName`, `variantName`, `currentStockQuantity`
- semua field wajib non-null sesuai contract
- tidak ada field tambahan di luar contract
- deterministic ordering tetap terjaga
- tidak ada fallback identity

### Cash

- payment history mengandung `paymentId` dan `method`
- outstanding output menggunakan `createdAt` atau punya translasi eksplisit yang stabil
- summary tetap konsisten dengan data detail

### Global

- semua perubahan tetap berada di reporting layer
- dashboard belum diimplementasikan sebelum kontrak ini selesai

---

## 14. Test Impact

Setelah perubahan reporting dilakukan, area test yang perlu diperbarui:

- inventory snapshot integration test
- inventory low stock integration test bila DTO ikut diperluas
- credit payment history integration test
- credit outstanding integration test
- tambahan assertion untuk deterministic ordering jika belum ada
- test memastikan tidak ada field null pada contract final
- test memastikan field createdAt tidak menggunakan orderDate di output
- test memastikan paymentId berasal dari payment entity

---

## 15. Urutan Implementasi yang Direkomendasikan

1. update `inventory-snapshot.query.ts`
2. update `inventory-snapshot-report.dto.ts`
3. update `get-inventory-snapshot-report.ts`
4. update `credit-payment-history.query.ts`
5. update `credit-payment-history.dto.ts`
6. update `get-credit-payment-history-report.ts`
7. update `credit-outstanding.dto.ts`
8. update `get-credit-outstanding-report.ts`
9. jalankan test reporting
10. dashboard tidak boleh diimplementasikan sebagian
11. semua contract reporting harus selesai sebelum dashboard dibuat
12. baru implementasi dashboard Step 5

---

## 16. Checklist Implementasi Per File

Checklist ini ditulis agar eksekusi coding berikutnya bisa langsung berjalan file per file tanpa membuka debat scope lagi.

---

### 16.1 `src/modules/reporting/queries/inventory-snapshot.query.ts`

#### Tujuan

Menambahkan field presentasi minimum untuk Warehouse Dashboard.

#### Semua output harus memenuhi contract

- tidak boleh ada field null
- tidak boleh ada fallback identity

#### Checklist

- [ ] tambahkan select untuk `variant.sku`
- [ ] tambahkan select untuk `variant.name`
- [ ] tambahkan select untuk `variant.product.name`
- [ ] pertahankan select `variant.productId`
- [ ] pertahankan `variantId`
- [ ] pertahankan `quantity`
- [ ] pertahankan fail-fast bila relasi variant tidak ada
- [ ] pertahankan ordering deterministic by `variantId asc`
- [ ] update return type `InventorySnapshotRow`

#### Output target

```ts
export type InventorySnapshotRow = {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
};
```

---

### 16.2 `src/modules/reporting/dto/inventory-snapshot-report.dto.ts`

#### Checklist

- [ ] ubah DTO agar memuat `sku`
- [ ] ubah DTO agar memuat `productName`
- [ ] ubah DTO agar memuat `variantName`
- [ ] pastikan `variantId` tidak nullable
- [ ] pertahankan `productId`
- [ ] pertahankan `currentStockQuantity`

#### Output target

```ts
export type InventorySnapshotReportRow = {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  currentStockQuantity: number;
};
```

---

### 16.3 `src/modules/reporting/application/get-inventory-snapshot-report.ts`

#### Checklist

- [ ] map `quantity -> currentStockQuantity`
- [ ] teruskan `variantId`
- [ ] teruskan `productId`
- [ ] teruskan `sku`
- [ ] teruskan `productName`
- [ ] teruskan `variantName`
- [ ] jangan tambah rule bisnis
- [ ] jangan ubah ordering

---

### 16.4 `src/modules/reporting/queries/credit-payment-history.query.ts`

#### Tujuan

Menambahkan field event payment untuk Cash Clarity.

#### Checklist

- [ ] tambahkan select `id`
- [ ] tambahkan select `method`
- [ ] pertahankan select `amount`
- [ ] pertahankan select `paidAt`
- [ ] pertahankan select order fields yang sudah ada
- [ ] pertahankan filter range tanggal
- [ ] pertahankan filter sesuai reporting existing
- [ ] pertahankan ordering `paidAt asc`
- [ ] tambahkan secondary ordering `id asc` bila diperlukan untuk tie-breaker deterministik
- [ ] update return type `CreditPaymentHistoryRow`
- [ ] pastikan paymentId berasal dari payment entity, bukan order

#### Output target

```ts
export type CreditPaymentHistoryRow = {
  paymentId: string;
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  method: string;
};
```

---

### 16.5 `src/modules/reporting/dto/credit-payment-history.dto.ts`

#### Checklist

- [ ] tambahkan `paymentId`
- [ ] tambahkan `method`
- [ ] pertahankan `orderId`
- [ ] pertahankan `paymentDate`
- [ ] pertahankan `orderDate`
- [ ] pertahankan `orderType`
- [ ] pertahankan `totalAmount`
- [ ] pertahankan `paidAmount`
- [ ] summary tetap tidak berubah

---

### 16.6 `src/modules/reporting/application/get-credit-payment-history-report.ts`

#### Checklist

- [ ] map `id -> paymentId`
- [ ] map `method -> method`
- [ ] pertahankan mapping field lama
- [ ] pertahankan summary reduce dari `paidAmount`
- [ ] jangan tambah business rule

---

### 16.7 `src/modules/reporting/dto/credit-outstanding.dto.ts`

#### Checklist

- [ ] ubah `orderDate` menjadi `createdAt` pada DTO output
- [ ] pertahankan `orderId`
- [ ] pertahankan `orderType`
- [ ] pertahankan `totalAmount`
- [ ] pertahankan `outstandingAmount`
- [ ] summary tidak berubah
- [ ] pastikan tidak ada field orderDate di DTO final

#### Output target

```ts
export type CreditOutstandingDetailDTO = {
  orderId: string;
  createdAt: Date;
  orderType: string;
  totalAmount: number;
  outstandingAmount: number;
};
```

---

### 16.8 `src/modules/reporting/application/get-credit-outstanding-report.ts`

#### Checklist

- [ ] translasi `orderDate -> createdAt` bila query masih memakai nama lama
- [ ] pertahankan `orderId`
- [ ] pertahankan `orderType`
- [ ] pertahankan `totalAmount`
- [ ] pertahankan `outstandingAmount`
- [ ] pertahankan summary reduce existing
- [ ] jangan tambah rule bisnis

---

## 17. Checklist Validasi Setelah Perubahan Reporting

### Inventory snapshot

- [ ] compile sukses
- [ ] integration test snapshot lulus
- [ ] output memuat `variantId`, `productId`, `sku`, `productName`, `variantName`, `currentStockQuantity`
- [ ] ordering tetap deterministic
- [ ] tidak ada field null pada output

### Credit payment history

- [ ] compile sukses
- [ ] integration test payment history lulus
- [ ] output memuat `paymentId`
- [ ] output memuat `method`
- [ ] summary tetap konsisten dengan detail
- [ ] ordering tetap deterministic
- [ ] tidak ada field null pada output

### Credit outstanding

- [ ] compile sukses
- [ ] integration test outstanding lulus
- [ ] output memakai `createdAt` atau translasi eksplisit yang stabil
- [ ] summary tetap konsisten dengan detail
- [ ] tidak ada field null pada output

---

## 18. Trigger untuk Mulai Dashboard Coding

Dashboard Step 5 baru boleh dimulai jika seluruh kondisi ini terpenuhi:

- [ ] inventory snapshot reporting sudah lengkap
- [ ] payment history reporting sudah lengkap
- [ ] outstanding reporting sudah selaras
- [ ] test reporting hijau
- [ ] tidak ada fallback identity
- [ ] semua contract field tersedia dan non-null

---

## 19. Status: REFERENCE DOCUMENT (POST IMPLEMENTATION)

Dokumen ini hanya mencakup Dashboard Logic (Step 5.1–5.3).

Dashboard Presentation (Step 5.5) menggunakan output dari dokumen ini
dan tidak boleh menambah, mengubah, atau menginterpretasi ulang data.
