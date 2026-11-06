# Spec Delta: dashboard/home

## ADDED Requirements

### Requirement: Perlu Tindakan per role
Beranda SHALL show, for the signed-in role, short lists of pending work, each item linking to the page where it is handled: Marketing — top tenders by weighted value with Mendesak labels, bid deadlines within 7 days, follow-ups due; Finance — termin Siap Ditagih, invoices due within 7 days or overdue, supplier bills due within 7 days or overdue, field cash waiting verification, approved payroll to pay; HCM — expired or expiring certificates, local workers awaiting verification, running projects without attendance yesterday, returned payroll; Operasional — running projects without yesterday's daily report, recent tool shortfalls, open incidents and overdue actions, materials below minimum. Empty lists SHALL say so. (DSB-04)

#### Scenario: Finance sees ready termin
- **WHEN** Finance opens Beranda while Termin 1 is Siap Ditagih
- **THEN** "Termin siap ditagih" lists it with a link to Buat Invoice

#### Scenario: Operasional missing report
- **WHEN** a running project sent no report yesterday
- **THEN** Operasional's Beranda lists it under "Laporan harian belum masuk"
