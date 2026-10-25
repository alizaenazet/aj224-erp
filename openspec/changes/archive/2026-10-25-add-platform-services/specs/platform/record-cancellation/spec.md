# Spec Delta

## Purpose

Keeps transactions permanent: instead of being deleted, a transaction is cancelled (status Batal) with who, when and why, stays visible with a marker, and no longer counts in reports (UMM-11).

## ADDED Requirements

### Requirement: Transactions cannot be hard-deleted
Tables designated as transaction tables SHALL refuse deletion of rows by any user, with the message "Data transaksi tidak dapat dihapus. Gunakan Batal dengan alasan." (UMM-11, PRD §14)

#### Scenario: Delete refused
- **WHEN** anyone deletes a row from a transaction table
- **THEN** the deletion is refused with that message and the row remains

### Requirement: Cancellation needs a reason
Cancelling a transaction SHALL record the cancellation time, the user and a non-empty reason; a cancellation without a reason SHALL be refused. (UMM-11)

#### Scenario: Missing reason
- **WHEN** a transaction is marked cancelled with an empty reason
- **THEN** the change is refused

#### Scenario: Cancellation stored
- **WHEN** a transaction is cancelled with the reason "Salah input"
- **THEN** it keeps all its data and additionally shows Batal, the user, the time and the reason

### Requirement: Cancelled transactions stay visible but do not count
Lists SHALL keep showing cancelled transactions with a "Batal" marker, and every total, balance or report SHALL exclude them. (UMM-11)

#### Scenario: Excluded from totals
- **WHEN** one of three supplier bills for a project is cancelled
- **THEN** the project's cost total includes only the other two, and the cancelled bill is still listed with "Batal"
