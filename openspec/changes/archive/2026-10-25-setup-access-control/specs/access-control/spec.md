# Spec Delta

## Purpose

Controls who can use AJ224 ERP and what each role may see and do: invite-only accounts, sign-in and password recovery, one role per account, role-scoped navigation and pages, and user administration by Super Admin.

## ADDED Requirements

### Requirement: Invite-only accounts
The system SHALL create accounts only through an invitation sent by a Super Admin. There SHALL be no public sign-up page, and Supabase Auth SHALL reject self sign-up requests. (UMM-01, MST-01)

#### Scenario: No sign-up page
- **WHEN** anyone opens `/auth/sign-up`
- **THEN** the page does not exist and no sign-up form is offered anywhere in the app

#### Scenario: Self sign-up rejected by Auth
- **WHEN** a client calls the Auth sign-up endpoint directly with a new email
- **THEN** the request is rejected and no account is created

### Requirement: Sign in with email and password
The system SHALL let an active user with a role sign in with email and password and land on Beranda. Error messages SHALL be in Bahasa Indonesia and SHALL NOT reveal whether the email exists. (UMM-01)

#### Scenario: Successful sign-in
- **WHEN** an active Finance user submits a correct email and password on `/auth/login`
- **THEN** they are signed in and taken to Beranda (`/`)

#### Scenario: Wrong credentials
- **WHEN** a user submits a wrong password or an unknown email
- **THEN** the form shows "Email atau kata sandi salah" and the user stays signed out

#### Scenario: Unauthenticated access redirected
- **WHEN** a signed-out visitor opens any app page, including `/`
- **THEN** they are redirected to `/auth/login`

### Requirement: Accept invitation and set password
The system SHALL let an invited person open the invitation link, set their own password (minimum 8 characters) and continue into the app signed in. (UMM-01, MST-01)

#### Scenario: Invite link sets password
- **WHEN** an invited user opens a valid invitation link and submits a new password of at least 8 characters
- **THEN** the password is saved and they land on Beranda signed in

#### Scenario: Password too short
- **WHEN** the user submits a password shorter than 8 characters
- **THEN** the form refuses it with a message in Bahasa Indonesia

#### Scenario: Expired or used link
- **WHEN** a user opens an invitation link that is expired or already used
- **THEN** they see an error page in Bahasa Indonesia telling them to ask the Super Admin for a new invitation

### Requirement: Password recovery by email
The system SHALL let a user request a password reset email from the sign-in page and set a new password (minimum 8 characters) from the emailed link. (UMM-01)

#### Scenario: Reset requested
- **WHEN** a user submits their email on "Lupa kata sandi"
- **THEN** the page confirms that a reset link was sent if the email is registered, without revealing whether it is

#### Scenario: New password set from link
- **WHEN** the user opens a valid reset link and submits a new password of at least 8 characters
- **THEN** the password is changed and they land on Beranda signed in

### Requirement: Sign out
The system SHALL let a signed-in user sign out from the app shell, ending their session on that device. (UMM-01)

#### Scenario: Sign out
- **WHEN** a signed-in user chooses "Keluar" in the user menu
- **THEN** their session ends and they are taken to `/auth/login`

### Requirement: One role per account
Every account SHALL have exactly one role: Super Admin, Direktur, Marketing, Finance, HCM, Operasional or Lapangan. A signed-in account without a role or that is inactive SHALL have no access to app data or pages. (UMM-02, PRD §6)

#### Scenario: Role shown to the user
- **WHEN** a signed-in user opens the user menu
- **THEN** it shows their name and role label (e.g. "Operasional")

#### Scenario: Account without a role
- **WHEN** a user who has a login but no profile role signs in
- **THEN** they see a page saying their account has no role yet and to contact the Super Admin, and no app data is returned to them

### Requirement: Role-scoped navigation
The app shell SHALL show only the menu groups and items the user's role may open, following PRD §9 and the access matrix in PRD §13. Menu items appear as their modules are delivered. (UMM-02)

