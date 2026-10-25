import { Separator } from "@/components/ui/separator";
import { getCompanyProfile } from "@/lib/company/queries";

/** Company letterhead for printable documents (UMM-05, MST-02). */
export async function Letterhead() {
  const { profile, logoUrl } = await getCompanyProfile();
  if (!profile) return null;

  const contact = [profile.phone, profile.email].filter(Boolean).join(" · ");

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          // Signed URL from private storage; plain img prints reliably.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={`Logo ${profile.name}`} className="h-16 w-auto" />
        ) : null}
        <div className="flex flex-col">
          <span className="text-xl font-bold">{profile.name}</span>
          {profile.address ? <span className="text-sm">{profile.address}</span> : null}
          {contact ? <span className="text-sm">{contact}</span> : null}
          {profile.npwp ? <span className="text-sm">NPWP: {profile.npwp}</span> : null}
        </div>
      </div>
      <Separator className="bg-foreground" />
    </header>
  );
}
