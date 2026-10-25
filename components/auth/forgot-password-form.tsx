"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.email("Format email tidak valid."),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email);

    // Only rate limits are reported; other outcomes look the same so the page
    // never reveals whether an email is registered.
    if (
      error?.code === "over_email_send_rate_limit" ||
      error?.code === "over_request_rate_limit"
    ) {
      setError(authErrorMessage(error));
      return;
    }

    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lupa kata sandi</CardTitle>
        <CardDescription>
          Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur
          ulang kata sandi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <Alert>
            <AlertDescription>
              Jika email tersebut terdaftar, tautan untuk mengatur ulang kata
              sandi telah dikirim. Periksa kotak masuk Anda.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@perusahaan.com"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Mengirim…" : "Kirim tautan"}
              </Button>
            </FieldGroup>
          </form>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="link" size="sm">
          <Link href="/auth/login">Kembali ke halaman masuk</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
