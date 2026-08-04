"use client";

import { usePrototypeStore } from "@/lib/store";

export function CompilePanel() {
  const result = usePrototypeStore((s) => s.result);
  const activePass = usePrototypeStore((s) => s.activePass);
  const setActivePass = usePrototypeStore((s) => s.setActivePass);
  const pass = result.passes[activePass];

  return (
    <div>
      <p className="eyebrow">Translation Layer · compiler passes</p>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.85rem",
          margin: "0.2rem 0 0.5rem",
        }}
      >
        Step through the compile
      </h2>
      <p style={{ marginTop: 0, color: "rgba(8,32,40,0.7)" }}>
        Each pass is deterministic and explainable. Click a pass to inspect its IR.
      </p>

      <div className="pass-rail">
        {result.passes.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={i === activePass ? "active" : ""}
            onClick={() => setActivePass(i)}
          >
            <span className="pid">{p.id}</span>
            <span className="ptitle">{p.title}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <h3>
          {pass.id} · {pass.title}
        </h3>
        <p>{pass.summary}</p>
      </div>

      {activePass === 0 && (
        <div className="card">
          <h3>Interaction Intent</h3>
          <dl className="kv">
            <dt>Goal type</dt>
            <dd>{result.intent.goalType}</dd>
            <dt>Cognitive mode</dt>
            <dd>{result.intent.cognitiveMode}</dd>
            <dt>Primary object</dt>
            <dd>{result.intent.primaryObject.label}</dd>
            <dt>Supporting</dt>
            <dd>
              {result.intent.supportingObjects.map((o) => o.label).join(", ") || "—"}
            </dd>
            <dt>Read/write</dt>
            <dd>{result.intent.readWriteRatio.toFixed(2)} (1 = read-only)</dd>
            <dt>Object span</dt>
            <dd>{result.intent.objectSpan}</dd>
            <dt>Time</dt>
            <dd>{result.intent.timeOrientation}</dd>
            <dt>Success</dt>
            <dd>{result.intent.successSignal}</dd>
          </dl>
          <ul>
            {result.intent.rationale.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {activePass === 1 && (
        <div className="grid-2">
          <div className="card">
            <h3>Selected pattern</h3>
            <p>
              <span className="chip amber">{result.pattern.selected}</span>{" "}
              <span className="chip">
                {Math.round(result.pattern.confidence * 100)}%
              </span>
            </p>
            {result.pattern.alternate && (
              <p>
                Alternate: <strong>{result.pattern.alternate}</strong>
              </p>
            )}
            <ul>
              {result.pattern.rationale.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Scorecard</h3>
            {Object.entries(result.pattern.scores)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([name, score]) => {
                const max = Math.max(...Object.values(result.pattern.scores), 1);
                const winner = name === result.pattern.selected;
                return (
                  <div key={name} className={`score-bar ${winner ? "winner" : ""}`}>
                    <span style={{ width: 130, fontWeight: winner ? 700 : 500 }}>
                      {name.replace("Workspace", "")}
                    </span>
                    <div className="track">
                      <div
                        className="fill"
                        style={{
                          width: `${Math.max(0, (score / max) * 100)}%`,
                        }}
                      />
                    </div>
                    <span style={{ width: 28 }}>{score}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activePass === 2 && (
        <div className="card">
          <h3>Information priorities</h3>
          <ul>
            {result.ia.map((n) => (
              <li key={n.ref.id}>
                {n.ref.label}{" "}
                <span className={`prio ${n.priority}`}>{n.priority}</span>{" "}
                <span className="chip muted">{n.facet}</span>{" "}
                <span className="chip muted">{n.displayRole}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activePass === 3 && (
        <div className="grid-2">
          <div className="card">
            <h3>Navigation strategies</h3>
            <ul>
              {result.navigation.assignments.map((a) => (
                <li key={a.target.id}>
                  <strong>{a.target.label}</strong> → {a.strategy}
                  <ul>
                    {a.rationale.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Emitted chrome (semantic)</h3>
            <p>
              Identity strip:{" "}
              {result.navigation.identityStrip.map((r) => r.label).join(", ") || "—"}
            </p>
            <p>
              Peer:{" "}
              {result.navigation.peerNavigation[0]?.items.map((i) => i.label).join(" · ") ||
                "—"}
            </p>
            <p>
              Panels:{" "}
              {result.navigation.relatedPanels.map((p) => p.target.label).join(", ") ||
                "—"}
            </p>
            <p>
              Expandable:{" "}
              {result.navigation.expandable.map((e) => e.label).join(", ") || "—"}
            </p>
          </div>
        </div>
      )}

      {activePass === 4 && (
        <div className="card">
          <h3>Action ranking</h3>
          <dl className="kv" style={{ marginBottom: "0.75rem" }}>
            <dt>Primary</dt>
            <dd>{result.actions.primary.map((a) => a.label).join(", ") || "—"}</dd>
            <dt>Secondary</dt>
            <dd>{result.actions.secondary.map((a) => a.label).join(", ") || "—"}</dd>
            <dt>Overflow</dt>
            <dd>{result.actions.overflow.map((a) => a.label).join(", ") || "—"}</dd>
          </dl>
          <ul>
            {result.actions.ranking.map((r) => (
              <li key={r.action.id}>
                <strong>{r.action.label}</strong> · score {r.score}
                <ul>
                  {r.reasons.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activePass === 5 && (
        <div className="card">
          <h3>Rule → affordance bindings</h3>
          {result.bindings.length === 0 ? (
            <p>No bindings for this activity (or all rules disabled).</p>
          ) : (
            result.bindings.map((b) => (
              <div key={b.id} style={{ marginBottom: "0.85rem" }}>
                <p>
                  <strong>{b.rule.label}</strong>
                </p>
                <p style={{ fontSize: "0.82rem" }}>
                  when <code>{b.when}</code>
                </p>
                <ul>
                  {b.effects.map((e, i) => (
                    <li key={`${e.type}-${i}`}>
                      <span className="chip amber">{e.type}</span> → {e.target.label}{" "}
                      ({e.severity}) — {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {activePass === 6 && (
        <div className="card">
          <h3>Workspace Definition</h3>
          <dl className="kv">
            <dt>Name</dt>
            <dd>{result.workspace.name}</dd>
            <dt>Purpose</dt>
            <dd>{result.workspace.purpose}</dd>
            <dt>Pattern</dt>
            <dd>{result.workspace.pattern}</dd>
            <dt>Primary object</dt>
            <dd>{result.workspace.primaryObject.label}</dd>
            <dt>Primary goal</dt>
            <dd>{result.workspace.primaryGoal.label}</dd>
          </dl>
          <h3 style={{ marginTop: "0.9rem", fontSize: "1.05rem" }}>Sections</h3>
          <ul>
            {result.workspace.sections.map((s) => (
              <li key={s.id}>
                <strong>{s.id}</strong> — {s.purpose}{" "}
                <span className={`prio ${s.priority}`}>{s.priority}</span>{" "}
                <span className="chip muted">{s.presentationHint}</span>
                <div style={{ fontSize: "0.82rem", color: "rgba(8,32,40,0.6)" }}>
                  {s.contentLabels.join(" · ") || "—"}
                </div>
              </li>
            ))}
          </ul>
          <h3 style={{ marginTop: "0.9rem", fontSize: "1.05rem" }}>Widget intents</h3>
          <div className="chip-row">
            {result.workspace.widgets.map((w) => (
              <span key={w.kind + w.binds.join()} className="chip">
                {w.kind}
              </span>
            ))}
          </div>
        </div>
      )}

      {activePass === 7 && (
        <div className="card">
          <h3>Layout Model (abstract regions)</h3>
          <dl className="kv">
            <dt>Header</dt>
            <dd>{result.layout.header.join(", ") || "—"}</dd>
            <dt>Nav chrome</dt>
            <dd>{result.layout.navChrome.join(" · ") || "—"}</dd>
            <dt>Primary</dt>
            <dd>{result.layout.primary.join(", ") || "—"}</dd>
            <dt>Secondary</dt>
            <dd>{result.layout.secondary.join(", ") || "—"}</dd>
            <dt>Action rail</dt>
            <dd>
              P: {result.layout.actionRail.primary.join(", ") || "—"} / S:{" "}
              {result.layout.actionRail.secondary.join(", ") || "—"}
            </dd>
            <dt>Disclosure</dt>
            <dd>{result.layout.disclosure.join(", ") || "—"}</dd>
          </dl>
          <p style={{ marginTop: "0.75rem" }}>
            Still not pixels — a renderer maps regions to web/mobile chrome later.
            Open <strong>Workspace preview</strong> for a semantic mock of this emit.
          </p>
        </div>
      )}
    </div>
  );
}
