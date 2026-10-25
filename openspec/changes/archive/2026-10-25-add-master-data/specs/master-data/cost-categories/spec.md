# Spec Delta

## Purpose

Provides the fixed-but-extendable list of cost categories that every cost, budget (RAB) line and payroll allocation is classified by (MST-05).

## ADDED Requirements

### Requirement: Default cost categories
The system SHALL start with the PRD categories: Upah & Gaji, Akomodasi & Konsumsi, Mobilisasi/Demobilisasi, Material & Consumable, Sewa Alat & Kendaraan, BBM & Transportasi, Perbaikan Alat, K3 & APD, Pelatihan & Sertifikasi, Perizinan & Sosial (ROW/warga), Lain-lain and Overhead Kantor, where Overhead Kantor is marked as the office overhead category. (MST-05)

#### Scenario: Seeded list
- **WHEN** a Finance user opens Kategori Biaya on a new installation
- **THEN** the 12 default categories are listed and Overhead Kantor is marked "Overhead"

### Requirement: Manage categories
Super Admin and Finance SHALL add, rename, deactivate and reactivate categories; all signed-in roles SHALL be able to read them. (MST-05, PRD §13)

#### Scenario: Add category
- **WHEN** a Finance user adds "Asuransi Proyek"
- **THEN** it is available as an active category

#### Scenario: HCM cannot manage
- **WHEN** an HCM user tries to add a category through the API
- **THEN** the request is refused

### Requirement: Used categories cannot be deleted
A category used by any record SHALL NOT be deletable and the user SHALL be told to deactivate it instead; an unused category MAY be deleted. (MST-05)

#### Scenario: Delete refused when used
- **WHEN** a Finance user deletes a category that a cost already uses
- **THEN** the deletion is refused with "Data sudah dipakai sehingga tidak dapat dihapus. Nonaktifkan saja."

#### Scenario: Unused category deleted
- **WHEN** a Finance user deletes a category nobody uses
- **THEN** it is removed from the list
