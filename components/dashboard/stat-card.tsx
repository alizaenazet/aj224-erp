import Link from "next/link";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/** Clickable headline number (DSB-01). */
export function StatCard({ label, value, detail, href }: { label: string; value: string; detail?: string; href: string }) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        </CardHeader>
        {detail ? <CardFooter className="text-sm text-muted-foreground">{detail}</CardFooter> : null}
      </Card>
    </Link>
  );
}
