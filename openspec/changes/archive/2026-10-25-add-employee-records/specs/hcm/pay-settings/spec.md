# Spec Delta

## Purpose

Holds each employee's pay settings for payroll in a place only HCM, Finance and Direktur can see, separate from the general employee data (HCM-02).

## ADDED Requirements

### Requirement: Pay settings per employee
HCM SHALL set per employee: pay type (Harian or Bulanan), daily wage (Harian) or base salary (Bulanan), fixed allowance, meal allowance per day, field allowance per day, overtime rate per hour and fixed deduction (BPJS), all as non-negative Rupiah amounts. (HCM-02)

#### Scenario: Daily worker
- **WHEN** HCM sets Agus to Harian with daily wage Rp 150.000, meal allowance Rp 25.000 and field allowance Rp 30.000
- **THEN** the pay card shows those amounts formatted as Rupiah

#### Scenario: Missing wage for type
- **WHEN** HCM chooses Harian but leaves the daily wage empty
- **THEN** saving is refused with a message that the daily wage is required

#### Scenario: Negative amount
- **WHEN** any amount is negative
- **THEN** saving is refused

### Requirement: Pay settings are restricted
Pay settings SHALL be readable only by HCM, Finance and Direktur and changeable only by HCM; Super Admin and other roles SHALL NOT see them, in the app or through the API. (HCM-02, PRD §6, §14)

#### Scenario: Super Admin cannot see pay
- **WHEN** a Super Admin opens an employee's detail page
- **THEN** no pay section is shown and the API returns no pay rows for them

#### Scenario: Finance reads only
- **WHEN** a Finance user opens an employee's pay section
- **THEN** the amounts are shown without an edit action

### Requirement: Pay changes are audited
Every change to pay settings SHALL be recorded in the audit log. Pay entries SHALL be visible to Direktur only; Super Admin, who cannot read pay, SHALL NOT see them in the log. (UMM-08, PRD §6)

#### Scenario: Wage change recorded
- **WHEN** HCM raises Agus's daily wage from Rp 150.000 to Rp 160.000
- **THEN** Direktur sees "Upah harian: Rp 150.000 → Rp 160.000" with the HCM user as actor in the employee's pay history and in Log Audit

#### Scenario: Super Admin does not see pay entries
- **WHEN** a Super Admin opens Log Audit after that change
- **THEN** no pay settings entry is listed
