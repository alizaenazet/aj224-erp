# Spec Delta

## Purpose

Provides the shared A4 print layout with the company letterhead that every printable document (invoice, surat jalan, slip gaji, laporan harian, laporan insiden) builds on, saved as PDF through the browser (UMM-05).

## ADDED Requirements

### Requirement: Letterhead from the company profile
Printable documents SHALL start with a letterhead showing the company logo, name, address, phone, email and NPWP taken from the current company profile. (UMM-05, MST-02)

#### Scenario: Letterhead content
- **WHEN** a user opens a printable document
- **THEN** its top shows the logo, "UD. AJ224", the address and NPWP from Profil Perusahaan

#### Scenario: No logo yet
- **WHEN** no logo has been uploaded
- **THEN** the letterhead shows the company name without a broken image

### Requirement: A4 print and PDF
Printable documents SHALL be laid out for A4 paper, print in dark text on white regardless of the screen theme, hide app navigation and buttons when printed, and offer a "Cetak" action that opens the browser print dialog (where "Save as PDF" is available). (UMM-05)

#### Scenario: Print in dark mode
- **WHEN** a user with the dark theme prints a document
- **THEN** the printout has dark text on a white page

#### Scenario: Controls hidden
- **WHEN** the document is printed
- **THEN** the "Cetak" button and app navigation do not appear on paper

### Requirement: Letterhead preview
Super Admin and Direktur SHALL be able to preview the letterhead from Profil Perusahaan. (UMM-05)

#### Scenario: Preview
- **WHEN** a Super Admin chooses "Pratinjau Kop Surat"
- **THEN** an A4 preview with the current letterhead opens
