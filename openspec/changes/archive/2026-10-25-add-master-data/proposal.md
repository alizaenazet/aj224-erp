# Proposal: add-master-data

## Why

Every operational module draws on reference data:
- Projects need locations and cost categories.
- Assignments need positions and their required certificates.
- Progress needs the stringing stage template.
- Tools and materials need categories and units.
- Bills need suppliers.
- Printed documents need the company profile.
- Business rules need tunable parameters (PRD §10.2, MST-02…MST-10).

These have to exist, seeded with the PRD defaults, before Stage 1's HCM and Marketing modules and all Stage 2 modules. The A4 print layout (UMM-05) depends on the company letterhead, so its shared base comes in this change too.

## What Changes

All Wajib.
- **Profil Perusahaan (MST-02):** name, address, phone, email, NPWP, PKP status, logo and company bank accounts (one default). Super Admin edits; every role can read it for printing.
- **Supplier (MST-03):** name, category, contact, address, NPWP, bank account and default payment term in days. Finance and Super Admin manage; Operasional and Direktur view (PRD §13).
- **Lokasi (MST-04):** warehouses (seeded with Gudang Lamongan) and project locations. Project locations are created automatically by the projects change.
- **Kategori Biaya (MST-05):** the 12 PRD default categories including Overhead Kantor. Finance and Super Admin manage. A category that is in use can't be deleted, only deactivated.
- **Jabatan & sertifikat wajib (MST-06) and Jenis Sertifikat (MST-07):** the 10 PRD positions and the PRD certificate types with default validity, plus the required certificates per position. HCM and Super Admin manage.
- **Template tahapan stringing (MST-08):** the 8 PRD stages with default weights. Active weights must total exactly 100. Operasional and Super Admin manage.
- **Kategori alat & material, satuan (MST-09):** seeded tool and material categories and units. Operasional and Super Admin manage.
- **Parameter Sistem (MST-10):**
  - Settings: backdate limit (H+3), certificate "segera kedaluwarsa" window (60 days), project health thresholds (10/20 points), PPN rate, standard work hours (8), monthly salary divisor (26), document number formats.
  - Super Admin edits and Direktur views. Every change is recorded in the audit log.
- **Print base (UMM-05):** a shared A4 print layout with the company letterhead (logo, name, address, NPWP, contact) that always prints in light colors, a "Cetak" action that saves to PDF through the browser, and a letterhead preview on Profil Perusahaan. Document-specific layouts (invoice, surat jalan, slip, laporan harian, insiden) build on it in their own changes.
- **Pengaturan menu:** Profil Perusahaan, Master Data (tabs per the role's access) and Parameter Sistem. All master lists use the list kit: search, status filter, export.

## Capabilities

### New Capabilities
- `master-data/company-profile`: The company's identity, PKP status, logo and bank accounts used on documents.
- `master-data/suppliers`: Supplier records with category, contact, bank and payment terms.
- `master-data/locations`: Warehouses and project locations where tools and materials are kept.
- `master-data/cost-categories`: The list of cost categories every cost is classified by.
- `master-data/positions-certificates`: Positions, certificate types and which certificates each position requires.
- `master-data/stage-template`: The default stringing stages and weights used for progress.
- `master-data/item-categories-units`: Categories for tools and materials, and units of measure.
- `master-data/system-parameters`: Tunable business-rule parameters and document number formats.
- `platform/print-layout`: The shared A4 printable layout with the company letterhead.

### Modified Capabilities
- None.

## Impact

- **Database:** tables `company_profile`, `company_bank_accounts`, `suppliers`, `locations`, `cost_categories`, `certificate_types`, `positions`, `position_required_certificates`, `stage_templates`, `item_categories`, `units`, `system_parameters`. Seeds for the PRD defaults. A deferred constraint keeping stage weights at 100. RLS per PRD §13. Audit triggers on parameters, document formats and the company profile. A private storage bucket `company-assets` for the logo.
- **App:**
  - `/settings/company`.
  - `/settings/master-data/*` (one route per tab).
  - `/settings/parameters`.
  - Print route group `app/(print)/print/*`.
  - A config-driven master-data list and form kit.
  - An `@page` A4 rule and print-time light colors in `globals.css`.
- **Dependencies:** shadcn `tabs`, `switch`, `textarea`.

## Out of scope

- **Project locations:** created by `add-projects-contracts`.
- **Per-project stage adjustments (PRD MST-08 "dapat dihapus per proyek"):** `add-sections-progress`.
- **Using the parameters:** the H+3 limit, certificate status, health status and PPN are applied by the modules that own those rules.
- **Document-specific print layouts:** come with their modules.

## Open questions (PRD §19)

- **Q1, PKP status:** stored as a setting (default: not PKP). PPN defaults to 11% and is editable.
- **Q7, stage weights and GSW/OPGW scope:** the PRD defaults are seeded and editable.
- **Q10, required certificates per position:** a starting mapping is seeded from common practice for transmission work. HCM must confirm it with the client before go-live.
