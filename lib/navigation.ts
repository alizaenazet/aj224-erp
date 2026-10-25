import {
  BadgeCheckIcon,
  Building2Icon,
  ChartColumnIcon,
  DatabaseIcon,
  FileTextIcon,
  FileUpIcon,
  GraduationCapIcon,
  HomeIcon,
  IdCardIcon,
  ListChecksIcon,
  ScrollTextIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { APP_ROLES, type AppRole } from "@/lib/auth/roles";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles that may open this page (PRD §13). */
  roles: readonly AppRole[];
};

export type NavGroup = {
  /** Null for the ungrouped top item (Beranda). */
  label: string | null;
  items: NavItem[];
};

/**
 * Sidebar menu in PRD §9 order. Each change adds its items to the matching
 * group; empty groups are hidden.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ title: "Beranda", href: "/", icon: HomeIcon, roles: APP_ROLES }],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Klien",
        href: "/marketing/clients",
        icon: Building2Icon,
        roles: ["super_admin", "director", "marketing", "finance", "operations"],
      },
      {
        title: "Tender",
        href: "/marketing/tenders",
        icon: FileTextIcon,
        roles: ["super_admin", "director", "marketing", "finance", "operations"],
      },
      {
        title: "Analitik Tender",
        href: "/marketing/tender-analytics",
        icon: ChartColumnIcon,
        roles: ["super_admin", "director", "marketing", "finance", "operations"],
      },
    ],
  },
  { label: "Proyek", items: [] },
  { label: "Operasional", items: [] },
  { label: "Keuangan", items: [] },
  {
    label: "SDM",
    items: [
      {
        title: "Karyawan",
        href: "/hr/employees",
        icon: IdCardIcon,
        roles: ["super_admin", "director", "finance", "hcm", "operations"],
      },
      {
        title: "Sertifikat",
        href: "/hr/certificates",
        icon: BadgeCheckIcon,
        roles: ["super_admin", "director", "hcm", "operations"],
      },
      {
        title: "Pelatihan",
        href: "/hr/trainings",
        icon: GraduationCapIcon,
        roles: ["super_admin", "director", "hcm", "operations"],
      },
      {
        title: "Kebutuhan Pelatihan",
        href: "/hr/training-needs",
        icon: ListChecksIcon,
        roles: ["super_admin", "director", "hcm", "operations"],
      },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      {
        title: "Pengguna & Peran",
        href: "/settings/users",
        icon: UsersIcon,
        roles: ["super_admin", "director"],
      },
      {
        title: "Profil Perusahaan",
        href: "/settings/company",
        icon: Building2Icon,
        roles: ["super_admin", "director"],
      },
      {
        title: "Master Data",
        href: "/settings/master-data",
        icon: DatabaseIcon,
        roles: ["super_admin", "director", "finance", "hcm", "operations"],
      },
      {
        title: "Parameter Sistem",
        href: "/settings/parameters",
        icon: SlidersHorizontalIcon,
        roles: ["super_admin", "director"],
      },
      {
        title: "Impor Data",
        href: "/settings/import",
        icon: FileUpIcon,
        roles: ["super_admin", "director", "hcm", "marketing", "finance"],
      },
      {
        title: "Log Audit",
        href: "/settings/audit-log",
        icon: ScrollTextIcon,
        roles: ["super_admin", "director"],
      },
    ],
  },
];

export function navForRole(role: AppRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

/** Active when the path is the item itself or one of its sub-pages. */
export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
