# Design: setup-access-control

## Context

See proposal.md (Why). The repo has the Supabase starter auth pages (`app/auth/*`), cookie-based clients in `lib/supabase/{client,server,proxy}.ts` (typed with `Database`), `proxy.ts` session refresh, and shadcn radix-nova components. Local Supabase runs via the CLI; `supabase/seed.sql` creates seven dev users (one per role, no roles yet).

## Goals / Non-Goals

**Goals:** a role model every later migration can reuse in RLS; immediate effect of deactivation and role changes; an app shell whose menu is driven by one role-to-item map that later changes extend.

**Non-Goals:** Lapangan project scoping (needs assignments), employee linking, audit logging, custom SMTP.

## Decisions

### Data model
- `public.app_role` enum: `super_admin, director, marketing, finance, hcm, operations, field`. UI labels (Super Admin, Direktur, Marketing, Finance, HCM, Operasional, Lapangan) live in `lib/auth/roles.ts`.
- `public.profiles`: `id uuid pk references auth.users on delete cascade`, `full_name text not null`, `email text not null unique`, `role app_role not null`, `is_active boolean not null default true`, `created_at`, `updated_at`. Profiles are created by the invite action (service role) and by the seed. No profile = no role = no access.

### Role checks read the profile, not the token
- SQL helpers (SECURITY DEFINER, STABLE, `search_path = ''`):
  - `public.current_app_role()` returns the caller's role when their profile is active, else NULL.
  - `public.has_role(variadic roles app_role[])` returns boolean.
- Policies call them as `(select public.has_role(...))` so Postgres evaluates them once per statement.
- **Why not read the JWT claim in RLS (PRD §15 wording)?** Tokens stay valid up to `jwt_expiry` (1 hour). Reading the claim would keep a deactivated or re-roled user's old access for up to an hour, which breaks MST-01 ("akun nonaktif langsung tidak bisa login"). A primary-key lookup per statement costs nothing at this scale (A11).
- The **custom access token hook** (`public.custom_access_token_hook(event jsonb)`) still adds `user_role` and `is_active` claims as PRD §15 asks. Browser code can then read the role without a query. Server rendering and RLS always use the profile.

### Server-side session helpers (`lib/auth/session.ts`)
- `getSession()` is wrapped in React `cache`. It reads claims with `supabase.auth.getClaims()` and fetches the caller's profile once per request.
- `requireProfile()`:
  - no session → redirect to `/auth/login`
  - no profile → redirect to `/auth/no-role` ("Akun belum memiliki peran")
  - inactive → redirect to `/auth/signout?reason=inactive`
- `requireRole(roles)` renders `<AccessDenied />` when the role does not match. Server actions use `assertRole(roles)`, which returns an error result instead of throwing to the client.
- `proxy.ts` only refreshes the session and redirects signed-out requests to `/auth/login`. Every path except `/auth/*` needs a session, and the starter's `hasEnvVars` bypass is removed.

### Deactivation
Deactivation does three things:
1. Sets `profiles.is_active = false`, through RLS as the Super Admin. RLS helpers now return NULL, so data access stops at once.
2. Bans the auth user with `ban_duration = '876000h'` via the Admin API, so new sign-ins and token refreshes fail.
3. On the user's next page load, `requireProfile()` sees the inactive profile and signs them out.

Reactivation reverses steps 1 and 2 (`ban_duration = 'none'`). If the Admin API call fails, the profile change is rolled back and the action reports an error.

### Guards in the database
A `BEFORE UPDATE` trigger on `profiles` raises:
- `Minimal harus ada satu Super Admin aktif` when the update would leave no active Super Admin.
- `Tidak dapat menonaktifkan akun sendiri` when `auth.uid() = id` and the update sets `is_active = false`.

The server actions also check both rules so they can show friendly errors before the database does.

### RLS on profiles
| Operation | Rule |
|---|---|
| select | own row, or `has_role('super_admin','director')` |
| update | `has_role('super_admin')` (role, full_name, is_active) |
| insert/delete | none for clients; the invite action uses the service role |

The user list needs auth fields (last sign-in, invite accepted). It comes from `public.list_users()` (SECURITY DEFINER), which raises unless the caller is Super Admin or Direktur and joins `profiles` with `auth.users`. Status is derived as `Nonaktif` if inactive, `Menunggu Undangan` if `email_confirmed_at` is null, otherwise `Aktif`.

### Invitations and email links
- `lib/supabase/admin.ts` (`import "server-only"`) creates a service-role client from `SUPABASE_SECRET_KEY`. It is used only for Auth Admin calls and profile inserts.
- Invite action:
  1. `assertRole(super_admin)`.
  2. Zod validation (nama, email, peran).
  3. `auth.admin.inviteUserByEmail(email, { data: { full_name } })`.
  4. Insert the profile. If the insert fails, delete the just-created auth user.
  - "already registered" errors map to "Email sudah terdaftar".
