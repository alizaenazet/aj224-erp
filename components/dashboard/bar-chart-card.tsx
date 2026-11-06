"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;
const compact = (value: number) => new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/**
 * Single-series bar chart (DSB-03). One series only: the theme's chart tokens
 * are a neutral ramp, so identity is never encoded by colour; the title names
 * the series and the linked page is the table view.
 */
export function BarChartCard({
  title,
  description,
  data,
  money = false,
  labelWidth = 72,
  tableHref,
}: {
  title: string;
  description?: string;
  data: { label: string; value: number }[];
  money?: boolean;
  /** Width of the category label column (long cost category names need more). */
  labelWidth?: number;
  tableHref: string;
}) {
  const config = { value: { label: title, color: "var(--chart-2)" } } satisfies ChartConfig;
  const empty = data.every((row) => row.value === 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction>
          <Link href={tableHref} className="text-sm underline-offset-4 hover:underline">
            Tabel
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        ) : (
          <ChartContainer config={config} className={data.length > 6 ? "aspect-auto h-80 w-full" : "aspect-auto h-52 w-full"}>
            {/* Horizontal bars: category labels never collide in narrow cards. */}
            <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12 }} accessibilityLayer>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={labelWidth} interval={0} />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(value: number) => (money ? compact(value) : String(value))} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => (money ? rupiah(Number(value)) : Number(value).toLocaleString("id-ID"))} />}
              />
              <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
