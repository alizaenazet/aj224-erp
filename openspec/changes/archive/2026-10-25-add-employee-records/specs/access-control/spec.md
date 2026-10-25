# Spec Delta

## ADDED Requirements

### Requirement: Link an account to an employee
A Super Admin SHALL link a user account to an employee record and SHALL be able to change or remove the link; an employee SHALL be linked to at most one account, and the user list SHALL show the linked employee. Lapangan accounts SHALL be linked to an employee so their project access can follow their assignments. (MST-01, PRD §14)

#### Scenario: Link field account
- **WHEN** a Super Admin chooses "Hubungkan karyawan" for the Lapangan user Lukman and picks employee Lukman Hakim
- **THEN** the user list shows Lukman Hakim as the linked employee

#### Scenario: Employee already linked
- **WHEN** a Super Admin tries to link a second account to an employee who already has one
- **THEN** the link is refused with a message that the employee is already linked to another account

#### Scenario: Direktur cannot link
- **WHEN** a Direktur views Pengguna & Peran
- **THEN** the linked employee is shown but no link action is offered, and any attempt is refused
