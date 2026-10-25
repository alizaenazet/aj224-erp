"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { deleteContact, saveContact } from "@/lib/clients/actions";
import type { ContactRow } from "@/lib/clients/labels";
import { contactSchema, type ContactInput } from "@/lib/clients/schema";

const FIELDS: { name: keyof ContactInput; label: string; required?: boolean; type?: string; max: number }[] = [
  { name: "name", label: "Nama", required: true, max: 120 },
  { name: "position", label: "Jabatan", max: 80 },
  { name: "phone", label: "No. HP", type: "tel", max: 20 },
  { name: "email", label: "Email", type: "email", max: 120 },
  { name: "notes", label: "Catatan", max: 300 },
];

/** Contacts of a client (MKT-01). */
export function ClientContacts({
  clientId,
  contacts,
  canManage,
}: {
  clientId: string;
  contacts: ContactRow[];
  canManage: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContactRow | null>(null);
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [deleteTarget, setDeleteTarget] = useState<ContactRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteContact(deleteTarget.id);
    setPending(false);
    setConfirmOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontak</CardTitle>
        {canManage ? (
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setDialogOpen(true);
              }}
            >
              <PlusIcon />
              Tambah kontak
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada kontak</EmptyTitle>
              <EmptyDescription>Kontak klien akan tampil di sini.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Catatan</TableHead>
                {canManage ? (
                  <TableHead>
                    <span className="sr-only">Tindakan</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.position ?? "—"}</TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`} className="underline-offset-4 hover:underline">
                        {contact.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="underline-offset-4 hover:underline">
                        {contact.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">{contact.notes ?? "—"}</TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Tindakan untuk ${contact.name}`}>
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditTarget(contact);
                              setDialogOpen(true);
                            }}
                          >
                            Ubah
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setDeleteTarget(contact);
                              setConfirmOpen(true);
                            }}
                          >
                            Hapus
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
      </CardContent>

      {canManage ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTarget ? "Ubah kontak" : "Tambah kontak"}</DialogTitle>
              <DialogDescription>Orang yang dihubungi di perusahaan klien.</DialogDescription>
            </DialogHeader>
            {dialogOpen ? (
              <ContactForm clientId={clientId} contact={editTarget} onDone={() => setDialogOpen(false)} />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kontak?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.name} dihapus dari daftar kontak klien.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ContactForm({
  clientId,
  contact,
  onDone,
}: {
  clientId: string;
  contact: ContactRow | null;
  onDone: () => void;
}) {
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema) as unknown as Resolver<ContactInput>,
    defaultValues: contact ?? { position: null, phone: null, email: null, notes: null },
  });

  async function onSubmit(values: ContactInput) {
    const result = await saveContact({ clientId, contactId: contact?.id, values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((config) => (
          <Controller
            key={config.name}
            name={config.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className={config.name === "notes" ? "sm:col-span-2" : undefined}>
                <FieldLabel htmlFor={`contact-${config.name}`}>
                  {config.required ? `${config.label} *` : config.label}
                </FieldLabel>
                <Input
                  id={`contact-${config.name}`}
                  type={config.type ?? "text"}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={config.max}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ))}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
