"use client";

import { useMemo, useState } from "react";
import { usePrototypeStore } from "@/lib/store";

export function PreviewPanel() {
  const result = usePrototypeStore((s) => s.result);
  const scenario = usePrototypeStore((s) => s.scenario);
  const graph = usePrototypeStore((s) => s.graph);
  const [nav, setNav] = useState(0);

  const eligibilityRuleOn = graph.rules.find((r) => r.id === "rule_eligibility")?.enabled;
  const overdueRuleOn = graph.rules.find((r) => r.id === "rule_overdue")?.enabled;
  const duplicateRuleOn = graph.rules.find((r) => r.id === "rule_duplicate")?.enabled;

  const administerDisabled =
    !!eligibilityRuleOn &&
    !scenario.childEligible &&
    result.actions.primary.some((a) => a.id === "actn_administer");

  const confirmDisabled =
    result.workspace.id.includes("administer") &&
    ((!!eligibilityRuleOn && !scenario.childEligible) ||
      (!!duplicateRuleOn && scenario.duplicateDose));

  const showOverdueBanner =
    !!overdueRuleOn && scenario.hasOverdue && result.workspace.pattern === "ProfileWorkspace";

  const peerItems = result.navigation.peerNavigation[0]?.items ?? [];
  const activeNav = peerItems[nav]?.label ?? "Overview";

  const disabledPrimaryIds = useMemo(() => {
    const ids = new Set<string>();
    if (administerDisabled) ids.add("actn_administer");
    if (confirmDisabled) ids.add("actn_confirm_dose");
    return ids;
  }, [administerDisabled, confirmDisabled]);

  return (
    <div>
      <p className="eyebrow">Semantic preview · not a designed page</p>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.85rem",
          margin: "0.2rem 0 0.5rem",
        }}
      >
        Workspace as compiled meaning
      </h2>
      <p style={{ marginTop: 0, color: "rgba(8,32,40,0.7)", maxWidth: "42rem" }}>
        This preview is a consequence of the Workspace Definition — regions, priorities,
        actions, and rule affordances. Toggle rules/scenario in the sidebar to see UX
        effects change without redesigning a screen.
      </p>

      <div className="preview-shell">
        {showOverdueBanner && (
          <div className="preview-banner">
            Warning · One or more vaccines are overdue — recommended next: Administer
            Vaccine
          </div>
        )}

        <div className="preview-header">
          <div>
            <p className="eyebrow">{result.workspace.pattern}</p>
            <h2>{result.workspace.name}</h2>
            <p style={{ margin: "0.25rem 0 0", color: "rgba(8,32,40,0.65)" }}>
              {result.workspace.purpose}
            </p>
            <p style={{ margin: "0.45rem 0 0", fontSize: "0.85rem" }}>
              {result.navigation.identityStrip.map((r) => r.label).join(" · ") ||
                result.workspace.primaryObject.label}
            </p>
          </div>
          <div className="kpi-row">
            {result.workspace.kpis.length === 0 && (
              <div className="kpi">
                <strong>—</strong>
                No KPIs for this pattern
              </div>
            )}
            {result.workspace.kpis.map((k) => (
              <div key={k.id} className="kpi">
                <strong>
                  {k.label.includes("Overdue") && scenario.hasOverdue
                    ? "2"
                    : k.label.includes("Z-Score")
                      ? "-0.8"
                      : k.label.includes("Last")
                        ? "12d"
                        : "—"}
                </strong>
                {k.label}
                <span className={`prio ${k.priority}`}>{k.priority}</span>
              </div>
            ))}
          </div>
        </div>

        {peerItems.length > 0 && (
          <div className="preview-nav">
            {peerItems.map((item, i) => (
              <span
                key={item.id}
                className={i === nav ? "active" : ""}
                onClick={() => setNav(i)}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setNav(i);
                }}
              >
                {item.label}
                {item.badgeFrom && showOverdueBanner && item.label === "Vaccinations" && (
                  <span className="badge">2</span>
                )}
              </span>
            ))}
          </div>
        )}

        <div className="preview-body">
          <div className="preview-main">
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "rgba(8,32,40,0.55)" }}>
              Viewing: <strong>{activeNav}</strong> · widget intents below are abstract
              (not React components)
            </p>

            {result.workspace.sections
              .filter((s) =>
                peerItems.length === 0
                  ? true
                  : nav === 0 ||
                    s.presentationHint === "chrome" ||
                    s.id.includes("status") ||
                    (nav > 0 &&
                      peerItems[nav] &&
                      s.contentLabels.some((c) =>
                        c.toLowerCase().includes(
                          peerItems[nav].label.toLowerCase().slice(0, 5),
                        ),
                      )),
              )
              .slice(0, 4)
              .map((s) => (
                <div key={s.id} className="widget-block">
                  <div className="wkind">
                    section · {s.presentationHint}{" "}
                    <span className={`prio ${s.priority}`}>{s.priority}</span>
                  </div>
                  <p className="note">
                    <strong>{s.purpose}</strong>
                    <br />
                    {s.contentLabels.join(" · ") || "—"}
                  </p>
                </div>
              ))}

            {result.workspace.widgets.slice(0, 5).map((w) => (
              <div key={w.kind + w.binds.join("-")} className="widget-block">
                <div className="wkind">
                  widget intent · {w.kind}{" "}
                  <span className={`prio ${w.priority}`}>{w.priority}</span>
                </div>
                <p className="note">binds: {w.binds.join(", ") || "—"}</p>
              </div>
            ))}

            {result.navigation.relatedPanels.map((p) => (
              <div key={p.target.id} className="widget-block">
                <div className="wkind">
                  related panel{" "}
                  <span className={`prio ${p.priority}`}>{p.priority}</span>
                </div>
                <p className="note">{p.target.label} summary</p>
              </div>
            ))}
          </div>

          <aside className="preview-actions">
            <h4>Action rail (compiled)</h4>
            <div className="action-stack">
              {result.actions.primary.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="primary"
                  disabled={disabledPrimaryIds.has(a.id)}
                  title={
                    disabledPrimaryIds.has(a.id)
                      ? "Disabled by eligibility rule"
                      : undefined
                  }
                >
                  {a.label}
                </button>
              ))}
              {result.actions.secondary.map((a) => (
                <button key={a.id} type="button">
                  {a.label}
                </button>
              ))}
              {result.actions.overflow.map((a) => (
                <button key={a.id} type="button" style={{ opacity: 0.7, fontWeight: 500 }}>
                  {a.label} · overflow
                </button>
              ))}
              {result.actions.primary.length === 0 &&
                result.actions.secondary.length === 0 && (
                  <p style={{ fontSize: "0.82rem", color: "rgba(8,32,40,0.55)" }}>
                    No action rail for this workspace (e.g. search selects a row).
                  </p>
                )}
            </div>

            <h4 style={{ marginTop: "1.1rem" }}>Active affordances</h4>
            <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem" }}>
              {showOverdueBanner && <li>warningBanner + alertBadge on Vaccinations</li>}
              {administerDisabled && <li>disableAction · Administer Vaccine</li>}
              {confirmDisabled && scenario.duplicateDose && (
                <li>blockAction + inlineValidation · duplicate dose</li>
              )}
              {confirmDisabled && !scenario.childEligible && (
                <li>disableAction · Confirm Administration</li>
              )}
              {!showOverdueBanner && !administerDisabled && !confirmDisabled && (
                <li>None firing for current scenario</li>
              )}
            </ul>
          </aside>
        </div>
      </div>

      <div className="note-bar">
        Trace: activity <code>{result.workspace.trace.activityId}</code> · confidence{" "}
        {Math.round(result.workspace.trace.confidence * 100)}%
        {result.workspace.trace.alternatePattern
          ? ` · alternate ${result.workspace.trace.alternatePattern}`
          : ""}
        . This is still not a page builder — a real renderer would map these intents to
        your design system.
      </div>
    </div>
  );
}
