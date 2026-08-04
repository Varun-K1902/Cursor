"use client";

import { usePrototypeStore } from "@/lib/store";

export function ExplorePanel() {
  const graph = usePrototypeStore((s) => s.graph);
  const activityId = usePrototypeStore((s) => s.activityId);
  const activity = graph.activities.find((a) => a.id === activityId)!;
  const primary = graph.objects.find((o) => o.id === activity.primaryObjectId)!;
  const supporting = graph.objects.filter((o) =>
    activity.supportingObjectIds.includes(o.id),
  );
  const actions = graph.actions.filter((a) => activity.actionIds.includes(a.id));
  const infos = graph.information.filter((i) => activity.readIds.includes(i.id));
  const decisions = graph.decisions.filter((d) =>
    activity.decisionIds.includes(d.id),
  );

  return (
    <div>
      <p className="eyebrow">Business exploration · no UX concepts</p>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.85rem",
          margin: "0.2rem 0 0.75rem",
        }}
      >
        {activity.label}
      </h2>
      <p style={{ marginTop: 0, color: "rgba(8,32,40,0.7)", maxWidth: "40rem" }}>
        Business users describe journeys, activities, objects, information, decisions,
        rules, and actions. They never place tabs, buttons, or layouts.
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>Goal & primary object</h3>
          <dl className="kv">
            <dt>Goal</dt>
            <dd>{activity.goalLabel}</dd>
            <dt>Verb</dt>
            <dd>{activity.verb}</dd>
            <dt>Primary object</dt>
            <dd>{primary.label}</dd>
            <dt>Roles</dt>
            <dd>{activity.roles.join(", ")}</dd>
            <dt>Entry</dt>
            <dd>{activity.entryContext}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>Supporting objects</h3>
          {supporting.length === 0 ? (
            <p>None — focused activity.</p>
          ) : (
            <ul>
              {supporting.map((o) => {
                const rel = graph.relationships.find(
                  (r) => r.from === primary.id && r.to === o.id,
                );
                return (
                  <li key={o.id}>
                    <strong>{o.label}</strong>
                    {rel && (
                      <>
                        {" "}
                        — {rel.affinity}, {rel.cardinality}
                        {rel.temporal ? ", temporal" : ""}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Information read</h3>
          <div className="chip-row">
            {infos.map((i) => (
              <span key={i.id} className="chip">
                {i.label}
              </span>
            ))}
          </div>
          {activity.writeIds.length > 0 && (
            <>
              <h3 style={{ marginTop: "0.9rem" }}>Information written</h3>
              <div className="chip-row">
                {activity.writeIds.map((id) => {
                  const i = graph.information.find((x) => x.id === id);
                  return (
                    <span key={id} className="chip amber">
                      {i?.label ?? id}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3>Decisions & actions</h3>
          {decisions.length > 0 && (
            <>
              <p style={{ fontWeight: 650, marginBottom: "0.35rem" }}>Decisions</p>
              <div className="chip-row" style={{ marginBottom: "0.75rem" }}>
                {decisions.map((d) => (
                  <span key={d.id} className="chip amber">
                    {d.label}
                  </span>
                ))}
              </div>
            </>
          )}
          <p style={{ fontWeight: 650, marginBottom: "0.35rem" }}>Actions</p>
          {actions.length === 0 ? (
            <p>No outbound actions (e.g. search selection).</p>
          ) : (
            <ul>
              {actions.map((a) => (
                <li key={a.id}>
                  {a.label}{" "}
                  <span className="chip muted">crit {a.criticality}</span>
                  {a.stereotype && (
                    <span className="chip muted">{a.stereotype}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Journey goal</h3>
        <p>{graph.journey.goal}</p>
        <p style={{ marginTop: "0.75rem" }}>
          Switch to <strong>Compile</strong> to see how this activity lowers into
          Interaction Intent → Pattern → Navigation → Actions → Affordance Bindings →
          Workspace Definition.
        </p>
      </div>
    </div>
  );
}
