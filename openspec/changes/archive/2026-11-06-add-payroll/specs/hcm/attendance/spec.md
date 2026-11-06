# Spec Delta: hcm/attendance

## ADDED Requirements

### Requirement: Lock after payroll approval
Attendance on dates inside an approved or paid period, for employees of that period's group, SHALL NOT be changed by the normal attendance sheet. HCM SHALL correct such a day with a required reason; the correction SHALL be audited and its money effect added to the employee's next payroll as a prior-period correction. (HCM-11)

#### Scenario: Locked day
- **WHEN** Lapangan edits a crew member's attendance on a day of an approved period
- **THEN** the change is refused with "Absensi periode ini sudah dikunci"

#### Scenario: Correction
- **WHEN** HCM changes that day from Alpa to Hadir with reason "Surat dokter menyusul"
- **THEN** the audit log shows the change and the next draft payroll shows a Koreksi periode lalu for it
