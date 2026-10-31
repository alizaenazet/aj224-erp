"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { saveProjectStages } from "@/lib/progress/actions";
import type { StageRow } from "@/lib/progress/labels";

type Row = { id: string | null; name: string; weight: string; key: string };

let keySeed = 0;
const nextKey = () => `new-${++keySeed}`;

/** The project's own stages and weights (PRJ-06, MST-08); weights total 100. */
export function StageEditor({
  projectId,
  stages,
  onDone,
}: {
  projectId: string;
  stages: StageRow[];
  onDone: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    stages.map((stage) => ({ id: stage.id, name: stage.name, weight: String(stage.weight), key: stage.id })),
  );
  const [pending, setPending] = useState(false);

  const total = rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
  const totalOk = Math.abs(total - 100) < 0.001;
  const removed = stages.filter((stage) => !rows.some((row) => row.id === stage.id));

  function update(index: number, changes: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  function move(index: number, offset: -1 | 1) {
    setRows((current) => {
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(index + offset, 0, row);
      return next;
    });
  }

  async function save() {
    setPending(true);
    const result = await saveProjectStages({
      projectId,
      stages: rows.map((row, index) => ({
        id: row.id,
        name: row.name,
        weight: Number(row.weight),
        sort_order: (index + 1) * 10,
      })),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">No.</TableHead>
            <TableHead>Tahapan</TableHead>
            <TableHead className="w-28">Bobot</TableHead>
            <TableHead className="w-32">
              <span className="sr-only">Tindakan</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.key}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Input
                  value={row.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                  aria-label={`Nama tahapan ${index + 1}`}
                  maxLength={60}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.5}
                  value={row.weight}
                  onChange={(event) => update(index, { weight: event.target.value })}
                  aria-label={`Bobot ${row.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Naikkan ${row.name}`}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Turunkan ${row.name}`}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Hapus ${row.name}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell />
            <TableCell>Total bobot</TableCell>
            <TableCell>
              <Badge variant={totalOk ? "success" : "destructive"}>{formatNumber(total, 2)}</Badge>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      {!totalOk ? (
        <Alert variant="destructive">
          <AlertDescription>
            Total bobot harus 100 (sekarang {formatNumber(total, 2)}). Pindahkan bobot ke tahapan lain sebelum menyimpan.
          </AlertDescription>
        </Alert>
      ) : null}
      {removed.length ? (
        <Alert variant="warning">
          <AlertDescription>
            Progres tahapan {removed.map((stage) => stage.name).join(", ")} ikut terhapus saat disimpan.
          </AlertDescription>
        </Alert>
      ) : null}

      <DialogFooter className="sm:justify-between">
        <Button
          variant="outline"
          onClick={() => setRows((current) => [...current, { id: null, name: "", weight: "0", key: nextKey() }])}
        >
          <PlusIcon />
          Tambah tahapan
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Batal
          </Button>
          <Button onClick={() => void save()} disabled={pending || !totalOk}>
            {pending ? "Menyimpan…" : "Simpan tahapan"}
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}
