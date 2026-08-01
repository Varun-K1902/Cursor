import type { RequirementDetail, SpecNodeData } from "./types";

export function emptyRequirement(
  overrides: Partial<RequirementDetail> = {},
): RequirementDetail {
  return {
    summary: "",
    actors: [],
    systems: [],
    inputs: [],
    outputs: [],
    businessRules: [],
    acceptanceCriteria: [],
    complianceTags: [],
    priority: "must",
    status: "draft",
    notes: "",
    ...overrides,
  };
}

export function makeNodeData(
  kind: SpecNodeData["kind"],
  label: string,
  overrides: Partial<RequirementDetail> = {},
): SpecNodeData {
  return {
    kind,
    label,
    ...emptyRequirement(overrides),
  };
}
