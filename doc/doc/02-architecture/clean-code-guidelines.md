# Clean Code Guidelines

Dokumen ini mendefinisikan pedoman penulisan kode (*clean code*) yang wajib diikuti dalam Sistem Jual Beli Terpadu. Tujuannya adalah menjaga konsistensi, keterbacaan, dan keberlanjutan kode seiring pertumbuhan sistem.

Pedoman ini berlaku untuk seluruh layer: domain, application, infrastructure, dan UI. Aturan di bawah ini **mengikat** dan tidak bergantung pada preferensi pribadi.

---

## Prinsip Umum

1. **Kode dibaca lebih sering daripada ditulis**
   Kejelasan lebih penting daripada kepintaran.

2. **Aturan bisnis harus mudah ditemukan**
   Jika aturan bisnis tersembunyi di util, controller, atau ORM, itu desain yang salah.

3. **Nama lebih penting daripada komentar**
   Kode yang baik menjelaskan dirinya sendiri.

---

## Penamaan (Naming)

* Gunakan nama yang mencerminkan **niat bisnis**, bukan detail teknis
* Hindari singkatan yang tidak jelas

Contoh baik:

* `CreateOrder`
* `markAsPaid()`
* `outstandingAmount`

Contoh buruk:

* `process()`
* `handle()`
* `doStuff()`

---

## Aturan untuk Domain Layer

* Entity harus menjaga invariants-nya sendiri
* Method domain harus mencerminkan bahasa bisnis
* Hindari setter generik (`setStatus`, `setPrice`)

Contoh:

* `order.markAsPaid()`
* `order.markAsCredit()`

Larangan:

* Import Prisma
* Import Next.js
* Logic validasi berat di UI

---

## Aturan untuk Application Layer

* Satu file = satu use case
* Use case harus eksplisit (CreateOrder, CancelOrder)
* Tidak ada logic UI atau database

Application layer boleh:

* Mengorkestrasi beberapa domain
* Menentukan urutan eksekusi

Application layer tidak boleh:

* Menyimpan aturan bisnis inti
* Melakukan query SQL langsung

---

## Aturan untuk Infrastructure Layer

* Infrastructure hanya mengimplementasikan kontrak
* Mapping entity ↔ database harus eksplisit
* Tidak boleh menyimpan aturan bisnis

Jika terdapat logika kompleks di repository, itu pertanda boundary dilanggar.

---

## Error Handling

* Gunakan error yang bermakna secara bisnis
* Hindari melempar string

Contoh:

* `InsufficientStockError`
* `OrderAlreadyCanceledError`

Error harus berasal dari domain atau application layer, bukan dari UI.

---

## Testing Guidelines

* Test fokus pada use case
* Gunakan mock repository
* Satu test menjelaskan satu skenario bisnis

Hindari:

* Test yang bergantung pada database
* Test yang menguji detail implementasi

---

## Komentar

* Komentar digunakan untuk *kenapa*, bukan *apa*
* Jika butuh komentar untuk menjelaskan *apa*, perbaiki nama variabel atau method

---

## Refactoring

* Refactor dilakukan untuk memperjelas niat, bukan sekadar merapikan
* Setiap refactor besar harus menjaga seluruh test tetap lulus

---

## Catatan Penutup

Pedoman ini dibuat untuk melindungi kualitas sistem jangka panjang. Jika muncul dilema antara kecepatan dan kejelasan, pilih kejelasan. Sistem yang jelas lebih mudah dipercepat daripada sistem yang membingungkan.
