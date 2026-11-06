# AJ224 ERP: starting point and remaining build plan

Reviewed 2026-11-06 against `PRD.md` v1.0 and the code on `feat/stage-1-foundation` @ `00c7d12`.

> **Status 2026-11-06 (end of day):** all seven changes A–G are built, verified and archived on branch `claude/prd-implementation-review-434788` (uncommitted). Migrations `20261106100000_material_stock` … `20261106200000_payroll`; G needed no migration. Not built by decision: UMM-07 email digest and the K3-02 email (see G). Remaining work is Stage 5 (go-live) below.

## 1. Starting point

### Where the code is
| Checkout | Branch @ commit | Contents |
|---|---|---|
| Main checkout `aj224-erp/` | `feat/stage-1-foundation` @ `00c7d12` (clean) | Everything built so far: Stage 1 + Stage 2 (changes 1–13) + `fix-hcm-gaps` |
| This worktree | `claude/prd-implementation-review-434788` @ `12fba83` (= `main`) | Starter + OpenSpec config only. **None of the ERP code.** |

`main` has not received Stage 1–2 yet. Before building here, do this:
1. Fast-forward this branch: `git merge --ff-only feat/stage-1-foundation`.
2. Copy `.env.local` from the main checkout and run `pnpm install`.
3. Run only one local Supabase stack: both checkouts share the same `project_id` in `supabase/config.toml`.

### What is built (archived OpenSpec changes, 13 migrations)
| Area | PRD IDs done | Notes |
|---|---|---|
| Access & platform | UMM-01, 02, 03, 04, 06, 08, 09, 10, 11, 12 (daily report only), 13 (8 templates) | Invite-only auth, JWT role hook, RLS helpers, notifications + bell, audit trigger, document numbering, cancel pattern, daily job runner, attachments (3 private buckets), Data Table + .xlsx export, import engine, A4 print + letterhead |
| Master data | MST-01…10 | All lists seeded with PRD defaults; `document_types` already has `invoice` and `incident` formats |
| Marketing | MKT-01…09 | Analytics are tables; charts deferred to dashboards |
| Projects | PRJ-01, 02, 05, 06, 07, 08, 10; PRJ-03/04/09 partial | Termin auto "Siap Ditagih" works; Ditagih/Lunas wait for invoices |
| Daily reports | OPS-01…04 | Local draft, review, print, missing-report check |
| Equipment | ALT-01…07 | Surat jalan Dikirim → Diterima, shortfalls, condition history, rentals |
| HCM | HCM-01…10, 12 (partial: payslip block), 11 (recap only) | Pay settings in separate table |

Last known good: `tsc --noEmit` and `pnpm lint` passed on 2026-10-31. Not re-run in this review.

### What is left
**Not started (39 IDs):** MAT-01…07 · K3-01…05 · FIN-01…14 · PAY-01…09 · DSB-01…04 (office roles) · UMM-07.

**Built, waiting on a later module (close these inside the change that owns the dependency):**

| Gap | Today | Closed by |
|---|---|---|
| PRJ-03 Ditagih / Lunas | Term status stops at `ready` | C Receivables |
| PRJ-04 Realisasi column | `project_category_costs` is an empty placeholder view | D Payables |
| PRJ-09 Ringkasan | Only contract, terms, RAB, progress | E Project P/L |
| PRJ-11 close | `set_project_status('closed')` always refused | E Project P/L |
| HCM-11 lock + audited correction | Not built | F Payroll |
| HCM-12 payslip block for unverified workers | `employees.verification_status` exists, nothing reads it | F Payroll |
| HCM-06 overrides on Direktur dashboard | Audited, not displayed | G Dashboards |
| UMM-05 print: invoice / payslip / incident | Only daily report, surat jalan | C / F / B |
| UMM-13 templates: materials, AR/AP/cost opening balances, kasbon | Not registered | A / C / D |
| UMM-12 local draft for field expenses | Inline in `components/daily-reports/report-form.tsx` | D (extract a shared hook) |
| ALT-03 transport cost refers to the surat jalan number | No cost records yet | D |
| DSB-04 Lapangan buttons: Catat Pengeluaran, Terima/Pakai Material, Lapor Insiden | Only Absensi, Laporan Harian, Pekerja Lokal | A / B / D |
| K3-02 email | No email sender | G |

## 2. Remaining roadmap: 7 changes (was 8)

