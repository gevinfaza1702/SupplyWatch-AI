import Link from "next/link";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/#fitur", label: "Fitur" },
  { href: "/#use-case", label: "Use Case" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
];

/**
 * Public marketing navbar used on the landing page.
 * The in-app navigation (sidebar) is a separate component (Phase 3).
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" />
          </span>
          <span className="text-base">
            SupplyWatch<span className="text-primary"> AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Coba Demo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
