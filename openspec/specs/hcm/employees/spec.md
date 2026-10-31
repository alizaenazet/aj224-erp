# hcm/employees Specification

## Purpose
Keeps one record per employee (office staff and field workers) with identity, employment and bank details, used by certification, assignment, attendance and payroll (HCM-01).

## Requirements

### Requirement: Employee records
HCM SHALL create and edit employees with: NIK karyawan (unique), name, NIK KTP (16 digits, unique when filled), place and date of birth, address, phone, emergency contact name and phone, blood type, employment status (Tetap, Kontrak, Harian Lepas), work type (Kantor, Lapangan), position, join date, exit date, bank name, account number, account holder, BPJS number and photo. (HCM-01)

#### Scenario: Create employee
- **WHEN** an HCM user saves a new field worker "Agus Salim" with NIK karyawan AJ-0101, position Linesman/Pemanjat and join date 1 Okt 2026
- **THEN** Agus is listed as Aktif, type Lapangan, position Linesman/Pemanjat

#### Scenario: Duplicate NIK karyawan
- **WHEN** an HCM user saves another employee with NIK karyawan AJ-0101
- **THEN** the save is refused with "Data yang sama sudah ada."

#### Scenario: Invalid NIK KTP
- **WHEN** the NIK KTP has fewer or more than 16 digits
- **THEN** the form refuses it

### Requirement: Employee access by role
HCM SHALL manage employees; Super Admin, Direktur, Finance and Operasional SHALL view the general employee data; Lapangan SHALL see only themselves and the employees assigned to their own active projects; Marketing SHALL NOT see employees. Employees SHALL NOT be deleted. (HCM-01, PRD §13)

#### Scenario: Finance views only
- **WHEN** a Finance user opens Karyawan
- **THEN** employees are listed without add or edit actions

#### Scenario: Marketing has no access
- **WHEN** a Marketing user opens `/hr/employees`
- **THEN** they see "Akses ditolak" and the menu does not list Karyawan

#### Scenario: Lapangan sees their crew only
- **WHEN** Lapangan queries employees through the API
- **THEN** only themselves and the crew of their active projects are returned

### Requirement: Inactive employees
HCM SHALL deactivate an employee by entering an exit date (today or earlier, not before the join date), and SHALL reactivate them by clearing it. An employee with an exit date SHALL be Nonaktif and excluded from active lists used for assignment and attendance, and their open assignments SHALL end on the exit date. A user account linked to the employee SHALL be deactivated at the same time; reactivating the employee SHALL NOT reactivate the account. (HCM-01, HCM-05, PRD §14)

#### Scenario: Employee leaves
- **WHEN** HCM deactivates an employee linked to a Lapangan account with exit date today
- **THEN** the employee shows Nonaktif, their assignment ends today and the linked account can no longer open any page or sign in

#### Scenario: Future exit date
- **WHEN** HCM enters an exit date after today
- **THEN** the deactivation is refused

### Requirement: Employee list
The Karyawan list SHALL support search by name, NIK karyawan or phone, filters for work type, employment status, position and status, and Excel export. (HCM-01, UMM-09, UMM-04)

#### Scenario: Filter field workers
- **WHEN** an HCM user filters by type Lapangan and status Aktif
- **THEN** only active field employees are listed and the export contains the same rows

### Requirement: Employee changes are audited
Changes to employee records SHALL be recorded in the audit log and visible in the employee's history. (UMM-08)

#### Scenario: Position change recorded
- **WHEN** HCM changes an employee's position from Helper to Linesman/Pemanjat
- **THEN** the history shows "Jabatan: Helper → Linesman/Pemanjat" with the HCM user as actor

### Requirement: Local workers from the field
Lapangan SHALL add a local worker to their active project with name, NIK KTP, phone, position and daily wage; only positions without required certificates SHALL be offered. The worker SHALL be created as a daily field employee with status Menunggu Verifikasi HCM and an automatic employee number, assigned to that project from today, and HCM SHALL be notified. (HCM-12)

#### Scenario: Helper added on site
- **WHEN** Lukman adds Agus Salim, NIK 3506011203900002, phone 081234567890, Helper, Rp 150.000/day to PRJ/AJ224/2026/001
- **THEN** Agus appears in today's attendance list of that project marked Menunggu Verifikasi and HCM gets a notification

#### Scenario: Certified position not offered
- **WHEN** Lapangan submits a local worker as Linesman/Pemanjat through the API
- **THEN** it is refused because that position requires certificates

### Requirement: HCM verifies local workers
HCM SHALL see workers Menunggu Verifikasi (badge and list filter) and SHALL verify each one after completing the data; verification SHALL be audited. (HCM-12, UMM-08)

#### Scenario: Verify
- **WHEN** HCM opens Agus Salim and chooses Verifikasi
- **THEN** his status becomes Terverifikasi and the audit log records the change by HCM
