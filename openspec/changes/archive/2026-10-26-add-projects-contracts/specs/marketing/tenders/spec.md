# Spec Delta

## ADDED Requirements

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
