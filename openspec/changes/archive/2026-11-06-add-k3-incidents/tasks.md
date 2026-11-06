# Tasks: add-k3-incidents

## 1. Database

- [x] 1.1 Write migration `<ts>_k3_incidents.sql` (tables, functions, notify trigger, `incident_list`, `k3_stats`, bucket `k3-files` + policies, attachment types, RLS, audit, seed); verify `supabase db reset` and `pnpm db:types`
- [x] 1.2 SQL check: Lapangan report on own project numbered K3/…, other project refused; LTI notifies Direktur + Operasional once; investigation moves to Investigasi; close refused with an open action and allowed after; cancel excluded from stats; LTI-free days and LTIFR match the spec examples
- [x] 1.3 SQL check access: Finance and Marketing read nothing; HCM read-only; Lapangan cannot investigate, add actions, close or cancel; direct writes refused

## 2. Library and export

- [x] 2.1 Add `lib/k3/{labels,schema,queries,actions,exports}.ts`, attachment entities, audit labels, export `incidents`, menu items; verify `tsc --noEmit`

## 3. Pages

- [x] 3.1 Insiden K3 list, report form (desktop + 375 px), detail with investigation, actions, close and cancel, print page; verify as Operasional end to end and print
- [x] 3.2 K3 summary page and project tab K3; Lapangan menu and home button; verify as Lapangan at 375 px: report from the home, see only own project

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; smoke-fetch new routes per role

## Verification notes
- SQL (2026-11-06): numbering K3/AJ224/2026/NNN; Lapangan report on own project accepted, other project refused; Lapangan investigation, close and direct insert refused; LTI by Lapangan notifies every Direktur and Operasional user ("Insiden LTI"); close refused with an open action; k3_stats: 45 LTI-free days without LTI (project start), 1 LTI / 232 h → LTIFR 4.310,34; Finance and Marketing read nothing; HCM reads.
- Browser: Lapangan at 375 px reported a Near Miss from the form (K3/AJ224/2026/003); office list, summary, edit and export refused; other project's K3 tab not found. Operasional saved the investigation and closed the incident from the UI; print page and Ringkasan K3 render. Fixed a phone overflow in the shared Combobox (long labels widened the field).
- `pnpm lint` and `pnpm build` pass.
