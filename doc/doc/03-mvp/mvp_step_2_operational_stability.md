# MVP Step 2 – Operational Stability

## Status
Draft – siap dikunci setelah disetujui

---

## Pernyataan Penguncian

Dokumen ini mendefinisikan **MVP Step 2 – Operational Stability** untuk Sistem Jual Beli Terpadu.

Ketentuan keras:
- **MVP Step 1 telah selesai dan dikunci secara resmi**.
- Seluruh domain, boundary, kontrak, dan perilaku bisnis pada Step 1 **TIDAK BOLEH diubah**.
- Step 2 bersifat **additive dan operasional**, bukan redefinisi model bisnis.
- Setiap perubahan yang berpotensi mengubah kontrak Step 1 dianggap **BREAKING** dan **tidak diizinkan** pada fase ini.

Dokumen ini adalah **pagar fase**. Implementasi apa pun yang bertentangan dengan dokumen ini dianggap keluar dari scope Step 2.

---

## Tujuan Step 2

Step 2 bertujuan menjadikan sistem **aman digunakan secara operasional harian** tanpa merusak fondasi bisnis yang telah divalidasi pada Step 1.

Yang dimaksud "aman secara operasional":
- Kesalahan dapat ditelusuri dan dijelaskan
- Aktivitas penting memiliki jejak audit
- Data penting tidak hilang tanpa konteks
- Akses pengguna dibatasi secara sadar

Step 2 **tidak** bertujuan menambah kompleksitas bisnis baru.

---

## Prinsip Utama

1. **Step 1 adalah kebenaran bisnis**  
   Semua aturan bisnis inti tetap berada di domain Step 1.

2. **Step 2 adalah stabilisator operasional**  
   Fokus pada validasi, error handling, audit, logging, dan kontrol akses.

3. **Tidak ada logika bisnis baru yang tersembunyi**  
   Perilaku baru wajib ditulis sebagai dokumen use case atau policy.

4. **Dokumen mendahului kode**  
   Implementasi tanpa dokumen pada Step 2 dianggap pelanggaran disiplin.

---

## Ruang Lingkup (Scope)

### 1. Validasi dan Error Handling Konsisten

Step 2 memperkenalkan standar error handling lintas sistem:
- Klasifikasi error yang jelas (validation, forbidden, conflict, not found, invariant)
- Error bermakna bisnis, bukan error teknis mentah
- Tidak ada `throw Error` generik di application flow

Catatan penting:
- Aturan domain Step 1 **tidak berubah**
- Step 2 hanya memperjelas cara sistem **menolak kondisi tidak valid**

Dokumen turunan:
- `error-handling-guidelines.md`

---

### 2. Logging Operasional

Step 2 mewajibkan logging operasional minimal untuk seluruh use case inti.

Tujuan logging:
- Tracing kejadian
- Investigasi error
- Audit aktivitas sistem

Logging **bukan**:
- analytics
- reporting
- pengganti database

Dokumen turunan:
- `logging-strategy.md`

---

### 3. Audit Trail dan Soft Delete

Step 2 memastikan bahwa:
- Data penting tidak hilang tanpa jejak
- Aktivitas korektif dapat diaudit

Batasan keras:
- Domain entity Step 1 **tidak boleh diubah kontraknya**
- Entity yang bersifat immutable (misalnya stock movement) **tidak boleh dihapus**

Audit trail dan soft delete ditempatkan sebagai **mekanisme operasional**, bukan logika bisnis inti.

Dokumen turunan:
- `audit-trail-policy.md`

---

### 4. Role dan Authorization Dasar

Step 2 memperkenalkan pemisahan peran dasar:
- **Admin**
- **Kasir**

Prinsip penting:
- Domain Step 1 **tidak mengetahui role**
- Authorization dilakukan di boundary (UI / application)

Tujuan:
- Mencegah operasi sensitif dilakukan tanpa konteks
- Menjaga jejak tanggung jawab

Dokumen turunan:
- `authorization-boundary.md`

---

### 5. Use Case Baru: Pay Credit

Step 2 menambahkan satu use case bisnis baru:

**Pay Credit**
- Menyelesaikan order dengan status `ON_CREDIT`
- Mengubah status menjadi `PAID`
- Tidak memengaruhi Inventory

Batasan:
- Tidak ada cicilan
- Tidak ada jatuh tempo
- Tidak ada accounting / AR detail

Use case ini bersifat **additive** dan **NON-BREAKING** terhadap Step 1.

Dokumen turunan:
- `pay-credit.md`

---

## Yang Secara Sadar Tidak Termasuk

Step 2 **tidak mencakup**:
- Promo, diskon, pajak
- Multi-gudang
- Reporting lanjutan
- Accounting / AR domain
- Integrasi eksternal enterprise

Fitur-fitur tersebut ditunda secara sadar ke fase berikutnya.

---

## Boundary dan Domain Tambahan

Step 2 **boleh** memperkenalkan modul/domain baru yang bersifat operasional, selama:
- Tidak mengubah domain Step 1
- Tidak mengubah kontrak use case Step 1

Contoh domain/modul yang diizinkan:
- Identity / Authorization (operasional)
- Audit / Operations

Memasukkan audit metadata langsung ke entity domain Step 1 dianggap **BREAKING**.

---

## Testing dan Validasi

Pada Step 2:
- Seluruh test Step 1 **harus tetap hijau** tanpa perubahan
- Test tambahan fokus pada:
  - error handling
  - authorization
  - use case Pay Credit

Integration test tetap mengikuti kebijakan yang sudah ditetapkan sebelumnya.

---

## Definition of Done (DoD)

MVP Step 2 dianggap selesai jika:
1. Seluruh perilaku Step 1 berjalan tanpa perubahan kontrak
2. Error handling konsisten dan dapat diklasifikasikan
3. Logging operasional tersedia untuk use case inti
4. Audit trail dan soft delete berjalan tanpa merusak domain Step 1
5. Role Admin vs Kasir diterapkan di boundary
6. Use case Pay Credit tersedia dan teruji

---

## Catatan Penutup

Step 2 adalah fase disiplin operasional.

Jika Step 1 membuktikan bahwa sistem **benar secara bisnis**, maka Step 2 membuktikan bahwa sistem **layak dipakai manusia setiap hari**.

Tidak ada alasan untuk terburu-buru. Sistem yang stabil tumbuh lebih cepat daripada sistem yang sering ditambal.
