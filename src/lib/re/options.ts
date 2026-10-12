export const projectTypes = [
  { id: "product", label: "Product development", detail: "A product with users, outcomes, and a release." },
  { id: "enterprise", label: "Enterprise application", detail: "HRMS, ERP, CRM, finance, or a similar system of record." },
  { id: "digitization", label: "Business process digitization", detail: "A process that still lives in email, paper, or spreadsheets." },
  { id: "enhancement", label: "Existing system enhancement", detail: "A change to a system that already runs." },
  { id: "other", label: "Other / not sure", detail: "Start broad. The recommendation can be changed." },
] as const

export const startingPoints = [
  { id: "new", label: "New idea or initiative" },
  { id: "import", label: "Existing documents to import" },
  { id: "enhancement", label: "Enhancement to an existing system" },
  { id: "digitization", label: "Existing process that needs digitization" },
] as const

export const domains = [
  { id: "hr", label: "HR and employee management" },
  { id: "finance", label: "Finance and accounting" },
  { id: "banking", label: "Banking and financial services" },
  { id: "sales", label: "Sales and CRM" },
  { id: "supply", label: "Supply chain and inventory" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "public", label: "Public sector" },
  { id: "other", label: "Other / domain agnostic" },
] as const

export const outcomeOptions = [
  { id: "business-requirements", label: "Capture business requirements" },
  { id: "prd-brd", label: "Create a PRD or BRD" },
  { id: "frd-srs", label: "Create an FRD or SRS" },
  { id: "processes", label: "Map business processes" },
  { id: "use-cases", label: "Define use cases" },
  { id: "data-rules", label: "Model data and business rules" },
  { id: "ui", label: "Design UI/UX" },
  { id: "improve", label: "Improve existing requirements" },
  { id: "baseline", label: "Build a complete requirements baseline" },
] as const

export const collaborationOptions = [
  { id: "individual", label: "Individual BA" },
  { id: "ba-team", label: "BA team" },
  { id: "delivery", label: "BA, architect, developer, and tester collaboration" },
  { id: "stakeholder", label: "Stakeholder-led discovery" },
] as const

export const detailLevels = [
  { id: "simple", label: "Simple", detail: "Essential fields only." },
  { id: "standard", label: "Standard", detail: "Recommended structure." },
  { id: "comprehensive", label: "Comprehensive", detail: "Detailed requirements and traceability." },
] as const

export function labelOf(list: readonly { id: string; label: string }[], id: string) {
  return list.find((item) => item.id === id)?.label ?? id
}