Two merges reduce the cycle count without dropping anything:
- **Kasbon ledger moves into D.** FIN-10 requires an approved field-cash "Kasbon Karyawan" to become a kasbon. Building the ledger with field cash avoids a temporary table. Payroll (F) then only consumes it.
- **Old 20 + 21 become G.** The digest (UMM-07) and the K3-02 email share one Edge Function sender and the SMTP setup. They also only make sense once every notification source exists.

| Order | Change | PRD IDs | Depends on |
|---|---|---|---|
| A | `add-material-stock` | MAT-01…07 | Surat jalan (built) |
| B | `add-k3-incidents` | K3-01…05 (K3-02 in-app) | Attendance (built) |
| C | `add-receivables` | FIN-01…05, PRJ-03 status sync | Terms (built) |
| D | `add-payables-expenses` | FIN-06…10, FIN-13, PAY-05 ledger, PRJ-04 realisasi | Suppliers, cost categories |
| E | `add-project-pl` | FIN-11, 12, 14, §11.3 health, PRJ-09 full, PRJ-11 | A, C, D |
| F | `add-payroll` | PAY-01…09, HCM-11, HCM-12 block | D (kasbon) |
| G | `add-dashboards` | DSB-01…04, HCM-06 display (no email: see G below) | All |

A and B finish the Operasional menu and Stage 2, which the user already considers "Operations". C–E deliver Finance, F delivers Payroll, and G delivers management visibility. Stage 5 (go-live) follows G.

Cadence (user preference): propose → apply → verify → archive for each change, back to back, with no review stop. Report at the end of each stage. Commit, push, and any hosted Supabase action only when the user asks.

## 3. Reuse, don't rebuild

Every remaining change is mostly a new composition of these. Find the latest definition of a function with `grep -l "function public.<name>" supabase/migrations/*`; several are redefined per migration.

| Need | Use | Where |
|---|---|---|
| Role checks | `requireRole()` in pages (inside `<Suspense>`), `assertRole()` + `ActionResult` in actions | `lib/auth/session.ts`, `lib/actions.ts` |
| RLS | `has_role(...)`, `current_app_role()`, `user_project_ids()`, `user_location_ids()`, `user_crew_ids()`, `current_employee_id()` | migrations 1, 10, 12 |
| Multi-table writes | One `security definer` RPC per action with row locks; pattern: `send_delivery_note`, `receive_delivery_note`, `save_attendance` | `…equipment_mobilization.sql` |
| Numbers | `next_document_number('<type>')` (invoice and incident formats already seeded) | `…platform_services.sql` |
| Audit | `audit_row_change('id')` trigger; `log_audit_event(...)` for overrides. Add payroll tables to `is_pay_table()` so their audit rows stay Direktur-only | platform, employee_records |
| Cancel | `status = 'cancelled'` + `cancel_reason`; `prevent_hard_delete()` trigger | platform |
| Notifications | `notify_roles(...)`, `notify_user(...)`, `notify_project_field(...)` with a dedupe key | platform, equipment |
| Daily checks | Insert one row into `scheduled_checks` (name, `function_name`, sort_order); `run_daily_checks()` runs them | platform |
| Attachments | Insert one row in `attachment_entity_types` (entity → bucket) and add `attachment_read_<entity>` / `attachment_write_<entity>` functions; the shared lookups are not touched. Add the entity to `ATTACHMENT_ENTITIES` | `…attachment_rules.sql`; `lib/attachments/config.ts` |
| Lists + export | `DataTable`, `DataTableToolbar`, `SelectFilter`, `DateRangeFilter`, `ExportButton`; `lib/list/params.ts`; register in `lib/export/registry.ts` | `components/data-table/` |
| Forms | `Combobox`, `DatePicker`, `RupiahInput`; shared zod schema client + server | `components/app/` |
| Import | One template file in `lib/import/templates/` + registry entry. Use an RPC, not upsert, when a table has column-level grants | `lib/import/` |
| Print | `PrintPage` + `Letterhead` + `PrintToolbar` under `app/(print)/print/<doc>/[id]` | `components/print/` |
| Photos | `use-attachment-upload.ts` (compression ≤ 1 MB, retry) | `components/attachments/` |
| Project tabs | Add a tab with a `*_VIEW_ROLES` constant in `app/(app)/projects/[id]/(tabs)/layout.tsx` | |
| Menu | Add items with PRD §13 roles in `lib/navigation.ts` (`Keuangan` group already exists, empty) | |
| Formats | `formatRupiah`, `formatDate`, `formatNumber`, `todayWib`; SQL `today_wib()`, `format_date_id()` | `lib/format.ts` |

## 4. Per-change essentials

