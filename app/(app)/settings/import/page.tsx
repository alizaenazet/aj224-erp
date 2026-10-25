import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ImportCard } from "@/components/import/import-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { templateTitle, templatesForRole } from "@/lib/import/registry";
import { peopleNames } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Impor Data" };

const IMPORT_ROLES = ["super_admin", "director", "hcm", "marketing", "finance"] as const;

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Impor Data"
        description="Impor data awal dari templat Excel atau CSV. Baris yang gagal ditampilkan beserta alasannya; data valid tetap masuk."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <ImportContent />
      </Suspense>
    </>
  );
}

async function ImportContent() {
  const profile = await requireRole(IMPORT_ROLES);
  if (!profile) return <AccessDenied />;

  const templates = templatesForRole(profile.role);
  const supabase = await createClient();
  const [{ data: runs }, names] = await Promise.all([
    supabase
      .from("import_runs")
      .select("id, template, file_name, total_rows, imported_rows, failed_rows, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    peopleNames(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {templates.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {templates.map((template) => (
            <ImportCard key={template.key} template={template} />
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat impor</CardTitle>
          <CardDescription>
            {profile.role === "super_admin" || profile.role === "director"
              ? "Semua impor, terbaru di atas."
              : "Impor yang Anda lakukan, terbaru di atas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runs?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Templat</TableHead>
                  <TableHead>Berkas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Berhasil</TableHead>
                  <TableHead className="text-right">Gagal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{formatDateTime(run.created_at)}</TableCell>
                    <TableCell>{names.get(run.created_by) ?? "Pengguna nonaktif"}</TableCell>
                    <TableCell>{templateTitle(run.template)}</TableCell>
                    <TableCell className="max-w-56 truncate">{run.file_name}</TableCell>
                    <TableCell className="text-right">{run.total_rows}</TableCell>
                    <TableCell className="text-right">{run.imported_rows}</TableCell>
                    <TableCell className="text-right">{run.failed_rows}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Belum ada impor</EmptyTitle>
                <EmptyDescription>Riwayat impor akan tampil di sini.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
