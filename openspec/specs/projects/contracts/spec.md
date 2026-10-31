# projects/contracts Specification

## Purpose
Holds the contract of each project with its addendum history, so every report uses the current contract value, and the payment-term schedule that drives billing (PRJ-02, PRJ-03).

## Requirements

### Requirement: Contract data
Each project SHALL have contract data: contract/SPK number, contract date, contract value before PPN, whether PPN applies, maintenance period in months and scope; Marketing and Finance SHALL edit it. (PRJ-02)

#### Scenario: Save contract
- **WHEN** Finance saves SPK 0123/SPK/UIP-JBTB/2026 dated 1 Agu 2026 with value Rp 10.000.000.000, PPN applies, maintenance 12 months
- **THEN** the Kontrak & Termin tab shows those values

### Requirement: Addenda
Marketing and Finance SHALL add addenda with number, date, new contract value (optional), new target finish date (optional) and description; addenda SHALL NOT be edited or deleted after saving except by a new addendum, and the contract value and target finish used everywhere SHALL be those of the latest addendum that sets them (by addendum date), falling back to the contract. (PRJ-02)

#### Scenario: Addendum changes value
- **WHEN** Finance adds addendum 01 dated 1 Okt 2026 with new value Rp 10.500.000.000
- **THEN** the project list, Ringkasan and term amounts use Rp 10.500.000.000 and the addendum history shows both values

#### Scenario: Schedule-only addendum
- **WHEN** a later addendum 02 changes only the target finish date
- **THEN** the contract value stays Rp 10.500.000.000 and the target finish date changes

### Requirement: Payment-term schedule
Marketing and Finance SHALL define payment terms per project, each with name, order, kind (Uang Muka, Termin, Retensi), either a percentage of the contract value or a fixed amount, a condition (Progres ≥ X%, Tanggal, or Manual) and notes; the term amount SHALL follow the current contract value when given as a percentage, and the tab SHALL warn when the terms do not total 100% of the contract value. (PRJ-03)

#### Scenario: Terms total 100%
- **WHEN** terms are Uang Muka 20%, Termin 1 35% at progress ≥ 50%, Termin 2 40% at progress ≥ 100%, Retensi 5% on 1 Okt 2027
- **THEN** no warning is shown and each amount is its percentage of the current contract value

#### Scenario: Terms do not total 100%
- **WHEN** the terms total 95%
- **THEN** the tab warns that the terms total 95% of the contract value

### Requirement: Term status
Each term SHALL have status Belum Waktunya, Siap Ditagih, Ditagih or Lunas; Finance and Operasional SHALL mark a Belum Waktunya term Siap Ditagih by hand (recording who and when), which SHALL notify Finance users; Ditagih and Lunas SHALL be set only by invoices and payments. (PRJ-03, PRD §11.2)

#### Scenario: Manual ready after BAST
- **WHEN** Operasional marks the Manual-condition term "Termin 3 (BAST)" Siap Ditagih
- **THEN** its status becomes Siap Ditagih and each Finance user gets a notification "Termin siap ditagih" linking to the project

### Requirement: Contract access by role
Contract data, addenda and terms SHALL be visible to Super Admin, Direktur, Marketing, Finance and Operasional and editable by Marketing and Finance; HCM and Lapangan SHALL NOT see them, in the app or through the API. (PRD §13)

#### Scenario: HCM refused through the API
- **WHEN** an HCM user queries project contracts, addenda or terms through the API
- **THEN** no rows are returned

### Requirement: Automatic term readiness
A Belum Waktunya term SHALL become Siap Ditagih automatically, recorded as done by the system, when its condition is met: project progress ≥ the term's progress condition (checked whenever progress, sections or stages change and when the term is saved), or the term's date has arrived (checked daily and when the term is saved). Each Finance user SHALL be notified once per term. (PRJ-03, PRD §11.2)

#### Scenario: Progress reaches the condition
- **WHEN** project progress rises from 48% to 52% and Termin 1 has condition progress ≥ 50%
- **THEN** Termin 1 becomes Siap Ditagih by Sistem and each Finance user gets "Termin siap ditagih"

#### Scenario: Retention date arrives
- **WHEN** the daily check runs on 1 Okt 2027 and Retensi has condition date 1 Okt 2027
- **THEN** Retensi becomes Siap Ditagih and Finance is notified

#### Scenario: Not yet met
- **WHEN** project progress is 40% and Termin 1 needs ≥ 50%
- **THEN** Termin 1 stays Belum Waktunya
