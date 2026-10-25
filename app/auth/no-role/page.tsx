import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NoRolePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Akun belum memiliki peran</CardTitle>
        <CardDescription>
          Akun Anda belum diberi peran sehingga belum bisa memakai AJ224 ERP.
          Hubungi Super Admin untuk mengatur peran Anda.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <SignOutButton className="w-full" />
      </CardFooter>
    </Card>
  );
}
