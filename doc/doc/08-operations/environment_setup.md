# Environment Setup – Lean Ops (UMKM Mode)

**Location:**  
`/docs/08-operations/environment-setup.md`

**Status:** READY – Operational Baseline

Dokumen ini mendefinisikan konfigurasi environment dan prosedur menjalankan sistem secara aman untuk mode **UMKM (Lean Operations)**.

Dokumen ini bersifat operasional dan tidak mengubah domain maupun aturan bisnis.

---

# 1. Tujuan

Environment setup bertujuan untuk:

- Membedakan local, test, dan production
- Mencegah kesalahan deploy
- Mencegah penggunaan database production di local
- Menjaga konsistensi konfigurasi sistem

Tanpa dokumen ini, sistem bergantung pada pengetahuan individu.

---

# 2. Environment Matrix

| Environment | Tujuan | Database | Catatan |
|-------------|--------|----------|---------|
| local | Development | Local MySQL | Aman untuk eksperimen |
| test | Integration Test | Schema-per-suite | Tidak boleh pakai DB production |
| production | Live System | Production DB | Tidak boleh digunakan untuk dev |

Mode Lean Ops menggunakan **1 VPS / 1 Server production**.

Tidak ada staging environment wajib pada tahap ini.

---

# 3. Environment Variables Contract

Semua environment WAJIB menggunakan `.env`.

## 3.1 Wajib Ada

```
APP_ENV=local | test | production
DATABASE_URL=mysql://user:pass@host:port/dbname
SHADOW_DATABASE_URL=mysql://user:pass@host:port/shadow_db
LOG_LEVEL=info | warn | error
MAINTENANCE_MODE=false
BACKUP_PATH=./backups
```

## 3.2 Aturan Keras

- `.env.production` tidak boleh di-commit ke Git.
- DATABASE_URL production tidak boleh digunakan di local.
- File `.env` wajib masuk `.gitignore`.
- Jangan pernah share credential production tanpa enkripsi.

---

# 4. Local Development Setup

## 4.1 Requirement

- Node.js (LTS)
- MySQL lokal
- npm

## 4.2 Instalasi

```
npm install
```

## 4.3 Menjalankan Development Mode

```
npm run dev
```

Aplikasi berjalan menggunakan `.env.local`.

---

# 5. Integration Test Environment

Integration test menggunakan strategi Schema-per-Suite.

Aturan:

- Tidak menggunakan production DB
- Tidak menggunakan local DB utama
- Tidak boleh hardcode DATABASE_URL

Menjalankan test:

```
npm run test
```

Jika test menyentuh production database, itu pelanggaran serius.

---

# 6. Production Setup (Lean Mode)

## 6.1 Infrastruktur Minimum

- 1 VPS (2–4GB RAM cukup untuk UMKM)
- 1 MySQL instance
- 1 aplikasi Node.js
- Reverse proxy (nginx atau bawaan cloud)

Tidak menggunakan:

- Load balancer
- Multi-node cluster
- Read replica

---

## 6.2 Deployment Flow (Lean)

Urutan wajib:

1. Aktifkan Maintenance Mode
2. Jalankan backup
3. Jalankan migration
4. Deploy versi baru
5. Smoke test
6. Nonaktifkan Maintenance Mode

Total downtime yang diterima: ±5–10 menit.

Zero downtime tidak menjadi target pada mode UMKM.

---

# 7. Maintenance Mode

Maintenance Mode digunakan untuk:

- Migration schema
- Restore database
- Perubahan besar

Aktivasi:

- Set `MAINTENANCE_MODE=true`
- Atau gunakan toggle sistem jika tersedia

Saat aktif:

- Write operation diblokir
- Read-only boleh tetap berjalan (opsional)

---

# 8. Backup Integration

Sebelum migration besar:

```
npm run db:backup
```

Backup disimpan di:

```
/backups/
```

Restore hanya boleh dilakukan saat maintenance mode aktif.

---

# 9. Security Baseline

Mode UMKM tetap wajib:

- HTTPS aktif
- Password hashing
- Role separation (Admin / Kasir)
- Database tidak exposed ke publik
- Port DB tidak dibuka ke internet

---

# 10. Logging Baseline

Minimal:

- Log error
- Log authorization failure
- Log mutation penting
- Log migration

Tidak wajib:

- Observability stack
- Distributed tracing
- APM enterprise

Log disimpan di server dan tidak di-commit.

---

# 11. Growth Trigger (Kapan Upgrade dari Lean)

Upgrade ke mode lebih kompleks jika:

- User > 20
- Transaksi > 10.000/hari
- Multi-cabang
- Downtime tidak bisa diterima
- Revenue sangat bergantung pada uptime

Sebelum itu, Lean Ops sudah cukup aman.

---

# 12. Definition of Operational Readiness

Environment dianggap siap jika:

- Semua environment terdefinisi jelas
- `.env` tidak bocor ke repo
- Backup pernah diuji restore
- Migration mengikuti playbook
- Maintenance mode berjalan benar

---

# Penutup

Environment setup bukan fitur.

Ia adalah pagar agar sistem tidak rusak karena kesalahan operasional.

Mode Lean Ops memastikan:

- Sistem stabil
- Biaya rendah
- Risiko terkendali
- Tanpa komp