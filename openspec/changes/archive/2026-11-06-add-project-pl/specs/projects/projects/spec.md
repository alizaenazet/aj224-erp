# Spec Delta: projects/projects

## ADDED Requirements

### Requirement: Ringkasan figures
The Ringkasan tab SHALL show progress vs plan and, for roles that may read P/L, health status, contract value, total billed, total received, total cost and gross profit; and to every role that may read the module: active crew today, tools on site, incident count with LTI-free days, and the latest daily report obstacles — all from their modules without re-entry. (PRJ-09)

#### Scenario: Finance opens Ringkasan
- **WHEN** Finance opens Ringkasan of Kediri – Pare
- **THEN** it shows health Waspada or Normal, billed and received amounts, cost and gross profit next to progress vs plan

### Requirement: Project closing
A project in Selesai SHALL be closed (Ditutup) by Finance or Operasional only when the checklist passes: no tools at the project location or in transit to it, no material stock left there, field cash balance 0 with nothing pending, and every termin other than retention Lunas. Direktur SHALL be able to close with an override note when items fail; the override SHALL be written to the audit log. The checklist SHALL be shown with each item's state. (PRJ-11, UMM-08)

#### Scenario: Blocked by field cash
- **WHEN** Operasional closes a Selesai project whose field cash balance is Rp 500.000
- **THEN** closing is refused and the checklist shows "Kas lapangan belum nol"

#### Scenario: Direktur override
- **WHEN** Direktur closes it with note "Sisa kas diganti PIC via potong gaji"
- **THEN** the project is Ditutup and the audit log shows the override with the note
