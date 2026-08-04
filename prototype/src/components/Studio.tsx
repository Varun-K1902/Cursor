"use client";

import Link from "next/link";
import { usePrototypeStore } from "@/lib/store";
import { ExplorePanel } from "./ExplorePanel";
import { CompilePanel } from "./CompilePanel";
import { PreviewPanel } from "./PreviewPanel";

export function Studio() {
  const tab = usePrototypeStore((s) => s.tab);
  const setTab = usePrototypeStore((s) => s.setTab);
  const graph = usePrototypeStore((s) => s.graph);
  const activityId = usePrototypeStore((s) => s.activityId);
  const setActivity = usePrototypeStore((s) => s.setActivity);
  const toggleRule = usePrototypeStore((s) => s.toggleRule);
  const scenario = usePrototypeStore((s) => s.scenario);
  const setScenario = usePrototypeStore((s) => s.setScenario);
  const result = usePrototypeStore((s) => s.result);

  const activity = graph.activities.find((a) => a.id === activityId)!;

  return (
    <div className="studio">
      <header className="studio-top">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" className="brand">
            <span className="brand-mark" />
            Translate
          </Link>
          <div>
            <p className="eyebrow">{graph.journey.label}</p>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{activity.label}</div>
          </div>
        </div>
        <nav className="studio-tabs">
          {(
            [
              ["explore", "1 · Business"],
              ["compile", "2 · Compile"],
              ["preview", "3 · Workspace preview"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="studio-body">
        <aside className="side">
          <h2>Activities</h2>
          <div className="activity-list">
            {graph.activities.map((a) => (
              <button
                key={a.id}
                type="button"
                className={a.id === activityId ? "active" : ""}
                onClick={() => setActivity(a.id)}
              >
                <strong>{a.label}</strong>
                <small>
                  {a.verb} · {a.goalLabel}
                </small>
              </button>
            ))}
          </div>

          <div className="panel-block">
            <h3>Business rules</h3>
            {graph.rules.map((r) => (
              <label key={r.id} className="toggle-row">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={() => toggleRule(r.id)}
                />
                <span>
                  <strong>{r.label}</strong>
                  <br />
                  <span style={{ color: "rgba(8,32,40,0.55)" }}>{r.stereotype}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="panel-block">
            <h3>Runtime scenario</h3>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={scenario.childEligible}
                onChange={(e) => setScenario({ childEligible: e.target.checked })}
              />
              <span>Child is eligible</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={scenario.hasOverdue}
                onChange={(e) => setScenario({ hasOverdue: e.target.checked })}
              />
              <span>Has overdue vaccines</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={scenario.duplicateDose}
                onChange={(e) => setScenario({ duplicateDose: e.target.checked })}
              />
              <span>Duplicate dose selected</span>
            </label>
            <p style={{ fontSize: "0.75rem", color: "rgba(8,32,40,0.55)", margin: "0.4rem 0 0" }}>
              Scenario affects the preview affordances (disable / banners), not the
              structural compile — unless you toggle rules above.
            </p>
          </div>

          <div className="panel-block">
            <h3>Live pattern</h3>
            <div className="chip-row">
              <span className="chip amber">{result.pattern.selected}</span>
              <span className="chip">
                {Math.round(result.pattern.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        </aside>

        <main className="main">
          {tab === "explore" && <ExplorePanel />}
          {tab === "compile" && <CompilePanel />}
          {tab === "preview" && <PreviewPanel />}
        </main>
      </div>
    </div>
  );
}
