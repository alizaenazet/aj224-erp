# Spec Delta

## Purpose

Keeps every tool with its stock per location and condition, its condition history and its stays on projects, and lists rented tools in use (ALT-01, ALT-02, ALT-05 … ALT-07).

## ADDED Requirements

### Requirement: Tool records
Operasional SHALL create and edit tools with code (unique), name, tool category, tracking type (Per Unit with serial number, or Per Jumlah), ownership (Milik Sendiri, or Sewa with supplier and rental rate per day or month), notes and a photo, and SHALL enter the opening stock (location, condition and quantity) when creating a tool; a Per Unit tool SHALL always total exactly 1. (ALT-01)

#### Scenario: Unit tool
- **WHEN** Operasional creates puller PL-01, Mesin Utama, Per Unit, serial PT-2019-0042, owned, opening stock 1 Baik at Gudang Lamongan
- **THEN** the tool is listed with total 1, Baik 1 at Gudang Lamongan

#### Scenario: Unit tool quantity refused
- **WHEN** a Per Unit tool is given an opening quantity of 2
- **THEN** it is refused

### Requirement: Stock per location and condition
The system SHALL keep each tool's quantity per location (warehouse or project) and condition (Baik, Rusak, Dalam Perbaikan, Hilang); the tool total SHALL be the sum over all locations and conditions plus quantities sent but not yet received. (ALT-02)

#### Scenario: Totals
- **WHEN** 20 pulleys are Baik at Gudang Lamongan, 30 Baik and 2 Rusak at PRJ-AJ224-2026-001, and 10 are on an unreceived delivery note
- **THEN** the pulley total is 62 and each location shows its quantities per condition

### Requirement: Condition changes
Operasional at any location, and Lapangan at their project locations, SHALL record a condition change of a quantity (e.g. Baik → Rusak, Rusak → Dalam Perbaikan, Dalam Perbaikan → Baik, Baik → Hilang) with a required note and an optional photo; the change SHALL be kept in the tool's history. (ALT-05)

#### Scenario: Broken on site
- **WHEN** Lapangan reports 2 pulleys at PRJ-AJ224-2026-001 from Baik to Rusak with note "Bearing pecah"
- **THEN** that location shows 28 Baik and 4 Rusak and the history lists the change by that user

### Requirement: Stock adjustment
Operasional SHALL be able to add or remove a quantity at a location and condition with a required reason (e.g. purchase or count correction), never below zero and never above 1 in total for a Per Unit tool; adjustments SHALL appear in the history and the audit log. (ALT-02, UMM-08)

#### Scenario: New purchase
- **WHEN** Operasional adds 10 Baik running boards at Gudang Lamongan with reason "Pembelian baru"
- **THEN** the stock rises by 10 and the history shows the adjustment with its reason

### Requirement: Tool history
Each tool SHALL show its movements (opening stock, sending, receipt, condition changes, adjustments) with date, quantity, locations, conditions, user and note; a Per Unit tool SHALL also show each stay at a location with start date, end date and the number of days. (ALT-06)

#### Scenario: Days on a project
- **WHEN** puller PL-01 was received at PRJ-AJ224-2026-001 on 1 Sep and sent back on 31 Okt
- **THEN** its history shows a stay at PRJ-AJ224-2026-001 from 1 Sep to 31 Okt of 60 days

### Requirement: Active rented tools
The rentals list SHALL show rented tools currently at project locations with project, supplier, quantity, date on site, rate and estimated running cost (rate × days, or × months for monthly rates); Finance SHALL see it to check vendor invoices. (ALT-07)

#### Scenario: Running cost
- **WHEN** a rented tensioner at Rp 750.000 per day has been at PRJ-AJ224-2026-001 for 20 days
- **THEN** the rentals list shows an estimated running cost of Rp 15.000.000

### Requirement: Tool access by role
Operasional SHALL manage tools and stock; Super Admin, Direktur and Finance SHALL view them; Lapangan SHALL see the tools and stock at their own project locations and report condition there; Marketing and HCM SHALL NOT see tools. Stock SHALL change only through the tool and delivery note functions. (PRD §13)

#### Scenario: HCM refused
- **WHEN** an HCM user opens `/operations/tools` or queries tools through the API
- **THEN** access is denied and no rows are returned

#### Scenario: Lapangan another location
- **WHEN** Lapangan reports a condition change at Gudang Lamongan through the API
- **THEN** it is refused
