# Spec Delta: equipment/delivery-notes

## ADDED Requirements

### Requirement: Material lines on a delivery note
A delivery note SHALL carry tool lines, material lines or both (at least one line). On sending, each material line SHALL take its quantity from the origin stock (refused above the available quantity). On receipt, the receiver SHALL confirm the quantity received per material line (≤ sent); the destination stock SHALL grow by it, a shortfall SHALL require a note, count as a discrepancy (photo required, Operasional notified) and be recorded as lost in transit. Cancelling a Dikirim note SHALL return material quantities to the origin. The note page and the A4 print SHALL list material lines with unit. (MAT-04, ALT-03, ALT-04)

#### Scenario: Send material to a project
- **WHEN** Operasional sends 10 kg grease and 2 pulleys from Gudang Lamongan to PRJ-…-003
- **THEN** the warehouse loses 10 kg grease and 2 pulleys and the note lists both

#### Scenario: Material shortfall
- **WHEN** Lukman confirms 8 kg of the 10 kg grease with note "1 ember bocor" and a photo
- **THEN** the project stock gains 8 kg, 2 kg is recorded as lost in transit and Operasional is notified

#### Scenario: Material only
- **WHEN** Operasional sends a note with only material lines
- **THEN** it is accepted
