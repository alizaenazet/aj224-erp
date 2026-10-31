# Design: fix-hcm-gaps

## Context

- **Import:** attendance has column-level grants: insert on all columns, update only on `status`, `overtime_hours`, `project_id` and `notes`. A PostgREST upsert sets every payload column in `ON CONFLICT DO UPDATE`, including `employee_id` and `work_date`, so Postgres refuses it. `save_attendance` updates only the permitted columns.
- **Saving the sheet:** `save_attendance` saves one day in a single transaction. `attendance_check` refuses a field record whose employee is no longer assigned to the project on that date. The sheet re-sent every filled row, including such records.
- **Assignments:** `assignments_check` compared the exit date only with the start date. The update path checked only overlap.

## Decisions

- **Import via `save_attendance`, grouped per project day:** no grant changes are needed, and the database rules stay the same as for the sheet. A day that fails is retried row by row, so each refused row is named in the import result, as other templates do.
- **Sheet sends only rows that differ from the stored record:** a stale record can still be viewed, but it no longer blocks saving others. Notes are not editable on the sheet, so the stored note is sent back unchanged.
- **Exit-date rule in the trigger, not the form:** this covers API access too.
  - Shortening an end date is always allowed, because `employees_end_assignments` shortens assignments when someone leaves.
  - Extending or clearing an end date needs an employee who is still employed by then and a project that is not completed or closed.
- **Crew filter in `projectCrew`:** an assignment that starts after a later-set exit date keeps one day, because end ≥ start and assignments are never deleted. The crew query drops employees whose exit date is before the sheet date, instead of changing the no-delete rule.
- **Operasional reminder:** a second `notify_roles` call per certificate when the employee has an assignment covering today. It has its own dedupe key (`cert-<status>-crew:<id>`), so HCM's existing keys are unchanged, and Operasional is still notified when someone becomes assigned later.
- **Certificate deletion order:** scan file → attachment row → certificate. Both storage and attachment policies resolve access through the certificate, so they must run while it still exists.
- **Training sync trigger (`AFTER UPDATE OF certificate_type_id, organizer, start_date, end_date`):**
  - Rewrites issuer, issue date and expiry of certificates with `training_id` = the training.
  - Issues missing certificates when a type is added.
  - Refuses a type change while issued certificates exist. Changing the type would silently change what certified people hold.

## Risks

- Re-dating a training overwrites a manually corrected expiry date on its certificates. This is accepted: the training is the source of these certificates.
- A certificate scan added to an auto-issued certificate is still left behind when the participant's result is changed away from Lulus. Storage objects cannot be removed from SQL. This edge stays as it is.