- Resend calls `inviteUserByEmail` again for users whose invite is still pending.
- Email templates (`supabase/templates/invite.html`, `recovery.html`, in Indonesian) link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<invite|recovery>&next=/auth/set-password`. The existing `app/auth/confirm/route.ts` (`verifyOtp`) creates the session.
- `/auth/set-password` replaces `update-password` and serves both the invite and reset flows.

### Supabase config (`supabase/config.toml`)
- `[auth] enable_signup = false`. `[auth.email] enable_signup` stays `true`: in the CLI it switches the whole email provider, so turning it off would block sign-in as well.
- `minimum_password_length = 8`
- `[auth.hook.custom_access_token]` enabled with `uri = "pg-functions://postgres/public/custom_access_token_hook"`
- `[auth.email.template.invite|recovery]` with Indonesian subjects

The hosted project needs the same settings in the dashboard (go-live checklist).

### App routes and UI (shadcn only)
- **Auth pages** (`app/auth/…`, URLs unchanged): `login`, `forgot-password`, `set-password`, `confirm` (route), `signout` (route), `error`. All are Card + Field forms with react-hook-form + zod. The `sign-up` and `sign-up-success` pages are deleted.
- **App shell:** route group `app/(app)/` with `layout.tsx`.
  - `SidebarProvider`, `AppSidebar`, `SidebarInset` with a header (SidebarTrigger, page title).
  - User menu in the sidebar footer: DropdownMenu with name, role, theme choice and "Keluar".
  - The `Sidebar` frame renders outside Suspense; only its role-dependent menu and user footer load inside `<Suspense>`. A Suspense-wrapped frame hydrates after `SidebarProvider` switches to mobile mode and causes a hydration mismatch.
  - Pages render outside the sidebar's boundary. Each page keeps a static `PageHeader` and wraps its data in its own `<Suspense>`. A layout-level boundary or `loading.tsx` doesn't cover client navigations inside nested segments, which Next 16's instant-navigation check flags.
  - `partialPrefetching` is on. `lib/supabase/server.ts` calls `await connection()` so every database read runs at request time (no `Date.now()` during the App Shell prerender).
  - Sign-in, set-password and sign-out end with a full page load (`window.location.replace`). That clears the client router cache and the previous pages Next keeps in the DOM, so a new session never reuses or exposes the previous user's pages.
- **Navigation map** `lib/navigation.ts`: groups → items `{ title, href, icon, roles }`, following PRD §9 group order. This change adds Beranda (all roles) and Pengaturan → Pengguna & Peran (`super_admin`, `director`). Later changes append their items with the roles from PRD §13.
- **Pages:**
  - `/` (Beranda): a greeting Card with name and role. Per-role content comes with `add-dashboards`.
  - `/settings/users`:
    - shadcn Table with columns Nama, Email, Peran (Badge), Status (Badge), Login Terakhir, plus a row DropdownMenu of actions for Super Admin.
    - "Undang Pengguna" Dialog form; "Ubah Peran" Dialog with Select.
    - AlertDialog to confirm deactivate and reactivate; Sonner toasts.
    - The shared Data Table arrives in `add-list-export-print-kit` and will replace the plain Table.
- **Route segments are English** (`/settings/users`), per the code-identifier convention. Labels are Bahasa Indonesia.

### Removed starter code
- Pages: `app/page.tsx` (replaced by `(app)/page.tsx`), `app/protected/*`, `app/auth/sign-up*`, `app/auth/update-password`.
- Components: `components/{hero,deploy-button,env-var-warning,next-logo,supabase-logo,auth-button,sign-up-form,update-password-form,tutorial/*}`.
- `hasEnvVars` in `lib/utils.ts`.
- Root layout: `lang="id"`, title "AJ224 ERP", and a Sonner `Toaster`.

## Risks / Trade-offs

- [The hosted project's default email sender is rate-limited] → Invites work locally through Mailpit now. Custom SMTP comes in `add-email-notifications` before go-live.
- [JWT claims can be stale for up to 1 hour] → Never used for authorization on the server or in RLS. Browser code treats them only as display hints.
- [Service-role key leaking to the browser] → It lives only in `lib/supabase/admin.ts` behind `server-only` and in a non-`NEXT_PUBLIC_` env var.
- [A profile insert fails after the invite is sent] → The auth user is deleted and the action reports an error. Re-inviting is safe.

## Migration Plan

1. Migration `…_access_control.sql`: enum, table, helpers, hook (with grants to `supabase_auth_admin` and revokes from `anon`/`authenticated`/`public`), trigger, `list_users()`, RLS.
2. Seed adds a profile for each dev user.
3. Hosted go-live:
   - Push the migration.
   - Enable the hook, disable sign-up, set password length 8 and paste the templates in the dashboard.
   - Create the first Super Admin in the Auth dashboard, then `insert into profiles (...) values (..., 'super_admin')` via SQL. Add a second Super Admin (PRD §18).
4. Rollback: drop the hook in the dashboard, then drop the migration objects. No business data exists yet.
