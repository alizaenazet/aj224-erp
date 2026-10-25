import { describeChanges, type AuditEntry } from "@/lib/audit/labels";

/** What an audit entry changed: field list for updates, reason for cancels. */
export function AuditChanges({ entry }: { entry: AuditEntry }) {
  if (entry.action === "insert") {
    return <span className="text-muted-foreground">Data dibuat</span>;
  }

  const changes = describeChanges(entry);

  return (
    <div className="flex flex-col gap-1">
      {changes.map((change) => (
        <span key={change.label}>
          <span className="font-medium">{change.label}:</span> {change.from} → {change.to}
        </span>
      ))}
      {entry.reason ? (
        <span className="text-muted-foreground">Alasan: {entry.reason}</span>
      ) : null}
    </div>
  );
}
