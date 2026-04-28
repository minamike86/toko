# Step 5.5 – Dashboard Presentation & Operational Visibility

**Status:** READY FOR IMPLEMENTATION
**Parent:** MVP Step 5 – Operational Dashboard & Cash Clarity

---

## 1. Tujuan

Menyajikan hasil Dashboard Logic (Step 5.1–5.3) menjadi tampilan operasional
yang dapat digunakan owner/admin untuk pengambilan keputusan harian.

Dashboard Presentation tidak menciptakan data baru, tidak menambah rule bisnis,
dan tidak menjadi source of truth.

---

## 2. Prinsip Utama

* UI adalah lapisan presentasi, bukan logic
* Dashboard adalah komposisi dari reporting
* Reporting adalah satu-satunya sumber kebenaran
* UI tidak boleh melakukan query langsung ke database
* UI tidak boleh menambahkan aturan bisnis baru

---

## 3. Scope

### 3.1 Screen Utama (SC1 – Owner Operational Dashboard)

#### Komponen utama

1. Summary Cards

   * totalVariants
   * lowStockCount
   * cashInTotal
   * outstandingTotal

2. Low Stock Section

   * sku
   * productName
   * variantName
   * unit
   * currentStockQuantity

3. Cash Clarity Section

   * payment events (paginated)
   * total kas masuk

4. Outstanding Section

   * daftar order outstanding
   * total outstanding

---

### 3.2 Data Source

Semua data berasal dari:

* getWarehouseDashboard()
* getCashClarityDashboard()

UI tidak boleh:

* query database
* menggunakan Prisma
* membuat query sendiri

---

### 3.3 Data Handling Rule

UI hanya boleh:

* formatting (tanggal, angka)
* mapping sederhana

UI tidak boleh:

* menghitung ulang nilai
* menentukan ulang status
* membuat agregasi baru
* mengubah makna data

---

## 4. Boundary

### 4.1 Dilarang

* Query database langsung dari UI
* Import repository / Prisma
* Menambahkan rule bisnis
* Mengubah DTO tanpa perubahan di layer bawah

### 4.2 Diizinkan

* Menggunakan DTO dari application layer
* Pagination / limit
* Formatting visual

---

## 5. State UI

Setiap section wajib memiliki:

* loading
* empty
* error

Tidak boleh ada silent failure

---

## 6. Visibility Rule

* Low stock harus langsung terlihat
* Outstanding harus langsung terlihat
* Informasi kritis tidak boleh disembunyikan

---

## 7. Performance Constraint

* Dataset besar wajib pagination
* Tidak boleh load seluruh dataset tanpa batas

---

## 8. Non-Goals

Tidak mencakup:

* chart analytics
* filter kompleks
* drill-down multi halaman
* accounting view
* forecasting
* alert system otomatis

---

## 9. Dashboard Information Architecture (ADD-ON)

### Sidebar Navigation Structure

* Dashboard
* Sales
* Inventory
* Procurement
* System

Sidebar hanya untuk navigasi, bukan logic

---

### Primary Screens

1. Dashboard Overview
2. Warehouse Dashboard
3. Cash & Credit View
4. Procurement
5. Reorder Dashboard (PLANNED)

#### Reorder Dashboard

Kategori:

* EMPTY
* CRITICAL
* NORMAL
* OVER

Constraint:

* berasal dari reporting
* UI tidak menentukan classification

Status: BLOCKED

Tidak boleh diimplementasikan sebelum:

* rule stock classification didefinisikan
* source of truth tersedia

---

### Cross-Screen Flow

* Dashboard → Warehouse
* Warehouse → Reorder
* Reorder → Procurement

Semua mutasi harus melalui use case

---

### Global Search and Filter Behavior

* Search hanya memfilter data dari API dan tidak boleh memicu query baru di luar kontrak API.
* Tidak boleh query langsung ke database
* Tidak boleh mengandung business rule

#### Clarification

Search hanya boleh bekerja terhadap data yang sudah disediakan oleh API endpoint yang spesifik.

Search tidak boleh:

* melakukan query baru ke endpoint lain
* menggabungkan data dari multiple endpoint
* melakukan cross-domain search
* membangun query logic sendiri di UI
* mengakses database secara langsung

Search bersifat:

* local filtering terhadap dataset yang sudah diambil
* atau delegasi ke API yang memang secara eksplisit menyediakan search

