"use client";

import { create } from "zustand";
import { childImmunizationGraph } from "./graph";
import { compileActivity } from "./compile";
import type { CompileResult, SpecGraph } from "./types";

export type StudioTab = "explore" | "compile" | "preview";

interface PrototypeState {
  graph: SpecGraph;
  activityId: string;
  result: CompileResult;
  tab: StudioTab;
  activePass: number;
  scenario: {
    childEligible: boolean;
    hasOverdue: boolean;
    duplicateDose: boolean;
  };
  setTab: (tab: StudioTab) => void;
  setActivity: (id: string) => void;
  setActivePass: (i: number) => void;
  toggleRule: (ruleId: string) => void;
  setScenario: (patch: Partial<PrototypeState["scenario"]>) => void;
  recompile: () => void;
}

function run(graph: SpecGraph, activityId: string): CompileResult {
  return compileActivity(graph, activityId);
}

export const usePrototypeStore = create<PrototypeState>((set, get) => ({
  graph: structuredClone(childImmunizationGraph),
  activityId: "act_review_child",
  result: run(childImmunizationGraph, "act_review_child"),
  tab: "explore",
  activePass: 0,
  scenario: {
    childEligible: true,
    hasOverdue: true,
    duplicateDose: false,
  },
  setTab: (tab) => set({ tab }),
  setActivity: (id) => {
    const { graph } = get();
    set({ activityId: id, result: run(graph, id), activePass: 0 });
  },
  setActivePass: (i) => set({ activePass: i }),
  toggleRule: (ruleId) => {
    const graph = structuredClone(get().graph);
    const rule = graph.rules.find((r) => r.id === ruleId);
    if (rule) rule.enabled = !rule.enabled;
    set({ graph, result: run(graph, get().activityId) });
  },
  setScenario: (patch) => set({ scenario: { ...get().scenario, ...patch } }),
  recompile: () => {
    const { graph, activityId } = get();
    set({ result: run(graph, activityId) });
  },
}));
