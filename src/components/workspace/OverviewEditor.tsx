"use client";

import { useParams } from "next/navigation";
import { useAtlasStore } from "@/lib/store";
import { createId } from "@/lib/ids";

function LinesField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        rows={4}
        value={values.join("\n")}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean),
          )
        }
      />
    </label>
  );
}

export function OverviewEditor() {
  const params = useParams<{ id: string }>();
  const solution = useAtlasStore((s) =>
    s.solutions.find((x) => x.id === params.id),
  );
  const updateSolutionMeta = useAtlasStore((s) => s.updateSolutionMeta);
  const hydrated = useAtlasStore((s) => s.hydrated);

  if (!hydrated) {
    return <div className="workspace-loading"><p>Loading…</p></div>;
  }
  if (!solution) {
    return <div className="workspace-loading"><p>Solution not found.</p></div>;
  }

  const patch = (
    partial: Parameters<typeof updateSolutionMeta>[1],
  ) => updateSolutionMeta(solution.id, partial);

  return (
    <div className="overview-editor">
      <section className="brief-panel">
        <h2>Solution brief</h2>
        <p className="section-sub">
          Context that frames every workflow — the cover sheet of your living
          specification.
        </p>

        <label className="field">
          <span>Solution name</span>
          <input
            value={solution.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Customer / programme</span>
          <input
            value={solution.customer}
            onChange={(e) => patch({ customer: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Tagline</span>
          <input
            value={solution.tagline}
            onChange={(e) => patch({ tagline: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            rows={4}
            value={solution.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </label>
      </section>

      <section className="brief-panel">
        <h2>Scope & control</h2>
        <LinesField
          label="Modules"
          values={solution.modules}
          onChange={(modules) => patch({ modules })}
          placeholder="One module per line"
        />
        <LinesField
          label="Constraints"
          values={solution.constraints}
          onChange={(constraints) => patch({ constraints })}
          placeholder="Technical and operational constraints"
        />
        <LinesField
          label="Compliance frameworks"
          values={solution.complianceFrameworks}
          onChange={(complianceFrameworks) => patch({ complianceFrameworks })}
          placeholder="Policies, statutes, standards"
        />
        <LinesField
          label="Success metrics"
          values={solution.successMetrics}
          onChange={(successMetrics) => patch({ successMetrics })}
          placeholder="Measurable outcomes"
        />
      </section>

      <section className="brief-panel wide">
        <div className="panel-head">
          <h2>Stakeholders</h2>
          <button
            type="button"
            className="btn ghost compact"
            onClick={() =>
              patch({
                stakeholders: [
                  ...solution.stakeholders,
                  {
                    id: createId("st"),
                    name: "New stakeholder",
                    role: "Role",
                    organization: "Org",
                    interest: "Interest",
                  },
                ],
              })
            }
          >
            Add stakeholder
          </button>
        </div>
        <div className="stakeholder-grid">
          {solution.stakeholders.map((st, idx) => (
            <div key={st.id} className="stakeholder-edit">
              <input
                value={st.name}
                onChange={(e) => {
                  const stakeholders = solution.stakeholders.map((s, i) =>
                    i === idx ? { ...s, name: e.target.value } : s,
                  );
                  patch({ stakeholders });
                }}
                placeholder="Name"
              />
              <input
                value={st.role}
                onChange={(e) => {
                  const stakeholders = solution.stakeholders.map((s, i) =>
                    i === idx ? { ...s, role: e.target.value } : s,
                  );
                  patch({ stakeholders });
                }}
                placeholder="Role"
              />
              <input
                value={st.organization}
                onChange={(e) => {
                  const stakeholders = solution.stakeholders.map((s, i) =>
                    i === idx ? { ...s, organization: e.target.value } : s,
                  );
                  patch({ stakeholders });
                }}
                placeholder="Organisation"
              />
              <input
                value={st.interest}
                onChange={(e) => {
                  const stakeholders = solution.stakeholders.map((s, i) =>
                    i === idx ? { ...s, interest: e.target.value } : s,
                  );
                  patch({ stakeholders });
                }}
                placeholder="Interest"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="brief-panel wide">
        <div className="panel-head">
          <h2>Glossary</h2>
          <button
            type="button"
            className="btn ghost compact"
            onClick={() =>
              patch({
                glossary: [
                  ...solution.glossary,
                  {
                    id: createId("gl"),
                    term: "Term",
                    definition: "Definition",
                  },
                ],
              })
            }
          >
            Add term
          </button>
        </div>
        <div className="glossary-grid">
          {solution.glossary.map((g, idx) => (
            <div key={g.id} className="glossary-edit">
              <input
                value={g.term}
                onChange={(e) => {
                  const glossary = solution.glossary.map((x, i) =>
                    i === idx ? { ...x, term: e.target.value } : x,
                  );
                  patch({ glossary });
                }}
              />
              <input
                value={g.definition}
                onChange={(e) => {
                  const glossary = solution.glossary.map((x, i) =>
                    i === idx ? { ...x, definition: e.target.value } : x,
                  );
                  patch({ glossary });
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
