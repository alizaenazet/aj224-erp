# Spec Delta

## Purpose

Keeps every employee's K3 and competency certificates with an automatic status, shows whether an employee is fit for their position, and reminds HCM before and when certificates expire (HCM-03, HCM-04, PRD §11.5).

## ADDED Requirements

### Requirement: Employee certificates
HCM SHALL record certificates per employee with type, number, issuer, issue date, expiry date and notes; an empty expiry date SHALL mean the certificate never expires (Seumur hidup). When a type and issue date are chosen, the expiry date SHALL be suggested from the type's validity. The expiry date SHALL NOT be before the issue date. (HCM-03)

#### Scenario: Add certificate with suggested expiry
- **WHEN** HCM adds a TKBT Tingkat 2 certificate (validity 60 months) issued 1 Okt 2026 for Budi Santoso
- **THEN** the expiry date is suggested as 1 Okt 2031 and the saved certificate shows status Berlaku

#### Scenario: Lifetime certificate
- **WHEN** HCM saves a certificate without an expiry date
- **THEN** it shows "Seumur hidup" and status Berlaku

#### Scenario: Expiry before issue
- **WHEN** the expiry date is earlier than the issue date
- **THEN** saving is refused

### Requirement: Certificate status
Each certificate's status SHALL be computed for today (WIB): Berlaku when it has no expiry date or expires after today plus the "segera kedaluwarsa" parameter (default 60 days); Segera Kedaluwarsa when it expires from today through today plus that parameter; Kedaluwarsa when it expired before today. (HCM-03, PRD §11.5, MST-10)

#### Scenario: Expiring soon
- **WHEN** today is 25 Okt 2026 and a certificate expires on 24 Nov 2026
- **THEN** its status is Segera Kedaluwarsa with 30 days left

#### Scenario: Expired
- **WHEN** a certificate expired on 10 Okt 2026
- **THEN** its status is Kedaluwarsa

### Requirement: Current certificate per type
Among one employee's certificates of the same type, the one with the latest expiry (no expiry counts as latest) SHALL be the current one; older ones SHALL be shown as Diperbarui and SHALL NOT count for status lists, fitness or reminders. (HCM-03)

#### Scenario: Renewed certificate
- **WHEN** an employee has an expired TKBT Tingkat 2 and HCM adds a new one valid until 2031
- **THEN** the new one is current with status Berlaku and the old one is shown as Diperbarui

### Requirement: Certificate scan
HCM SHALL attach a scanned file (PDF, JPG or PNG) to a certificate; users who may view the certificate SHALL open it through a temporary link. (HCM-03, UMM-03)

#### Scenario: Attach scan
- **WHEN** HCM uploads a PDF scan for Budi's TKBT certificate
- **THEN** the certificate shows a link that opens the scan

### Requirement: Certificate access by role
HCM SHALL manage certificates; Super Admin, Direktur and Operasional SHALL view them; Finance and Marketing SHALL NOT see certificates. (PRD §13)

#### Scenario: Operasional views only
- **WHEN** an Operasional user opens Sertifikat
- **THEN** certificates are listed without add, edit or delete actions

#### Scenario: Finance has no access
- **WHEN** a Finance user opens `/hr/certificates` or queries certificates through the API
- **THEN** they see "Akses ditolak" and no rows are returned

### Requirement: Fit for position
The employee page SHALL list each certificate required by the employee's position with its current status, and SHALL show the employee as Layak Tugas when every required certificate is Berlaku or Segera Kedaluwarsa, otherwise Belum Layak Tugas with the missing or expired types. (PRD §11.5, MST-06)

#### Scenario: Missing required certificate
- **WHEN** a Driver has no SIM B1 certificate
- **THEN** the page shows SIM B1 as Belum ada and the employee as Belum Layak Tugas

#### Scenario: Expiring still fit
- **WHEN** a Mandor's only required certificate is Segera Kedaluwarsa
- **THEN** the employee is shown as Layak Tugas

### Requirement: Certificate list
SDM → Sertifikat SHALL list the current certificate per employee and type for active employees, with search by employee name, NIK karyawan or certificate number, filters for status (Berlaku, Segera Kedaluwarsa, Kedaluwarsa, Bermasalah = Segera Kedaluwarsa or Kedaluwarsa) and type, days left, and Excel export. (HCM-04, UMM-09, UMM-04)

#### Scenario: Problem certificates
- **WHEN** HCM filters by Bermasalah
- **THEN** only Segera Kedaluwarsa and Kedaluwarsa certificates are listed, soonest expiry first, and the export contains the same rows

### Requirement: Expiry reminders
The daily check at 06:00 WIB SHALL notify HCM users once when a current certificate of an active employee enters the Segera Kedaluwarsa window and once when it becomes Kedaluwarsa; the notification SHALL name the employee, certificate type and expiry date and link to the certificate list. (HCM-04, UMM-06)

#### Scenario: Reminder at 60 days
- **WHEN** the daily check runs and Lukman's TKBT Tingkat 1 expires in 30 days
- **THEN** each HCM user gets one notification "Sertifikat segera kedaluwarsa" for it, and running the check again does not repeat it

#### Scenario: Reminder at expiry
- **WHEN** the daily check runs after Slamet's TKBT Tingkat 2 expired
- **THEN** each HCM user gets one notification "Sertifikat kedaluwarsa" for it

#### Scenario: Renewed certificate not reminded
- **WHEN** an expired certificate has been superseded by a valid one of the same type
- **THEN** no reminder is sent for the old one
