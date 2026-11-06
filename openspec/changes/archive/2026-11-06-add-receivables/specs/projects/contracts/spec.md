# Spec Delta: projects/contracts

## ADDED Requirements

### Requirement: Termin billing link
In Kontrak & Termin, Finance SHALL see a Buat Invoice action on each Siap Ditagih termin without an active invoice, and every role that may read invoices SHALL see the invoice number linked on termin that are Ditagih or Lunas. Termin status SHALL follow its invoice: Ditagih when issued, Lunas when paid, back to Siap Ditagih when the invoice is cancelled. (PRJ-03, FIN-01)

#### Scenario: Bill a ready termin
- **WHEN** Finance opens Kontrak & Termin with Termin 1 in Siap Ditagih
- **THEN** Termin 1 shows Buat Invoice, which opens the invoice form for that termin
