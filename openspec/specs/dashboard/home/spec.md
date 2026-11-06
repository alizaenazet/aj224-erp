# dashboard/home Specification

## Purpose
The home page (Beranda) shows each role what needs doing; this change adds the mobile home for Lapangan (DSB-04, PRD §9).

## Requirements

### Requirement: Lapangan home
For Lapangan the home page SHALL show their active project(s) with large buttons for the field actions available (Absensi Hari Ini, Laporan Harian, Terima Alat, Tambah Pekerja Lokal) and today's status: how many crew members have attendance recorded out of the crew assigned today, whether today's daily report is sent, and how many delivery notes wait for receipt. Lapangan without an active assignment SHALL see a message to contact HCM. (DSB-04, PRD §9)

#### Scenario: Status today
- **WHEN** Lukman, assigned to PRJ/AJ224/2026/001 with 6 crew, has recorded 4 of them today
- **THEN** the home shows the project with "Absensi hari ini 4/6 kru" and the Absensi Hari Ini button opens that project's list

#### Scenario: No assignment
- **WHEN** a Lapangan user has no active assignment
- **THEN** the home says no project is assigned and to contact HCM, and no field buttons are shown

#### Scenario: Report status
- **WHEN** today's report of the project is not sent yet
- **THEN** the home shows "Laporan hari ini belum dikirim" and the Laporan Harian button opens the form for today

#### Scenario: Delivery waiting
- **WHEN** one delivery note to the project is Dikirim
- **THEN** the home shows "1 surat jalan menunggu diterima" and the Terima Alat button opens it

### Requirement: Lapangan material actions
The Lapangan home SHALL show, for each active project, large buttons Terima Material and Pakai Material that open the receipt and usage forms preset to that project's location; the Lapangan menu SHALL list the same two actions. (DSB-04, MAT-02, MAT-03)

#### Scenario: Record usage from the home
- **WHEN** Lukman taps Pakai Material on his project card
- **THEN** the usage form opens with his project location selected

### Requirement: Lapangan incident action
The Lapangan home SHALL show a Lapor Insiden button for each active project that opens the incident form preset to that project; the Lapangan menu SHALL list Lapor Insiden. (DSB-04, K3-01)

#### Scenario: Report from the home
- **WHEN** Lukman taps Lapor Insiden on his project card
- **THEN** the incident form opens with his project selected

### Requirement: Lapangan field cash
The Lapangan home SHALL show, per active project, the field cash balance and a Catat Pengeluaran button that opens the spending form for that project. (DSB-04, FIN-10)

#### Scenario: Balance on the home
- **WHEN** Lukman opens Beranda
- **THEN** his project card shows "Kas lapangan Rp 18.000.000" and Catat Pengeluaran

### Requirement: Perlu Tindakan per role
Beranda SHALL show, for the signed-in role, short lists of pending work, each item linking to the page where it is handled: Marketing — top tenders by weighted value with Mendesak labels, bid deadlines within 7 days, follow-ups due; Finance — termin Siap Ditagih, invoices due within 7 days or overdue, supplier bills due within 7 days or overdue, field cash waiting verification, approved payroll to pay; HCM — expired or expiring certificates, local workers awaiting verification, running projects without attendance yesterday, returned payroll; Operasional — running projects without yesterday's daily report, recent tool shortfalls, open incidents and overdue actions, materials below minimum. Empty lists SHALL say so. (DSB-04)

#### Scenario: Finance sees ready termin
- **WHEN** Finance opens Beranda while Termin 1 is Siap Ditagih
- **THEN** "Termin siap ditagih" lists it with a link to Buat Invoice

#### Scenario: Operasional missing report
- **WHEN** a running project sent no report yesterday
- **THEN** Operasional's Beranda lists it under "Laporan harian belum masuk"
