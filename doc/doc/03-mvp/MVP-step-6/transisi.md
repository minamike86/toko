## DECISION LOG — AuthorizationGuard Transitional Compatibility

Type: DESIGN DECISION LOG  
Status: ACTIVE

### Context  
Refactor `AuthorizationGuard` memperkenalkan method baru `assertAuthorized(...)` untuk menyederhanakan validasi actor + role pada application layer.

Namun codebase saat ini masih memiliki banyak use case yang memakai kontrak lama:
- `assertActorExists(...)`
- `assertRole(...)`

Perubahan langsung ke API baru menyebabkan error compile dan kegagalan test lintas Sales, Inventory, dan Procurement.

### Problem  
Migrasi `AuthorizationGuard` dilakukan terlalu cepat terhadap shared API, sementara seluruh use case lama belum dimigrasikan serentak.

Akibatnya:
- TypeScript error pada banyak file
- runtime failure pada test
- perubahan kecil di shared guard menghasilkan blast radius besar

### Constraints  
- Authorization harus tetap berada di application layer
- Domain tidak boleh mengetahui role atau actor
- Tidak boleh mengubah invariant domain
- Tidak boleh memperluas scope Step 6
- Tidak boleh membuat redesign authorization baru

### Options Considered  
1. Langsung mengganti seluruh use case ke `assertAuthorized(...)`
2. Mengembalikan kontrak lama sepenuhnya
3. Menjaga backward compatibility sementara dengan menyediakan:
   - `assertActorExists(...)`
   - `assertRole(...)`
   - `assertAuthorized(...)`

### Decision  
Dipilih **opsi 3**.

`AuthorizationGuard` bersifat **transitional compatible**:
- method lama tetap tersedia untuk menjaga kestabilan codebase
- method baru `assertAuthorized(...)` ditambahkan sebagai API target untuk migrasi bertahap

### Rationale  
- Mengurangi blast radius perubahan shared contract
- Menjaga compile dan test tetap bisa dipulihkan cepat
- Memberi jalur migrasi bertahap tanpa breaking change besar
- Konsisten dengan prinsip stabilitas operasional dan boundary application layer

### Trade-offs  
- Ada duplikasi API sementara pada `AuthorizationGuard`
- Codebase belum langsung seragam memakai satu style
- Cleanup final harus dilakukan setelah seluruh use case selesai dimigrasikan

### Consequences  
- Existing use case lama tetap berjalan tanpa perubahan massal langsung
- Use case baru boleh memakai `assertAuthorized(...)`
- Refactor authorization menjadi additive, bukan breaking
- Technical debt kecil diterima sementara untuk menjaga stabilitas

### Constraints Moving Forward  
- Jangan menghapus `assertActorExists(...)` dan `assertRole(...)` sebelum seluruh use case dimigrasikan
- Jangan memindahkan authorization ke domain
- Cleanup final hanya boleh dilakukan setelah:
  - `tsc --noEmit` pass
  - seluruh test terkait pass
  - seluruh use case sudah memakai kontrak final yang dipilih

### Reference  
- `authorization-boundary.md`
- `mvp_stages_overview.md`
- `log_note_writing_guidelines.md`
- `log_note.md`
- `error.txt`