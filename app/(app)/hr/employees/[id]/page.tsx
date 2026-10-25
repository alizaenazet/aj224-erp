import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { EmployeeCertificates } from "@/components/certifications/employee-certificates";
import { EmployeeActions } from "@/components/employees/employee-actions";
import { EmployeePhoto } from "@/components/employees/employee-photo";
import { PaySettingsCard } from "@/components/employees/pay-settings-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listAttachments, signedAttachmentUrl } from "@/lib/attachments/queries";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { CERTIFICATE_VIEW_ROLES } from "@/lib/certifications/labels";
import {
  certificateTypeOptions,
  certificatesWithScan,
  employeeCertificates,
  positionRequirements,
} from "@/lib/certifications/queries";
import {
  DOCUMENT_VIEW_ROLES,
  EMPLOYEE_VIEW_ROLES,
  EMPLOYMENT_STATUS_LABELS,
  PAY_VIEW_ROLES,
  WORK_TYPE_LABELS,
  type Employee,
} from "@/lib/employees/labels";
import { getEmployee, getPaySettings } from "@/lib/employees/queries";
import { formatDate, todayWib } from "@/lib/format";

export const metadata: Metadata = { title: "Detail Karyawan" };

const DOCUMENT_CATEGORIES = ["ktp", "kk", "contract", "diploma", "other"];

const TABS = ["data", "documents", "pay", "certificates"] as const;

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string | string[] }>;

export default function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <EmployeeDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EmployeeDetailContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const profile = await requireRole(EMPLOYEE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const canManage = profile.role === "hcm";
  const canViewDocuments = hasAnyRole(profile.role, DOCUMENT_VIEW_ROLES);
  const canViewPay = hasAnyRole(profile.role, PAY_VIEW_ROLES);
  const canViewHistory = hasAnyRole(profile.role, ["super_admin", "director"]);
  const canViewCertificates = hasAnyRole(profile.role, CERTIFICATE_VIEW_ROLES);

  const [photoUrl, documents, pay, certificates, requirements, types] = await Promise.all([
    signedAttachmentUrl("employee", employee.id, "photo"),
    canViewDocuments ? listAttachments("employee", employee.id, { exclude: ["photo"] }) : null,
    canViewPay ? getPaySettings(employee.id) : null,
    canViewCertificates ? employeeCertificates(employee.id) : null,
    canViewCertificates ? positionRequirements(employee.position_id) : [],
    canManage ? certificateTypeOptions() : [],
  ]);
  const scans = certificates
    ? await certificatesWithScan(certificates.rows.map((certificate) => certificate.id))
    : new Map<string, string>();

  const requestedTab = (await searchParams).tab;
  const visibleTabs: string[] = TABS.filter(
    (tab) =>
      tab === "data" ||
      (tab === "documents" && canViewDocuments) ||
      (tab === "pay" && canViewPay) ||
      (tab === "certificates" && canViewCertificates),
  );
  const defaultTab =
    typeof requestedTab === "string" && visibleTabs.includes(requestedTab) ? requestedTab : "data";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={employee.full_name}
        description={`${employee.employee_no} · ${employee.position?.name ?? "—"}`}
        actions={
          <EmployeeActions
            employee={employee}
            today={todayWib()}
            canManage={canManage}
            canViewHistory={canViewHistory}
          />
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant={employee.is_active ? "secondary" : "destructive"}>
          {employee.is_active ? "Aktif" : `Nonaktif sejak ${formatDate(employee.exit_date)}`}
        </Badge>
        <Badge variant="outline">{WORK_TYPE_LABELS[employee.work_type]}</Badge>
        <Badge variant="outline">{EMPLOYMENT_STATUS_LABELS[employee.employment_status]}</Badge>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          {canViewCertificates ? <TabsTrigger value="certificates">Sertifikat</TabsTrigger> : null}
          {canViewDocuments ? <TabsTrigger value="documents">Dokumen</TabsTrigger> : null}
          {canViewPay ? <TabsTrigger value="pay">Gaji</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="data" className="pt-2">
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="self-start">
              <CardContent>
                <EmployeePhoto
                  employeeId={employee.id}
                  name={employee.full_name}
                  photoUrl={photoUrl}
                  canManage={canManage}
                />
              </CardContent>
            </Card>
            <div className="lg:col-span-3">
              <EmployeeDetails employee={employee} />
            </div>
          </div>
        </TabsContent>

        {certificates ? (
          <TabsContent value="certificates" className="pt-2">
            <EmployeeCertificates
              employeeId={employee.id}
              employeeName={employee.full_name}
              positionName={employee.position?.name ?? "—"}
              requirements={requirements}
              certificates={certificates.rows}
              scans={Object.fromEntries(scans)}
              types={types}
              canManage={canManage}
              canViewHistory={canViewHistory}
            />
          </TabsContent>
        ) : null}

        {documents ? (
          <TabsContent value="documents" className="pt-2">
            <AttachmentList
              entityType="employee"
              entityId={employee.id}
              attachments={documents.rows}
              categories={DOCUMENT_CATEGORIES}
              canManage={canManage}
            />
          </TabsContent>
        ) : null}

        {canViewPay ? (
          <TabsContent value="pay" className="pt-2">
            <PaySettingsCard
              employeeId={employee.id}
              employeeName={employee.full_name}
              settings={pay}
              canManage={canManage}
              canViewHistory={profile.role === "director"}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function EmployeeDetails({ employee }: { employee: Employee }) {
  const groups: { title: string; rows: [string, string | null][] }[] = [
    {
      title: "Identitas",
      rows: [
        ["NIK karyawan", employee.employee_no],
        ["NIK KTP", employee.nik_ktp],
        [
          "Tempat, tanggal lahir",
          [employee.birth_place, employee.birth_date ? formatDate(employee.birth_date) : null]
            .filter(Boolean)
            .join(", ") || null,
        ],
        ["Golongan darah", employee.blood_type],
        ["No. HP", employee.phone],
        ["Alamat", employee.address],
        [
          "Kontak darurat",
          [employee.emergency_contact_name, employee.emergency_contact_phone].filter(Boolean).join(" · ") ||
            null,
        ],
      ],
    },
    {
      title: "Pekerjaan",
      rows: [
        ["Jabatan", employee.position?.name ?? null],
        ["Tipe", WORK_TYPE_LABELS[employee.work_type]],
        ["Status kerja", EMPLOYMENT_STATUS_LABELS[employee.employment_status]],
        ["Tanggal masuk", formatDate(employee.join_date)],
        ["Tanggal keluar", employee.exit_date ? formatDate(employee.exit_date) : null],
      ],
    },
    {
      title: "Rekening & BPJS",
      rows: [
        ["Bank", employee.bank_name],
        ["No. rekening", employee.bank_account_number],
        ["Atas nama", employee.bank_account_holder],
        ["No. BPJS", employee.bpjs_number],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {group.rows.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-words">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