Jika kebutuhan search lintas domain muncul:

→ harus dianggap sebagai fitur baru  
→ wajib melalui Circle Update Fitur

---

### UI Boundary Rules (MANDATORY)

* UI hanya consume DTO dari application layer
* UI tidak boleh mengandung invariant domain
* UI tidak boleh melakukan perhitungan stok
* UI tidak boleh menentukan status bisnis
* Semua classification berasal dari reporting layer

## 9A. Minimal Layout & Operational Shell Specification (MANDATORY)

Section ini mendefinisikan struktur layout dan batasan UI shell
untuk memastikan dashboard dapat digunakan secara operasional
tanpa melanggar boundary sistem.

Section ini bersifat:

* ADDITIVE
* NON-BREAKING
* IMPLEMENTATION-GUIDING
* Tidak menambah domain, use case, atau business rule

---

### 9A.1 Tujuan

Layout minimal bertujuan untuk:

* menyediakan navigasi operasional dasar
* menempatkan dashboard sebagai entry point utama
* memastikan sistem usable secara nyata oleh owner/admin
* menjaga UI tetap sederhana dan tidak over-engineered

Layout ini tidak bertujuan untuk:

* membangun design system formal
* menambahkan global business logic
* menambahkan workflow baru
* menjadi foundation CRUD generic system

---

### 9A.2 Struktur Layout Minimum

Struktur layout yang diperbolehkan:

`[Sidebar] [Main Content]`

Opsional:

* Header / Navbar kecil (presentational only)

Tidak wajib:

* top navbar kompleks
* breadcrumb system
* global search engine lintas domain
* command palette
* multi-layout system

---

### 9A.3 `src/app/layout.tsx`

#### Tanggung Jawab

* menyediakan shell aplikasi
* merender sidebar
* menyediakan container halaman aktif

#### Input

* `children` dari App Router

#### Output

* layout dengan:
  * sidebar
  * main content

#### Larangan

Tidak boleh:

* query database
* menggunakan Prisma
* memanggil reporting secara langsung
* menjalankan business logic
* menentukan authorization rule
* menghitung badge operasional

#### Aturan Keras

Layout adalah **pure presentation container**

---

### 9A.4 Sidebar Navigation

#### Struktur Minimum

Sidebar wajib berisi:

* Dashboard
* Sales
* Inventory
* Procurement
* System

#### Tanggung Jawab

* navigasi antar halaman
* menunjukkan halaman aktif

#### Boleh

* icon
* collapse / expand
* highlight active page

#### Tidak boleh

* fetch data
* badge bisnis
* mutation
* logic role
* perubahan menu berbasis rule bisnis

#### Catatan

Jika halaman belum tersedia:

* boleh disembunyikan, atau
* ditampilkan sebagai placeholder non-interaktif

---

### 9A.5 UI Shell Customization Boundary (GLOBAL)

Berlaku untuk:

* Sidebar
* Navbar (jika ada)
* Header (jika ada)
* Layout container

---

#### 9A.5.1 Prinsip

* UI shell adalah presentational layer
* UI shell bukan decision layer
* UI shell tidak boleh menjadi source of truth
* UI shell tidak boleh mengandung business logic

---

#### 9A.5.2 Kustomisasi yang Diizinkan

Diperbolehkan:

* warna sidebar / navbar / header
* icon navigasi
* collapse / expand sidebar
* hide / show sidebar
* sticky / fixed layout
* full-width / constrained layout
* spacing, border, shadow, radius
* hover / active visual state
* responsive layout dasar
* header kecil presentational

Syarat:
→ tidak mengubah perilaku sistem

---

#### 9A.5.3 Kustomisasi yang Tidak Boleh

Tidak diperbolehkan:

* badge dinamis berbasis rule bisnis
* navigasi berbasis rule tersembunyi
* authorization logic di UI shell
* shortcut mutation (create/update/delete)
* perhitungan data operasional
* query database / Prisma
* classification bisnis baru
* global search yang bypass API contract
* notifikasi berbasis logic UI

---

#### 9A.5.4 Sidebar Clarification

Sidebar hanya:

* navigational
* presentational

Tidak boleh:

* decision layer
* data processor

---

#### 9A.5.5 Navbar / Header Clarification

Navbar / Header bersifat opsional.

Boleh:

