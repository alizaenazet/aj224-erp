# Spec Delta

## Purpose

Progress now also comes from daily reports, and lowering progress needs a reason (OPS-01, PRJ-06).

## MODIFIED Requirements

### Requirement: Stage progress with source
Operasional SHALL set the cumulative progress (0–100%) of each stage of a section, and daily reports SHALL set it when sent; every change SHALL be logged with the old and new value, who changed it, when, the source (manual or daily report with its report) and a note. Lowering a value SHALL be possible only for Operasional with a reason. Progress SHALL NOT change on a closed project. (PRJ-06, OPS-01)

#### Scenario: Manual update logged
- **WHEN** Operasional sets Penarikan Konduktor of S-03 from 0% to 50% with note "Tarik konduktor T.12–T.15"
- **THEN** the matrix shows 50% and the progress log lists S-03 · Penarikan Konduktor 0% → 50%, manual, by that user

#### Scenario: Lowering needs a reason
- **WHEN** Operasional lowers S-03 Penarikan Konduktor from 60% to 55% without a note
- **THEN** the change is refused with a reason that lowering progress needs a reason
