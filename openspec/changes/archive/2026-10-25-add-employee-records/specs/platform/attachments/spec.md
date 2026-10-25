# Spec Delta

## Purpose

Lets users attach files (documents, photos, receipts) to records, stores them privately, and serves them only to users who may see the record, with on-device photo compression for weak field connections (UMM-03).

## ADDED Requirements

### Requirement: Allowed files
Attachments SHALL accept PDF, JPG, PNG and XLSX files up to 10 MB; JPG and PNG photos SHALL be compressed on the device to at most 1 MB before upload. Other types or larger files SHALL be refused with a message in Bahasa Indonesia. (UMM-03)

#### Scenario: Photo compressed
- **WHEN** HCM attaches a 4 MB JPG photo of a KTP
- **THEN** the stored file is at most 1 MB

#### Scenario: Too large
- **WHEN** a 12 MB PDF is attached
- **THEN** the upload is refused with "Ukuran berkas maksimal 10 MB."

#### Scenario: Wrong type
- **WHEN** a .zip file is chosen
- **THEN** the upload is refused with the list of allowed types

### Requirement: Access follows the record
A file SHALL be listed, opened or removed only by users allowed for its record type and category; files SHALL be stored privately and opened through links that expire within minutes. (UMM-03, PRD §14)

#### Scenario: Authorized view
- **WHEN** HCM opens an employee's KTP attachment
- **THEN** the file opens through a temporary link

#### Scenario: Unauthorized access
- **WHEN** an Operasional user requests the same file through the API or storage URL
- **THEN** no attachment row is returned and the storage download is refused

#### Scenario: Expired link
- **WHEN** a copied file link is opened after it expired
- **THEN** the file is not served

### Requirement: Categories and metadata
Each attachment SHALL record its record type, record, category, original file name, type, size, uploader and upload time, and lists SHALL show category, name, size and upload time. (UMM-03)

#### Scenario: Listed with category
- **WHEN** HCM uploads a file as "Kontrak kerja"
- **THEN** the employee's document list shows it under Kontrak kerja with its name, size and time

### Requirement: Retry failed uploads
When an upload fails (for example, a lost connection), the user SHALL be able to retry it without choosing the file again. (UMM-03, PRD §14)

#### Scenario: Retry
- **WHEN** an upload fails
- **THEN** a "Coba lagi" action re-sends the same file

### Requirement: Remove attachments
Users allowed to manage the record's files SHALL remove an attachment, which deletes the stored file. (UMM-03)

#### Scenario: Remove document
- **WHEN** HCM removes an employee's outdated KK file
- **THEN** it disappears from the list and its stored file is deleted
