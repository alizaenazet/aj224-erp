import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { NotesTable, NotesToolbar } from "@/components/equipment/notes-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { EQUIPMENT_VIEW_ROLES } from "@/lib/equipment/labels";
import { locationOptions, parseNoteListParams, queryNotes } from "@/lib/equipment/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Surat Jalan" };

type SearchParams = Promise<RawSearchParams>;

export default function DeliveryNotesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Surat Jalan" description="Mobilisasi dan demobilisasi alat antar lokasi." />
      <Suspense fallback={<ContentSkeleton />}>
        <DeliveryNotesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DeliveryNotesContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(EQUIPMENT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseNoteListParams(raw);
  const [{ rows, count, error }, locations] = await Promise.all([
    queryNotes(params, { page: params.page }),
    profile.role === "field" ? Promise.resolve([]) : locationOptions(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <NotesToolbar locations={locations} canCreate={profile.role === "operations"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Surat jalan gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <NotesTable notes={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/operations/delivery-notes", page)}
      />
    </div>
  );
}
