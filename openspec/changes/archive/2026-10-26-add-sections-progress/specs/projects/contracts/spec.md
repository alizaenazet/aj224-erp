# Spec Delta

## Purpose

Adds the automatic part of the payment-term schedule: terms whose progress or date condition is met become Siap Ditagih without manual action (PRJ-03, PRD §11.2).

## ADDED Requirements

### Requirement: Automatic term readiness
A Belum Waktunya term SHALL become Siap Ditagih automatically, recorded as done by the system, when its condition is met: project progress ≥ the term's progress condition (checked whenever progress, sections or stages change and when the term is saved), or the term's date has arrived (checked daily and when the term is saved). Each Finance user SHALL be notified once per term. (PRJ-03, PRD §11.2)

#### Scenario: Progress reaches the condition
- **WHEN** project progress rises from 48% to 52% and Termin 1 has condition progress ≥ 50%
- **THEN** Termin 1 becomes Siap Ditagih by Sistem and each Finance user gets "Termin siap ditagih"

#### Scenario: Retention date arrives
- **WHEN** the daily check runs on 1 Okt 2027 and Retensi has condition date 1 Okt 2027
- **THEN** Retensi becomes Siap Ditagih and Finance is notified

#### Scenario: Not yet met
- **WHEN** project progress is 40% and Termin 1 needs ≥ 50%
- **THEN** Termin 1 stays Belum Waktunya
