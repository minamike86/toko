# LOCK NOTE – Backup System Activation (Operational Layer)

**Status:** DESIGN LOCKED  
**Layer:** Operational Hardening  
**Scope:** Database Backup & Restore Discipline  
**MVP Impact:** Non-Business, Operational Only  

---

## 1. Background

Sistem saat ini belum memiliki:

- Backup otomatis
- Backup policy terdokumentasi
- Restore procedure tervalidasi
- Snapshot strategy

Meskipun migration discipline dan maintenance guard sudah aktif, sistem belum memiliki mekanisme perlindungan data terhadap:

- Human error
- Migration failure
- Corrupted deployment
- Server crash

Backup System diaktifkan sebagai Operational Safety Layer.

---

## 2. Architectural Boundary

Backup System:

- Tidak mengubah domain
- Tidak menyentuh use case bisnis
- Tidak memodifikasi entity
- Tidak menambah dependency domain

Backup System hanya berada pada layer operasional:

```
/docs/08-operations/
/scripts/db/
```

---

## 3. Implementation Scope

### Phase 1 – Manual + Scriptable Backup

- Folder `/backups/`
- Script `scripts/db/backup.ts`
- Command `npm run db:backup`
- Timestamped filename
- Format `.sql`

### Phase 2 – Restore Script

- Script `scripts/db/restore.ts`
- Validasi environment
- Konfirmasi sebelum restore

### Phase 3 – Backup Policy Documentation

Dokumen:

```
/docs/08-operations/backup-policy.md
```

Berisi:

- Frekuensi backup
- Lokasi penyimpanan
- Retention policy
- Restore test schedule

---

## 4. Technical Principles

1. Backup dilakukan sebelum migration berisiko.
2. Backup tidak disimpan dalam Git.
3. Backup tidak boleh menimpa file lama.
4. Restore harus diverifikasi di staging sebelum production.

---

## 5. Non-Goals

Backup System bukan:

- Multi-region replication
- Real-time streaming replica
- High-availability cluster
- Enterprise disaster recovery architecture

Itu berada di fase ERP lanjutan.

---

## 6. Definition of Done

Backup layer dianggap aktif jika:

- `npm run db:backup` menghasilkan file valid
- File tersimpan di folder `/backups/`
- Restore berhasil diuji minimal satu kali
- Backup policy terdokumentasi

---

## 7. Architectural Impact

Dengan aktivasi ini, sistem kini memiliki:

- Migration Discipline
- Maintenance Mode
- Backup Strategy

Sistem bertransisi dari sekadar development project menjadi production-aware application.

---

END LOCK

