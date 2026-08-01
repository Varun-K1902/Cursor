"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Edge, Node } from "@xyflow/react";
import type { Solution, SpecNodeData, Workflow } from "./types";
import {
  blankSolution,
  franchiseTemplate,
  hrmsTemplate,
  inventoryTemplate,
} from "./templates";
import { createId } from "./ids";
import { makeNodeData } from "./defaults";

interface AtlasState {
  solutions: Solution[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  seedIfEmpty: () => void;
  createFromTemplate: (
    kind: "inventory" | "hrms" | "franchise" | "blank",
    name?: string,
  ) => string;
  upsertSolution: (solution: Solution) => void;
  deleteSolution: (id: string) => void;
  getSolution: (id: string) => Solution | undefined;
  setActiveWorkflow: (solutionId: string, workflowId: string) => void;
  updateWorkflowGraph: (
    solutionId: string,
    workflowId: string,
    nodes: Node<SpecNodeData>[],
    edges: Edge[],
  ) => void;
  updateNodeData: (
    solutionId: string,
    workflowId: string,
    nodeId: string,
    data: SpecNodeData,
  ) => void;
  addNode: (
    solutionId: string,
    workflowId: string,
    kind: SpecNodeData["kind"],
    position?: { x: number; y: number },
  ) => void;
  addWorkflow: (solutionId: string, name: string) => void;
  updateSolutionMeta: (
    solutionId: string,
    patch: Partial<
      Pick<
        Solution,
        | "name"
        | "tagline"
        | "description"
        | "customer"
        | "modules"
        | "constraints"
        | "complianceFrameworks"
        | "successMetrics"
        | "stakeholders"
        | "glossary"
      >
    >,
  ) => void;
}

function touch(solution: Solution): Solution {
  return { ...solution, updatedAt: new Date().toISOString() };
}

export const useAtlasStore = create<AtlasState>()(
  persist(
    (set, get) => ({
      solutions: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      seedIfEmpty: () => {
        if (get().solutions.length > 0) return;
        set({
          solutions: [inventoryTemplate(), hrmsTemplate(), franchiseTemplate()],
        });
      },
      createFromTemplate: (kind, name) => {
        let solution: Solution;
        if (kind === "inventory") solution = inventoryTemplate();
        else if (kind === "hrms") solution = hrmsTemplate();
        else if (kind === "franchise") solution = franchiseTemplate();
        else solution = blankSolution(name ?? "Untitled Solution");
        if (name) solution = { ...solution, name };
        set((s) => ({ solutions: [solution, ...s.solutions] }));
        return solution.id;
      },
      upsertSolution: (solution) =>
        set((s) => {
          const exists = s.solutions.some((x) => x.id === solution.id);
          return {
            solutions: exists
              ? s.solutions.map((x) =>
                  x.id === solution.id ? touch(solution) : x,
                )
              : [touch(solution), ...s.solutions],
          };
        }),
      deleteSolution: (id) =>
        set((s) => ({
          solutions: s.solutions.filter((x) => x.id !== id),
        })),
      getSolution: (id) => get().solutions.find((x) => x.id === id),
      setActiveWorkflow: (solutionId, workflowId) =>
        set((s) => ({
          solutions: s.solutions.map((sol) =>
            sol.id === solutionId
              ? touch({ ...sol, activeWorkflowId: workflowId })
              : sol,
          ),
        })),
      updateWorkflowGraph: (solutionId, workflowId, nodes, edges) =>
        set((s) => ({
          solutions: s.solutions.map((sol) => {
            if (sol.id !== solutionId) return sol;
            return touch({
              ...sol,
              workflows: sol.workflows.map((wf) =>
                wf.id === workflowId ? { ...wf, nodes, edges } : wf,
              ),
            });
          }),
        })),
      updateNodeData: (solutionId, workflowId, nodeId, data) =>
        set((s) => ({
          solutions: s.solutions.map((sol) => {
            if (sol.id !== solutionId) return sol;
            return touch({
              ...sol,
              workflows: sol.workflows.map((wf) => {
                if (wf.id !== workflowId) return wf;
                return {
                  ...wf,
                  nodes: wf.nodes.map((n) =>
                    n.id === nodeId ? { ...n, data } : n,
                  ),
                };
              }),
            });
          }),
        })),
      addNode: (solutionId, workflowId, kind, position) =>
        set((s) => ({
          solutions: s.solutions.map((sol) => {
            if (sol.id !== solutionId) return sol;
            return touch({
              ...sol,
              workflows: sol.workflows.map((wf) => {
                if (wf.id !== workflowId) return wf;
                const id = createId("n");
                const node: Node<SpecNodeData> = {
                  id,
                  type: "spec",
                  position: position ?? {
                    x: 120 + wf.nodes.length * 40,
                    y: 120 + (wf.nodes.length % 3) * 80,
                  },
                  data: makeNodeData(kind, `New ${kind}`),
                };
                return { ...wf, nodes: [...wf.nodes, node] };
              }),
            });
          }),
        })),
      addWorkflow: (solutionId, name) =>
        set((s) => ({
          solutions: s.solutions.map((sol) => {
            if (sol.id !== solutionId) return sol;
            const wf: Workflow = {
              id: createId("wf"),
              name,
              description: "New workflow for this solution.",
              nodes: [
                {
                  id: createId("n"),
                  type: "spec",
                  position: { x: 100, y: 140 },
                  data: makeNodeData("trigger", "Start"),
                },
              ],
              edges: [],
            };
            return touch({
              ...sol,
              workflows: [...sol.workflows, wf],
              activeWorkflowId: wf.id,
            });
          }),
        })),
      updateSolutionMeta: (solutionId, patch) =>
        set((s) => ({
          solutions: s.solutions.map((sol) =>
            sol.id === solutionId ? touch({ ...sol, ...patch }) : sol,
          ),
        })),
    }),
    {
      name: "atlas-spec-store",
      partialize: (s) => ({ solutions: s.solutions }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        state?.seedIfEmpty();
      },
    },
  ),
);
