# Backup Policy & Procedure – Operational Database Protection

**Location:**
`/docs/08-operations/backup-policy.md`

**Status:** DESIGN READY – Implementation Pending

---

## 1. Purpose

Dokumen ini mendefinisikan kebijakan dan prosedur backup database untuk memastikan:

- Data tidak hilang akibat human error
- Migration failure dapat dipulihkan
- Sistem dapat direstore setelah crash
- Deployment berisiko memiliki safety net

Dokumen ini bersifat operasional dan tidak memengaruhi domain atau business logic.

---

## 2. Scope

Backup policy berlaku untuk:

- Database utama (production)
- Database staging (opsional)

Tidak berlaku untuk:

- Cache
- Log file
- File upload storage (fase terpisah)

---

## 3. Backup Strategy Level

### Level Saat Ini (Phase 1 – Local / Single Server)

- Full database dump (.sql)
- Manual trigger via script
- Timestamped file
- Disimpan di folder `/backups/`

### Level Future (Phase 2 – Production)

- Scheduled backup (cron / CI)
- Retention policy
- Offsite storage
- Restore test berkala

---

## 4. Backup Frequency

### Development
- Backup sebelum migration besar

### Production (Target)
- Harian (minimal 1x per hari)
- Sebelum migration berisiko
- Sebelum perubahan schema besar

---

## 5. Retention Policy

### Phase 1
- Simpan 7 backup terakhir
- Backup lebih lama dari 30 hari boleh dihapus manual

### Phase 2 (Future)
- 7 harian
- 4 mingguan
- 3 bulanan

---

## 6. Storage Rules

- Folder: `/backups/`
- Format nama: `db-backup-YYYY-MM-DD-HH-mm.sql`
- Tidak di-commit ke Git
- Harus masuk `.gitignore`

---

## 7. Restore Procedure (High Level)

1. Aktifkan Maintenance Mode
2. Pastikan koneksi ke database benar
3. Jalankan restore script
4. Verifikasi integritas data
5. Nonaktifkan Maintenance Mode

Restore tidak boleh dilakukan langsung di production tanpa:
- Konfirmasi eksplisit
- Backup tambahan sebelum restore

---

## 8. Pre-Migration Safety Rule

Sebelum menjalankan migration yang:

- Mengubah schema besar
- Menghapus kolom
- Mengubah constraint

WAJIB menjalankan:

```
npm run db:backup
```

---

## 9. Testing Policy

Restore harus diuji minimal satu kali pada:

- Environment staging
- Atau database lokal clone

Backup tanpa pernah diuji restore dianggap tidak valid.

---

## 10. Security Considerations

- File backup mengandung seluruh data
- Jangan disimpan di public folder
- Jangan dibagikan tanpa enkripsi
- Jangan upload ke repository

---

## 11. Definition of Operational Readiness

Backup system dianggap aktif dan siap jika:

- Script backup tersedia
- Script restore tersedia
- Backup file terbukti dapat direstore
- Policy terdokumentasi

---

Dokumen ini menjadi dasar implementasi teknis backup layer.
Implementation akan mengikuti kebijakan ini dan tidak boleh menyimpang dari prinsip yang telah dikunci.

