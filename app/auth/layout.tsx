export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-semibold">AJ224 ERP</span>
          <span className="text-sm text-muted-foreground">UD. AJ224</span>
        </div>
        {children}
      </div>
    </div>
  );
}
