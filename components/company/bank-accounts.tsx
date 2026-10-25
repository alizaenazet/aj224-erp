"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  saveBankAccount,
  setBankAccountActive,
  setDefaultBankAccount,
} from "@/lib/company/actions";
import type { BankAccount } from "@/lib/company/queries";
import { bankAccountSchema, type BankAccountInput } from "@/lib/company/schema";

const FIELDS: { name: keyof BankAccountInput; label: string }[] = [
  { name: "bank_name", label: "Bank *" },
  { name: "account_number", label: "Nomor rekening *" },
  { name: "account_holder", label: "Atas nama *" },
];

/** Company bank accounts with exactly one default (MST-02). */
export function BankAccounts({ accounts, canEdit }: { accounts: BankAccount[]; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  async function run(action: Promise<{ ok: boolean; message?: string; error?: string }>) {
    const result = await action;
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada rekening perusahaan.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead>Nomor rekening</TableHead>
              <TableHead>Atas nama</TableHead>
              <TableHead>Status</TableHead>
              {canEdit ? (
                <TableHead>
                  <span className="sr-only">Tindakan</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.bank_name}</TableCell>
                <TableCell>{account.account_number}</TableCell>
                <TableCell>{account.account_holder}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {account.is_default ? <Badge>Utama</Badge> : null}
                    <Badge variant={account.is_active ? "secondary" : "destructive"}>
                      {account.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </TableCell>
                {canEdit ? (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Tindakan untuk ${account.bank_name} ${account.account_number}`}>
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(account);
                            setOpen(true);
                          }}
                        >
                          Ubah
                        </DropdownMenuItem>
                        {!account.is_default ? (
                          <DropdownMenuItem onSelect={() => void run(setDefaultBankAccount(account.id))}>
                            Jadikan utama
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onSelect={() => void run(setBankAccountActive(account.id, !account.is_active))}
                        >
                          {account.is_active ? "Nonaktifkan" : "Aktifkan"}
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

      {canEdit ? (
        <div>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <PlusIcon />
            Tambah rekening
          </Button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {open ? (
            <BankAccountForm key={editing?.id ?? "new"} account={editing} onDone={() => setOpen(false)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BankAccountForm({ account, onDone }: { account: BankAccount | null; onDone: () => void }) {
  const form = useForm<BankAccountInput>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: account?.bank_name ?? "",
      account_number: account?.account_number ?? "",
      account_holder: account?.account_holder ?? "",
    },
  });

  async function onSubmit(values: BankAccountInput) {
    const result = await saveBankAccount(account?.id ?? null, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{account ? "Ubah rekening" : "Tambah rekening"}</DialogTitle>
      </DialogHeader>
      <FieldGroup className="py-4">
        {FIELDS.map((field) => (
          <Controller
            key={field.name}
            name={field.name}
            control={form.control}
            render={({ field: control, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`bank-${field.name}`}>{field.label}</FieldLabel>
                <Input id={`bank-${field.name}`} {...control} aria-invalid={fieldState.invalid} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ))}
      </FieldGroup>
      <DialogFooter>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
