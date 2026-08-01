"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { useAtlasStore } from "@/lib/store";
import { DOMAIN_LABELS } from "@/lib/types";
import { TEMPLATE_CATALOG } from "@/lib/templates";

export function WorkspaceHub() {
  const router = useRouter();
  const hydrated = useAtlasStore((s) => s.hydrated);
  const solutions = useAtlasStore((s) => s.solutions);
  const seedIfEmpty = useAtlasStore((s) => s.seedIfEmpty);
  const createFromTemplate = useAtlasStore((s) => s.createFromTemplate);
  const deleteSolution = useAtlasStore((s) => s.deleteSolution);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (hydrated) seedIfEmpty();
  }, [hydrated, seedIfEmpty]);

  const start = (kind: "inventory" | "hrms" | "franchise" | "blank") => {
    setCreating(true);
    const id = createFromTemplate(kind);
    router.push(`/workspace/${id}/map`);
  };

  if (!hydrated) {
    return (
      <div className="workspace-loading">
        <p>Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="workspace-hub">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          Atlas
        </Link>
        <nav>
          <button
            type="button"
            className="btn primary compact"
            disabled={creating}
            onClick={() => start("blank")}
          >
            <Plus size={16} />
            Blank solution
          </button>
        </nav>
      </header>

      <section className="hub-intro">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          Solution workspace
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          Pick a domain template or open an existing living specification.
          Everything saves in this browser.
        </motion.p>
      </section>

      <section className="template-strip">
        {TEMPLATE_CATALOG.map((t, i) => (
          <motion.button
            key={t.id}
            type="button"
            className="template-card"
            disabled={creating}
            onClick={() => start(t.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
          >
            <span className="template-index">0{i + 1}</span>
            <h3>{t.title}</h3>
            <p>{t.blurb}</p>
            <span className="template-go">
              Use template <ArrowUpRight size={16} />
            </span>
          </motion.button>
        ))}
      </section>

      <section className="solution-list">
        <div className="list-head">
          <h2>Your solutions</h2>
          <span>{solutions.length} total</span>
        </div>
        <div className="solution-grid">
          {solutions.map((sol) => (
            <article key={sol.id} className="solution-card">
              <div className="solution-card-top">
                <p className="eyebrow">{DOMAIN_LABELS[sol.domain]}</p>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Delete solution"
                  onClick={() => deleteSolution(sol.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <h3>{sol.name}</h3>
              <p>{sol.tagline}</p>
              <div className="solution-stats">
                <span>{sol.workflows.length} workflows</span>
                <span>
                  {sol.workflows.reduce((a, w) => a + w.nodes.length, 0)} steps
                </span>
              </div>
              <div className="solution-actions">
                <Link href={`/workspace/${sol.id}/map`} className="btn primary compact">
                  Open map
                </Link>
                <Link href={`/workspace/${sol.id}/living-spec`} className="btn ghost compact">
                  Living spec
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
