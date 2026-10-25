"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { saveStageTemplate } from "@/lib/master-data/stage-actions";

type Stage = { id: string | null; name: string; weight: string; is_active: boolean; key: string };

type StageTemplateEditorProps = {
  stages: { id: string; name: string; default_weight: number; is_active: boolean }[];
  canManage: boolean;
};

let keySeed = 0;
const nextKey = () => `new-${++keySeed}`;

/** Edits all stringing stages at once; active weights must total 100 (MST-08). */
export function StageTemplateEditor({ stages, canManage }: StageTemplateEditorProps) {
  const [rows, setRows] = useState<Stage[]>(() =>
    stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      weight: String(stage.default_weight),
      is_active: stage.is_active,
      key: stage.id,
    })),
  );
  const [pending, setPending] = useState(false);

  const total = rows
    .filter((row) => row.is_active)
    .reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
  const totalOk = Math.abs(total - 100) < 0.001;

  function update(index: number, changes: Partial<Stage>) {
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
    const result = await saveStageTemplate(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        default_weight: Number(row.weight),
        is_active: row.is_active,
      })),
    );
    setPending(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">No.</TableHead>
            <TableHead>Tahapan</TableHead>
            <TableHead className="w-32">Bobot</TableHead>
            <TableHead className="w-24">Aktif</TableHead>
            {canManage ? (
              <TableHead className="w-36">
                <span className="sr-only">Tindakan</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.key}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {canManage ? (
                  <Input
                    value={row.name}
                    onChange={(event) => update(index, { name: event.target.value })}
                    aria-label={`Nama tahapan ${index + 1}`}
                    maxLength={80}
                  />
                ) : (
                  row.name
                )}
              </TableCell>
              <TableCell>
                {canManage ? (
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
                ) : (
                  formatNumber(Number(row.weight), 2)
                )}
              </TableCell>
              <TableCell>
                {canManage ? (
                  <Switch
                    checked={row.is_active}
                    onCheckedChange={(checked) => update(index, { is_active: checked })}
                    aria-label={`Aktif ${row.name}`}
                  />
                ) : (
                  <Badge variant={row.is_active ? "secondary" : "outline"}>
                    {row.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                )}
              </TableCell>
              {canManage ? (
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
              ) : null}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell />
            <TableCell>Total bobot tahapan aktif</TableCell>
            <TableCell>
              <Badge variant={totalOk ? "secondary" : "destructive"}>{formatNumber(total, 2)}</Badge>
            </TableCell>
            <TableCell colSpan={canManage ? 2 : 1} />
          </TableRow>
        </TableFooter>
      </Table>

      {!totalOk ? (
        <Alert variant="destructive">
          <AlertDescription>
            Total bobot harus 100 (sekarang {formatNumber(total, 2)}). Sesuaikan bobot sebelum menyimpan.
          </AlertDescription>
        </Alert>
      ) : null}

      {canManage ? (
        <div className="flex flex-wrap justify-between gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setRows((current) => [
                ...current,
                { id: null, name: "", weight: "0", is_active: true, key: nextKey() },
              ])
            }
          >
            <PlusIcon />
            Tambah tahapan
          </Button>
          <Button onClick={save} disabled={pending || !totalOk}>
            {pending ? "Menyimpan…" : "Simpan template"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
