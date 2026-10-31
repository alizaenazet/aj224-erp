import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { NotesTable } from "@/components/equipment/notes-table";
import { StockTable } from "@/components/equipment/stock-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { EQUIPMENT_VIEW_ROLES } from "@/lib/equipment/labels";
import { locationStock, notesForLocation } from "@/lib/equipment/queries";
import { PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Alat Proyek" };

type Params = Promise<{ id: string }>;

export default function ProjectEquipmentPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectEquipment params={params} />
    </Suspense>
  );
}

/** Alat tab: tools at the project location and its delivery notes (ALT-02 … ALT-05). */
async function ProjectEquipment({ params }: { params: Params }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, EQUIPMENT_VIEW_ROLES)) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();
  if (!project.location_id) return <p className="text-sm text-muted-foreground">Proyek belum memiliki lokasi.</p>;

  const canChangeCondition = profile.role === "operations" || profile.role === "field";
  const [stock, notes] = await Promise.all([locationStock(project.location_id), notesForLocation(project.location_id)]);
  const incoming = notes.rows.filter((note) => note.status === "sent" && note.to_location_id === project.location_id);

  return (
    <div className="flex flex-col gap-4">
      {incoming.length ? (
        <Alert variant="warning">
          <AlertTitle>{incoming.length} surat jalan menunggu diterima</AlertTitle>
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {incoming.map((note) => (
                <li key={note.id}>
                  <Link href={`/operations/delivery-notes/${note.id}`} className="underline-offset-4 hover:underline">
                    {note.number} dari {note.from_location}
                  </Link>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Alat di lokasi proyek</CardTitle>
          <CardDescription>
            {canChangeCondition
              ? "Laporkan alat rusak, hilang, atau selesai diperbaiki lewat Ubah kondisi."
              : "Jumlah alat per kondisi di lokasi proyek."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTable
            mode="location"
            canChangeCondition={canChangeCondition}
            rows={stock.map((row) => ({
              tool_id: row.tool_id,
              tool_label: `${row.tool_code} — ${row.tool_name}`,
              location_id: row.location_id,
              location_label: row.location_name,
              condition: row.condition,
              quantity: row.quantity,
            }))}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Surat jalan</CardTitle>
          <CardDescription>Pengiriman ke dan dari lokasi proyek ini.</CardDescription>
          {profile.role === "operations" ? (
            <CardAction>
              <Button asChild size="sm">
                <Link href="/operations/delivery-notes/new">
                  <PlusIcon />
                  Buat surat jalan
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <NotesTable notes={notes.rows} />
        </CardContent>
      </Card>
    </div>
  );
}
