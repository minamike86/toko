# Auto Update Workflow

### Status
OPERATIONAL WORKFLOW — CONSISTENCY ENFORCEMENT

---

## Tujuan

Workflow ini dibuat agar:

- `traceability_index.md` tetap konsisten sebagai dokumen struktur
- `execution_status.md` tetap konsisten sebagai dokumen status
- AI / developer tidak mengubah status secara acak
- setiap perubahan fitur, step, atau batch menghasilkan update dokumentasi yang deterministik

Workflow ini **tidak menggantikan** ADR, domain doc, use case, atau log note.

---

## Scope Dokumen

Workflow ini berlaku untuk:

- penambahan fitur baru
- update batch / step MVP
- implementasi use case baru
- perubahan status implementasi
- penutupan step / batch

Workflow ini **tidak** dipakai untuk:

- typo kecil
- rename non-konseptual
- perubahan format tanpa dampak artefak

---

# 1. Pembagian Tanggung Jawab Dokumen

## 1.1 traceability_index.md

Dokumen ini hanya boleh berisi:

- daftar overview documents
- daftar architecture documents
- daftar domain documents
- daftar use case documents
- daftar ADR
- codebase mapping
- critical file tracking
- use case traceability mapping

Dokumen ini **tidak boleh** berisi:

- status step
- status module
- missing artifacts
- keputusan COMPLETE / INCOMPLETE / INVALID

---

## 1.2 execution_status.md

Dokumen ini hanya boleh berisi:

- step status
- step ↔ module mapping
- use case coverage status
- module health
- missing artifacts
- enforcement rule
- audit trigger
- final decision rule

Dokumen ini **tidak boleh** menjadi daftar file mentah.

---

# 2. Single Source Rule

Semua status WAJIB diturunkan dari tiga sumber inti berikut:

1. **Use Case Coverage Table**
2. **Module Health**
3. **Step Status**

Konsekuensinya:

- `Missing Artifacts` tidak boleh ditulis manual tanpa basis
- `COMPLETE / INCOMPLETE / INVALID` tidak boleh ditentukan di luar 3 sumber di atas
- `traceability_index.md` tidak boleh punya status independen

---

# 3. Trigger Update

Workflow ini dijalankan setiap kali terjadi salah satu kondisi berikut:

## 3.1 Setelah ADR baru dibuat

Wajib cek:

- domain doc yang terdampak
- use case yang terdampak
- code path yang terdampak
- step / batch yang terdampak

Update yang wajib:

- `traceability_index.md` → tambah ADR jika belum tercatat
- `execution_status.md` → tandai step terkait sebagai `IN PROGRESS` jika sebelumnya belum aktif

---

## 3.2 Setelah dokumen domain atau use case dibuat / diupdate

Wajib cek:

- apakah use case coverage berubah
- apakah step status terdampak

Update yang wajib:

- `traceability_index.md` → tambahkan mapping doc baru
- `execution_status.md` → update kolom `Doc` / `Domain Update`

---

## 3.3 Setelah implementasi kode selesai

Wajib cek:

- apakah file code utama benar-benar ada
- apakah file tersebut masuk module yang benar
- apakah perlu ditambahkan ke critical file tracking

Update yang wajib:

- `traceability_index.md` → update mapping doc ↔ code ↔ test
- `execution_status.md` → update kolom `Code` / `Implementation`

---

## 3.4 Setelah test selesai / bertambah

Wajib cek:

- apakah use case sudah punya test
- apakah integration test sudah ada jika required
- apakah module health berubah

Update yang wajib:

- `traceability_index.md` → update mapping test jika perlu
- `execution_status.md` → update kolom `Test` dan `Module Health`

---

## 3.5 Sebelum log note / closure note dibuat

Wajib cek seluruh syarat completion:

- ADR
- domain update
- use case
- implementation
- test
- log note

Jika ada yang belum lengkap:

- log note penutupan **tidak boleh** dibuat
- step status harus tetap `INCOMPLETE` atau `INVALID`

---

# 4. Update Order (WAJIB)

Setiap review AI / developer harus mengikuti urutan ini:

1. identifikasi step / batch / fitur
2. identifikasi ADR terkait
3. identifikasi domain doc terkait
4. identifikasi use case terkait
5. identifikasi implementation file terkait
6. identifikasi test terkait
7. update `traceability_index.md`
8. baru update `execution_status.md`
9. simpulkan status

Aturan keras:

- jangan update `execution_status.md` lebih dulu
- jangan menulis status sebelum mapping artefak benar

