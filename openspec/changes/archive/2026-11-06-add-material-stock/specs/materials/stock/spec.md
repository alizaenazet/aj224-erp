# Spec Delta: materials/stock

## Purpose
Records materials and their quantity per location (gudang or project) through receipts, usage, returns, transfers and stock opname, so stock is always known without valuation (MAT-01 … MAT-05, MAT-07).

## ADDED Requirements

### Requirement: Material data
Operasional SHALL maintain materials with a unique code, name, unit, material category, ownership (Milik Perusahaan or Titipan Klien), optional minimum stock and notes; a material SHALL be deactivated instead of deleted once it has movements. (MAT-01)

#### Scenario: New consumable
- **WHEN** Operasional adds GRS-01 "Grease" unit kg, category Consumable, Milik Perusahaan, minimum 20
- **THEN** the material appears in Material & Stok with total stock 0

#### Scenario: Duplicate code
- **WHEN** Operasional adds another material with code grs-01
- **THEN** saving is refused with "Kode material sudah dipakai"

### Requirement: Material receipt
Operasional (any location) and Lapangan (only the location of their assigned project) SHALL record a receipt with date, location, source (Supplier with nota number, or Klien with surat jalan/BA number), optional supplier, notes, and lines of material and quantity (> 0); the location stock SHALL grow by each line, and document photos SHALL be attachable. Lapangan SHALL NOT date a receipt more than the backdate limit (default H+3) in the past or in the future. (MAT-02, A5)

#### Scenario: Client material arrives at site
- **WHEN** Lukman (Lapangan, PRJ-…-003) records a receipt from Klien, BA no. "BA-17/UIP", 3.000 m ACSR Zebra, with a photo of the BA
- **THEN** the project location shows 3.000 m ACSR Zebra and the receipt is listed under Transaksi Material

#### Scenario: Lapangan at another site
- **WHEN** Lukman records a receipt at Gudang Lamongan
- **THEN** it is refused

### Requirement: Material usage
Operasional and Lapangan (their project) SHALL record usage at a project location with date, optional seksi of that project, notes and lines; a line SHALL be refused when its quantity exceeds the stock at that location. (MAT-03)

#### Scenario: Usage within stock
- **WHEN** Lukman records usage of 600 m ACSR Zebra for seksi S-03
- **THEN** the project stock drops to 2.400 m

#### Scenario: Usage above stock
- **WHEN** a usage line asks for 5.000 m while 2.400 m is on hand
- **THEN** it is refused naming the material and the available quantity

### Requirement: Return to client
Operasional SHALL record titipan material returned from a project location to the client with date, document number and lines; it reduces the project stock and counts as returned in the reconciliation. (MAT-06)

#### Scenario: Leftover returned
- **WHEN** Operasional returns 150 m ACSR Zebra with BA no. "BA-RET-02"
- **THEN** the project stock drops by 150 m

### Requirement: Stock opname
Operasional SHALL record a stock opname for a location: counted quantity per material and a required reason; each difference against the system quantity SHALL be posted to the stock and written to the audit log. (MAT-05)

#### Scenario: Counted less than recorded
- **WHEN** Operasional counts 18 kg grease at Gudang Lamongan where the system shows 20 kg, reason "Opname bulanan"
- **THEN** stock becomes 18 kg and the audit log shows −2 kg with the reason

### Requirement: Cancel a transaction
Operasional SHALL cancel a receipt, usage or return with a required reason; the stock effect SHALL be reversed (refused when the reversal would make stock negative) and the transaction SHALL stay visible as Batal. Stock opname SHALL NOT be cancelled. (UMM-11)

#### Scenario: Wrong quantity
- **WHEN** Operasional cancels a usage of 600 m with reason "Salah input"
- **THEN** the 600 m returns to the project stock and the usage shows Batal

### Requirement: Stock views
Material & Stok SHALL list materials with total stock and stock per location, with search, filters (category, ownership, location), a low-stock marker and Excel export; each material SHALL show stock per location and its movement history; Transaksi Material SHALL list transactions with filters (type, location, date range) and export. (UMM-04, UMM-09)

#### Scenario: Filter by location
- **WHEN** Operasional filters Material & Stok by the PRJ-…-003 location
- **THEN** only materials with stock there are listed with the quantity at that location

### Requirement: Minimum stock reminder
The daily check SHALL notify Operasional once per day for each active company material whose stock at a location where it is kept is below its minimum. (MAT-07)

#### Scenario: Below minimum
- **WHEN** grease at Gudang Lamongan is 18 kg with minimum 20 and the daily check runs
- **THEN** Operasional gets "Stok di bawah minimum" naming GRS-01, Gudang Lamongan, 18 kg and the minimum, once that day

### Requirement: Material access by role
Super Admin, Direktur, Finance and Operasional SHALL read all material data; Lapangan SHALL read the material list and only stock, transactions and movements of their assigned project locations; HCM and Marketing SHALL see no material data. Only Operasional SHALL manage materials, opname, returns and cancellations; direct table writes SHALL be refused. (PRD §13, UMM-02)

#### Scenario: HCM opens Material & Stok
- **WHEN** an HCM user opens /operations/materials
- **THEN** the access denied message is shown and no data is returned

#### Scenario: Lapangan opens another project's transactions
- **WHEN** Lukman opens a transaction of a project he is not assigned to by URL
- **THEN** it is not found
