import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { FlowEdgeView, FlowNodeView, ProcessModel } from '../model/types'
import { deriveFlow, layoutFlow } from '../model/flow'
import { statusLabel } from '../model/labels'

interface Props {
  model: ProcessModel
  selectedStepId: string | null
  onSelectStep: (id: string) => void
  onResolveGap: (outcomeId: string) => void
}

function FlowStepNode({ data }: { data: FlowNodeView & { selected?: boolean } }) {
  return (
    <div
      className={`flow-node flow-${data.kind} ${data.selected ? 'selected' : ''}`}
      title={data.gapMessage}
    >
      <Handle type="target" position={Position.Top} />
      {data.kind === 'role' && <div className="flow-role-label">{data.label}</div>}
      {data.kind === 'gap' && (
        <div className="flow-gap-body">
          <div>⚠</div>
          <div>{data.gapMessage ?? 'Unresolved'}</div>
        </div>
      )}
      {(data.kind === 'step' || data.kind === 'decision') && (
        <>
          <div className="flow-node-label">{data.label}</div>
          <div className="flow-node-meta">
            {data.screenType && <span>{data.screenType}</span>}
            <span className={`badge badge-${data.confirmation}`}>
              {statusLabel(data.confirmation)}
            </span>
          </div>
        </>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = { aiba: FlowStepNode }

export function FlowView({ model, selectedStepId, onSelectStep, onResolveGap }: Props) {
  const projected = useMemo(() => deriveFlow(model), [model])
  const positions = useMemo(
    () => layoutFlow(projected.nodes, projected.edges),
    [projected.nodes, projected.edges],
  )

  const initialNodes: Node[] = useMemo(
    () =>
      projected.nodes.map((n) => ({
        id: n.id,
        type: 'aiba',
        position: positions[n.id] ?? { x: 0, y: 0 },
        data: { ...n, selected: n.id === selectedStepId },
      })),
    [projected.nodes, positions, selectedStepId],
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      projected.edges.map((e: FlowEdgeView) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.isGap,
        style: e.isGap
          ? { stroke: '#b45309', strokeDasharray: '4 4' }
          : { stroke: '#4a5568' },
        labelStyle: { fill: '#3d4a5c', fontSize: 11 },
        markerEnd: { type: MarkerType.ArrowClosed, color: e.isGap ? '#b45309' : '#4a5568' },
        data: { outcomeId: e.outcomeId, isGap: e.isGap },
      })),
    [projected.edges],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  return (
    <div className="flow-shell">
      <header className="flow-banner">
        <div className="preview-kicker">Flow</div>
        <p>Derived from the same canonical model as the Functional Preview — not a separate diagram.</p>
      </header>
      <div className="flow-canvas">
        {model.steps.length === 0 ? (
          <div className="preview-empty">
            <p>Flow will emerge as steps are understood.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node) => {
              if (node.id.startsWith('gap:')) {
                const outcomeId = node.id.replace('gap:', '')
                onResolveGap(outcomeId)
                return
              }
              if (node.id.startsWith('role:') || node.id.startsWith('gap-')) return
              onSelectStep(node.id)
            }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
          >
            <Background gap={16} color="#d7d2c8" />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
