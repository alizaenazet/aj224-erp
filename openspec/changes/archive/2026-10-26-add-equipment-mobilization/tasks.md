# Tasks: add-equipment-mobilization

## 1. Database

- [x] 1.1 Write migration `<ts>_equipment_mobilization.sql`: `tools`, `tool_stock`, `tool_movements`, `delivery_notes`, `delivery_note_tool_lines`, functions `tool_stock_change` / `create_tool` / `send_delivery_note` / `receive_delivery_note` / `cancel_delivery_note` / `change_tool_condition` / `adjust_tool_stock` / `user_location_ids` / `notify_project_field`, views `tool_overview` / `tool_stays` / `active_rentals`, attachment types `tool` and `delivery_note`, RLS, audit; seed supplier, tools, notes; verify `pnpm db:reset` and `pnpm db:types`
- [x] 1.2 SQL check: unit tool quantity 1; send deducts and numbers SJ/…, insufficient stock refused; receive with shortfall needs note and photo, records Hilang and notifies Operasional; cancel restores; condition change by Lapangan at their project allowed and at the warehouse refused; adjustment with reason audited; totals include in transit; stays in days; rental cost
- [x] 1.3 SQL check access: Finance/SA/Dir read only; HCM and Marketing see nothing; Lapangan sees only their location's stock and notes and cannot send or adjust; direct writes refused

## 2. Library, export and import

- [x] 2.1 Add `lib/equipment/*`, audit labels, attachment config, exports `tools` and `delivery-notes`, import template `tools`, menu items (Operasional → Alat, Surat Jalan; Lapangan → Surat Jalan); verify `tsc` passes

## 3. Pages

- [x] 3.1 Add the tool list, new tool page and tool page (stock, condition change, adjustment, history, stays, photo) and rentals; verify as Operasional: create a Per Jumlah tool with opening stock, adjust with reason, change condition, history and PL-01 stay days; rentals show TN-01 running cost; Finance read-only
- [x] 3.2 Add the delivery note list, new note and note page with receipt and cancel, and the print view; verify as Operasional: send tools to PRJ/AJ224/2026/003 (stock drops, number issued), cancel another with reason; print
- [x] 3.3 Add the project tab Alat and the Lapangan home line; verify at 375 px as Lapangan: the waiting note shows on the home, receive it with a shortfall (note + photo required), project stock and Hilang updated, Operasional notified; report a condition change on site

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; confirm no server or console errors; check the receipt page at 375 px
