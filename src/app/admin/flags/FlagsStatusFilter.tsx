"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  current: string;
}

const OPTIONS: { value: string; label: string }[] = [
  { value: "open", label: "Sin revisar" },
  { value: "reviewed", label: "Revisados" },
  { value: "dismissed", label: "Descartados" },
];

export function FlagsStatusFilter({ current }: Props) {
  const router = useRouter();
  return (
    <div className="flex gap-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={current === opt.value ? "default" : "ghost"}
          onClick={() => router.push(`/admin/flags?status=${opt.value}`)}
          className={
            current === opt.value
              ? "bg-law-gold text-gem-onyx hover:bg-law-gold/80"
              : "text-gem-offwhite/60 hover:text-gem-offwhite"
          }
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
