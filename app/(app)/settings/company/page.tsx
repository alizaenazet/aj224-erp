import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { BankAccounts } from "@/components/company/bank-accounts";
import { CompanyProfileForm } from "@/components/company/company-profile-form";
import { LogoUploader } from "@/components/company/logo-uploader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { getCompanyProfile, listBankAccounts } from "@/lib/company/queries";

export const metadata: Metadata = { title: "Profil Perusahaan" };

export default function CompanyPage() {
  return (
    <>
      <PageHeader
        title="Profil Perusahaan"
        description="Identitas perusahaan untuk kop surat, invoice, dan dokumen cetak."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <CompanyContent />
      </Suspense>
    </>
  );
}

async function CompanyContent() {
  const profile = await requireRole(["super_admin", "director"]);
  if (!profile) return <AccessDenied />;

  const canEdit = profile.role === "super_admin";
  const [{ profile: company, logoUrl }, accounts] = await Promise.all([
    getCompanyProfile(),
    listBankAccounts(),
  ]);

  if (!company) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Identitas</CardTitle>
          <CardDescription>
            {canEdit ? "Perubahan tercatat di log audit." : "Hanya Super Admin yang dapat mengubah."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyProfileForm profile={company} canEdit={canEdit} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>PNG, JPG, atau WEBP, maksimal 1 MB.</CardDescription>
            <CardAction>
              <Button asChild variant="outline">
                <Link href="/print/letterhead">Pratinjau Kop Surat</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            {logoUrl ? (
              // Signed URL from private storage; next/image would need a remote pattern per project.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`Logo ${company.name}`} className="h-16 w-auto" />
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada logo.</p>
            )}
            {canEdit ? <LogoUploader /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekening Perusahaan</CardTitle>
            <CardDescription>Rekening utama tampil di invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccounts accounts={accounts} canEdit={canEdit} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
