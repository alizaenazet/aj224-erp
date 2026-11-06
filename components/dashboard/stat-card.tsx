import Link from "next/link";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Clickable headline number (DSB-01). `shortValue` ("Rp 18,3 M") replaces a
 * long value on phones, where the cards sit two per row.
 */
export function StatCard({
  label,
  value,
  shortValue,
  detail,
  href,
}: {
  label: string;
  value: string;
  shortValue?: string;
  detail?: string;
  href: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-xl tabular-nums sm:text-2xl">
            {shortValue ? (
              <>
                <span className="sm:hidden">{shortValue}</span>
                <span className="hidden sm:inline">{value}</span>
              </>
            ) : (
              value
            )}
          </CardTitle>
        </CardHeader>
        {detail ? <CardFooter className="text-sm text-muted-foreground">{detail}</CardFooter> : null}
      </Card>
    </Link>
  );
}
