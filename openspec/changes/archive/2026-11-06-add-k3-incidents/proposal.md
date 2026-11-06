# Proposal: add-k3-incidents

## Why
Accidents repeat because incidents, their causes and corrective actions are not recorded (PRD §3.2). Management also has no LTI-free count or LTIFR. This is the last module under the Operasional menu (PRD §9).

## What Changes
- **Report (K3-01, Wajib):** date and time, project, seksi/tower, classification (Near Miss, P3K/First Aid, Perawatan Medis, LTI, Fatal, Kerusakan Properti/Alat), chronology, people involved (employee or outside name, with injured body part), witnesses, photos and immediate action. Saved without an investigation. Lapangan reports from a phone for their project; numbered `K3/AJ224/YYYY/NNN`.
- **Immediate notification (K3-02, Wajib):** an LTI or Fatal incident notifies Direktur and Operasional in the app at the moment it is saved, and again if a later edit raises it to LTI/Fatal. **Email is not built** (decision 2026-11-06: no email integration).
- **Investigation (K3-03, Wajib):** direct cause, root cause (Manusia, Alat, Metode, Lingkungan, Material) and lost work days. Status Dilaporkan → Investigasi → Ditutup.
- **Corrective actions (K3-04, Wajib):** description, PIC (employee), due date, status Terbuka/Selesai, evidence. An incident closes only when every action is Selesai.
- **Summary (K3-05, Wajib; LTIFR Sebaiknya):** incidents per classification, project and month; LTI-free days per project and company; open and overdue actions; work hours from attendance and LTIFR (PRD §11.6).
- **Cancel (UMM-11)** with reason; cancelled incidents do not count.
- **Print (UMM-05):** A4 incident report with letterhead.
- **Screens:** Operasional → Insiden K3 (list, detail, summary); project tab K3; Lapangan menu and home button Lapor Insiden.

## Capabilities

### New Capabilities
- `k3-incidents/incidents`: reporting, notification, investigation, actions, close, cancel, print and access.
- `k3-incidents/summary`: counts, LTI-free days, actions, hours and LTIFR.

### Modified Capabilities
- `dashboard/home`: Lapangan home gains Lapor Insiden.

## Impact
- Migration `<ts>_k3_incidents.sql`: tables `incidents`, `incident_people`, `incident_actions`; functions `save_incident`, `save_incident_investigation`, `close_incident`, `cancel_incident`, `k3_stats`; notify trigger; bucket `k3-files`; attachment types `incident` and `incident_action`; RLS; audit.
- New `lib/k3/*`, `components/k3/*`, pages under `app/(app)/operations/incidents`, project tab `k3`, print `app/(print)/print/incidents/[id]`.
- Out of scope (PRD §7.2): scheduled PPE inspection. K3-02 email (decision above).
