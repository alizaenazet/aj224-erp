# Spec Delta

## Purpose

Lets Lapangan see the certificates of their crew (PRD §13: Sertifikat & pelatihan L (P: kru)).

## MODIFIED Requirements

### Requirement: Certificate access by role
HCM SHALL manage certificates; Super Admin, Direktur and Operasional SHALL view them; Lapangan SHALL view the certificates of the crew of their own active projects; Finance and Marketing SHALL NOT see certificates. (PRD §13)

#### Scenario: Operasional views only
- **WHEN** an Operasional user opens Sertifikat
- **THEN** certificates are listed without add, edit or delete actions

#### Scenario: Finance has no access
- **WHEN** a Finance user opens `/hr/certificates` or queries certificates through the API
- **THEN** they see "Akses ditolak" and no rows are returned

#### Scenario: Lapangan crew certificates
- **WHEN** Lapangan queries certificates through the API
- **THEN** only certificates of employees assigned to their active projects are returned
