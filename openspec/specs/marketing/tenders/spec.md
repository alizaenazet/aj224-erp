# marketing/tenders Specification

## Purpose
Tracks every tender from first information to the final result, keeps the full history of offer revisions and documents, reminds Marketing before bid deadlines, and ranks active tenders by weighted value (MKT-03 … MKT-07).

## Requirements

### Requirement: Tender records
Marketing SHALL record tenders with package name, client, end owner, location, voltage (150, 275 or 500 kV), length (kms), tower count, scope, information date, bid deadline, bid value, cost estimate (HPP), PIC (a Marketing user), win chance (0–100%) and notes. The planned margin SHALL be computed as (bid value − cost estimate) ÷ bid value and the weighted value as bid value × win chance. (MKT-03, MKT-07, PRD §11.1)

#### Scenario: Planned margin
- **WHEN** Marketing saves a tender with bid value Rp 12.500.000.000 and cost estimate Rp 10.625.000.000
- **THEN** the tender shows planned margin 15,0%

#### Scenario: Weighted value
- **WHEN** the same tender has win chance 40%
- **THEN** its weighted value is Rp 5.000.000.000

### Requirement: Tender status
Tenders SHALL move between Prospek, Persiapan Penawaran, Penawaran Dikirim, Negosiasi, Menang, Kalah and Batal (Tidak Ikut). Menang, Kalah and Batal SHALL record a closing date (today or earlier, default today). Kalah SHALL require a reason (Harga, Teknis, Jadwal, Relasi, Administrasi, Lainnya) and MAY record the winner and the winning price. Reopening a closed tender SHALL clear its closing data. (MKT-04)

#### Scenario: Lost without reason
- **WHEN** Marketing sets a tender to Kalah without a reason
- **THEN** the change is refused with a message that the reason is required

#### Scenario: Lost with details
- **WHEN** Marketing sets a tender to Kalah with reason Harga, winner "PT Kompetitor Jaya" and winning price Rp 11.900.000.000
- **THEN** the tender shows Kalah with the reason, winner and price, closed today

### Requirement: Bid revision history
Every change of a tender's bid value SHALL be stored automatically with time, old value, new value, the user and an optional note, including the first value; the history SHALL be shown on the tender page newest first and SHALL NOT be editable. (MKT-05)

#### Scenario: Revision recorded
- **WHEN** Marketing changes the bid value from Rp 12.500.000.000 to Rp 12.150.000.000 with note "Negosiasi harga besi"
- **THEN** the history shows that change with the user, time and note above the original value

### Requirement: Tender documents
Marketing SHALL attach documents to a tender in categories RKS, BoQ, Surat penawaran and Lainnya; users who may view the tender SHALL open them through temporary links. (MKT-03, UMM-03)

#### Scenario: Attach BoQ
- **WHEN** Marketing uploads an XLSX file as BoQ
- **THEN** the tender page lists it under BoQ and Finance can open it

### Requirement: Bid deadline reminders
The daily check SHALL notify Marketing users three days and one day before the bid deadline of tenders in Prospek or Persiapan Penawaran, once per tender and reminder. (MKT-06, UMM-06)

#### Scenario: H-3 reminder
- **WHEN** the daily check runs three days before the deadline of a tender in Persiapan Penawaran
- **THEN** each Marketing user gets "Batas penawaran 3 hari lagi" for that tender

#### Scenario: Submitted tender not reminded
- **WHEN** the tender is already Penawaran Dikirim
- **THEN** no deadline reminder is sent

### Requirement: Priority list
Marketing → Tender SHALL by default list active tenders (not Menang, Kalah or Batal) sorted by weighted value, highest first, showing the client's historical win rate as reference. (MKT-07)

#### Scenario: Highest weighted value first
- **WHEN** two active tenders have weighted values Rp 5 M and Rp 2 M
- **THEN** the Rp 5 M tender is listed first

### Requirement: Urgency labels
A tender not yet submitted (Prospek or Persiapan Penawaran) SHALL be labelled "Mendesak" when its bid deadline is today or within 7 days, and "Lewat batas" when the deadline has passed; other tenders SHALL carry no urgency label. (MKT-07)

#### Scenario: Urgent tender
- **WHEN** today is 25 Okt 2026 and a tender in Persiapan Penawaran has deadline 30 Okt 2026
- **THEN** the list shows it with the label Mendesak

#### Scenario: Submitted tender not urgent
- **WHEN** a tender in Penawaran Dikirim has deadline 30 Okt 2026
- **THEN** it carries no urgency label

### Requirement: Tender list filters and export
The tender list SHALL support search by package name, client or location, filters for status (active by default, all, or one status), client and voltage, sorting by weighted value, deadline, bid value or name, and Excel export of the filtered rows. (UMM-09, UMM-04)

#### Scenario: All lost tenders
- **WHEN** Marketing filters status Kalah
- **THEN** only Kalah tenders are listed and the export matches

### Requirement: Tender access by role
Marketing SHALL create and edit tenders; Super Admin, Direktur, Finance and Operasional SHALL view tenders and their documents; HCM and Lapangan SHALL NOT see tenders. Tenders SHALL NOT be deleted; Batal (Tidak Ikut) is used instead. (PRD §13, UMM-11)

#### Scenario: Super Admin views only
- **WHEN** a Super Admin opens a tender
- **THEN** it is shown without edit or status actions

### Requirement: Convert won tender to project
A tender with status Menang SHALL offer Marketing "Buat Proyek", which opens the new-project form prefilled from the tender (name, client, end owner, location, voltage, length, tower count, scope and the bid value as contract value); a tender SHALL produce at most one project, and the tender and project pages SHALL link to each other. (MKT-09)

#### Scenario: Create project from won tender
- **WHEN** Marketing chooses "Buat Proyek" on the won tender "Stringing SUTT 150 kV Kediri – Pare" and saves
- **THEN** a project with the tender's data and contract value Rp 10.000.000.000 is created, and the tender page links to it

#### Scenario: Second project refused
- **WHEN** someone tries to create another project from the same tender
- **THEN** "Buat Proyek" is not offered and the database refuses the link

#### Scenario: Only won tenders
- **WHEN** a tender is in Negosiasi
- **THEN** "Buat Proyek" is not offered
