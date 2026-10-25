import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { EmployeeForm } from "@/components/employees/employee-form";
import { requireRole } from "@/lib/auth/session";
import { getEmployee, positionOptions } from "@/lib/employees/queries";

export const metadata: Metadata = { title: "Ubah Karyawan" };

type Params = Promise<{ id: string }>;

export default function EditEmployeePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <EditEmployeeContent params={params} />
    </Suspense>
  );
}

async function EditEmployeeContent({ params }: { params: Params }) {
  const profile = await requireRole(["hcm"]);
  if (!profile) return <AccessDenied />;

  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const positions = await positionOptions({ includeId: employee.position_id });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Ubah ${employee.full_name}`}
        description={`${employee.employee_no} · Kolom bertanda * wajib diisi.`}
      />
      <EmployeeForm
        employeeId={employee.id}
        positions={positions.filter((position) => position.active).map(({ value, label }) => ({ value, label }))}
        defaultValues={{
          employee_no: employee.employee_no,
          full_name: employee.full_name,
          nik_ktp: employee.nik_ktp,
          birth_place: employee.birth_place,
          birth_date: employee.birth_date,
          address: employee.address,
          phone: employee.phone,
          emergency_contact_name: employee.emergency_contact_name,
          emergency_contact_phone: employee.emergency_contact_phone,
          blood_type: employee.blood_type,
          employment_status: employee.employment_status,
          work_type: employee.work_type,
          position_id: employee.position_id,
          join_date: employee.join_date,
          bank_name: employee.bank_name,
          bank_account_number: employee.bank_account_number,
          bank_account_holder: employee.bank_account_holder,
          bpjs_number: employee.bpjs_number,
        }}
      />
    </div>
  );
}
