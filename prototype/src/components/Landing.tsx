"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.07 * i,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const PIPE = [
  "Business",
  "Spec Graph",
  "Translation Layer",
  "Workspace Def",
  "Layout",
  "UI",
];

export function Landing() {
  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-inner">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="brand">
            <span className="brand-mark" />
            Translate
          </span>
          <Link href="/studio" className="btn ghost compact">
            Open prototype
          </Link>
        </header>

        <motion.p className="eyebrow" custom={0} variants={fade} initial="hidden" animate="show" style={{ marginTop: "3rem" }}>
          Interactive prototype · Business-to-UX Translation Layer
        </motion.p>
        <motion.h1 custom={1} variants={fade} initial="hidden" animate="show">
          Translate
        </motion.h1>
        <motion.p className="lead" custom={2} variants={fade} initial="hidden" animate="show">
          Compile business meaning into UX meaning — without designing pages.
        </motion.p>
        <motion.p className="sub" custom={3} variants={fade} initial="hidden" animate="show">
          Explore a Child Immunization journey, step through compiler passes, toggle
          rules, and inspect the emitted Workspace Definition and semantic preview.
          No forms, tabs, or components are authored by the business user.
        </motion.p>

        <motion.div custom={4} variants={fade} initial="hidden" animate="show" style={{ marginTop: "1.5rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link href="/studio" className="btn primary">
            Launch interactive studio
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        <motion.div className="pipeline-strip" custom={5} variants={fade} initial="hidden" animate="show">
          {PIPE.map((p, i) => (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <span className={`pipe-chip ${p === "Translation Layer" ? "hl" : ""}`}>{p}</span>
              {i < PIPE.length - 1 && <span className="pipe-arrow">→</span>}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
