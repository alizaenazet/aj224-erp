# Spec Delta

## Purpose

Operasional hears about expiring certificates of crew on duty (HCM-04); deleting a certificate removes its scan (HCM-03).

## MODIFIED Requirements

### Requirement: Expiry reminders
The daily check at 06:00 WIB SHALL notify HCM users once when a current certificate of an active employee enters the Segera Kedaluwarsa window and once when it becomes Kedaluwarsa; when that employee is on an active assignment, Operasional users SHALL be notified as well, with the project code. Each notification SHALL name the employee, certificate type and expiry date and link to the certificate list. (HCM-04, UMM-06)

#### Scenario: Reminder at 60 days
- **WHEN** the daily check runs and Lukman's TKBT Tingkat 1 expires in 30 days
- **THEN** each HCM user gets one notification "Sertifikat segera kedaluwarsa" for it, and running the check again does not repeat it

#### Scenario: Reminder at expiry
- **WHEN** the daily check runs after Slamet's TKBT Tingkat 2 expired
- **THEN** each HCM user gets one notification "Sertifikat kedaluwarsa" for it

#### Scenario: Operasional reminded for assigned crew
- **WHEN** the daily check runs and Eko's P3K has expired while he is assigned to PRJ/AJ224/2026/001
- **THEN** each Operasional user gets one notification "Sertifikat kedaluwarsa" naming Eko, P3K and PRJ/AJ224/2026/001, while Slamet (not assigned) gives Operasional no notification

#### Scenario: Renewed certificate not reminded
- **WHEN** an expired certificate has been superseded by a valid one of the same type
- **THEN** no reminder is sent for the old one

### Requirement: Certificate scan
HCM SHALL attach a scanned file (PDF, JPG or PNG) to a certificate; users who may view the certificate SHALL open it through a temporary link. Deleting a certificate SHALL remove its scan file and attachment record. (HCM-03, UMM-03)

#### Scenario: Attach scan
- **WHEN** HCM uploads a PDF scan for Budi's TKBT certificate
- **THEN** the certificate shows a link that opens the scan

#### Scenario: Delete certificate with scan
- **WHEN** HCM deletes Dedi's TKBT Tingkat 1 certificate that has a scan
- **THEN** the certificate, its attachment record and the stored file are gone
