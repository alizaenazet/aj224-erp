# platform/list-views Specification

## Purpose
Defines how every list in AJ224 ERP behaves: text search, filters (status, project, date range), sorting, pagination and URL-based state, so users find records the same way everywhere (UMM-09).

## Requirements

### Requirement: Text search
Each list SHALL offer a text search over its main text fields; results update shortly after typing stops and the search is case-insensitive. (UMM-09)

#### Scenario: Search users
- **WHEN** a Super Admin types "maya" in the search box on Pengguna & Peran
- **THEN** only users whose name or email contains "maya" are listed

### Requirement: Choice filters
Lists SHALL offer filters for their key attributes (such as status or role) that combine with the search and with each other. (UMM-09)

#### Scenario: Combine filter and search
- **WHEN** a Super Admin filters Pengguna & Peran by Peran "Finance" and Status "Aktif"
- **THEN** only active Finance users are listed

#### Scenario: Reset filters
- **WHEN** the user chooses "Reset filter"
- **THEN** search and filters are cleared and the full list is shown

### Requirement: Date range filter
Lists with dated records SHALL offer a date-range filter in Bahasa Indonesia; a range includes whole days in WIB from the start date to the end date. (UMM-09)

#### Scenario: Audit entries for one day
- **WHEN** a Super Admin filters Log Audit from 25 Okt 2026 to 25 Okt 2026
- **THEN** only entries made on 25 Okt 2026 WIB are listed

### Requirement: Sorting
Lists SHALL allow sorting by their sortable columns, toggling ascending and descending. (UMM-09)

#### Scenario: Sort by last sign-in
- **WHEN** a Super Admin sorts Pengguna & Peran by Login Terakhir descending
- **THEN** the most recently signed-in user is first

### Requirement: Pagination
Lists SHALL show at most 50 rows per page with controls for the previous and next page and the current page number. (UMM-09, PRD §14)

#### Scenario: Second page
- **WHEN** a list has 60 matching rows
- **THEN** the first page shows 50 and "Halaman 1 dari 2", and the next page shows the remaining 10

### Requirement: List state in the URL
Search, filters, sorting and page SHALL be kept in the page address so reloading or sharing it reproduces the same view; changing search or a filter SHALL return to page 1. (UMM-09)

#### Scenario: Reload keeps filters
- **WHEN** a user reloads Log Audit filtered by "Pengguna" on page 2
- **THEN** the same filter and page are shown

#### Scenario: New filter resets the page
- **WHEN** a user on page 2 changes a filter
- **THEN** page 1 of the new result is shown

### Requirement: Empty results
When nothing matches, a list SHALL say so and offer to reset the filters. (UMM-09)

#### Scenario: No match
- **WHEN** a search matches no rows
- **THEN** the list shows "Tidak ada data yang cocok" with a "Reset filter" action
