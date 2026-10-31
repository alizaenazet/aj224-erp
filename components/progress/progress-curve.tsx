"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDate } from "@/lib/format";
import { formatProgress, type CurvePoint } from "@/lib/progress/labels";

// The neutral chart palette is greys; primary and muted-foreground keep the
// two lines apart in light and dark themes (plan is also dashed).
const chartConfig = {
  planned: { label: "Rencana", color: "var(--muted-foreground)" },
  actual: { label: "Realisasi", color: "var(--primary)" },
} satisfies ChartConfig;

/** Kurva rencana vs realisasi per minggu (PRJ-08). */
export function ProgressCurve({ points }: { points: CurvePoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <LineChart data={points} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="week_end"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value: string) => formatDate(value).replace(/ \d{4}$/, "")}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value: number) => `${value}%`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => `Minggu s.d. ${formatDate(payload?.[0]?.payload?.week_end)}`}
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                  <span className="font-medium tabular-nums">{formatProgress(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="planned" type="monotone" stroke="var(--color-planned)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
        <Line dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={2} dot={false} connectNulls={false} />
      </LineChart>
    </ChartContainer>
  );
}
