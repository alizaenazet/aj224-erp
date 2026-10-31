import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { clientOptions } from "@/lib/clients/queries";
import { parseText, type RawSearchParams } from "@/lib/list/params";
import { PROJECT_MANAGE_ROLES } from "@/lib/projects/labels";
import { projectForTender } from "@/lib/projects/queries";
import { getTender } from "@/lib/tenders/queries";

export const metadata: Metadata = { title: "Tambah Proyek" };

type SearchParams = Promise<RawSearchParams>;

export default function NewProjectPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Tambah Proyek" description="Kolom bertanda * wajib diisi." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewProjectContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewProjectContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(PROJECT_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;

  const tenderId = parseText((await searchParams).tender);
  const tender = tenderId ? await getTender(tenderId) : null;

  if (tender) {
    const existing = await projectForTender(tender.id);
    if (existing || tender.status !== "won") {
      return (
        <Alert variant="warning">
          <AlertTitle>{existing ? "Tender ini sudah dijadikan proyek" : "Tender belum dimenangkan"}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>
              {existing
                ? `Proyek ${existing.code} sudah dibuat dari tender ${tender.name}.`
                : "Proyek dari tender hanya bisa dibuat setelah tender berstatus Menang."}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={existing ? `/projects/${existing.id}` : `/marketing/tenders/${tender.id}`}>
                {existing ? "Buka proyek" : "Kembali ke tender"}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
  }

  const clients = await clientOptions({ includeId: tender?.client_id });

  return (
    <ProjectForm
      clients={clients}
      tender={tender ? { id: tender.id, name: tender.name } : null}
      defaultValues={
        tender
          ? {
              project: {
                name: tender.name,
                client_id: tender.client_id,
                end_owner: tender.end_owner,
                site: tender.location,
                voltage_kv: tender.voltage_kv as 150 | 275 | 500 | null,
                length_kms: tender.length_kms,
                tower_count: tender.tower_count,
              },
              contract: { contract_value: tender.bid_value ?? 0, scope: tender.scope },
            }
          : undefined
      }
    />
  );
}
