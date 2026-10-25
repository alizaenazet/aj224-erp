/** Printable documents: no app shell, A4 sheet centered on screen. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-muted p-4 sm:p-8 print:bg-background print:p-0">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">{children}</div>
    </div>
  );
}
