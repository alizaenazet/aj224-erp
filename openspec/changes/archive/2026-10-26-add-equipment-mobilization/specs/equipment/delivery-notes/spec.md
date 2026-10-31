# Spec Delta

## Purpose

Moves tools between locations with a numbered, printable delivery note that the receiver confirms, recording shortfalls automatically (ALT-03, ALT-04).

## ADDED Requirements

### Requirement: Send a delivery note
Operasional SHALL create a delivery note with origin and destination (different locations), date, vehicle, driver, notes and lines of tool, condition and quantity; sending SHALL number it (document type Surat Jalan), set it Dikirim and reduce the origin stock of each line, refusing quantities above the stock in that condition. The project team at the destination SHALL be notified. (ALT-03, UMM-10)

#### Scenario: Mobilize to a project
- **WHEN** Operasional sends puller PL-01 (1 Baik) and 10 pulleys (Baik) from Gudang Lamongan to PRJ-AJ224-2026-001
- **THEN** the note gets number SJ/AJ224/2026/10/001 with status Dikirim, the warehouse loses those quantities and Lukman gets "Alat dikirim ke proyek"

#### Scenario: Not enough stock
- **WHEN** a line asks for 40 pulleys Baik while the origin has 20
- **THEN** sending is refused with a reason naming the tool and the available quantity

### Requirement: Receipt confirmation
The receiver (Lapangan at the destination project, or Operasional) SHALL confirm per line the quantity received Baik and Rusak; the destination stock SHALL grow by those quantities, any shortfall SHALL be recorded as Hilang at the destination, and a line with damage or shortfall SHALL require a note; a note with a discrepancy SHALL require at least one photo before confirming and SHALL notify Operasional. The note becomes Diterima. (ALT-04)

#### Scenario: All received
- **WHEN** Lukman confirms 1 puller Baik and 10 pulleys Baik
- **THEN** the note is Diterima and the project location shows those tools Baik

#### Scenario: Shortfall
- **WHEN** Lukman confirms 8 pulleys Baik and 1 Rusak out of 10 with note "1 pecah, 1 tidak ada" and a photo
- **THEN** the project shows 8 Baik, 1 Rusak and 1 Hilang for pulleys, and Operasional gets "Selisih penerimaan surat jalan"

### Requirement: Cancel before receipt
Operasional SHALL cancel a Dikirim note with a required reason; the quantities SHALL return to the origin in their sent condition and the note SHALL show Batal with the reason. A received note SHALL NOT be cancelled. (ALT-03, UMM-11)

#### Scenario: Wrong destination
- **WHEN** Operasional cancels a Dikirim note with reason "Salah tujuan"
- **THEN** the note is Batal and the warehouse stock is restored

### Requirement: Delivery note list and print
Operasional → Surat Jalan SHALL list notes with number, date, origin, destination, status and line count, with filters for status and location and Excel export; each note SHALL print on A4 with the letterhead, the lines and signature boxes for sender, driver and receiver. (ALT-03, UMM-04, UMM-05)

#### Scenario: Print
- **WHEN** Operasional prints SJ/AJ224/2026/10/001
- **THEN** the print view shows origin, destination, vehicle, driver, each line with quantity and condition, and three signature boxes

### Requirement: Delivery note access by role
Operasional SHALL create, receive and cancel notes; Lapangan SHALL see and receive notes to or from their project locations; Super Admin, Direktur and Finance SHALL view notes; Marketing and HCM SHALL NOT see them. (PRD §13)

#### Scenario: Lapangan cannot send
- **WHEN** Lapangan tries to create a delivery note through the API
- **THEN** it is refused
