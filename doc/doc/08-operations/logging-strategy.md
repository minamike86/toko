# Logging Strategy – MVP Step 2

## Status

Draft – MVP Step 2

---

## Tujuan Dokumen

Dokumen ini mendefinisikan **strategi logging operasional** pada MVP Step 2.

Tujuan logging pada tahap ini adalah:

* Memungkinkan investigasi kejadian sistem
* Mendukung audit dan tracing error
* Memberikan konteks saat terjadi kegagalan operasional

Logging pada Step 2 **bukan** bertujuan untuk analytics, monitoring performa lanjutan, atau business intelligence.

---

## Prinsip Utama

1. **Logging adalah alat operasional, bukan fitur bisnis**
   Logging tidak boleh memengaruhi hasil use case.

2. **Log harus dapat dibaca manusia**
   Log digunakan saat kondisi tidak normal, bukan saat sistem ideal.

3. **Sedikit tapi bermakna**
   Lebih baik sedikit log yang konsisten daripada banyak log yang tidak bisa ditelusuri.

4. **Kegagalan logging tidak boleh merusak bisnis**
   Sistem tidak boleh gagal hanya karena mekanisme logging bermasalah.

---

## Ruang Lingkup Logging

Pada MVP Step 2, logging difokuskan pada:

* Eksekusi use case
* Kegagalan operasional
* Perubahan state penting (status order, perubahan stok)

Logging **tidak mencakup**:

* clickstream UI
* analytics pengguna
* metrik performa detail

---

## Event yang Wajib Dilog

Minimal event berikut **wajib** memiliki log:

1. **Use Case Started**

   * Nama use case
   * Actor ID
   * Correlation ID

2. **Use Case Succeeded**

   * Nama use case
   * Entity utama (misalnya Order ID)
   * Correlation ID

3. **Use Case Failed**

   * Nama use case
   * Jenis error
   * Entity terkait (jika ada)
   * Correlation ID

4. **Authorization Failure**

   * Actor ID
   * Use case
   * Role

---

## Struktur Log (Konseptual)

Setiap log entry minimal memuat:

* timestamp
* level (info, warn, error)
* message singkat
* context terstruktur

Context minimal:

* useCase
* actorId (jika ada)
* entityId (jika relevan)
* correlationId

Struktur ini bersifat konseptual dan tidak mengikat format teknis tertentu.

---

## Correlation ID

Correlation ID digunakan untuk:

* Mengaitkan beberapa log dalam satu alur
* Melacak satu kejadian lintas layer

Aturan:

* Correlation ID dibuat di boundary awal (request / job)
* Diteruskan ke seluruh layer
* Tidak dihasilkan ulang di tengah proses

---

## Hubungan dengan Error Handling

* Setiap error kategori `Invariant`, `Conflict`, dan `Forbidden` **wajib** dilog
* Error `Validation` boleh dilog dengan level lebih rendah
* Log error tidak menggantikan mekanisme error handling

---

## Hubungan dengan Audit Trail

* Logging **bukan** audit trail
* Audit trail bersifat persisten dan terstruktur
* Logging bersifat operasional dan temporal

Keduanya saling melengkapi, bukan saling menggantikan.

---

## Testing Guidelines

* Logging tidak diuji melalui unit test domain
* Logging boleh diverifikasi melalui:

  * application test
  * integration test bernilai tinggi

---

## Dampak terhadap MVP Step 1

* **NON-BREAKING**
* Tidak mengubah domain atau use case Step 1
* Menambah visibilitas operasional

---

## Yang Sengaja Tidak Ditangani

Dokumen ini **tidak** mencakup:

* Pemilihan tool logging
* Centralized logging system
* Alerting dan monitoring

Keputusan tersebut ditunda ke fase berikutnya.

---

## Catatan Penutup

Logging yang baik tidak membuat sistem ramai.

Ia membuat sistem **jujur saat terjadi masalah**, dan diam saat semuanya berjalan normal.
