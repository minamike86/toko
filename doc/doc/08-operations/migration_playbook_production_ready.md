# Migration Playbook – Production Ready Evolution

**Location Recommendation:**
`/docs/08-operations/migration-playbook.md`

Dokumen ini adalah SOP resmi untuk melakukan perubahan schema dan data pada sistem yang sudah memiliki data produksi.

Dokumen ini berlaku untuk mode:
- Maintenance window (±10 menit)
- Future 24/7 zero-downtime readiness

Dokumen ini tidak mengubah MVP scope dan tidak menambah aturan bisnis.

---

## 1. Prinsip Utama

1. Jangan pernah merusak histori.
2. Jangan pernah melakukan destructive migration secara langsung.
3. Semua perubahan schema harus backward-compatible terlebih dahulu.
4. Semua perubahan data skala besar harus dilakukan secara batch.
5. Migration harus reversible atau memiliki rollback plan.

---

## 2. Pola Wajib: Expand → Migrate → Contract

### 2.1 Expand (Non-Breaking Phase)

Tujuan: menyiapkan struktur baru tanpa merusak sistem lama.

Yang diperbolehkan:
- Tambah kolom baru (nullable)
- Tambah tabel baru
- Tambah index
- Tambah enum value (hati-hati)

Yang dilarang:
- Drop kolom
- Rename kolom langsung
- Ubah tipe kolom yang memicu table rewrite
- Tambah NOT NULL tanpa default

Pada fase ini:
- Versi lama aplikasi masih harus bisa berjalan.
- Versi baru aplikasi belum bergantung penuh pada kolom baru.

---

### 2.2 Migrate (Data Backfill Phase)

Tujuan: memindahkan data lama ke struktur baru secara aman.

Aturan:
- Proses dalam batch (misalnya 500–5000 row per batch)
- Commit per batch
- Simpan checkpoint (last processed id)
- Hindari satu transaksi besar

Jika proses tidak selesai dalam satu maintenance window:
- Lanjutkan di window berikutnya
- Jangan paksa full table update sekaligus

Pada fase ini:
- Sistem tetap berjalan dengan dua struktur sementara (dual-read jika perlu)

---

### 2.3 Contract (Finalization Phase)

Tujuan: membersihkan struktur lama setelah sistem stabil.

Yang diperbolehkan:
- Tambah NOT NULL constraint
- Tambah foreign key strict
- Drop kolom lama
- Hapus fallback logic di code

Syarat:
- Semua data sudah termigrasi
- Semua instance aplikasi sudah versi terbaru
- Backup terbaru tersedia

Contract adalah fase paling berisiko.

---

## 3. Mode 10 Menit Maintenance

Urutan standar:

1. Aktifkan maintenance mode (block write atau stop app).
2. Jalankan migration Expand.
3. Jalankan migration ringan atau batch kecil jika memungkinkan.
4. Deploy aplikasi versi baru.
5. Jalankan smoke test minimal.
6. Nonaktifkan maintenance mode.

Jika migration berat diperlukan:
- Pecah menjadi beberapa malam.

---

## 4. Mode Future 24/7 (Zero Downtime Ready)

Prinsip tambahan:

1. Migration harus backward-compatible.
2. Gunakan feature flag untuk perubahan berisiko.
3. Hindari schema change yang mem-lock tabel lama.
4. Gunakan rolling deploy atau blue/green deploy.
5. Jangan lakukan Contract sebelum semua node memakai versi baru.

---

## 5. Large Data Handling Rules

Dilarang:
- UPDATE jutaan row dalam satu query
- CREATE INDEX tanpa perencanaan pada tabel besar
- ALTER TABLE berat tanpa evaluasi

Disarankan:
- Tambah index sebelum query baru digunakan luas
- Uji migration pada snapshot data besar di staging
- Monitor execution time migration

---

## 6. Rollback Strategy

Setiap migration harus memiliki salah satu:

1. Script down migration
2. Backup snapshot sebelum migration
3. Rencana revert versi aplikasi

Rollback tidak boleh dilakukan dengan mengedit data manual di production.

---

## 7. Checklist Sebelum Migration

- [ ] Backup tersedia
- [ ] Migration diuji di staging
- [ ] Query plan dievaluasi
- [ ] Tidak ada destructive change langsung
- [ ] Rollback plan jelas

---

## 8. Hal yang Tidak Pernah Dilakukan

- Mengedit totalAmount order lama
- Menghitung ulang histori stok
- Mengubah cost historis
- Menghapus data transaksi lama

Jika koreksi diperlukan, gunakan adjustment entry.

---

## 9. Hubungan dengan MVP

Migration Playbook adalah dokumen operasional.

Dokumen ini:
- Tidak menambah fitur
- Tidak mengubah MVP Step
- Tidak memengaruhi domain

Namun semua perubahan domain besar wajib mengikuti playbook ini.

---

## 10. Definition of Discipline

Sistem dianggap production-ready jika:

- Semua perubahan schema mengikuti Expand–Migrate–Contract
- Tidak ada destructive migration langsung
- Migration dapat dijalankan pada data besar tanpa lock panjang
- Tim memahami SOP ini sebelum menyentuh production

Dokumen ini adalah pagar agar sistem bisa tumbuh besar tanpa menghancurkan database sendiri.

