import { Check, X } from "lucide-react";
import { getPasswordChecks } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";

// Live checklist of the password rules. Pass the current password value; each
// rule turns green as it's satisfied.
export function PasswordRequirements({ password, className }: { password: string; className?: string }) {
  const checks = getPasswordChecks(password);
  return (
    <ul className={cn("space-y-1", className)}>
      {checks.map((c) => (
        <li
          key={c.label}
          className={cn(
            "flex items-center gap-2 text-xs",
            c.ok ? "text-green-600" : "text-slate-500",
          )}
        >
          {c.ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
          {c.label}
        </li>
      ))}
    </ul>
  );
}
