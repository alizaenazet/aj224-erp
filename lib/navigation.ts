import {
  BadgeCheckIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  TruckIcon,
  WrenchIcon,
  PackageIcon,
  PackagePlusIcon,
  PackageMinusIcon,
  ArrowLeftRightIcon,
  TriangleAlertIcon,
  ReceiptTextIcon,
  FileStackIcon,
  WalletIcon,
  CoinsIcon,
  HandCoinsIcon,
  TrendingUpIcon,
  BanknoteIcon,
  UserPlusIcon,
  UserRoundCheckIcon,
  Building2Icon,
  ChartColumnIcon,
  DatabaseIcon,
  FileTextIcon,
  FileUpIcon,
  FolderKanbanIcon,
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
  {
    label: "Proyek",
    items: [
      {
        title: "Daftar Proyek",
        href: "/projects",
        icon: FolderKanbanIcon,
        roles: ["super_admin", "director", "marketing", "finance", "hcm", "operations"],
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      {
        title: "Laporan Harian",
        href: "/operations/daily-reports",
        icon: ClipboardListIcon,
        roles: ["super_admin", "director", "operations"],
      },
      {
        title: "Alat",
        href: "/operations/tools",
        icon: WrenchIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
      {
        title: "Surat Jalan",
        href: "/operations/delivery-notes",
        icon: TruckIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
      {
        title: "Material & Stok",
        href: "/operations/materials",
        icon: PackageIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
      {
        title: "Transaksi Material",
        href: "/operations/material-transactions",
        icon: ArrowLeftRightIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
      {
        title: "Insiden K3",
        href: "/operations/incidents",
        icon: TriangleAlertIcon,
        roles: ["super_admin", "director", "hcm", "operations"],
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        title: "Invoice & Piutang",
        href: "/finance/invoices",
        icon: ReceiptTextIcon,
        roles: ["super_admin", "director", "marketing", "finance"],
      },
      {
        title: "Tagihan Supplier & Utang",
        href: "/finance/bills",
        icon: FileStackIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
      {
        title: "Pengeluaran",
        href: "/finance/expenses",
        icon: CoinsIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
      {
        title: "Kas Lapangan",
        href: "/finance/field-cash",
        icon: WalletIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
      {
        title: "Laporan L/R",
        href: "/finance/pl",
        icon: TrendingUpIcon,
        roles: ["super_admin", "director", "finance", "operations"],
      },
    ],
  },
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
      {
        title: "Penugasan",
        href: "/hr/assignments",
        icon: UserRoundCheckIcon,
        roles: ["super_admin", "director", "hcm", "operations"],
      },
      {
        title: "Absensi",
        href: "/hr/attendance",
        icon: CalendarCheckIcon,
        roles: ["super_admin", "director", "finance", "hcm", "operations"],
      },
      {
        title: "Kasbon",
        href: "/hr/kasbon",
        icon: HandCoinsIcon,
        roles: ["director", "finance", "hcm"],
      },
      {
        title: "Payroll",
        href: "/hr/payroll",
        icon: BanknoteIcon,
        roles: ["director", "finance", "hcm"],
      },
    ],
  },
  {
    label: "Lapangan",
    items: [
      { title: "Absensi Hari Ini", href: "/field/attendance", icon: CalendarCheckIcon, roles: ["field"] },
      { title: "Laporan Harian", href: "/field/daily-reports/new", icon: ClipboardListIcon, roles: ["field"] },
      { title: "Surat Jalan", href: "/operations/delivery-notes", icon: TruckIcon, roles: ["field"] },
      { title: "Terima Material", href: "/operations/material-transactions/new?kind=receipt", icon: PackagePlusIcon, roles: ["field"] },
      { title: "Pakai Material", href: "/operations/material-transactions/new?kind=usage", icon: PackageMinusIcon, roles: ["field"] },
      { title: "Lapor Insiden", href: "/operations/incidents/new", icon: TriangleAlertIcon, roles: ["field"] },
      { title: "Catat Pengeluaran", href: "/finance/field-cash/expenses/new", icon: WalletIcon, roles: ["field"] },
      { title: "Tambah Pekerja Lokal", href: "/field/workers/new", icon: UserPlusIcon, roles: ["field"] },
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
        roles: ["super_admin", "director", "hcm", "marketing", "finance", "operations"],
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