Tables are named in English snake_case. "RLS" below lists only who writes; everyone else follows PRD §13 for reads.

### A. `add-material-stock` (MAT-01…07)
- **Tables:**
  - `materials`: code, name, `unit_code` → units, category (`item_categories.kind = 'material'`), `ownership` company | client, `min_stock` (nullable).
  - `material_stock`: material × location, qty ≥ 0.
  - `material_transactions` header: type `receipt` | `usage` | `return_to_client` | `opname`, location, project, optional section, source `supplier` | `client` + document no., date, notes, status/cancel.
  - `material_transaction_lines`: material, qty, plus `counted_qty` for opname.
- **Transfer (MAT-04):** reuse surat jalan. Add `delivery_note_material_lines` (sent and received qty, shortfall note). Extend `send_/receive_/cancel_delivery_note` so one note can carry tools and materials. Show both on the surat jalan print.
- **Rules (RPCs):**
  - Stock moves only through RPCs that lock the stock row.
  - Usage and transfer refuse qty > available.
  - Opname writes the difference and its reason, and is audited.
- **MAT-06 view `client_material_reconciliation`:** per project × titipan material: received from client, used, returned, on hand, and shrinkage = received − used − returned − on hand. Export it for the berita acara.
- **MAT-07:** daily check → Operasional when stock < `min_stock` at a location.
- **RLS:** Operasional writes everything. Lapangan does receipt and usage only at `user_location_ids()`.
- **UI:**
  - Operasional → Material & Stok (materials, stock by location, transactions, reconciliation).
  - Project tab "Material".
  - Lapangan buttons "Terima Material" and "Pakai Material".
- **Import:** `materials`, with an optional opening stock per location (posted as opname).

### B. `add-k3-incidents` (K3-01…05)
- **Tables:**
  - `incidents`: number `incident`, project, `occurred_at`, section/tower text, classification `near_miss` | `first_aid` | `medical` | `lti` | `fatal` | `property`, chronology, body parts, witnesses, immediate action. Investigation: direct cause, root cause `human` | `equipment` | `method` | `environment` | `material`, lost days. Status `reported` → `investigating` → `closed`, or `cancelled`.
  - `incident_people`: optional employee or external name, plus involvement.
  - `incident_actions`: description, PIC, due date, status open | done, evidence attachment.
- **Rules:**
  - An incident is saved without an investigation.
  - Close is refused while any action is open.
  - An insert with LTI/Fatal calls `notify_roles('director','operations')` in the same transaction. Email comes in G.
- **K3-05 (§11.6) functions:**
  - Counts by classification, project and month.
  - LTI-free days per project and company (since the last LTI/Fatal, else since project start).
  - Open and overdue actions.
  - LTIFR = (LTI + Fatal) × 1,000,000 ÷ hours, where hours = Σ(present days × `standard_work_hours` + overtime) from `attendance`.
- **RLS:**
  - Operasional writes everything.
  - Lapangan inserts and reads only for `user_project_ids()`; no investigation or close.
  - HCM, Direktur and Super Admin read.
- **Storage:** new private bucket `k3-files` (PRD §15), entity `incident`.
- **UI:**
  - Operasional → Insiden K3 (list, detail, summary).
  - Project tab "K3".
  - Mobile "Lapor Insiden" form with photos.
  - A4 incident print.

### C. `add-receivables` (FIN-01…05)
- **Tables:**
  - `invoices`: number `invoice`, project, optional `term_id` (null = non-termin, FIN-02), kind `term` | `other` | `opening`, date, `due_date` defaulting to date + `clients.payment_term_days`, gross, manual deductions (down-payment return, retention, other), DPP = gross − deductions, PPN snapshot, total, status `draft` → `issued` → `partial` → `paid` | `cancelled`.
  - `invoice_payments`: date, amount received, PPh withheld + slip no., `company_bank_accounts` target, proof, cancel.
- **PPN rule:** PPN = DPP × `ppn_rate` only when `company_profile.is_pkp` and the contract is `ppn_applicable`. PRD §19 Q1 is still open, so keep it parameter-driven.
- **Triggers:**
  - Payment status: paid when received + PPh = total.
  - Term sync: issued → term `invoiced`, paid → `paid`, cancelled → back to `ready`.
  - At most one non-cancelled invoice per term (partial unique index).
- **Views (§11.4):** `receivable_list` (balance, days overdue, aging bucket) and `receivable_aging` by client and project.
- **Daily check:** H-7 and overdue → Finance.
- **RLS:**
  - Finance writes.
  - Direktur, Super Admin and Marketing read.
  - Operasional gets **no** invoice access. "Status saja" is already satisfied by the term status it can see.
