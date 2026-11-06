# Spec Delta: k3-incidents/summary

## Purpose
Gives management the safety picture: incident counts, LTI-free days, open actions and LTIFR per project and for the company (K3-05, PRD §11.6).

## ADDED Requirements

### Requirement: K3 summary
The K3 summary SHALL show, for a chosen period (default the current year) and per project plus a company total: incident count per classification, open and overdue corrective actions, work hours = Σ(present days × standard work hours + overtime hours) from attendance, LTIFR = (LTI + Fatal) × 1.000.000 ÷ work hours (shown as — when hours are 0), and LTI-free days = today − date of the last LTI/Fatal (since project start when none; for the company since the earliest project start). A monthly table SHALL show incident counts per classification per month. Cancelled incidents SHALL NOT count. (K3-05)

#### Scenario: No LTI yet
- **WHEN** a project started 45 days ago has no LTI or Fatal incident
- **THEN** its LTI-free days is 45

#### Scenario: LTIFR
- **WHEN** a project has 1 LTI and 2.000 work hours in the period
- **THEN** its LTIFR is 500

### Requirement: Summary access
Super Admin, Direktur, HCM and Operasional SHALL see the summary for all projects; Lapangan SHALL see the K3 tab of their own projects only. (PRD §13)

#### Scenario: Project tab
- **WHEN** Lukman opens the K3 tab of his project
- **THEN** he sees its incidents and LTI-free days
