# Spec Delta

## Purpose

Certificates issued by a training follow later corrections of that training (HCM-07).

## MODIFIED Requirements

### Requirement: Certificates from passed participants
When a participant's result becomes Lulus and the training produces a certificate type, the system SHALL create a certificate for that employee with issue date = the training's end date (or start date when there is none), expiry = issue date + the type's validity (none for lifetime types), issuer = the organizer, and a link to the training; its number and scan SHALL be completable later. Changing the result away from Lulus SHALL remove that automatically created certificate. Changing the training's organizer or dates SHALL update the certificates it issued; adding a certificate type SHALL issue certificates to participants who already passed; changing the certificate type SHALL be refused while certificates from the training exist. (HCM-07)

#### Scenario: Passed participant gets certificate
- **WHEN** HCM marks Slamet as Lulus in the TKBT Tingkat 2 training ending 5 Nov 2026
- **THEN** Slamet gets a TKBT Tingkat 2 certificate issued 5 Nov 2026, expiring 5 Nov 2031, which supersedes his expired one

#### Scenario: Result corrected
- **WHEN** HCM changes Slamet's result from Lulus to Tidak Lulus
- **THEN** the certificate created from that training is removed

#### Scenario: Training without certificate type
- **WHEN** a participant passes an internal workshop without a certificate type
- **THEN** no certificate is created

#### Scenario: Training dates corrected
- **WHEN** HCM moves the end date of the TKBT Tingkat 2 training from 23 Sep to 24 Sep 2026 after Budi passed
- **THEN** Budi's certificate from it is issued 24 Sep 2026 and expires 24 Sep 2031

#### Scenario: Certificate type added later
- **WHEN** HCM sets P3K as the certificate type of a workshop where Joko already passed
- **THEN** Joko gets a P3K certificate linked to that workshop

#### Scenario: Type change refused
- **WHEN** HCM changes the certificate type of a training that has issued certificates
- **THEN** the change is refused, asking to change the Lulus results first