- **Storage:** new bucket `finance-files`, entity `invoice` / `invoice_payment` (BAP, proof).
- **UI:**
  - Keuangan → Invoice & Piutang (list, aging).
  - "Buat Invoice" on a ready term in Kontrak & Termin.
  - A4 invoice print with bank account and *terbilang*. Add a `terbilang()` helper to `lib/format.ts`.
- **Import:** open invoices as `opening`.

### D. `add-payables-expenses` (FIN-06…10, FIN-13, PAY-05 ledger)
- **Tables:**
  - `supplier_bills`: supplier, bill no., date, `due_date` defaulting to date + `suppliers.payment_term_days`, optional PPN, total, status `unpaid` → `partial` → `paid` | `cancelled`.
  - `supplier_bill_lines`: description, amount, `project_id` (null = Kantor/Umum, chosen explicitly), `cost_category_id` required, optional `delivery_note_id` (ALT-03).
  - `supplier_payments`.
  - `expenses` (FIN-09): date, project or office, category, amount, payee, method, `no_receipt` + note (otherwise proof is required), optional `delivery_note_id`, `is_opening` for cost opening balances.
  - Field cash (FIN-10): `field_cash_topups`, `field_cash_returns`, and `field_cash_expenses` (kind `project_cost` | `kasbon` | `wage_payment`, category for project cost, employee for kasbon/wage, receipt photo, status `pending` → `approved` | `rejected` + reason).
  - Kasbon: `kasbons` (employee, date, amount, installment per period, source manual | field_cash, link). Add it to `is_pay_table()`; only Finance, HCM and Direktur can read it.
- **Single cost source (§11.3):** replace the placeholder with one view, `cost_entries` (source, source_id, date, project_id nullable, cost_category_id, amount). It unions:
  - bill lines (ex-PPN when PKP; PPN spread pro rata when non-PKP),
  - expenses,
  - approved field-cash `project_cost`.

  Then re-create `project_category_costs` as an aggregate of `cost_entries`. Payments, top-ups, kasbon and wage payments never enter it.
- **Field cash balance view (§11.3):** Σ top-ups − Σ expenses (pending + approved) − Σ returns.
- **Triggers:**
  - An approved `kasbon` expense inserts a `kasbons` row.
  - Bill status follows payments.
- **Daily checks:** AP H-3 → Finance. A new field-cash expense notifies Finance.
- **Views:** `payable_list` (overdue, this week, next week, aging).
- **RLS:**
  - Finance writes all of it and verifies.
  - Lapangan inserts field-cash expenses for its projects and reads the balance.
  - HCM writes kasbon.
  - Operasional reads bills and expenses.
- **UI:**
  - Keuangan → Tagihan Supplier & Utang, Pengeluaran & Kas Lapangan.
  - SDM → Kasbon.
  - Lapangan "Catat Pengeluaran" (mobile, photo, local draft). Extract the daily-report draft logic into a shared `use-local-draft` hook.
- **Import:** open bills, cost opening balance per project × category, open kasbon.

### E. `add-project-pl` (FIN-11, 12, 14, PRJ-09, PRJ-11)
- **View `project_financials`, one row per project (§11.3):**
  - Contract value, progress, work done.
  - Recognised revenue (Σ DPP of issued/partial/paid) and unbilled.
  - Cost realisation, gross profit, margin, planned profit.
  - Estimated final cost (Σ max(RAB, actual) per category) and projected profit.
  - Project cash position and field cash balance.
  - Health: cost index and schedule deviation against `health_warning_points` / `health_critical_points` → Normal / Waspada / Kritis. Kritis also applies when cost > RAB.
- **FIN-14:** monthly company summary from `invoices` + `cost_entries` (project vs office) + cash in/out.
- **PRJ-11:** `project_close_checklist(p_project)`:
  1. No tool stock left at the project location.
  2. No titipan material on hand there (reconciled).
  3. Field cash balance is 0.
  4. Every non-retention term is paid.

  Replace `set_project_status`: `closed` is allowed when the checklist passes, or by Direktur override with a note (`log_audit_event`).
- **UI:**
  - Keuangan → Laporan L/R (list + export).
  - Ringkasan tab completed (billed, received, cost, gross profit, active crew, tools on site, incidents, latest obstacles).
  - RAB & Biaya tab now shows real numbers.
  - Close dialog with the checklist.

