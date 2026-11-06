import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRate } from "@/lib/clients/labels";
import { formatRupiah } from "@/lib/format";
import {
  LOST_REASON_LABELS,
  TENDER_STATUS_LABELS,
  type LostReason,
  type TenderStatus,
} from "@/lib/tenders/labels";
import { MoneyValue } from "@/components/app/money-value";

type WinRow = {
  key: string;
  label: string;
  won_count: number;
  lost_count: number;
  won_value: number;
  lost_value: number;
  win_rate_count: number | null;
  win_rate_value: number | null;
};

/** Headline cards for the period (MKT-08, §11.1). */
export function AnalyticsSummary({ overall }: { overall: WinRow | null }) {
  const cards: [string, React.ReactNode, string][] = [
    [
      "Win rate (jumlah)",
      formatRate(overall?.win_rate_count),
      `${overall?.won_count ?? 0} menang dari ${(overall?.won_count ?? 0) + (overall?.lost_count ?? 0)} tender`,
    ],
    [
      "Win rate (nilai)",
      formatRate(overall?.win_rate_value),
      `${formatRupiah(overall?.won_value ?? 0)} dari ${formatRupiah((overall?.won_value ?? 0) + (overall?.lost_value ?? 0))}`,
    ],
    ["Nilai menang", <MoneyValue key="won" value={overall?.won_value ?? 0} />, `${overall?.won_count ?? 0} tender`],
    ["Nilai kalah", <MoneyValue key="lost" value={overall?.lost_value ?? 0} />, `${overall?.lost_count ?? 0} tender`],
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map(([title, value, note]) => (
        <Card key={title}>
          <CardHeader>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{value}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{note}</CardContent>
        </Card>
      ))}
    </div>
  );
}

function NoData({ text }: { text: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Belum ada data</EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/** Win rates per client or voltage for the period. */
export function WinRateTable({ title, rows, keyLabel }: { title: string; rows: WinRow[]; keyLabel: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <NoData text="Tidak ada tender Menang atau Kalah pada periode ini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{keyLabel}</TableHead>
                <TableHead className="text-right">Menang</TableHead>
                <TableHead className="text-right">Kalah</TableHead>
                <TableHead className="text-right">Win Rate (Jumlah)</TableHead>
                <TableHead className="text-right">Nilai Menang</TableHead>
                <TableHead className="text-right">Win Rate (Nilai)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right">{row.won_count}</TableCell>
                  <TableCell className="text-right">{row.lost_count}</TableCell>
                  <TableCell className="text-right">{formatRate(row.win_rate_count)}</TableCell>
                  <TableCell className="text-right">{formatRupiah(row.won_value)}</TableCell>
                  <TableCell className="text-right">{formatRate(row.win_rate_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function LostReasonsTable({
  rows,
}: {
  rows: { reason: string; tender_count: number; bid_value: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alasan kalah</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <NoData text="Tidak ada tender Kalah pada periode ini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alasan</TableHead>
                <TableHead className="text-right">Tender</TableHead>
                <TableHead className="text-right">Nilai Penawaran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.reason}>
                  <TableCell className="font-medium">{LOST_REASON_LABELS[row.reason as LostReason] ?? row.reason}</TableCell>
                  <TableCell className="text-right">{row.tender_count}</TableCell>
                  <TableCell className="text-right">{formatRupiah(row.bid_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

const PIPELINE_ORDER: TenderStatus[] = ["prospect", "preparing", "submitted", "negotiation"];

export function PipelineTable({
  rows,
}: {
  rows: { status: string; tender_count: number; bid_value: number; weighted_value: number }[];
}) {
  const byStatus = new Map(rows.map((row) => [row.status, row]));
  const total = rows.reduce(
    (sum, row) => ({
      count: sum.count + row.tender_count,
      bid: sum.bid + Number(row.bid_value),
      weighted: sum.weighted + Number(row.weighted_value),
    }),
    { count: 0, bid: 0, weighted: 0 },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline per status</CardTitle>
        <CardDescription>Tender aktif saat ini, tanpa melihat periode.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tender</TableHead>
              <TableHead className="text-right">Nilai Penawaran</TableHead>
              <TableHead className="text-right">Nilai Tertimbang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PIPELINE_ORDER.map((status) => {
              const row = byStatus.get(status);
              return (
                <TableRow key={status}>
                  <TableCell className="font-medium">{TENDER_STATUS_LABELS[status]}</TableCell>
                  <TableCell className="text-right">{row?.tender_count ?? 0}</TableCell>
                  <TableCell className="text-right">{formatRupiah(row?.bid_value ?? 0)}</TableCell>
                  <TableCell className="text-right">{formatRupiah(row?.weighted_value ?? 0)}</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-medium">{total.count}</TableCell>
              <TableCell className="text-right font-medium">{formatRupiah(total.bid)}</TableCell>
              <TableCell className="text-right font-medium">{formatRupiah(total.weighted)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
