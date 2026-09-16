"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type NavLink = { href: string; label: string };

export default function NavBar({
  title,
  name,
  links,
}: {
  title: string;
  name: string;
  links: NavLink[];
}) {
  const pathname = usePathname();

  // The most specific (longest) matching href wins — otherwise a section's
  // index link (e.g. "/owner") would also light up on every nested route
  // under it (e.g. "/owner/orders").
  const activeHref = links
    .filter((link) => pathname === link.href || pathname?.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <header className="border-b border-border bg-card/40 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="font-heading text-sm font-bold">
            Arck&rsquo;s Warehouse
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const isActive = link.href === activeHref;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" })}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{name}</span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
