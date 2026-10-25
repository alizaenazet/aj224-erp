# platform/document-numbering Specification

## Purpose
Generates unique, human-readable document numbers per document type and period from a configurable format, for tenders, projects, invoices, delivery notes (surat jalan) and incidents (UMM-10).

## Requirements

### Requirement: Numbered document types
The system SHALL provide numbering for tender, proyek, invoice, surat jalan and insiden, each with its own format and reset period (monthly, yearly or never). Defaults SHALL follow the PRD example, e.g. invoice `INV/AJ224/{YYYY}/{MM}/{SEQ:3}` with monthly reset. (UMM-10)

#### Scenario: Default invoice number
- **WHEN** the first invoice of October 2026 is numbered
- **THEN** its number is `INV/AJ224/2026/10/001`

#### Scenario: Monthly reset
- **WHEN** the first invoice of November 2026 is numbered after five in October
- **THEN** its number is `INV/AJ224/2026/11/001`

#### Scenario: Yearly reset
- **WHEN** tenders are numbered yearly and the first tender of 2027 is numbered
- **THEN** its sequence restarts at 001

### Requirement: Format tokens
A format SHALL support the tokens `{YYYY}`, `{YY}`, `{MM}` and `{SEQ:n}` (sequence padded to n digits), taken from the document date in WIB. (UMM-10)

#### Scenario: Two-digit year and padding
- **WHEN** the surat jalan format is `SJ-{YY}{MM}-{SEQ:4}` and the 12th surat jalan of March 2027 is numbered
- **THEN** its number is `SJ-2703-0012`

### Requirement: No duplicate numbers
The system SHALL never issue the same number twice for a document type, including when several documents are saved at the same time. (UMM-10)

#### Scenario: Concurrent saves
- **WHEN** two invoices are numbered concurrently in the same period
- **THEN** they receive consecutive, different numbers

### Requirement: Numbers are issued only by the system
Users SHALL NOT be able to request or reserve numbers directly through the API; numbers are assigned when a document is saved. Only Super Admin MAY change formats. (UMM-10, MST-10)

#### Scenario: Direct call refused
- **WHEN** a Finance user calls the numbering function through the API
- **THEN** the call is refused
