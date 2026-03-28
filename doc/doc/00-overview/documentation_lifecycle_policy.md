# Documentation Lifecycle Policy

Status: ACTIVE  
Scope: Seluruh dokumen dalam repository

Dokumen ini mendefinisikan aturan penyimpanan, klasifikasi, dan siklus hidup dokumentasi pada sistem ini.  
Tujuannya adalah menjaga repository tetap bersih, relevan, dan tidak menjadi arsip percakapan.

Dokumen ini berlaku untuk seluruh folder `/docs` serta file strategis seperti `README.md` dan `Implementation Lock Notes.md`.

---

## 1. Prinsip Umum

1. Repository menyimpan **kebenaran sistem**, bukan seluruh proses berpikir.
2. Tidak semua hasil diskusi atau percakapan harus menjadi dokumen permanen.
3. Dokumen yang disimpan harus memiliki nilai jangka panjang.
4. Setiap dokumen harus memiliki peran yang jelas.
5. Tidak boleh ada duplikasi tanggung jawab antar dokumen.

Jika sebuah dokumen tidak memiliki fungsi arsitektural atau operasional yang jelas, maka dokumen tersebut tidak boleh disimpan.

---

## 2. Klasifikasi Dokumentasi

Seluruh dokumentasi dikategorikan ke dalam tiga kelas berikut.

### 2.1 Canonical Documents (Wajib Disimpan)

Dokumen kategori ini bersifat mengikat dan mempengaruhi sistem secara langsung.

Termasuk di dalamnya:

- Definisi domain
- Kontrak use case
- Desain reporting
- Boundary policy
- Folder structure
- Architecture overview
- ADR (Architecture Decision Record)
- MVP lock notes
- Testing policy yang mengikat implementasi

Kriteria:

- Mempengaruhi perilaku sistem
- Menjadi referensi implementasi
- Dibutuhkan untuk memahami kode
- Akan tetap relevan dalam 6 bulan ke depan
- Dirujuk oleh dokumen lain

Dokumen kategori ini wajib disimpan penuh di repository.

---

### 2.2 Operational Records (Disimpan Jika Mengikat)

Dokumen kategori ini bersifat historis atau operasional, tetapi memiliki nilai jangka panjang.

Contoh:

- Lock declaration
- Catatan penguncian fase MVP
- Keputusan teknis yang mempengaruhi stabilitas
- Investigasi bug desain yang tidak boleh diulang

Kriteria:

- Mencegah pengulangan kesalahan
- Menjelaskan kondisi sistem saat ini
- Berkaitan dengan fase implementasi resmi

Jika hanya bersifat sementara dan tidak mempengaruhi sistem ke depan, dokumen tidak perlu disimpan.

---

### 2.3 Ephemeral Discussions (Tidak Disimpan)

Kategori ini mencakup:

- Brainstorm alternatif desain
- Eksplorasi pendekatan yang tidak dipilih
- Diskusi konseptual sebelum finalisasi
- Draft awal sebelum dirapikan
- Catatan percakapan eksploratif

Kriteria:

- Tidak mengubah kontrak sistem
- Tidak dirujuk oleh dokumen lain
- Tidak mengikat implementasi
- Hanya bagian dari proses berpikir

Dokumen kategori ini tidak boleh disimpan di repository.  
Percakapan dianggap cukup sebagai arsip proses berpikir.

---

## 3. Aturan Penyimpanan Dokumen Baru

Sebelum membuat dokumen baru, wajib menjawab pertanyaan berikut:

1. Apakah tanpa dokumen ini implementasi bisa salah?
2. Apakah dokumen ini mengubah atau mengunci kontrak sistem?
3. Apakah dokumen ini akan tetap relevan dalam jangka panjang?
4. Apakah isi dokumen tidak sudah tercakup dalam dokumen lain?

Jika lebih dari satu jawaban adalah “tidak”, maka dokumen tidak perlu dibuat.

---

## 4. Aturan Anti-Duplikasi

1. Satu tanggung jawab hanya boleh dimiliki satu dokumen.
2. README tidak boleh menggandakan isi dokumen domain atau lock note.
3. Lock note tidak boleh menjelaskan ulang desain domain.
4. Testing policy tidak boleh tersebar di banyak file tanpa referensi tunggal.
5. Jika dua dokumen memiliki isi yang sama, salah satunya harus dihapus atau dirujuk saja.

Repository harus memiliki satu source of truth untuk setiap kategori informasi.

---

## 5. Ringkasan Siklus Hidup Dokumen

1. Draft (diskusi) → berada di percakapan, belum disimpan.
2. Final (mengikat) → dipindahkan ke `/docs`.
3. Locked → ditandai status dan dirujuk secara eksplisit.
4. Deprecated → dipindahkan atau dihapus melalui keputusan eksplisit (ADR jika signifikan).

Tidak boleh ada dokumen “setengah final” yang menggantung tanpa status.

---

## 6. Penutup

Dokumentasi adalah alat disiplin, bukan arsip percakapan.

Repository harus menyimpan:
- aturan,
- kontrak,
- keputusan,
- dan struktur sistem.

Proses berpikir, alternatif yang ditolak, dan diskusi eksploratif tidak wajib disimpan.

Dengan kebijakan ini, repository diharapkan tetap:
- ringkas,
- konsisten,
- dan terkontrol seiring pertumbuhan sistem.
