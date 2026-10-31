"use client";

import { MoreHorizontalIcon, SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConditionBadge } from "@/components/equipment/badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { adjustToolStock, changeToolCondition } from "@/lib/equipment/actions";
import { CONDITION_LABELS, CONDITIONS, type ToolCondition } from "@/lib/equipment/labels";

export type StockLine = {
  tool_id: string;
  tool_label: string;
  location_id: string;
  location_label: string;
  condition: ToolCondition;
  quantity: number;
};

type StockTableProps = {
  rows: StockLine[];
  /** Tool page lists locations; project tab lists tools. */
  mode: "tool" | "location";
  canChangeCondition: boolean;
  /** Tool page only: stock adjustment for Operasional. */
  adjust?: { toolId: string; locations: { value: string; label: string }[] } | null;
};

/** Stok per lokasi/kondisi with condition changes (ALT-05) and adjustments (ALT-02). */
export function StockTable({ rows: unsorted, mode, canChangeCondition, adjust }: StockTableProps) {
  const label = (row: StockLine) => (mode === "tool" ? row.location_label : row.tool_label);
  const rows = [...unsorted].sort(
    (a, b) => label(a).localeCompare(label(b)) || CONDITIONS.indexOf(a.condition) - CONDITIONS.indexOf(b.condition),
  );
  const [target, setTarget] = useState<StockLine | null>(null);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [to, setTo] = useState<ToolCondition>("damaged");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [adjustValues, setAdjustValues] = useState({ location_id: "", condition: "good" as ToolCondition, delta: "", reason: "" });
  const [pending, setPending] = useState(false);

  async function submitCondition() {
    if (!target) return;
    setPending(true);
    const result = await changeToolCondition({
      toolId: target.tool_id,
      values: { location_id: target.location_id, from: target.condition, to, quantity: Number(quantity), note },
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setConditionOpen(false);
  }

  async function submitAdjust() {
    if (!adjust) return;
    setPending(true);
    const result = await adjustToolStock({
      toolId: adjust.toolId,
      values: { ...adjustValues, delta: Number(adjustValues.delta) },
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setAdjustOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {adjust ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAdjustValues({ location_id: adjust.locations[0]?.value ?? "", condition: "good", delta: "", reason: "" });
              setAdjustOpen(true);
            }}
          >
            <SlidersHorizontalIcon />
            Penyesuaian stok
          </Button>
        </div>
      ) : null}
      {rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Belum ada stok</EmptyTitle>
            <EmptyDescription>{mode === "tool" ? "Alat ini sedang tidak berada di lokasi mana pun." : "Belum ada alat di lokasi ini."}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{mode === "tool" ? "Lokasi" : "Alat"}</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              {canChangeCondition ? (
                <TableHead>
                  <span className="sr-only">Tindakan</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.tool_id}-${row.location_id}-${row.condition}`}>
                <TableCell className="max-w-80 whitespace-normal">{mode === "tool" ? row.location_label : row.tool_label}</TableCell>
                <TableCell>
                  <ConditionBadge condition={row.condition} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{row.quantity}</TableCell>
                {canChangeCondition ? (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Tindakan ${row.tool_label} ${row.location_label} ${CONDITION_LABELS[row.condition]}`}
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setTarget(row);
                            setTo(row.condition === "good" ? "damaged" : "good");
                            setQuantity("1");
                            setNote("");
                            setConditionOpen(true);
                          }}
                        >
                          Ubah kondisi
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={conditionOpen} onOpenChange={setConditionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah kondisi</DialogTitle>
            <DialogDescription>
              {target
                ? `${target.tool_label} di ${target.location_label} · ${target.quantity} ${CONDITION_LABELS[target.condition]}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="condition-to">Kondisi baru *</FieldLabel>
              <Select value={to} onValueChange={(value) => setTo(value as ToolCondition)}>
                <SelectTrigger id="condition-to" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.filter((condition) => condition !== target?.condition).map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {CONDITION_LABELS[condition]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="condition-quantity">Jumlah *</FieldLabel>
              <Input
                id="condition-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={target?.quantity}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <FieldDescription>Maksimal {target?.quantity}.</FieldDescription>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="condition-note">Catatan *</FieldLabel>
              <Textarea
                id="condition-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={300}
                placeholder="Mis. bearing pecah saat penarikan"
              />
              <FieldDescription>Foto kondisi dapat dilampirkan di halaman alat.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setConditionOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending || !note.trim() || Number(quantity) < 1} onClick={() => void submitCondition()}>
              {pending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {adjust ? (
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Penyesuaian stok</DialogTitle>
              <DialogDescription>Tambah (+) atau kurangi (−) stok, mis. pembelian atau koreksi hitung. Tercatat di log audit.</DialogDescription>
            </DialogHeader>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="adjust-location">Lokasi *</FieldLabel>
                <Select
                  value={adjustValues.location_id}
                  onValueChange={(value) => setAdjustValues((current) => ({ ...current, location_id: value }))}
                >
                  <SelectTrigger id="adjust-location" className="w-full">
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {adjust.locations.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="adjust-condition">Kondisi *</FieldLabel>
                <Select
                  value={adjustValues.condition}
                  onValueChange={(value) => setAdjustValues((current) => ({ ...current, condition: value as ToolCondition }))}
                >
                  <SelectTrigger id="adjust-condition" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {CONDITION_LABELS[condition]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="adjust-delta">Jumlah (±) *</FieldLabel>
                <Input
                  id="adjust-delta"
                  type="number"
                  inputMode="numeric"
                  value={adjustValues.delta}
                  onChange={(event) => setAdjustValues((current) => ({ ...current, delta: event.target.value }))}
                  placeholder="Mis. 10 atau -2"
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="adjust-reason">Alasan *</FieldLabel>
                <Textarea
                  id="adjust-reason"
                  value={adjustValues.reason}
                  onChange={(event) => setAdjustValues((current) => ({ ...current, reason: event.target.value }))}
                  maxLength={300}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" disabled={pending} onClick={() => setAdjustOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={pending || !adjustValues.reason.trim() || !Number(adjustValues.delta) || !adjustValues.location_id}
                onClick={() => void submitAdjust()}
              >
                {pending ? "Menyimpan…" : "Simpan penyesuaian"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
