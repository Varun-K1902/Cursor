"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  ConnectionMode,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SpecNode, type SpecFlowNode } from "./SpecNode";
import type { NodeKind, SpecNodeData, Workflow } from "@/lib/types";
import { NODE_KIND_META } from "@/lib/types";
import { Inspector } from "@/components/inspector/Inspector";
import { createId } from "@/lib/ids";
import { makeNodeData } from "@/lib/defaults";

const nodeTypes = { spec: SpecNode };

interface WorkflowCanvasProps {
  solutionId: string;
  workflow: Workflow;
  onGraphChange: (
    nodes: Node<SpecNodeData>[],
    edges: Edge[],
  ) => void;
  onNodeDataChange: (nodeId: string, data: SpecNodeData) => void;
}

function WorkflowCanvasInner({
  workflow,
  onGraphChange,
  onNodeDataChange,
}: Omit<WorkflowCanvasProps, "solutionId">) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflow.nodes as SpecFlowNode[],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const persist = useCallback(
    (nextNodes: Node<SpecNodeData>[], nextEdges: Edge[]) => {
      onGraphChange(nextNodes, nextEdges);
    },
    [onGraphChange],
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      persist(nodes as Node<SpecNodeData>[], edges);
    }, 280);
    return () => window.clearTimeout(t);
  }, [nodes, edges, persist]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            id: `e_${connection.source}_${connection.target}_${Date.now()}`,
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const handleAddNode = (kind: NodeKind) => {
    const id = createId("n");
    const node: SpecFlowNode = {
      id,
      type: "spec",
      position: {
        x: 120 + nodes.length * 40,
        y: 120 + (nodes.length % 3) * 80,
      },
      data: makeNodeData(kind, `New ${NODE_KIND_META[kind].label}`),
    };
    setNodes((nds) => [...nds, node]);
    setSelectedId(id);
  };

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  return (
    <div className="canvas-shell">
      <aside className="palette">
        <p className="palette-title">Add step</p>
        {(Object.keys(NODE_KIND_META) as NodeKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            className="palette-item"
            style={{ ["--node-accent" as string]: NODE_KIND_META[kind].accent }}
            onClick={() => handleAddNode(kind)}
          >
            <span className="palette-dot" />
            <span>
              <strong>{NODE_KIND_META[kind].label}</strong>
              <small>{NODE_KIND_META[kind].hint}</small>
            </span>
          </button>
        ))}
      </aside>

      <div className="canvas-stage">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          onSelectionChange={({ nodes: sel }) =>
            setSelectedId(sel[0]?.id ?? null)
          }
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.2}
            color="rgba(11, 58, 68, 0.14)"
          />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(8, 32, 40, 0.12)"
            nodeColor={(n) =>
              NODE_KIND_META[(n.data as SpecNodeData).kind]?.accent ?? "#0B3A44"
            }
          />
        </ReactFlow>
      </div>

      <Inspector
        node={selectedNode as Node<SpecNodeData> | null}
        onChange={(data) => {
          if (!selectedNode) return;
          setNodes((nds) =>
            nds.map((n) => (n.id === selectedNode.id ? { ...n, data } : n)),
          );
          onNodeDataChange(selectedNode.id, data);
        }}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <WorkflowCanvasInner
      key={`${props.solutionId}:${props.workflow.id}`}
      workflow={props.workflow}
      onGraphChange={props.onGraphChange}
      onNodeDataChange={props.onNodeDataChange}
    />
  );
}
