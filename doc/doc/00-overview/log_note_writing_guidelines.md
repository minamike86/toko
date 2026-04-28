# Log Note Writing Guidelines

## Purpose
Dokumen ini mendefinisikan standar penulisan **log note** agar konsisten, jelas, dan dapat digunakan untuk audit, debugging, dan decision tracking.

Log note bukan design document dan bukan source of truth.
Log note adalah **jejak keputusan dan kejadian sistem**.

---

## 1. Prinsip Utama

### 1.1 Clarity over Completeness
- Tulis yang penting saja
- Hindari cerita panjang
- Fokus pada fakta dan keputusan

### 1.2 No Ambiguity
- Hindari kalimat yang bisa ditafsirkan ganda
- Gunakan istilah teknis yang spesifik

### 1.3 Immutable Meaning
- Log tidak boleh diubah maknanya setelah ditulis
- Koreksi dilakukan dengan entry baru, bukan edit lama

### 1.4 Not a Design Document
- Jangan menjelaskan sistem secara umum
- Hanya catat kejadian / keputusan spesifik

---

## 2. Jenis Log

Setiap log HARUS memiliki type:

### 2.1 INCIDENT LOG
Untuk bug, error, atau ketidaksesuaian sistem

### 2.2 DESIGN DECISION LOG
Untuk keputusan arsitektur atau domain

### 2.3 GOVERNANCE LOG
Untuk lock, policy, atau aturan sistem

---

## 3. Struktur Wajib

Setiap log minimal harus memiliki:

### Header
- Type
- Status

### Context
- Apa yang terjadi
- Di mana terjadi

### Detail / Root Cause
- Fakta teknis
- Penyebab

### Analysis
- Kenapa ini terjadi
- Kenapa ini masalah (atau tidak)

### Decision / Action
- Apa yang diputuskan
- Apa yang dilakukan

### Constraint
- Apa yang tidak boleh dilakukan

### Conclusion
- Ringkasan akhir

---

## 4. Format Penulisan

Gunakan format konsisten:

- Bullet point untuk daftar
- Short paragraph
- Hindari nested paragraph panjang

Contoh:

Context:
Masalah terjadi pada AdjustStock test

Root Cause:
- method tidak ada di domain
- mismatch contract

Decision:
- test di-skip

---

## 5. Aturan Bahasa

- Gunakan bahasa langsung (tidak bertele-tele)
- Hindari kata seperti:
  - mungkin
  - sepertinya
  - kemungkinan

Ganti dengan:
- fakta
- kondisi
- keputusan

---

## 6. Referencing Rules

Jika log terkait dokumen lain:

- sebutkan nama file
- jangan duplikasi isi dokumen

Contoh:
- phase_2_2_stock_origin_design_revised.md

---

## 7. Larangan (Anti-Pattern)

Jangan:

- mencampur log dengan design doc
- menulis opini tanpa fakta
- menulis ulang dokumentasi existing
- menambahkan solusi yang belum diputuskan

---

## 8. Konsistensi Antar Step

Untuk setiap Step:

- gunakan format yang sama
- gunakan istilah yang sama
- jangan mengubah gaya penulisan

---

## 9. Evolusi Log

Jika ada perubahan:

- jangan edit log lama
- tambahkan log baru
- referensikan log sebelumnya

---

## 10. Tujuan Akhir

Log note harus bisa:

- menjawab “kenapa keputusan ini diambil”
- menjelaskan “apa yang terjadi”
- mencegah investigasi ulang

Jika seseorang membaca log:

→ dia tidak perlu bertanya ulang

---

# 11. Canonical Templates (WAJIB DIGUNAKAN)

Semua penulisan log HARUS menggunakan salah satu template berikut.

---

## 11.1 INCIDENT LOG TEMPLATE

```
## INCIDENT LOG — <Judul Singkat>

Type: INCIDENT LOG  
Status: <OPEN / RESOLVED / DEFERRED>

### Context  
<Di mana masalah terjadi>

### Detail  
- <Fakta teknis>

### Root Cause  
<Penyebab utama>

### Analysis  
<Penjelasan kenapa ini terjadi>

### Constraints  
- <Batasan teknis>

### Identified Options  
1. <Opsi>

### Decision / Action  
<Aksi yang diambil>

### Impact  
- <Dampak>

### Conclusion  
<Ringkasan>
```

---

## 11.2 DESIGN DECISION LOG TEMPLATE

```
## DECISION LOG — <Nama Keputusan>

Type: DESIGN DECISION LOG  
Status: <ACTIVE / COMPLETED>

### Context  
<Kenapa perlu keputusan>

### Problem  
<Masalah>

### Constraints  
- <Constraint>

### Options Considered  
1. <Opsi>

### Decision  
<Keputusan>

### Rationale  
- <Alasan>

### Trade-offs  
- <Konsekuensi>

### Consequences  
- <Dampak>

### Constraints Moving Forward  
- <Batasan lanjutan>

### Reference  
- <Dokumen terkait>
```

---

## 11.3 GOVERNANCE LOG TEMPLATE

```
## GOVERNANCE LOG — <Nama>

Type: GOVERNANCE LOG  
Status: <LOCKED / ACTIVE>

### Context  
<Kapan dan kenapa dibuat>

### Scope  
<Cakupan>

### Locked Rules  
- <Rule>

### Allowed Changes  
- <Proses perubahan>

### Technical Constraints  
- <Constraint>

### Impact  
- <Dampak>

### Conclusion  
<Ringkasan>
```

---

## 11.4 STEP LOG TEMPLATE

```
## STEP X.X — <Nama Step>

Type: DESIGN DECISION LOG  
Status: <COMPLETED / IN PROGRESS>

### Context  
<Tujuan step>

### Key Decisions  
- <Keputusan>

### Implementation Decisions  
- <Teknis>

### Rationale  
- <Alasan>

### Trade-offs  
- <Konsekuensi>

### Consequences  
- <Dampak>

### Constraints (Critical)  
- <Batasan>

### Notes  
- <Catatan>

### Conclusion  
<Ringkasan>
```

---

## 11.5 QUICK LOG TEMPLATE

```
## LOG — <Judul>

Type: <INCIDENT / DECISION / GOVERNANCE>  
Status: <OPEN / DONE>

Context:
<ringkas>

Problem:
<ringkas>

Decision:
<ringkas>

Impact:
<ringkas>
```

---

## Final Note

Template di atas bersifat **canonical**.

- Tidak boleh diubah tanpa update guideline
- Harus digunakan oleh AI maupun manusia

Log yang baik:
- singkat
- jelas
- tidak ambigu
- dapat diaudit

