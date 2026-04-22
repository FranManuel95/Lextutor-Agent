import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  href: string;
  label?: string;
}

// Server-safe (renders a plain <a download>). Works even with query params.
export function AdminExportButton({ href, label = "Exportar CSV" }: Props) {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="gap-2 border-law-gold/30 bg-law-gold/5 text-law-gold hover:bg-law-gold/10 hover:text-law-gold"
    >
      <Link href={href} prefetch={false}>
        <Download className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