### F. `add-payroll` (PAY-01…09, HCM-11, HCM-12)
- **Tables:**
  - `payroll_periods`: start, end, group `field` | `office` | `all`, status `draft` → `submitted` → `approved` | `returned` → `paid`. Refuse overlap for the same employee, where `all` overlaps both other groups.
  - `payslips`: snapshot of pay settings, day counts by status, overtime, components, gross, deductions, net, flags `incomplete_attendance` and `unverified`.
  - `payslip_adjustments` (PAY-03; note required).
  - `kasbon_installments`.
  - `payroll_allocations`: payslip, `project_id` (null = office), amount.
  - `attendance_corrections`.
- **`generate_payroll(period)` in SQL (§11.7):**
  - Daily-paid and monthly staff, with proration by active calendar days.
  - Alpa deduction = base ÷ `monthly_salary_divisor`.
  - Kasbon installment = min(installment, balance), reduced so net ≥ 0.
  - BPJS from `fixed_deduction`.
- **Transitions:**
  - HCM submits. Direktur approves or returns with a note. Finance pays per slip or in bulk (date, method).
  - Approval is refused while any slip is `unverified` (HCM-12).
  - On approve:
    - Lock that period's attendance: a trigger on `attendance` refuses edits.
    - HCM corrects through an audited RPC that writes `attendance_corrections`, which the next generate turns into a prior-period adjustment.
    - Write `payroll_allocations` (gross × present days per project ÷ total present days; 0 days → active assignment, else office). Add them to `cost_entries` as Upah & Gaji, and to cash position once paid.
- **Notifications:** submitted → Direktur, returned → HCM, approved → Finance.
- **UI:**
  - SDM → Payroll (periods, slips, adjustments).
  - A4 payslip print, single and bulk per project.
  - Transfer-list export (name, bank, account, amount) and recap export per project and group (PAY-09).

### G. `add-dashboards` (DSB-01…04)

> **Decision 2026-11-06:** no email integration. Auth stays exactly as built: Supabase Auth email + password, its own invite and reset mails, no custom SMTP, no Edge Functions. K3-02 is in-app only (the notification is created in the same transaction as the incident). UMM-07 (Sebaiknya) is dropped. The email bullets below are kept only for reference and are **not** built.

- **DSB-01 Direktur cards**, each linking to a filtered list: active contract value, unbilled, AR (total and overdue), AP (total and due in 7 days), win rate YTD and pipeline, LTI-free days, crew with certificate problems or overrides, payroll awaiting approval.
- **DSB-02:** health table from `project_financials` plus the top obstacle from `daily_report_obstacle_summary`.
- **DSB-03 (Sebaiknya):** shadcn Chart (recharts 3.8 is already installed) for AR aging, incidents per month, pipeline by status, and cost by category per project.
- **DSB-04:** "Perlu Tindakan" per role, built from the views above. No new tables.
- **Email:**
  - One Edge Function sender with Resend/Mailgun SMTP.
  - K3-02: on LTI/Fatal insert, `pg_net` calls the function (≤ 5 min).
  - UMM-07: a pg_cron job at 07:00 WIB sends a digest of that day's notifications per user, only when there is at least one.
  - Custom SMTP for Auth in hosted config.

### Stage 5: go-live (not an OpenSpec change)
Link hosted Staging, push migrations, deploy to Vercel, import client data per PRD §16, run UAT per role, then Production. Every hosted step waits for the user's approval.

## 5. Rules that keep it simple and correct
- RLS, audit trigger, cancel guard, `pnpm db:types` and nav/tab entries go in the **same** change that creates a table.
- Every number shown on more than one page comes from a SQL view or function (`cost_entries`, `project_financials`, aging, balances). Never recompute it in TypeScript.
- Money is `numeric`, never negative. "Today" is `today_wib()`.
- Out of scope (PRD §7.2): journals or ledger, a tax engine, PO/approval chains, stock valuation, GPS attendance, offline mode, WhatsApp or bank integrations.
- Open PRD §19 questions stay configurable: PKP/PPN, pay period and borongan (manual adjustment), paid sick leave (status → paid days could later become a parameter).
- **Verification for each change:**
  - `pnpm db:reset`.
  - SQL as each role for RLS and the §11 formulas (use the PRD worked examples).
  - A browser walkthrough per role at desktop width and at 375 px for field screens.
  - `pnpm lint` and `pnpm build`.
- **Known pitfalls:**
  - PostgREST upsert fails on column-grant tables; use an RPC.
  - Restart `next-dev` when server behaviour contradicts the source.
  - Run `select public.run_daily_checks()` to test scheduled notifications.
