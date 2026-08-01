"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  FileCheck2,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-atmosphere" aria-hidden />
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          Atlas
        </Link>
        <nav>
          <Link href="/workspace">Open workspace</Link>
        </nav>
      </header>

      <main className="hero">
        <motion.p
          className="hero-kicker"
          custom={0}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          Requirements for government & enterprise
        </motion.p>
        <motion.h1
          className="hero-brand"
          custom={1}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          Atlas
        </motion.h1>
        <motion.p
          className="hero-line"
          custom={2}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          Replace the BRD/SRS binder with a living visual specification.
        </motion.p>
        <motion.p
          className="hero-sub"
          custom={3}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          Map inventory, HRMS, franchise, and other business solutions as
          workflows stakeholders can agree on — with actors, rules, compliance,
          and acceptance criteria attached to every step.
        </motion.p>
        <motion.div
          className="hero-cta"
          custom={4}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          <Link href="/workspace" className="btn primary">
            Start from a template
            <ArrowRight size={18} />
          </Link>
          <a href="#how" className="btn ghost">
            How it replaces documents
          </a>
        </motion.div>

        <motion.div
          className="hero-visual"
          custom={5}
          variants={fade}
          initial="hidden"
          animate="show"
          aria-hidden
        >
          <div className="flow-preview">
            <div className="fp-node trigger">Shipment arrives</div>
            <div className="fp-wire" />
            <div className="fp-node process">Verify against PO</div>
            <div className="fp-wire" />
            <div className="fp-node decision">QC required?</div>
            <div className="fp-wire" />
            <div className="fp-node outcome">Stock available</div>
          </div>
        </motion.div>
      </main>

      <section id="how" className="section how">
        <h2>One map. The whole specification.</h2>
        <p className="section-sub">
          Atlas turns narrative requirements into an executable conversation
          between business, IT, vendors, and auditors.
        </p>
        <div className="feature-grid">
          <article>
            <Waypoints size={22} />
            <h3>Visual workflows</h3>
            <p>
              Triggers, processes, decisions, approvals, systems, and outcomes —
              connected the way the business actually runs.
            </p>
          </article>
          <article>
            <FileCheck2 size={22} />
            <h3>Requirements on every node</h3>
            <p>
              Actors, inputs/outputs, business rules, and testable acceptance
              criteria live on the step — not in a 90-page appendix.
            </p>
          </article>
          <article>
            <ShieldCheck size={22} />
            <h3>Govt / enterprise ready</h3>
            <p>
              Compliance tags, stakeholders, constraints, and a living-spec
              export that can stand in for BRD/SRS reviews.
            </p>
          </article>
          <article>
            <GitBranch size={22} />
            <h3>Domain templates</h3>
            <p>
              Start from Inventory, HRMS, or Franchise Management — then reshape
              the map to your organisation.
            </p>
          </article>
        </div>
      </section>

      <section className="section domains">
        <h2>Built for real solution programmes</h2>
        <div className="domain-row">
          <div>
            <h3>Inventory</h3>
            <p>Gate-in to ledger with QC and replenishment.</p>
          </div>
          <div>
            <h3>HRMS</h3>
            <p>Hire-to-onboard and leave with policy gates.</p>
          </div>
          <div>
            <h3>Franchise</h3>
            <p>Onboarding, brand audits, and royalty cycles.</p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span className="brand">
          <span className="brand-mark" />
          Atlas
        </span>
        <span>Visual specifications · not document theatre</span>
      </footer>
    </div>
  );
}
