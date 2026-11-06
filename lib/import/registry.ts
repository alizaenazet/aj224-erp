import "server-only";

import type { AppRole } from "@/lib/auth/roles";
import { attendanceTemplate } from "@/lib/import/templates/attendance";
import { certificatesTemplate } from "@/lib/import/templates/certificates";
import { clientsTemplate } from "@/lib/import/templates/clients";
import { employeesTemplate } from "@/lib/import/templates/employees";
import { materialsTemplate } from "@/lib/import/templates/materials";
import { openingBillsTemplate, openingCostsTemplate, openingKasbonTemplate } from "@/lib/import/templates/opening-finance";
import { openingInvoicesTemplate } from "@/lib/import/templates/opening-invoices";
import { sectionsTemplate } from "@/lib/import/templates/sections";
import { suppliersTemplate } from "@/lib/import/templates/suppliers";
import { tendersTemplate } from "@/lib/import/templates/tenders";
import { toolsTemplate } from "@/lib/import/templates/tools";
import type { ImportTemplate } from "@/lib/import/types";

/** Import templates by key (UMM-13). Later modules add theirs here. */
export const IMPORT_TEMPLATES: Record<string, ImportTemplate> = Object.fromEntries(
  [
    employeesTemplate,
    certificatesTemplate,
    attendanceTemplate,
    clientsTemplate,
    suppliersTemplate,
    tendersTemplate,
    sectionsTemplate,
    toolsTemplate,
    materialsTemplate,
    openingInvoicesTemplate,
    openingBillsTemplate,
    openingCostsTemplate,
    openingKasbonTemplate,
  ].map((template) => [
    template.key,
    template as ImportTemplate,
  ]),
);

/** Templates a role may use, with what the page needs to show them. */
export function templatesForRole(role: AppRole) {
  return Object.values(IMPORT_TEMPLATES)
    .filter((template) => template.roles.includes(role))
    .map(({ key, title, description, columns }) => ({
      key,
      title,
      description,
      required: columns.filter((column) => column.required).map((column) => column.header),
    }));
}

export function templateTitle(key: string) {
  return IMPORT_TEMPLATES[key]?.title ?? key;
}
