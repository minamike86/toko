# Circle Update Fitur (Dokumentasi)

Dokumen ini menjelaskan siklus standar yang digunakan setiap kali akan menambahkan fitur baru, **khusus dari sisi dokumentasi**, sebelum implementasi kode dilakukan. Tujuan utama dokumen ini adalah menjaga konsistensi arah produk, mencegah perubahan impulsif, dan memastikan setiap fitur memiliki jejak keputusan yang jelas.

Dokumen ini berlaku untuk seluruh pengembangan fitur setelah MVP Roadmap dan Non-Goals ditetapkan.

---

## Prinsip Dasar

- Dokumentasi adalah alat berpikir, bukan arsip administratif.
- Tidak ada implementasi fitur tanpa jejak keputusan tertulis.
- Perubahan dilakukan secara aditif, bukan dengan menulis ulang dokumen besar.
- Architecture Decision Record (ADR) adalah pusat perubahan fitur.

---

## Kapan Siklus Ini Digunakan

Siklus ini digunakan setiap kali:
- Menambah fitur baru
- Menambah aturan bisnis yang signifikan
- Mengubah perilaku domain yang sudah ada

Siklus ini **tidak** digunakan untuk:
- Perbaikan bug kecil
- Refactor internal tanpa perubahan perilaku bisnis

---

## Circle Update Fitur (Langkah demi Langkah)

### Step 1 – Identifikasi Niat Fitur

Tujuan:
Menentukan apakah fitur layak ditambahkan pada tahap saat ini.

Aksi:
- Baca kembali:
  - `mvp-roadmap.md`
  - `non-goals.md`
- Tentukan fitur ini masuk ke MVP step mana.

Aturan:
- Jika fitur melanggar non-goals pada step aktif, fitur ditunda.
- Tidak ada penulisan dokumen baru pada tahap ini.

---

### Step 2 – Buat Architecture Decision Record (ADR)

Tujuan:
Mencatat keputusan resmi bahwa fitur akan ditambahkan.

Aksi:
- Buat file baru di:
  `/docs/09-decisions/`
- Gunakan penomoran berurutan.

Isi minimal ADR:
- Konteks: alasan fitur dibutuhkan sekarang
- Keputusan: pendekatan yang dipilih
- Konsekuensi: dampak ke domain, data, dan laporan

Catatan:
- Tidak berisi detail implementasi
- Tidak berisi kode atau skema database

ADR adalah titik awal resmi sebuah fitur.

---

### Step 3 – Update Roadmap MVP (Jika Diperlukan)

Tujuan:
Membuat fitur legal secara roadmap.

Aksi:
- Update dokumen MVP step terkait
- Tambahkan fitur sebagai bagian scope
- Jelaskan batasan fitur secara eksplisit

Aturan:
- Tidak menulis ulang roadmap
- Hanya melakukan amendment kecil

---

### Step 4 – Update Dokumentasi Domain

Tujuan:
Menyesuaikan aturan bisnis dengan fitur baru.

Aksi:
- Update dokumen domain yang terdampak
- Tambahkan:
  - konsep baru (entity atau value object)
  - aturan bisnis (invariants)

Catatan:
- Tambahkan penanda waktu atau MVP step jika relevan
- Tidak perlu menyentuh domain lain jika tidak terdampak

---

### Step 5 – Update Use Case Terkait

Tujuan:
Menjelaskan perubahan perilaku sistem secara operasional.

Aksi:
- Update atau buat dokumen use case
- Tambahkan:
  - alur normal
  - alur gagal
  - edge case baru

Use case menjadi acuan utama untuk testing.

---

### Step 6 – Evaluasi Siklus

Tujuan:
Memastikan dokumentasi siap sebelum implementasi.

Checklist:
- ADR tersedia
- Roadmap mencerminkan fitur
- Aturan domain konsisten
- Use case menjelaskan perilaku baru

Jika semua terpenuhi, implementasi kode **baru boleh dimulai**.

---

## Ringkasan Siklus

Niat fitur
→ ADR
→ Roadmap (jika perlu)
→ Domain documentation
→ Use case
→ Implementasi

---

### Peran Dokumen dalam Siklus

Untuk menghindari kebingungan antara keputusan, rencana, dan eksekusi,
dokumen dalam sistem ini memiliki peran yang dibedakan secara eksplisit:

- **ADR (Architecture Decision Record)**  
  Merupakan keputusan arsitektural resmi.  
  Menjawab *apa yang diputuskan* dan *mengapa diputuskan*.

- **Phase Checklist**  
  Merupakan rencana eksekusi terkontrol setelah ADR disetujui.  
  Digunakan untuk memastikan implementasi tidak melanggar scope dan lock yang sudah ditetapkan.

- **PR Checklist**  
  Merupakan pengaman terakhir sebelum merge.  
  Digunakan untuk mengingatkan developer jika terdapat penambahan fitur,
  perubahan scope, atau pelanggaran batas ADR secara tidak sadar.

---

## Catatan Penutup

Siklus ini dibuat untuk menjaga kualitas keputusan, bukan untuk memperlambat pengembangan. Jika langkah-langkah ini terasa berat, itu pertanda fitur belum cukup matang untuk diimplementasikan.

Dokumen ini harus dibaca ulang setiap kali muncul keinginan untuk menambahkan fitur secara spontan.

