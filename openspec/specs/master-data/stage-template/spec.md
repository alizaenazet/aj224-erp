# master-data/stage-template Specification

## Purpose
Defines the default stringing stages and their weights that each project's sections start from when progress is measured (MST-08, PRD §11.2).

## Requirements

### Requirement: Default stages and weights
The system SHALL start with the stages Pemasangan Pulley (10), Penarikan Pilot Wire (10), Penarikan Konduktor (30), Sagging (15), Clamping (15), Spacer & Damper (10), Jumper (5) and GSW/OPGW (5) in that order. (MST-08)

#### Scenario: Seeded template
- **WHEN** an Operasional user opens Tahapan Stringing on a new installation
- **THEN** the 8 stages are listed in order with a total weight of 100

### Requirement: Weights must total 100
Operasional and Super Admin SHALL edit stage names, order, weights and active flags together, and the system SHALL refuse to save when the active weights do not total exactly 100. (MST-08)

#### Scenario: Valid edit
- **WHEN** an Operasional user changes Sagging to 20 and Clamping to 10 and saves
- **THEN** the template is saved with total 100

#### Scenario: Invalid total
- **WHEN** an Operasional user changes Jumper to 10 without reducing another stage
- **THEN** saving is refused with "Total bobot harus 100 (sekarang 105)" and nothing is changed

#### Scenario: Other roles cannot edit
- **WHEN** a Finance user tries to change a stage weight through the API
- **THEN** the change is refused