* judul aplikasi
* nama halaman aktif
* icon statis
* tombol navigasi sederhana

Tidak boleh:

* quick action mutation
* dropdown berbasis logic bisnis
* notifikasi operasional berbasis rule
* global search lintas domain tanpa contract resmi
* summary bisnis

#### Batasan Tambahan (MANDATORY)

Navbar / Header tidak boleh menjadi entry point untuk use case mutasi.

Tidak diperbolehkan:

* tombol create / update / delete langsung
* quick action lintas modul
* shortcut yang bypass flow resmi
* trigger use case tanpa melalui halaman yang sesuai

Semua mutasi harus:

→ terjadi melalui halaman/module yang memiliki use case resmi  
→ mengikuti boundary Application Layer

Navbar / Header hanya bersifat:

* navigasi
* informasi statis
* presentational helper

---

#### 9A.5.5A Navbar Boundary Detail

Navbar bersifat opsional dan hanya berfungsi sebagai lapisan navigasi atas
yang membantu orientasi pengguna.

Navbar boleh berisi:

* judul aplikasi
* nama halaman aktif
* tombol navigasi sederhana
* icon statis
* informasi presentational yang tidak mengandung makna bisnis

Navbar tidak boleh berisi:

* badge operasional dinamis
* quick action mutation
* tombol create / update / delete lintas modul
* shortcut ke use case yang melewati flow resmi
* summary bisnis
* notifikasi berbasis rule bisnis
* search lintas domain tanpa contract resmi

Navbar tidak boleh menjadi:

* control center operasional
* decision layer
* source of truth
* tempat logic authorization

Jika navbar membutuhkan data selain route aktif dan label halaman:

→ data tersebut harus berasal dari contract application / reporting yang eksplisit  
→ dan tidak boleh ditambahkan sebagai convenience logic di UI shell

---

#### 9A.5.5B Sidebar Boundary Detail

Sidebar hanya berfungsi sebagai navigasi utama antar halaman.

Sidebar boleh berisi:

* daftar menu utama
* icon navigasi
* active state
* collapse / expand
* placeholder non-interaktif untuk halaman yang belum aktif

Sidebar tidak boleh berisi:

* badge stok rendah
* badge outstanding
* jumlah transaksi
* status bisnis hasil perhitungan
* role-based logic yang tidak dikunci di contract resmi
* action button mutasi

Sidebar tidak boleh:

* menentukan prioritas bisnis
* memfilter data
* mengubah flow use case
* menyembunyikan menu berdasarkan rule bisnis tersembunyi

Jika suatu item menu membutuhkan data operasional agar dapat tampil:

→ item tersebut bukan lagi navigasi murni  
→ harus dievaluasi sebagai perubahan fitur

---

#### 9A.5.5C Header Boundary Detail

Header bersifat opsional dan hanya boleh membantu konteks halaman aktif.

Header boleh berisi:

* nama halaman
* subtitle kecil
* breadcrumb sederhana jika murni navigational
* tombol kembali / navigasi sederhana
* icon statis
* informasi waktu / label statis

Header tidak boleh berisi:

* quick mutation action
* ringkasan bisnis lintas domain
* operational alert
* rekomendasi tindakan
* classification baru
* shortcut use case yang tidak berasal dari halaman resmi

Header tidak boleh:

* mengambil data langsung dari database
* menjalankan query tambahan di luar contract API
* menjadi tempat summary dashboard global yang dihitung ulang di UI

Jika header mulai menampilkan informasi operasional dinamis:

→ informasi tersebut wajib berasal dari DTO resmi  
→ dan tidak boleh dihitung ulang di shell

---

#### 9A.5.5D Visual Freedom Rule

Navbar, sidebar, dan header boleh dimaksimalkan pada aspek berikut:

* warna
* ukuran
* spacing
* icon
* hover / active style
* sticky / fixed behavior
* collapse / expand behavior
* responsive adaptation
* border / shadow / radius
* full-width / contained layout

Semua kebebasan visual di atas sah selama:

* tidak mengubah contract data
* tidak menambah logic bisnis
* tidak memicu side effect
* tidak memperkenalkan flow baru

---

#### 9A.5.5E Trigger for Reclassification

Perubahan pada navbar, sidebar, atau header harus dianggap sebagai
perubahan fitur — bukan sekadar customization UI — jika mulai menyentuh
salah satu kondisi berikut:

