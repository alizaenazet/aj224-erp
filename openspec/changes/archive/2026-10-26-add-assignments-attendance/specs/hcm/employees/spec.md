# Spec Delta

## Purpose

Lets Lapangan see their crew and register local workers for HCM verification, and ends assignments when an employee leaves (HCM-01, HCM-12).

## MODIFIED Requirements

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

## ADDED Requirements

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
