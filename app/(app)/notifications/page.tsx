import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { NotificationList, NotificationToolbar } from "@/components/notifications/notification-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireProfile } from "@/lib/auth/session";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { parseNotificationListParams, queryNotifications } from "@/lib/notifications/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifikasi" };

type SearchParams = Promise<RawSearchParams>;

export default function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Notifikasi" description="Pemberitahuan untuk akun Anda." />
      <Suspense fallback={<ContentSkeleton />}>
        <NotificationsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NotificationsContent({ searchParams }: { searchParams: SearchParams }) {
  await requireProfile();
  const raw = await searchParams;
  const params = parseNotificationListParams(raw);

  const supabase = await createClient();
  const [{ rows, count, error }, { count: unread }] = await Promise.all([
    queryNotifications(params, { page: params.page }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <NotificationToolbar hasUnread={(unread ?? 0) > 0} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Notifikasi gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <NotificationList items={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/notifications", page)}
      />
    </div>
  );
}
