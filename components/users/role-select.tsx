"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/auth/roles";

type RoleSelectProps = {
  id?: string;
  value: AppRole | undefined;
  onValueChange: (role: AppRole) => void;
  invalid?: boolean;
};

export function RoleSelect({ id, value, onValueChange, invalid }: RoleSelectProps) {
  return (
    // "" keeps the Select controlled while showing the placeholder.
    <Select value={value ?? ""} onValueChange={(next) => onValueChange(next as AppRole)}>
      <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
        <SelectValue placeholder="Pilih peran" />
      </SelectTrigger>
      <SelectContent>
        {APP_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
