import type { Solution, SpecNodeData } from "./types";
import { NODE_KIND_META } from "./types";

export interface LivingSpecSection {
  title: string;
  body: string[];
}

export interface LivingSpecDoc {
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: LivingSpecSection[];
  requirements: {
    id: string;
    workflow: string;
    kind: string;
    label: string;
    summary: string;
    priority: string;
    status: string;
    actors: string[];
    systems: string[];
    rules: string[];
    criteria: string[];
    compliance: string[];
  }[];
}

function bullets(items: string[], empty = "—"): string[] {
  return items.length ? items.map((i) => `• ${i}`) : [`• ${empty}`];
}

export function buildLivingSpec(solution: Solution): LivingSpecDoc {
  const requirements = solution.workflows.flatMap((wf) =>
    wf.nodes.map((node) => {
      const d = node.data as SpecNodeData;
      return {
        id: node.id,
        workflow: wf.name,
        kind: NODE_KIND_META[d.kind].label,
        label: d.label,
        summary: d.summary || "No summary yet.",
        priority: d.priority,
        status: d.status,
        actors: d.actors,
        systems: d.systems,
        rules: d.businessRules,
        criteria: d.acceptanceCriteria,
        compliance: d.complianceTags,
      };
    }),
  );

  const mustCount = requirements.filter((r) => r.priority === "must").length;
  const agreedCount = requirements.filter((r) => r.status === "agreed").length;

  return {
    title: solution.name,
    subtitle: `${solution.customer} · ${solution.tagline}`,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Solution intent",
        body: [
          solution.description,
          "",
          "This living specification is the authoritative requirements artefact. Visual workflows, not a static BRD/SRS, define scope, rules, and acceptance.",
        ],
      },
      {
        title: "2. Stakeholders",
        body: solution.stakeholders.length
          ? solution.stakeholders.map(
              (s) =>
                `• ${s.name} — ${s.role} (${s.organization}): ${s.interest}`,
            )
          : ["• Stakeholders not yet captured."],
      },
      {
        title: "3. Solution modules",
        body: bullets(solution.modules, "Modules not yet defined."),
      },
      {
        title: "4. Constraints",
        body: bullets(solution.constraints, "No constraints recorded."),
      },
      {
        title: "5. Compliance frameworks",
        body: bullets(
          solution.complianceFrameworks,
          "No compliance frameworks tagged.",
        ),
      },
      {
        title: "6. Success metrics",
        body: bullets(solution.successMetrics, "Metrics not yet defined."),
      },
      {
        title: "7. Coverage snapshot",
        body: [
          `• Workflows: ${solution.workflows.length}`,
          `• Requirement nodes: ${requirements.length}`,
          `• Must-have: ${mustCount}`,
          `• Agreed: ${agreedCount}`,
        ],
      },
      {
        title: "8. Glossary",
        body: solution.glossary.length
          ? solution.glossary.map((g) => `• ${g.term}: ${g.definition}`)
          : ["• Glossary empty."],
      },
    ],
    requirements,
  };
}

export function livingSpecToMarkdown(doc: LivingSpecDoc): string {
  const lines: string[] = [
    `# ${doc.title}`,
    "",
    `_${doc.subtitle}_`,
    "",
    `Generated: ${doc.generatedAt}`,
    "",
  ];

  for (const section of doc.sections) {
    lines.push(`## ${section.title}`, "", ...section.body, "");
  }

  lines.push("## 9. Requirements catalogue", "");
  for (const req of doc.requirements) {
    lines.push(
      `### ${req.label} (${req.kind})`,
      "",
      `- Workflow: ${req.workflow}`,
      `- Priority: ${req.priority} · Status: ${req.status}`,
      `- Summary: ${req.summary}`,
    );
    if (req.actors.length) lines.push(`- Actors: ${req.actors.join(", ")}`);
    if (req.systems.length) lines.push(`- Systems: ${req.systems.join(", ")}`);
    if (req.rules.length) {
      lines.push("- Business rules:");
      req.rules.forEach((r) => lines.push(`  - ${r}`));
    }
    if (req.criteria.length) {
      lines.push("- Acceptance criteria:");
      req.criteria.forEach((c) => lines.push(`  - ${c}`));
    }
    if (req.compliance.length) {
      lines.push(`- Compliance: ${req.compliance.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
