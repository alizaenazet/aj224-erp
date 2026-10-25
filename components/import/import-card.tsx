"use client";

import { CircleCheckIcon, DownloadIcon, FileSpreadsheetIcon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImportResult } from "@/lib/import/types";

const SHOWN_ERRORS = 200;

type ImportCardProps = {
  template: { key: string; title: string; description: string; required: string[] };
};

/** One import template: download, choose file, Periksa, Impor (UMM-13). */
export function ImportCard({ template }: ImportCardProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<"check" | "import" | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function send(mode: "check" | "import") {
    if (!file) return;
    setPending(mode);
    setError(null);
    const body = new FormData();
    body.set("file", file);
    body.set("mode", mode);
    try {
      const response = await fetch(`/api/import/${template.key}`, { method: "POST", body });
      const json = await response.json();
      if (!response.ok) {
        setResult(null);
        setError(json.error ?? "Impor gagal diproses. Coba lagi.");
      } else {
        setResult(json as ImportResult);
        if (mode === "import") router.refresh();
      }
    } catch {
      setResult(null);
      setError("Koneksi terputus. Periksa jaringan lalu coba lagi.");
    } finally {
      setPending(null);
      setConfirmOpen(false);
    }
  }

  // Ask before importing when the last check of this file found failed rows.
  const knownFailures = result?.mode === "check" ? result.failed : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.title}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Kolom wajib: {template.required.join(", ")}.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild variant="outline">
            <a href={`/api/import/${template.key}`} download>
              <DownloadIcon />
              Unduh templat
            </a>
          </Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <FileSpreadsheetIcon />
            {file ? "Ganti berkas" : "Pilih berkas"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
              setError(null);
              event.target.value = "";
            }}
          />
          {file ? <span className="truncate text-sm">{file.name}</span> : null}
        </div>

        {error ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Berkas ditolak</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {result ? <ResultView result={result} /> : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!file || pending !== null} onClick={() => void send("check")}>
          {pending === "check" ? "Memeriksa…" : "Periksa"}
        </Button>
        <Button
          disabled={!file || pending !== null}
          onClick={() => (knownFailures ? setConfirmOpen(true) : void send("import"))}
        >
          {pending === "import" ? "Mengimpor…" : "Impor"}
        </Button>
      </CardFooter>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Impor baris yang valid saja?</AlertDialogTitle>
            <AlertDialogDescription>
              {knownFailures} baris gagal tidak akan diimpor. Perbaiki lalu impor ulang baris tersebut nanti; baris
              yang sudah masuk akan dilaporkan sebagai data yang sudah ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending !== null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending !== null}
              onClick={(event) => {
                event.preventDefault();
                void send("import");
              }}
            >
              Impor baris valid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ResultView({ result }: { result: ImportResult }) {
  const summary =
    result.mode === "check"
      ? `${result.total} baris: ${result.valid} valid, ${result.failed} gagal. Belum ada data yang disimpan.`
      : `${result.total} baris: ${result.imported} berhasil diimpor, ${result.failed} gagal.`;

  return (
    <div className="flex flex-col gap-3">
      <Alert variant={result.failed ? "destructive" : "default"}>
        {result.failed ? <TriangleAlertIcon /> : <CircleCheckIcon />}
        <AlertTitle>{result.mode === "check" ? "Hasil pemeriksaan" : "Hasil impor"}</AlertTitle>
        <AlertDescription>{summary}</AlertDescription>
      </Alert>
      {result.errors.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Baris</TableHead>
                <TableHead>Kolom</TableHead>
                <TableHead>Alasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.errors.slice(0, SHOWN_ERRORS).map((error, index) => (
                <TableRow key={`${error.row}-${index}`}>
                  <TableCell>{error.row}</TableCell>
                  <TableCell>{error.column ?? "—"}</TableCell>
                  <TableCell className="whitespace-normal">{error.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {result.errors.length > SHOWN_ERRORS ? (
            <p className="text-sm text-muted-foreground">
              Menampilkan {SHOWN_ERRORS} dari {result.errors.length} kesalahan.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
