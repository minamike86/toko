# Credit Payment History Report – MVP Step 3

**Status:** DESIGN FINAL – READY TO LOCK  
**Scope:** Internal Reporting (Read-Only)  
**MVP Phase:** Step 3 – Reporting

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan desain **Credit Payment History Report** sebagai bagian dari **MVP Step 3 – Reporting**.

Laporan ini bertujuan memberikan visibilitas operasional mengenai:

> *Riwayat penyelesaian pembayaran hutang (credit) yang telah dilakukan melalui use case **Pay Credit**.*

Dokumen ini **tidak membuka kembali** kontrak domain maupun use case pada:
- MVP Step 1 – Core Transaction
- MVP Step 2 – Operational Stability

---

## 2. Posisi Credit Payment History Report dalam Sistem

Credit Payment History Report adalah:

- **Internal Reporting**
- **Read-only & observasional**
- **Berbasis histori kejadian**
- **Tanpa mutasi data**

Laporan ini **BUKAN**:
- laporan piutang (outstanding)
- laporan akuntansi
- laporan rekonsiliasi fiskal

Jika suatu kebutuhan memerlukan:
- period locking
- bukti pembayaran formal
- pencatatan jurnal keuangan

maka kebutuhan tersebut **BUKAN scope MVP Step 3**.

---

## 3. Definisi Bisnis Credit Payment History (Final)

### 3.1 Apa yang Dicatat dalam Laporan

Satu entri pada Credit Payment History Report merepresentasikan:

> **Satu kejadian pelunasan order ON_CREDIT melalui use case Pay Credit.**

Artinya:
- Order yang **tidak pernah ON_CREDIT** tidak muncul
- Order ON_CREDIT yang **belum dilunasi** tidak muncul
- Order yang dilunasi **muncul tepat satu kali**

---

### 3.2 Sumber Fakta

Laporan ini membaca fakta dari:

- perubahan status order dari `ON_CREDIT` → `PAID`
- timestamp penyelesaian pembayaran (paidAt / updatedAt, sesuai data yang tersedia)

Tidak ada logika inferensi tambahan.

---

## 4. Struktur Data Laporan

### 4.1 Baris Detail (Per Pelunasan)

Setiap baris detail merepresentasikan **satu kejadian Pay Credit**.

Field wajib:

- `orderId`
- `paymentDate` (timestamp saat status berubah menjadi PAID)
- `orderDate` (createdAt)
- `orderType` (string: ONLINE | OFFLINE)
- `totalAmount`
- `paidAmount` (selalu sama dengan totalAmount)

Catatan desain:
- Tidak ada customer
- Tidak ada metode pembayaran
- Tidak ada pembayaran parsial
- Semua field bertipe primitif

---

### 4.2 Baris Summary (Agregat)

Selain daftar detail, laporan **SELALU** menyertakan **1 baris summary**.

Isi summary:

- `totalPaidAmount` → SUM(paidAmount)
- `totalPaidOrders` → COUNT(orderId)

Summary:
- dihitung dari dataset yang sama
- mengikuti filter tanggal yang sama
- tidak disimpan secara persisten

---

## 5. Filter dan Ruang Lingkup Query

### 5.1 Filter yang Didukung

Credit Payment History Report mendukung filter:

- **Tanggal Pembayaran (paymentDate)**
  - from (inclusive)
  - to (inclusive)

Filter ini:
- bersifat query-time
- **BUKAN** period locking

---

### 5.2 Hal yang Secara Sadar Tidak Ada

- filter berdasarkan customer
- filter berdasarkan metode pembayaran
- periode akuntansi

Jika data histori berubah (misalnya order dibatalkan setelah PAID), laporan periode lama **boleh berubah**.

---

## 6. Arsitektur & Boundary Reporting

### 6.1 Posisi Modul

Credit Payment History Report berada di:

```
src/modules/reporting/
```

Struktur modul:

```
reporting/
  application/
  queries/
  dto/
```

---

### 6.2 Aturan Dependency (Mengikat)

Reporting **DILARANG**:
- mengimpor domain Sales
- mengimpor application use case Pay Credit
- mengimpor enum atau entity domain

Reporting **BOLEH**:
- membaca data order
- menggunakan query langsung atau database view

---

## 7. Dampak terhadap MVP Sebelumnya

Desain Credit Payment History Report:

- **NON-BREAKING** terhadap MVP Step 1
- **NON-BREAKING** terhadap MVP Step 2
- Tidak mengubah use case Pay Credit
- Tidak menambah aturan bisnis baru

---

## 8. Definition of Done (Desain)

Credit Payment History Report dianggap **selesai secara desain** jika:

1. Setiap pelunasan muncul tepat satu kali
2. Tidak ada order non-credit yang masuk
3. Summary konsisten dengan detail
4. Tidak ada klaim finalitas fiskal
5. Seluruh prinsip reporting Step 3 dipatuhi

---

## 9. Catatan Penutup

Credit Payment History Report berfungsi sebagai:

- bukti operasional bahwa hutang telah diselesaikan
- alat audit internal
- pendamping Credit Outstanding Report

Laporan ini **melengkapi**, bukan menggantikan, laporan outstanding.

Ia sengaja sederhana agar:
- mudah diverifikasi
- tidak bocor ke accounting
- tetap jujur terhadap fakta sistem.

