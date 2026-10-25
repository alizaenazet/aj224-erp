# Proposal: setup-access-control

## Why

Every AJ224 ERP module depends on knowing who the user is and what their role allows. Today the app is the Supabase starter: anyone can sign up, there are no roles, and the pages are tutorial content. Access control comes first so that every later module can rely on roles in the database (RLS) and in the UI.

## What Changes

- Accounts are **invite-only**. The public sign-up page and sign-up flow are removed, and public sign-up is disabled in Supabase Auth. (UMM-01, Wajib)
- Sign-in with email + password, "lupa kata sandi" via email, set-password from the invite link, and logout. All screens are in Bahasa Indonesia. Minimum password length is 8 characters (PRD §14). (UMM-01, Wajib)
- Seven roles (Super Admin, Direktur, Marketing, Finance, HCM, Operasional, Lapangan), one per account. Each user's role and active status are stored in a profile, and the role is added to the login token. (UMM-02, Wajib)
- Database-side role checks that every later table's RLS policies reuse. (UMM-02, Wajib)
- An app shell with a sidebar whose menu shows only the modules the user's role may open (PRD §9, §13). Direct URL access to a page outside the role is refused. (UMM-02, Wajib)
- A **Pengguna & Peran** page (Pengaturan): Super Admin invites users (name, email, role), changes roles, deactivates and reactivates accounts, and resends pending invites. Direktur sees the list read-only. Deactivated accounts lose access immediately. The last active Super Admin cannot be deactivated or demoted. (MST-01, Wajib)
- Removes the starter's tutorial home page, `/protected` page, sign-up pages and demo components, and sets the app title and language to AJ224 ERP / Bahasa Indonesia.
- Seeded local dev users get their roles.

## Capabilities

### New Capabilities
- `access-control`: Who can sign in (invite-only accounts, sign-in, password reset, deactivation) and what each role may see and do (roles, role-scoped navigation, page-level refusal, user and role administration).

### Modified Capabilities
- None (no existing specs).

## Impact

- **Database:** new `app_role` enum, `profiles` table with RLS, role-check SQL functions, a custom access token hook, and a guard that keeps at least one active Super Admin.
- **Supabase config:** sign-up disabled, minimum password length 8, access token hook enabled, Indonesian invite and recovery email templates (`supabase/config.toml`, `supabase/templates/`). Hosted projects need the same settings in the dashboard at go-live.
- **App:** new route groups for auth and the app shell, `/settings/users`, a server-only admin Supabase client using `SUPABASE_SECRET_KEY`, removal of the starter pages and components.
- **Dependencies:** react-hook-form, zod, @hookform/resolvers, server-only; shadcn components sidebar, table, dialog, alert-dialog, select, field, sonner, avatar, separator, tooltip, skeleton, sheet.

## Out of scope

- Linking a user account to an employee record (MST-01's "hubungkan ke data karyawan") needs the employee table and is delivered in `add-employee-records`.
- Lapangan project scoping (only assigned projects, including by URL) needs projects and assignments and is delivered in `add-projects-contracts` and `add-assignments-attendance`. This change only scopes Lapangan's menu.
- Audit logging of user administration belongs to `add-platform-services` (UMM-08).
- Custom SMTP for hosted email is part of `add-email-notifications`. Locally, emails go to Mailpit.
- Not in v1 at all: self-registration, SSO/OAuth sign-in, multiple roles per account (PRD §6), and features listed in PRD §7.2.

## Open questions (PRD §19)

None of the §19 questions affect this change.
