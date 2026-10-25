# master-data/suppliers Specification

## Purpose
Keeps the suppliers UD. AJ224 buys from or rents from, with category, contact, bank details and default payment term used for supplier bills (MST-03).

## Requirements

### Requirement: Supplier records
The system SHALL keep suppliers with name, category (Material, Sewa Alat, Transportasi, Akomodasi, Katering, Lainnya), contact person, phone, email, address, NPWP, bank name, account number, account holder, default payment term in days and notes. Names SHALL be unique ignoring letter case. (MST-03)

#### Scenario: Create supplier
- **WHEN** a Finance user adds "CV Sinar Baja" with category Material and payment term 30 days
- **THEN** it appears in the supplier list with those values

#### Scenario: Duplicate name
- **WHEN** a Finance user adds "cv sinar baja" while "CV Sinar Baja" exists
- **THEN** the save is refused with "Data yang sama sudah ada."

#### Scenario: Negative term refused
- **WHEN** the payment term is entered as -5
- **THEN** the form refuses it

### Requirement: Supplier access by role
Super Admin and Finance SHALL manage suppliers; Direktur and Operasional SHALL view them; other roles SHALL have no access. (PRD §13)

#### Scenario: Operasional views only
- **WHEN** an Operasional user opens the Supplier tab
- **THEN** suppliers are listed without add, edit or deactivate actions

#### Scenario: HCM has no access
- **WHEN** an HCM user reads suppliers through the API
- **THEN** no rows are returned

### Requirement: Deactivate instead of losing history
Suppliers SHALL be deactivatable; inactive suppliers stay on existing records but are not offered for new ones. A supplier already used SHALL NOT be deletable. (MST-03, UMM-11)

#### Scenario: Deactivated supplier
- **WHEN** a Finance user deactivates a supplier
- **THEN** it is shown as Nonaktif and excluded from the active filter
