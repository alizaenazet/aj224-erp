# Spec Delta: k3-incidents/incidents

## Purpose
Records safety incidents per project with people involved, investigation and corrective actions, so causes are fixed and serious incidents reach management at once (K3-01 … K3-04).

## ADDED Requirements

### Requirement: Report an incident
Operasional (any project) and Lapangan (only their assigned projects) SHALL report an incident with date and time (not in the future), project, optional seksi of that project, tower/location note, classification, chronology (required), people involved (an employee or an outside name, with involvement and injured body part), witnesses, immediate action and photos. Saving SHALL assign the next incident number and status Dilaporkan without requiring an investigation. (K3-01, UMM-10)

#### Scenario: Lapangan reports a near miss
- **WHEN** Lukman reports a Near Miss on his project with chronology "Tali pilot wire lepas dari pulley di T.14"
- **THEN** the incident gets number K3/AJ224/2026/001, status Dilaporkan, and appears in Insiden K3

#### Scenario: Other project
- **WHEN** Lukman reports an incident on a project he is not assigned to
- **THEN** it is refused

### Requirement: Immediate LTI/Fatal notification
When an incident is saved as LTI or Fatal, or an edit changes its classification to LTI or Fatal, Direktur and Operasional users SHALL receive an in-app notification in the same transaction. (K3-02; email not built by decision)

#### Scenario: LTI reported
- **WHEN** an LTI incident is reported
- **THEN** every active Direktur and Operasional user has an unread notification "Insiden LTI" linking to it

### Requirement: Edit and investigate
Operasional SHALL edit an incident that is not Ditutup or Batal, and SHALL record the investigation: direct cause, root cause category (Manusia, Alat, Metode, Lingkungan, Material) and lost work days (≥ 0); saving the investigation SHALL move the status to Investigasi. (K3-03)

#### Scenario: Investigation saved
- **WHEN** Operasional records root cause Metode and 3 lost days
- **THEN** the incident shows status Investigasi with those values

### Requirement: Corrective actions
Operasional SHALL add corrective actions with description, PIC (employee), due date and status Terbuka/Selesai, attach evidence, and mark them Selesai with a note; an action past its due date and still Terbuka SHALL be marked overdue. (K3-04)

#### Scenario: Overdue action
- **WHEN** an action due yesterday is still Terbuka
- **THEN** it is shown as terlambat on the incident and in the summary

### Requirement: Close and cancel
Operasional SHALL close an incident only when the investigation (root cause) is filled and every action is Selesai; otherwise closing is refused with the reason. Operasional SHALL cancel an incident with a required reason; a cancelled incident stays visible as Batal and is excluded from counts. (K3-03, K3-04, UMM-11)

#### Scenario: Open action blocks closing
- **WHEN** Operasional closes an incident with one Terbuka action
- **THEN** it is refused with "Semua tindakan perbaikan harus Selesai"

### Requirement: Incident list and print
Insiden K3 SHALL list incidents with number, date, project, classification, status and open actions, with search, filters (project, classification, status, date range) and Excel export; each incident SHALL print on A4 with the letterhead, details, people, investigation and actions, and photos on following pages. (UMM-04, UMM-05, UMM-09)

#### Scenario: Print
- **WHEN** Operasional prints K3/AJ224/2026/001
- **THEN** an A4 page with the company letterhead and the incident details opens

### Requirement: Incident access by role
Super Admin, Direktur, HCM and Operasional SHALL read all incidents; Lapangan SHALL read and report only for their assigned projects and SHALL NOT investigate, edit actions, close or cancel; Finance and Marketing SHALL see no incident data. Direct table writes SHALL be refused. (PRD §13)

#### Scenario: Finance opens Insiden K3
- **WHEN** a Finance user opens /operations/incidents
- **THEN** the access denied message is shown
