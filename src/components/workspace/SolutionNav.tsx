"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAtlasStore } from "@/lib/store";
import { DOMAIN_LABELS } from "@/lib/types";

export function SolutionNav() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const solution = useAtlasStore((s) =>
    s.solutions.find((x) => x.id === params.id),
  );

  if (!solution) return null;

  const tabs = [
    { href: `/workspace/${solution.id}/map`, label: "Workflow map" },
    { href: `/workspace/${solution.id}/overview`, label: "Solution brief" },
    { href: `/workspace/${solution.id}/living-spec`, label: "Living spec" },
  ];

  return (
    <header className="solution-nav">
      <div className="solution-nav-left">
        <Link href="/workspace" className="brand compact">
          <span className="brand-mark" />
          Atlas
        </Link>
        <div className="solution-title-block">
          <p className="eyebrow">{DOMAIN_LABELS[solution.domain]}</p>
          <h1>{solution.name}</h1>
        </div>
      </div>
      <nav className="solution-tabs">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={pathname === t.href ? "active" : ""}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
