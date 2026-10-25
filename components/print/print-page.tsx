/** A4-width sheet; on paper it fills the @page area without decoration. */
export function PrintPage({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      {children}
    </article>
  );
}
