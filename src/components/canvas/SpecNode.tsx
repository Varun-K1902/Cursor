"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { SpecNodeData } from "@/lib/types";
import { NODE_KIND_META } from "@/lib/types";

export type SpecFlowNode = Node<SpecNodeData, "spec">;

function SpecNodeComponent({ data, selected }: NodeProps<SpecFlowNode>) {
  const meta = NODE_KIND_META[data.kind];
  const isDecision = data.kind === "decision";

  return (
    <div
      className={`spec-node ${selected ? "is-selected" : ""} ${
        isDecision ? "is-decision" : ""
      }`}
      style={{ ["--node-accent" as string]: meta.accent }}
    >
      <Handle type="target" position={Position.Left} className="spec-handle" />
      <div className="spec-node-kind">{meta.label}</div>
      <div className="spec-node-label">{data.label}</div>
      {data.summary ? (
        <p className="spec-node-summary">{data.summary}</p>
      ) : (
        <p className="spec-node-summary muted">Add requirement detail…</p>
      )}
      <div className="spec-node-meta">
        <span className={`prio prio-${data.priority}`}>{data.priority}</span>
        <span className={`status status-${data.status}`}>{data.status}</span>
      </div>
      <Handle type="source" position={Position.Right} className="spec-handle" />
    </div>
  );
}

export const SpecNode = memo(SpecNodeComponent);
