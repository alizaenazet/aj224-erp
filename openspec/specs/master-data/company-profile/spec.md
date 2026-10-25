# master-data/company-profile Specification

## Purpose
Holds UD. AJ224's identity used on every printed document and invoice: name, address, contact, NPWP, PKP status, logo and bank accounts (MST-02).

## Requirements

### Requirement: Company profile maintained by Super Admin
The system SHALL keep one company profile (name, address, phone, email, NPWP, PKP status, logo). Super Admin SHALL edit it; Direktur SHALL view it read-only; every signed-in role SHALL be able to read it for documents. (MST-02, PRD §13)

#### Scenario: Super Admin updates the profile
- **WHEN** a Super Admin changes the address and saves
- **THEN** the new address is stored and shown on the letterhead preview

#### Scenario: Direktur views read-only
- **WHEN** a Direktur opens Profil Perusahaan
- **THEN** the data is shown without editable fields or save actions

#### Scenario: Other roles cannot edit
- **WHEN** a Finance user tries to update the company profile through the API
- **THEN** the change is refused

### Requirement: Company logo
A Super Admin SHALL be able to upload a PNG, JPG or WEBP logo of at most 1 MB, which replaces the previous logo on documents. (MST-02, UMM-03)

#### Scenario: Logo replaced
- **WHEN** a Super Admin uploads a 200 KB PNG logo
- **THEN** the letterhead preview shows the new logo

#### Scenario: Wrong file refused
- **WHEN** a Super Admin selects a 3 MB file or a PDF as logo
- **THEN** the upload is refused with a message in Bahasa Indonesia

### Requirement: Company bank accounts
The system SHALL keep company bank accounts (bank, account number, account holder), exactly one of which is the default shown on invoices, and accounts can be deactivated. (MST-02)

#### Scenario: Change default account
- **WHEN** a Super Admin marks a second account as default
- **THEN** it becomes the only default account

#### Scenario: Deactivated account
- **WHEN** an account is deactivated
- **THEN** it is no longer offered for new invoices or payments but stays on existing records

### Requirement: Profile changes are audited
Changes to the company profile SHALL be recorded in the audit log. (MST-02, UMM-08)

#### Scenario: PKP change recorded
- **WHEN** a Super Admin switches PKP status on
- **THEN** the audit log shows the change with the Super Admin as actor
