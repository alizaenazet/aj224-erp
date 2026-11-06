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
import { PAYROLL_VIEW_ROLES } from "@/lib/payroll/labels";
import { getPeriod, getSlip } from "@/lib/payroll/queries";

export const metadata: Metadata = { title: "Cetak Slip Gaji" };

type Params = Promise<{ id: string }>;

export default function PrintPayslipPage({ params }: { params: Params }) {
  return (
    <>
      <PrintToolbar />
      <Suspense fallback={<ContentSkeleton />}>
        <PrintPayslip params={params} />
      </Suspense>
    </>
  );
}

/** Slip gaji A4 (PAY-07, UMM-05). */
async function PrintPayslip({ params }: { params: Params }) {
  const profile = await requireRole(PAYROLL_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const slip = await getSlip((await params).id);
  if (!slip) notFound();
  const period = await getPeriod(slip.period_id);
  return (
    <PrintPage>
      <Letterhead />
      <h1 className="text-center text-lg font-semibold">SLIP GAJI — {period?.name}</h1>
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
  );
}
