import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tautan tidak dapat dipakai</CardTitle>
        <CardDescription>
          Tautan ini tidak valid, sudah dipakai, atau sudah kedaluwarsa. Untuk
          undangan, minta Super Admin mengirim ulang undangan. Untuk atur ulang
          kata sandi, ajukan permintaan baru dari halaman masuk.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/auth/login">Ke halaman masuk</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
