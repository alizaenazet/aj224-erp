# Spec Delta

## Purpose

Provides the categories that tools and materials are grouped by and the units of measure used for stock quantities (MST-09).

## ADDED Requirements

### Requirement: Tool and material categories
The system SHALL keep categories per kind (Alat or Material), unique per kind ignoring case, starting with tool categories Mesin Utama, Alat Bantu, Alat Ukur, Kendaraan and APD, and material categories Konduktor & Kawat, Insulator, Fitting & Aksesoris and Consumable. (MST-09, ALT-01)

#### Scenario: Seeded categories
- **WHEN** an Operasional user opens Kategori Alat & Material on a new installation
- **THEN** 5 tool and 4 material categories are listed with their kind

#### Scenario: Same name in both kinds
- **WHEN** a category "Lainnya" is added for both Alat and Material
- **THEN** both are saved

### Requirement: Units of measure
The system SHALL keep units with a short unique code and a name, starting with m, kg, pcs, set, drum and liter. (MST-09, MAT-01)

#### Scenario: Add unit
- **WHEN** an Operasional user adds unit code "roll" named "Roll"
- **THEN** it is available for materials

### Requirement: Category and unit access by role
Super Admin and Operasional SHALL manage categories and units; Direktur SHALL view; all signed-in roles SHALL be able to read them. (PRD §13)

#### Scenario: HCM cannot manage
- **WHEN** an HCM user tries to add a unit through the API
- **THEN** the request is refused