#### Scenario: Super Admin sees settings
- **WHEN** a Super Admin is signed in
- **THEN** the sidebar shows Beranda and Pengaturan → Pengguna & Peran

#### Scenario: Direktur sees settings read-only entry
- **WHEN** a Direktur is signed in
- **THEN** the sidebar shows Pengaturan → Pengguna & Peran

#### Scenario: Other roles do not see user administration
- **WHEN** a Marketing, Finance, HCM, Operasional or Lapangan user is signed in
- **THEN** the sidebar does not show Pengguna & Peran

### Requirement: Page access enforced beyond the menu
The system SHALL refuse a page, server action or data read that the user's role may not access, even when it is requested directly by URL or API. Refusals SHALL be enforced in the database (row-level security) as well as in the app. (UMM-02, PRD §14)

#### Scenario: Direct URL outside the role
- **WHEN** an HCM user opens `/settings/users` directly
- **THEN** they see an "Akses ditolak" page and no user data is shown

#### Scenario: Direct API read outside the role
- **WHEN** a Marketing user queries the profiles table through the Supabase API
- **THEN** only their own profile is returned

### Requirement: User list for administrators
Super Admin and Direktur SHALL see a list of all users with name, email, role, status (Aktif, Nonaktif, Menunggu Undangan) and last sign-in. Only Super Admin SHALL see the actions to change accounts. (MST-01, PRD §13)

#### Scenario: Super Admin sees list with actions
- **WHEN** a Super Admin opens Pengaturan → Pengguna & Peran
- **THEN** every user is listed with name, email, role, status and last sign-in, and the invite, change-role, deactivate/reactivate and resend-invite actions are available

#### Scenario: Direktur sees list read-only
- **WHEN** a Direktur opens the same page
- **THEN** the same list is shown and no action buttons are offered, and any attempt to change a user is refused

### Requirement: Invite a user
A Super Admin SHALL invite a user by name, email and role. The system SHALL send an invitation email and list the user as "Menunggu Undangan" until they set a password. An email that already has an account SHALL be refused. (MST-01)

#### Scenario: Invitation sent
- **WHEN** a Super Admin invites "Budi" at budi@example.com with role Operasional
- **THEN** an invitation email is sent to that address and Budi appears in the list as Operasional with status Menunggu Undangan

#### Scenario: Duplicate email
- **WHEN** a Super Admin invites an email that already belongs to an account
- **THEN** the invitation is refused with a message that the email is already registered

#### Scenario: Resend pending invite
- **WHEN** a Super Admin chooses "Kirim Ulang Undangan" for a user still Menunggu Undangan
- **THEN** a new invitation email is sent to that user

### Requirement: Change a user's role
A Super Admin SHALL change a user's role. The new role SHALL apply to that user's data access immediately and to their menu at their next page load. (MST-01, UMM-02)

#### Scenario: Role changed
- **WHEN** a Super Admin changes a user from Marketing to Finance
- **THEN** the list shows Finance and that user's next data request is checked as Finance

### Requirement: Deactivate and reactivate accounts
A Super Admin SHALL deactivate an account, after which that account SHALL immediately be unable to sign in or read data, and SHALL be able to reactivate it later. A Super Admin SHALL NOT deactivate their own account. (MST-01, PRD §14)

#### Scenario: Deactivated user loses access immediately
- **WHEN** a Super Admin deactivates a user who is currently signed in
- **THEN** that user's next page load or data request is refused and they are signed out, and new sign-in attempts fail

#### Scenario: Reactivated user can sign in again
- **WHEN** a Super Admin reactivates the account
- **THEN** the user can sign in again with their existing password

#### Scenario: Cannot deactivate self
- **WHEN** a Super Admin tries to deactivate their own account
- **THEN** the action is refused with an explanation

### Requirement: At least one active Super Admin
The system SHALL refuse any change that would leave no active Super Admin, whether by deactivation or role change. (MST-01, PRD §18)

#### Scenario: Last Super Admin protected
- **WHEN** the only active Super Admin's role is changed to Direktur or the account is deactivated
- **THEN** the change is refused with a message that at least one active Super Admin is required
