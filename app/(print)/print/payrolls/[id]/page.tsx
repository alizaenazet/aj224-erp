import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PayslipBody } from "@/components/payroll/payslip-body";
import { Letterhead } from "@/components/print/letterhead";
import { PrintPage } from "@/components/print/print-page";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { requireRole } from "@/lib/auth/session";
import { isUuid, parseText, type RawSearchParams } from "@/lib/list/params";
import { PAYROLL_VIEW_ROLES } from "@/lib/payroll/labels";
import { getPeriod, periodSlips } from "@/lib/payroll/queries";

export const metadata: Metadata = { title: "Cetak Slip Gaji Massal" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<RawSearchParams>;

export default function PrintPayrollPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <>
      <PrintToolbar />
      <Suspense fallback={<ContentSkeleton />}>
        <PrintPayroll params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** Cetak massal slip per proyek (PAY-07): one A4 page per slip. */
async function PrintPayroll({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const profile = await requireRole(PAYROLL_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const [period, raw] = await Promise.all([getPeriod((await params).id), searchParams]);
  if (!period) notFound();
  const project = parseText(raw.project);
  const slips = await periodSlips(period.id, isUuid(project) ? project : null);
  return (
    <div className="flex flex-col gap-6">
      {slips.map((slip, index) => (
        <div key={slip.id} className={index ? "print:break-before-page" : undefined}>
          <PrintPage>
            <Letterhead />
            <h1 className="text-center text-lg font-semibold">SLIP GAJI — {period.name}</h1>
            <PayslipBody slip={slip} withWords />
            <div className="grid grid-cols-2 gap-6 pt-6 text-center text-sm">
              {["Diterima oleh", "HCM"].map((role) => (
                <div key={role} className="flex flex-col gap-16">
                  <span>{role},</span>
                  <span>(________________)</span>
                </div>
              ))}
            </div>
          </PrintPage>
        </div>
      ))}
    </div>
  );
}
