# Tasks: setup-access-control

## 1. Setup

- [x] 1.1 Add packages react-hook-form, zod, @hookform/resolvers, server-only and verify `pnpm install` succeeds
- [x] 1.2 Run `pnpm exec shadcn add sidebar table dialog alert-dialog select field sonner avatar separator tooltip skeleton sheet breadcrumb` and verify the components exist in `components/ui` and `pnpm build` passes

## 2. Database and Auth config

- [x] 2.1 Write migration `supabase/migrations/<ts>_access_control.sql` (app_role enum, profiles, current_app_role/has_role helpers, custom_access_token_hook with grants, last-Super-Admin and self-deactivation trigger, list_users(), RLS policies) and verify `pnpm db:reset` applies it without errors
- [x] 2.2 Update `supabase/config.toml` (sign-up off, password length 8, access token hook, invite/recovery templates) and add Indonesian templates in `supabase/templates/`; verify after `supabase stop && supabase start` that a direct sign-up API call is rejected
- [x] 2.3 Extend `supabase/seed.sql` with a profile per dev user (one per role) and regenerate types with `pnpm db:types`; verify `profiles` has 7 rows and `Database` includes `profiles` and `app_role`
- [x] 2.4 Manual SQL check as each role (set request.jwt.claims sub): Marketing/Finance/HCM/Operasional/Lapangan see only their own profile; Super Admin and Direktur see all; only Super Admin can update; list_users() refuses non-admins; demoting or deactivating the last Super Admin and self-deactivation raise the Indonesian errors

## 3. Auth flows

- [x] 3.1 Add `lib/auth/roles.ts` (role list + labels) and `lib/auth/session.ts` (getSession, requireProfile, requireRole, assertRole); verify `tsc` passes
- [x] 3.2 Update `proxy.ts`/`lib/supabase/proxy.ts` to require a session for every path except `/auth/*` and remove `hasEnvVars`; verify in the browser that signed-out `/` and `/settings/users` redirect to `/auth/login`
- [x] 3.3 Rebuild login, forgot-password and set-password forms in Bahasa Indonesia with Field + react-hook-form + zod; add `/auth/signout` route; update the error page copy; verify in the browser: sign in as Finance lands on `/`, wrong password shows "Email atau kata sandi salah", reset email arrives in Mailpit and its link sets a new password
- [x] 3.4 Delete `app/auth/sign-up*`, `app/auth/update-password`, `app/protected/*`, starter components and `hasEnvVars`; verify `/auth/sign-up` returns 404 and `pnpm lint` passes

## 4. App shell and navigation

- [x] 4.1 Add `lib/navigation.ts` (PRD §9 groups, roles per item) and `app/(app)/layout.tsx` with Sidebar, header and user menu (name, role, theme, Keluar), profile loaded inside Suspense; verify in the browser as Super Admin (sees Pengaturan → Pengguna & Peran) and as Marketing (does not)
- [x] 4.2 Add Beranda page, "Akses ditolak" and "Akun belum memiliki peran" states; set root layout `lang="id"`, title "AJ224 ERP" and Toaster; verify as HCM that `/settings/users` shows Akses ditolak and that a login without a profile shows the no-role page
- [x] 4.3 Check the shell at 375 px as Lapangan: the sidebar opens as a sheet, only Beranda is listed, and Keluar signs out to `/auth/login`

## 5. Users & Roles page

- [x] 5.1 Add `lib/supabase/admin.ts` (server-only service-role client) and `lib/users/actions.ts` (invite, resend invite, change role, deactivate, reactivate) with Zod validation and assertRole; verify `tsc` passes
- [x] 5.2 Build `/settings/users` (Table, role/status Badges, invite Dialog, change-role Dialog, deactivate/reactivate AlertDialog, Sonner toasts) using list_users(); verify as Super Admin: inviting a new Operasional user sends an Indonesian email to Mailpit and the row shows Menunggu Undangan; the invite link sets a password and lands on Beranda
- [x] 5.3 Verify as Super Admin: inviting an existing email shows "Email sudah terdaftar"; changing Marketing → Finance updates the list and the user's next page load shows the Finance menu; deactivating a signed-in user signs them out on their next page load and blocks sign-in, and reactivating restores sign-in
- [x] 5.4 Verify as Super Admin that deactivating self and demoting the last Super Admin are refused with messages; verify as Direktur that the list shows no actions and a direct server-action call is refused

## 6. Integration

- [x] 6.1 Run `pnpm lint` and `pnpm build` and confirm both pass with no console errors on `/auth/login`, `/` and `/settings/users`

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.
