import type { Metadata } from "next";
import { PrinterIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AdjustmentEditor } from "@/components/payroll/adjustment-form";
import { PayslipBody } from "@/components/payroll/payslip-body";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { PAYROLL_VIEW_ROLES } from "@/lib/payroll/labels";
import { getPeriod, getSlip, slipAdjustments } from "@/lib/payroll/queries";

export const metadata: Metadata = { title: "Slip Gaji" };

type Params = Promise<{ id: string; slipId: string }>;

export default function SlipPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <SlipContent params={params} />
    </Suspense>
  );
}

async function SlipContent({ params }: { params: Params }) {
  const profile = await requireRole(PAYROLL_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const { id, slipId } = await params;
  const [period, slip] = await Promise.all([getPeriod(id), getSlip(slipId)]);
  if (!period || !slip || slip.period_id !== period.id) notFound();
  const adjustments = await slipAdjustments(period.id, slip.employee_id);
  const editable = profile.role === "hcm" && (period.status === "draft" || period.status === "returned");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={slip.full_name}
        description={period.name}
        actions={
          <Button asChild variant="outline">
            <Link href={`/print/payslips/${slip.id}`} target="_blank">
              <PrinterIcon />
              Cetak slip
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <PayslipBody slip={slip} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Penyesuaian manual</CardTitle>
          <CardDescription>Insentif/borongan, PPh 21, potongan lain, dan koreksi periode lalu — wajib dengan keterangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdjustmentEditor periodId={period.id} employeeId={slip.employee_id} adjustments={adjustments} editable={editable} />
        </CardContent>
      </Card>
    </div>
  );
}
