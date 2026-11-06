# Design: add-k3-incidents

## Context
Document type `incident` (`K3/AJ224/{YYYY}/{SEQ:3}`) is already seeded. Lapangan scoping comes from `user_project_ids()`. Attendance (`attendance.status = 'present'`, `overtime_hours`) and `system_parameters.standard_work_hours` give the LTIFR hours.

## Goals / Non-Goals
**Goals:** one write path per action (RPCs), K3-02 as a trigger so every write path notifies, one stats function shared by the summary page, the project tab and the dashboard (change G).

**Non-Goals:** email, PPE inspections, attaching incidents to daily reports.

## Decisions
- **Tables**
  | Table | Key columns |
  |---|---|
  | `incidents` | number (unique), project_id, occurred_at timestamptz, section_id null, location_note, classification `near_miss`/`first_aid`/`medical`/`lti`/`fatal`/`property`, chronology, body_parts, witnesses, immediate_action, status `reported`/`investigating`/`closed`/`cancelled`, direct_cause, root_cause `human`/`equipment`/`method`/`environment`/`material`, lost_days, investigated_at/by, closed_at/by, cancel_reason/at, reported_by; audited |
  | `incident_people` | incident_id, employee_id null, external_name null (one of them), involvement `victim`/`involved`, injury |
  | `incident_actions` | incident_id, description, pic_employee_id, due_date, status `open`/`done`, done_note, done_at/by; audited |
- **Functions** (`security definer`, role checks inside):
  - `save_incident(p_id uuid, p_incident jsonb, p_people jsonb) returns uuid`: insert when `p_id` is null (Operasional or Lapangan on their project; numbers it), update otherwise (Operasional, not closed/cancelled); people are replaced.
  - `save_incident_investigation(p_id, p_values)`: Operasional; status `reported` → `investigating`.
  - `save_incident_action(p_id, p_incident, p_values)`, `complete_incident_action(p_id, p_note)`: Operasional.
  - `close_incident(p_id)`: root cause required, no open action.
  - `cancel_incident(p_id, p_reason)`.
  - `k3_stats(p_from date, p_to date)`: one row per project plus a company row (project_id null). `security invoker`, so RLS on incidents and attendance applies.
- **Trigger** `incidents_notify_serious` (after insert or update of classification): LTI/Fatal → `notify_roles(director, operations)`, dedupe `incident-serious:<id>`.
- **Views:** `incident_list` (security_invoker) with project code/name, open and overdue action counts.
- **RLS:** read for SA, Direktur, HCM, Operasional; Lapangan reads rows of `user_project_ids()`; people/actions follow the incident. No direct writes.
- **Storage:** new private bucket `k3-files` with the same three storage policies as other attachment buckets; entity `incident` (category `photo`, writable by Operasional and by Lapangan of that project while not closed; at most 10) and `incident_action` (category `evidence`, Operasional).
- **UI:** Data Table list with filters; detail page with Cards for data, people, investigation form, actions Table + Dialog; ReasonDialogButton for cancel; Tabs not needed. Mobile report form with Button size lg. Print page reuses `PrintPage` + `Letterhead`.
- **Single cost source:** not affected.

## Risks / Trade-offs
- [Lapangan reports late with weak signal] → the form is short; photos are added after saving, with retry from the attachment list.
- [Hours depend on attendance completeness] → LTIFR shows — when hours are 0; the page says hours come from attendance.
