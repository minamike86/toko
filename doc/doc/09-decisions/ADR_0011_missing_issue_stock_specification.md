# ADR-0011 – Missing IssueStock Use Case Specification

**Status:** Accepted  
**Date:** 2026-02-12  
**Scope:** Inventory Domain – IssueStock  
**Related Step:** MVP Step 1 (Core Transaction)  

---

## Context

Pada implementasi saat ini, `IssueStock` telah tersedia dalam kode sebagai application use case yang:

- Mengurangi stok (`decrease`)
- Memvalidasi kecukupan stok
- Menghasilkan `StockMovement` bertipe `OUT`
- Digunakan oleh `CreateOrder`

Namun, berbeda dengan use case lain seperti:

- Create Order
- Cancel Order
- Adjust Stock
- Initialize Stock
- Pay Credit

`IssueStock` belum memiliki dokumen spesifikasi resmi di folder `/docs/04-use-cases`.

Dengan meningkatnya disiplin dokumentasi sistem, ketidakhadiran spesifikasi formal ini dianggap sebagai celah dokumentasi arsitektural.

---

## Problem Statement

Tanpa dokumen resmi:

1. Perilaku `IssueStock` hanya hidup di kode.
2. Boundary dan tanggung jawabnya tidak didefinisikan secara eksplisit.
3. Hubungannya dengan `CreateOrder` tidak terdokumentasi formal.
4. Risiko interpretasi ulang meningkat di fase berikutnya.

Walaupun sistem berjalan dengan benar, kekosongan dokumentasi ini berpotensi menimbulkan inkonsistensi evolusi domain.

---

## Decision

Diputuskan untuk:

- Mengakui bahwa `IssueStock` adalah use case domain eksplisit, bukan sekadar helper teknis.
- Membuat dokumen resmi `issue-stock.md` di `/docs/04-use-cases`.
- Tidak mengubah implementasi Step 1.
- Tidak mengubah kontrak test yang sudah ada.

ADR ini bersifat dokumentatif, bukan refactor perilaku.

---

## Intended Documentation Scope

Dokumen `issue-stock.md` akan mencakup:

- Tujuan use case
- Aktor (biasanya internal system / application layer)
- Prasyarat (stok mencukupi)
- Alur utama
- Error handling (`InsufficientStockError`)
- Dampak terhadap Inventory Domain
- Hubungan dengan Create Order
- Non-goals

Dokumen tersebut tidak akan menambahkan aturan bisnis baru.

---

## Consequences

### Positive

- Konsistensi dokumentasi use case Inventory
- Boundary domain lebih eksplisit
- Evolusi Step 4 lebih terarah

### Neutral

- Tidak ada perubahan kode
- Tidak ada perubahan perilaku
- Tidak ada perubahan test

---

## Rationale

MVP Step 1 telah dinyatakan CLOSED & DESIGN LOCKED.

Perubahan perilaku tidak diperbolehkan tanpa ADR yang eksplisit.

ADR ini tidak mengubah perilaku sistem, melainkan memperbaiki kelengkapan dokumentasi agar arsitektur tetap terjaga dalam evolusi selanjutnya.

---

## Status

🔒 Accepted  
Dokumen `issue-stock.md` akan dibuat sebagai tindak lanjut ADR ini.

---

**End of ADR-0011**

