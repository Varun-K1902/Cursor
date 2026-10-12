import type {
  FlowKind,
  QualityCharacteristic,
  RequirementKind,
  RequirementStatus,
  RuleKind,
  TraceRelation,
} from "@/lib/types"

export const requirementKindLabel: Record<RequirementKind, string> = {
  functional: "Functional",
  interface: "Interface",
  data: "Data",
  quality: "Quality",
  constraint: "Constraint",
  transition: "Transition",
}

export const qualityLabel: Record<QualityCharacteristic, string> = {
  "functional-suitability": "Functional suitability",
  "performance-efficiency": "Performance efficiency",
  compatibility: "Compatibility",
  "interaction-capability": "Interaction capability",
  reliability: "Reliability",
  security: "Security",
  maintainability: "Maintainability",
  flexibility: "Flexibility",
  safety: "Safety",
}

export const qualityCharacteristics = Object.keys(
  qualityLabel
) as QualityCharacteristic[]

export const flowKindLabel: Record<FlowKind, string> = {
  journey: "User journey",
  current: "Current-state process",
  future: "Future-state process",
  "use-case": "Use-case path",
}

export const ruleKindLabel: Record<RuleKind, string> = {
  definitional: "Definitional",
  operative: "Operative",
}

export const statusLabel: Record<RequirementStatus, string> = {
  draft: "Draft",
  "in-review": "In review",
  "changes-requested": "Changes requested",
  approved: "Approved",
  deprecated: "Deprecated",
  baselined: "Baselined",
  changed: "Changed",
}

export const relationLabel: Record<TraceRelation, string> = {
  "derives-from": "Derives from",
  "constrained-by": "Constrained by",
  elaborates: "Elaborates",
  uses: "Uses",
}

export const relationIncoming: Record<TraceRelation, string> = {
  "derives-from": "Source for",
  "constrained-by": "Constrains",
  elaborates: "Elaborated by",
  uses: "Used by",
}

export const raciMeaning: Record<string, string> = {
  R: "Responsible — does the work",
  A: "Accountable — owns the outcome",
  C: "Consulted — shapes the work",
  I: "Informed — needs to know",
}

const tone = {
  teal: "bg-[oklch(0.93_0.035_196)] text-[oklch(0.34_0.07_200)]",
  indigo: "bg-[oklch(0.93_0.04_275)] text-[oklch(0.36_0.08_275)]",
  sky: "bg-[oklch(0.93_0.035_230)] text-[oklch(0.36_0.07_240)]",
  green: "bg-[oklch(0.93_0.04_155)] text-[oklch(0.34_0.07_155)]",
  violet: "bg-[oklch(0.94_0.04_320)] text-[oklch(0.38_0.08_320)]",
  amber: "bg-[oklch(0.95_0.05_85)] text-[oklch(0.42_0.09_68)]",
  sand: "bg-[oklch(0.95_0.02_75)] text-[oklch(0.4_0.04_55)]",
  olive: "bg-[oklch(0.94_0.04_130)] text-[oklch(0.36_0.06_140)]",
  coral: "bg-[oklch(0.95_0.035_40)] text-[oklch(0.46_0.1_35)]",
  ink: "bg-sidebar text-sidebar-foreground",
}

export function requirementTone(kind: RequirementKind) {
  switch (kind) {
    case "functional":
      return tone.indigo
    case "interface":
      return tone.sky
    case "data":
      return tone.green
    case "quality":
      return tone.violet
    case "constraint":
      return tone.amber
    case "transition":
      return tone.sand
  }
}

export function flowTone(kind: FlowKind) {
  switch (kind) {
    case "journey":
      return tone.teal
    case "current":
      return tone.sand
    case "future":
      return tone.teal
    case "use-case":
      return tone.indigo
  }
}

export function ruleTone(kind: RuleKind) {
  return kind === "definitional" ? tone.indigo : tone.amber
}

export const tones = tone

export function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return iso
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${day} ${months[month - 1]} ${year}`
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter((part) => part[0] && part[0] === part[0].toUpperCase() && /[A-Za-z]/.test(part[0]))
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
}

export function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function bumpVersion(version: string) {
  const [majorRaw, minorRaw] = version.split(".")
  const major = Number(majorRaw)
  const minor = Number(minorRaw)
  if (Number.isNaN(major) || Number.isNaN(minor)) return `${version}.1`
  return `${major}.${minor + 1}`
}

export function nextCode(codes: string[], prefix: string, pad = 2) {
  let max = 0
  for (const code of codes) {
    if (!code.startsWith(prefix)) continue
    const n = Number.parseInt(code.slice(prefix.length), 10)
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`
}

export function requirementPrefix(kind: RequirementKind) {
  switch (kind) {
    case "functional":
      return "FR-"
    case "interface":
      return "IR-"
    case "data":
      return "DR-"
    case "quality":
      return "QR-"
    case "constraint":
      return "CR-"
    case "transition":
      return "TR-"
  }
}
