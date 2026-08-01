"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAtlasStore } from "@/lib/store";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { Plus } from "lucide-react";

export function MapStudio() {
  const params = useParams<{ id: string }>();
  const solution = useAtlasStore((s) =>
    s.solutions.find((x) => x.id === params.id),
  );
  const setActiveWorkflow = useAtlasStore((s) => s.setActiveWorkflow);
  const updateWorkflowGraph = useAtlasStore((s) => s.updateWorkflowGraph);
  const updateNodeData = useAtlasStore((s) => s.updateNodeData);
  const addWorkflow = useAtlasStore((s) => s.addWorkflow);
  const hydrated = useAtlasStore((s) => s.hydrated);

  const workflow = useMemo(() => {
    if (!solution) return null;
    return (
      solution.workflows.find((w) => w.id === solution.activeWorkflowId) ??
      solution.workflows[0] ??
      null
    );
  }, [solution]);

  if (!hydrated) {
    return <div className="workspace-loading"><p>Loading map…</p></div>;
  }

  if (!solution || !workflow) {
    return (
      <div className="workspace-loading">
        <p>Solution not found.</p>
      </div>
    );
  }

  return (
    <div className="map-studio">
      <div className="workflow-switcher">
        <div className="workflow-tabs">
          {solution.workflows.map((wf) => (
            <button
              key={wf.id}
              type="button"
              className={wf.id === workflow.id ? "active" : ""}
              onClick={() => setActiveWorkflow(solution.id, wf.id)}
            >
              {wf.name}
            </button>
          ))}
          <button
            type="button"
            className="add-wf"
            onClick={() =>
              addWorkflow(
                solution.id,
                `Workflow ${solution.workflows.length + 1}`,
              )
            }
          >
            <Plus size={14} />
            Add workflow
          </button>
        </div>
        <p className="workflow-desc">{workflow.description}</p>
      </div>

      <WorkflowCanvas
        solutionId={solution.id}
        workflow={workflow}
        onGraphChange={(nodes, edges) =>
          updateWorkflowGraph(solution.id, workflow.id, nodes, edges)
        }
        onNodeDataChange={(nodeId, data) =>
          updateNodeData(solution.id, workflow.id, nodeId, data)
        }
      />
    </div>
  );
}