---

# 5. Auto Update Rules per Dokumen

## 5.1 Rules untuk traceability_index.md

### Tambah data jika:

- ada dokumen baru yang sah
- ada file implementasi utama baru
- ada use case baru
- ada ADR baru
- ada module / critical file baru

### Jangan ubah jika:

- hanya status yang berubah
- hanya progress implementasi yang berubah
- hanya hasil test yang berubah

### Formula praktis

`traceability_index.md` berubah jika struktur artefak berubah.

---

## 5.2 Rules untuk execution_status.md

### Tambah / ubah data jika:

- progress berubah
- status artefak berubah
- module health berubah
- missing artifacts berubah
- keputusan complete / incomplete berubah

### Jangan ubah jika:

- hanya ada rename file yang belum final
- hanya ada perpindahan posisi list tanpa dampak status

### Formula praktis

`execution_status.md` berubah jika kesiapan eksekusi berubah.

---

# 6. Status Derivation Rules

## 6.1 Use Case Coverage

Setiap use case minimal harus memiliki:

- Doc
- Code
- Test

Status ditentukan sebagai berikut:

- **COMPLETE** → Doc ✅ Code ✅ Test ✅
- **INCOMPLETE** → salah satu ⚠️
- **INVALID** → ada mismatch struktural atau artefak wajib hilang

---

## 6.2 Module Health

Setiap module minimal dicek pada:

- Domain
n- Use Case
- Repository / Infrastructure
- Integration Test
- Wiring / Container (jika relevan)

Status ditentukan sebagai berikut:

- **VERIFIED** → semua komponen utama ✅
- **PARTIAL VERIFIED** → ada ⚠️ tapi tidak ada ❌ kritikal
- **UNKNOWN** → mayoritas belum diverifikasi
- **INVALID** → ada missing kritikal

---

## 6.3 Step Status

Setiap step minimal dicek pada:

- ADR
- Domain Update
- Use Case
- Implementation
- Test
- Log Note

Status ditentukan sebagai berikut:

- **COMPLETE** → semua ✅
- **INCOMPLETE** → ada ⚠️ atau ❌ non-fatal
- **INVALID** → urutan dilanggar atau artefak wajib hilang

---

# 7. Missing Artifact Generation Rule

Section `Missing Artifacts` harus diturunkan dari:

- use case coverage yang belum complete
- module health yang belum verified
- step status yang belum complete

Format wajib:

```md
## Step X Missing Artifacts

- <artifact> → ❌
- <artifact> → ⚠️
```

Aturan:

- missing artifact wajib ditempel ke step atau module yang jelas
- tidak boleh ada list global tanpa konteks

---

# 8. Audit Trigger

Audit wajib dijalankan saat:

- ADR selesai dibuat
- batch implementasi selesai
- sebelum merge besar
- sebelum membuat closure note
- sebelum menyatakan step selesai

---

# 9. Enforcement Rule

Jika ditemukan salah satu kondisi berikut:

- use case `INVALID`
- step `INVALID`
- missing artifact kritikal
- domain doc belum ada tapi code sudah ada
- log note dibuat sebelum syarat completion terpenuhi

Maka:

- status final tidak boleh `COMPLETE`
- step berikutnya tidak boleh dianggap aktif selesai
- closure note tidak boleh dipakai sebagai bukti selesai

---

# 10. Recommended Maintenance Routine

## Setiap selesai kerja batch

1. update artefak di `traceability_index.md`
2. update coverage di `execution_status.md`
3. update module health
4. update step status
5. generate missing artifacts
6. baru simpulkan hasil

## Setiap mulai sesi baru

1. baca `execution_status.md`
2. identifikasi step aktif
3. lihat missing artifacts
4. pilih prioritas kerja dari missing artifacts tertinggi

---

# 11. Practical Prompt Pattern for AI

Gunakan pola ini saat ingin AI menjaga konsistensi:

```text
Gunakan auto update workflow.
1. Cek traceability_index.md untuk artefak struktural.
2. Cek execution_status.md untuk status aktual.
3. Jika ada artefak baru, update traceability dulu.
4. Setelah itu update execution_status.
5. Jangan menyatakan COMPLETE jika masih ada missing artifacts kritikal.
```

---

# Penutup

Workflow ini dibuat agar dokumentasi tidak menjadi arsip pasif.

Tujuan akhirnya adalah:

- struktur artefak selalu jelas
- status eksekusi selalu konsisten
- AI / developer tidak menebak
- completion decision selalu dapat diaudit

