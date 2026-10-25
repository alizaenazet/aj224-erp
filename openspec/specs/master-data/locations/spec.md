# master-data/locations Specification

## Purpose
Defines the places where tools and materials are kept: company warehouses and one location per project, used by stock and delivery notes (MST-04).

## Requirements

### Requirement: Warehouse and project locations
The system SHALL keep locations with a unique code, name, type (Gudang or Proyek), address and active flag, seeded with "Gudang Lamongan". Users SHALL create warehouses; project locations SHALL only be created by the system together with their project. (MST-04)

#### Scenario: Seeded warehouse
- **WHEN** the system is first set up
- **THEN** a warehouse "Gudang Lamongan" with code GDG-LMG exists

#### Scenario: Add warehouse
- **WHEN** an Operasional user adds warehouse "Gudang Tuban" with code GDG-TBN
- **THEN** it is listed as type Gudang

#### Scenario: Duplicate code
- **WHEN** a second location uses code GDG-TBN
- **THEN** the save is refused with "Data yang sama sudah ada."

### Requirement: Location access by role
Super Admin and Operasional SHALL manage warehouses; Direktur SHALL view; every signed-in role SHALL be able to read locations for stock forms. (PRD §13)

#### Scenario: Marketing cannot manage
- **WHEN** a Marketing user tries to create a location through the API
- **THEN** the request is refused
