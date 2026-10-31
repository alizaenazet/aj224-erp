# hcm/training Specification

## Purpose
Records trainings and workshops with participants and results, turns passed participants into certificates, and shows who still needs training for their position (HCM-07, HCM-08).

## Requirements

### Requirement: Training records
HCM SHALL record trainings with name, kind (Internal or Eksternal), organizer, start date, optional end date (not before the start date), location, the certificate type it produces (optional) and notes, and SHALL add or remove participants (active employees, each at most once per training) and set each participant's result: Belum dinilai, Lulus or Tidak Lulus. (HCM-07)

#### Scenario: Create training with participants
- **WHEN** HCM creates "Pelatihan TKBT Tingkat 2" (Eksternal, organizer PT Sertifikasi K3 Nusantara, 3–5 Nov 2026) producing TKBT Tingkat 2 with Slamet Riyadi and Agus Salim
- **THEN** the training lists both participants as Belum dinilai

#### Scenario: Duplicate participant
- **WHEN** HCM adds Slamet to the same training again
- **THEN** he is not added twice

### Requirement: Certificates from passed participants
When a participant's result becomes Lulus and the training produces a certificate type, the system SHALL create a certificate for that employee with issue date = the training's end date (or start date when there is none), expiry = issue date + the type's validity (none for lifetime types), issuer = the organizer, and a link to the training; its number and scan SHALL be completable later. Changing the result away from Lulus SHALL remove that automatically created certificate. Changing the training's organizer or dates SHALL update the certificates it issued; adding a certificate type SHALL issue certificates to participants who already passed; changing the certificate type SHALL be refused while certificates from the training exist. (HCM-07)

#### Scenario: Passed participant gets certificate
- **WHEN** HCM marks Slamet as Lulus in the TKBT Tingkat 2 training ending 5 Nov 2026
- **THEN** Slamet gets a TKBT Tingkat 2 certificate issued 5 Nov 2026, expiring 5 Nov 2031, which supersedes his expired one

#### Scenario: Result corrected
- **WHEN** HCM changes Slamet's result from Lulus to Tidak Lulus
- **THEN** the certificate created from that training is removed

#### Scenario: Training without certificate type
- **WHEN** a participant passes an internal workshop without a certificate type
- **THEN** no certificate is created

#### Scenario: Training dates corrected
- **WHEN** HCM moves the end date of the TKBT Tingkat 2 training from 23 Sep to 24 Sep 2026 after Budi passed
- **THEN** Budi's certificate from it is issued 24 Sep 2026 and expires 24 Sep 2031

#### Scenario: Certificate type added later
- **WHEN** HCM sets P3K as the certificate type of a workshop where Joko already passed
- **THEN** Joko gets a P3K certificate linked to that workshop

#### Scenario: Type change refused
- **WHEN** HCM changes the certificate type of a training that has issued certificates
- **THEN** the change is refused, asking to change the Lulus results first

### Requirement: Training needs
SDM → Kebutuhan Pelatihan SHALL list active employees whose position requires a certificate they do not have (Belum ada), whose current certificate is Kedaluwarsa, or is Segera Kedaluwarsa, grouped per certificate type with the employee, position, status and expiry date; HCM SHALL select employees in a group and start a new training for that certificate type with them as participants. (HCM-08, PRD §11.5)

#### Scenario: Grouped needs
- **WHEN** HCM opens Kebutuhan Pelatihan
- **THEN** TKBT Tingkat 2 lists Slamet (Kedaluwarsa) and SIM B1 lists Andi Wijaya (Belum ada)

#### Scenario: Start training from needs
- **WHEN** HCM selects Slamet under TKBT Tingkat 2 and chooses "Buat pelatihan"
- **THEN** a new training form opens with TKBT Tingkat 2 as the certificate type and Slamet as a participant

### Requirement: Training access by role
HCM SHALL manage trainings; Super Admin, Direktur and Operasional SHALL view trainings and training needs; Finance and Marketing SHALL NOT see them. (PRD §13)

#### Scenario: Direktur views only
- **WHEN** a Direktur opens a training
- **THEN** participants and results are shown without edit actions

### Requirement: Training list
SDM → Pelatihan SHALL list trainings with name, kind, organizer, dates, certificate type, number of participants and number passed, with search by name or organizer, filters for kind and date range, and Excel export. (HCM-07, UMM-09, UMM-04)

#### Scenario: Filter external trainings
- **WHEN** HCM filters kind Eksternal for November 2026
- **THEN** only external trainings starting in that range are listed and the export matches
