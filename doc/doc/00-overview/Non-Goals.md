Non-Goals
Dokumen ini mendefinisikan batasan eksplisit mengenai fitur, ruang lingkup, dan tanggung jawab sistem pada fase MVP dan tahap awal pengembangan. Tujuannya adalah menjaga fokus produk, mencegah scope creep, dan memastikan sistem berkembang secara terkontrol.
Keputusan dalam dokumen ini bersifat sadar dan strategis, bukan keterbatasan teknis semata.

Non-Goals Fungsional
Pada tahap MVP dan fase awal menuju enterprise readiness, sistem ini tidak bertujuan untuk:
Menjadi ERP penuh yang mencakup akuntansi, payroll, atau procurement
Menjadi marketplace multi-vendor
Menyediakan sistem promosi, diskon kompleks, atau loyalty program
Menyediakan real-time analytics atau business intelligence lanjutan
Menangani manajemen pelanggan kompleks (CRM penuh)
Menyediakan aplikasi mobile native
Fitur-fitur di atas dapat dipertimbangkan di masa depan, tetapi bukan bagian dari MVP atau fokus awal produk.

Non-Goals Arsitektural
Sistem ini tidak dirancang pada tahap awal untuk:
Microservices architecture
Event-driven architecture kompleks
Multi-database atau sharding
High availability lintas region
Auto-scaling infrastructure
Pendekatan awal adalah monolith terstruktur dengan batas domain yang jelas untuk meminimalkan kompleksitas dan risiko.

Non-Goals Operasional
Pada fase awal, sistem ini tidak menargetkan:
Compliance khusus industri (misalnya PCI-DSS, HIPAA, dsb.)
Integrasi dengan sistem eksternal enterprise
SLA enterprise formal
Dukungan multi-bahasa dan multi-mata uang kompleks
Kesiapan operasional akan ditingkatkan secara bertahap seiring pertumbuhan produk dan kebutuhan bisnis.

Non-Goals UI dan Pengalaman Pengguna
Pada tahap MVP:
UI tidak dioptimalkan untuk branding atau estetika tingkat lanjut


Fokus UI adalah kejelasan alur, bukan animasi atau personalisasi


Tidak ada kustomisasi tampilan per pengguna


Desain visual akan ditingkatkan setelah stabilitas dan kejelasan domain tercapai.

Prinsip Peninjauan Ulang
Non-goals dalam dokumen ini dapat ditinjau ulang hanya jika:
MVP step sebelumnya telah memenuhi seluruh kriteria selesai


Perubahan memiliki justifikasi bisnis yang jelas


Dampak terhadap arsitektur telah dianalisis


Menambahkan fitur tanpa memenuhi syarat di atas dianggap sebagai pelanggaran fokus produk.

