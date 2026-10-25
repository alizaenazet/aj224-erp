import { Suspense } from "react";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";

export default function HomePage() {
  return (
    <>
      <PageHeader title="Beranda" />
      <Suspense fallback={<ContentSkeleton />}>
        <Welcome />
      </Suspense>
    </>
  );
}

async function Welcome() {
  const profile = await requireProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selamat datang, {profile.full_name}</CardTitle>
        <CardDescription>
          Anda masuk sebagai {ROLE_LABELS[profile.role]}. Ringkasan dan daftar
          Perlu Tindakan untuk peran Anda akan tampil di halaman ini.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