* membutuhkan DTO baru
* membutuhkan rule bisnis baru
* membutuhkan query baru
* membutuhkan authorization behavior baru
* membutuhkan shortcut mutasi
* membutuhkan search lintas domain
* mengubah urutan atau visibilitas menu berdasarkan kondisi bisnis

Jika salah satu kondisi di atas terpenuhi:

→ perubahan wajib keluar dari scope customization shell  
→ dan harus melalui Circle Update Fitur

---

#### 9A.5.6 Konsekuensi

Jika UI shell mulai:

* memproses data
* menentukan status
* mempengaruhi keputusan bisnis
* mengakses data di luar contract

maka:

→ bukan lagi customization UI  
→ wajib melalui Circle Update Fitur

---

### 9A.6 `src/app/dashboard/page.tsx`

#### Tanggung Jawab

* entry point dashboard operasional
* mengambil data dari application layer
* menyusun section dashboard

#### Section Minimum

* Summary Cards
* Low Stock
* Cash Clarity
* Outstanding

#### Input

* `getWarehouseDashboard()`
* `getCashClarityDashboard()`

#### Larangan

Tidak boleh:

* query database
* menggunakan Prisma
* menghitung ulang nilai
* menentukan status baru
* membuat derived state lintas domain

---

### 9A.7 Operational Visibility Enhancement (ALLOWED)

Boleh:

* hierarchy visual
* grouping
* layout
* readability

Tidak boleh:

* rule baru
* classification baru
* agregasi baru
* insight otomatis

---

### 9A.8 State Management

Wajib:

* loading
* empty
* error

Tidak boleh ada silent failure

---

### 9A.9 Styling Constraint

Boleh:

* sederhana
* flex/grid
* fokus ke kejelasan

Tidak boleh:

* design system baru
* theme engine
* kompleksitas tidak perlu
* perubahan perilaku sistem

---

### 9A.10 CRUD Clarification (MANDATORY)

Layout tidak mengizinkan CRUD otomatis.

CRUD hanya boleh jika:

* domain ada
* use case ada
* roadmap aktif

---

### 9A.11 Definition of Layout Completion

Layout selesai jika:

* shell tersedia
* sidebar tersedia
* dashboard dalam shell
* tidak ada business logic di UI
* tidak ada query DB
* semua state tersedia
* tidak melanggar boundary

Jika tidak:

→ implementasi tidak valid

---

## 10. Definition of Done

* Dashboard tersedia
* Data sesuai reporting
* Tidak ada query DB di UI
* Tidak ada business rule di UI
* UI hanya menggunakan application layer
* Test tetap hijau

---

## 11. Implementation Scope

### Module Structure

src/modules/dashboard/

---

### UI Structure

app/dashboard/page.tsx
components/dashboard/*

---

### Data Flow

UI → Application → Reporting → Database

---

### API / Route

* Route hanya memanggil application layer
* Tidak boleh ada logic tambahan

---

### Pagination

* Payment events wajib paginated
* Tidak boleh load semua data

---

### Error Handling

* Error dari application layer diteruskan ke UI
* UI hanya menampilkan

---

### Formatting Rule

UI hanya boleh:

* format tanggal
* format angka
* grouping visual

UI tidak boleh:

* mengubah nilai
* mengubah status

---

## 12. Data Contract Usage

### Warehouse Dashboard

* variantId
* sku
* productName
* variantName
* unit
* currentStockQuantity
* isLowStock

### Cash Clarity

* paymentId
* paymentDate
* amount
* method
* orderId

### Outstanding

* orderId
* createdAt
* totalAmount
* outstandingAmount

---

## 13. Cross Data Constraint

UI tidak boleh:

* menggabungkan DTO untuk makna baru
* membuat derived state lintas domain
* membuat relasi baru

---

## 14. Inventory Listing UI (Implementation Addendum)

### Tujuan

Menampilkan inventory read-only

### Scope

* halaman `/inventory`
* tabel variant + stock

### Boundary

* read-only
* dari reporting
* tanpa Prisma

### Data Flow

`/inventory` → API → application → reporting → database

### File Structure

```
src/app/inventory/page.tsx
src/app/inventory/loading.tsx
src/app/inventory/error.tsx
src/app/inventory/_components/InventoryTable.tsx
src/app/api/reporting/inventory/route.ts
```
