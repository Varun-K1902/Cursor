"use client";

import type { Node } from "@xyflow/react";
import type { Priority, ReqStatus, SpecNodeData } from "@/lib/types";
import { NODE_KIND_META } from "@/lib/types";
import { X } from "lucide-react";

interface InspectorProps {
  node: Node<SpecNodeData> | null;
  onChange: (data: SpecNodeData) => void;
  onClose: () => void;
}

function ListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={values.join("\n")}
        placeholder={placeholder}
        rows={Math.min(5, Math.max(2, values.length + 1))}
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

export function Inspector({ node, onChange, onClose }: InspectorProps) {
  if (!node) {
    return (
      <aside className="inspector empty">
        <h3>Requirement detail</h3>
        <p>
          Select a step on the map to capture actors, rules, acceptance
          criteria, and compliance — the content that used to live in a BRD.
        </p>
      </aside>
    );
  }

  const d = node.data;
  const meta = NODE_KIND_META[d.kind];

  const patch = (partial: Partial<SpecNodeData>) =>
    onChange({ ...d, ...partial });

  return (
    <aside className="inspector">
      <header className="inspector-head">
        <div>
          <p className="eyebrow" style={{ color: meta.accent }}>
            {meta.label}
          </p>
          <h3>Requirement detail</h3>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </header>

      <label className="field">
        <span>Title</span>
        <input
          value={d.label}
          onChange={(e) => patch({ label: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Summary</span>
        <textarea
          rows={3}
          value={d.summary}
          onChange={(e) => patch({ summary: e.target.value })}
          placeholder="What must happen at this step?"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Priority</span>
          <select
            value={d.priority}
            onChange={(e) => patch({ priority: e.target.value as Priority })}
          >
            <option value="must">Must</option>
            <option value="should">Should</option>
            <option value="could">Could</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={d.status}
            onChange={(e) => patch({ status: e.target.value as ReqStatus })}
          >
            <option value="draft">Draft</option>
            <option value="agreed">Agreed</option>
            <option value="deferred">Deferred</option>
          </select>
        </label>
      </div>

      <ListEditor
        label="Actors"
        values={d.actors}
        onChange={(actors) => patch({ actors })}
        placeholder="One actor per line"
      />
      <ListEditor
        label="Systems"
        values={d.systems}
        onChange={(systems) => patch({ systems })}
        placeholder="One system per line"
      />
      <ListEditor
        label="Inputs"
        values={d.inputs}
        onChange={(inputs) => patch({ inputs })}
        placeholder="One input per line"
      />
      <ListEditor
        label="Outputs"
        values={d.outputs}
        onChange={(outputs) => patch({ outputs })}
        placeholder="One output per line"
      />
      <ListEditor
        label="Business rules"
        values={d.businessRules}
        onChange={(businessRules) => patch({ businessRules })}
        placeholder="One rule per line"
      />
      <ListEditor
        label="Acceptance criteria"
        values={d.acceptanceCriteria}
        onChange={(acceptanceCriteria) => patch({ acceptanceCriteria })}
        placeholder="Testable criteria, one per line"
      />
      <ListEditor
        label="Compliance tags"
        values={d.complianceTags}
        onChange={(complianceTags) => patch({ complianceTags })}
        placeholder="e.g. Audit trail, KYC"
      />

      <label className="field">
        <span>Notes</span>
        <textarea
          rows={3}
          value={d.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Open questions, assumptions, links"
        />
      </label>
    </aside>
  );
}
