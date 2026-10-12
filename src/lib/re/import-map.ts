import type { TemplateDefinition } from "@/lib/re/templates"

export interface ExtractedBlock {
  kind: "heading" | "paragraph" | "table" | "requirement"
  text: string
  requirementCode?: string
}

export interface MappedRow {
  block: ExtractedBlock
  sectionId: string
  sectionTitle: string
  fieldId: string
  confidence: "matched" | "ambiguous"
  note: string
}

const codePattern = /\b((?:REQ|FR|BR|NFR|UC)-?\d+)\b/i

export function extractBlocks(text: string): ExtractedBlock[] {
  const blocks: ExtractedBlock[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const code = line.match(codePattern)?.[1]?.toUpperCase()
    if (code) {
      blocks.push({ kind: "requirement", text: line, requirementCode: code.replace(/^([A-Z]+)(\d)/, "$1-$2") })
      continue
    }
    if (/^#{1,3}\s+/.test(line) || (/^[A-Z][A-Za-z0-9 /&-]{2,60}$/.test(line) && line.length < 50)) {
      blocks.push({ kind: "heading", text: line.replace(/^#+\s+/, "") })
      continue
    }
    if (line.includes("\t") || line.split(",").length > 3) {
      blocks.push({ kind: "table", text: line })
      continue
    }
    blocks.push({ kind: "paragraph", text: line })
  }
  return blocks
}

export function mapBlocks(blocks: ExtractedBlock[], template: TemplateDefinition): MappedRow[] {
  const sections = template.sections.length > 0 ? template.sections : []
  const fallback = sections[0]
  return blocks.map((block) => {
    const heading = block.kind === "heading" ? block.text.toLowerCase() : ""
    const matched = sections.find((section) => {
      const title = section.title.toLowerCase()
      return heading.includes(title) || title.includes(heading) || block.text.toLowerCase().includes(title)
    })
    if (matched && block.kind === "heading") {
      return {
        block,
        sectionId: matched.id,
        sectionTitle: matched.title,
        fieldId: matched.fields[0]?.id ?? "body",
        confidence: "matched",
        note: "Heading matches a template section.",
      }
    }
    if (block.kind === "requirement") {
      const functional = sections.find((section) => section.id.includes("functional") || section.id.includes("requirement")) ?? fallback
      return {
        block,
        sectionId: functional?.id ?? "functional-requirements",
        sectionTitle: functional?.title ?? "Functional requirements",
        fieldId: functional?.fields[0]?.id ?? "body",
        confidence: "matched",
        note: "A requirement id was found. Confirm the section before saving.",
      }
    }
    return {
      block,
      sectionId: fallback?.id ?? "business-context",
      sectionTitle: fallback?.title ?? "Business context",
      fieldId: fallback?.fields[0]?.id ?? "body",
      confidence: "ambiguous",
      note: "No heading match. The text is kept, and the section is a suggestion.",
    }
  })
}

export function rowsToRequirements(rows: MappedRow[]) {
  return rows
    .filter((row) => row.block.kind === "requirement")
    .map((row) => {
      const text = row.block.text
      const code = row.block.requirementCode ?? ""
      const title = text.replace(code, "").replace(/^[\s:.-]+/, "").slice(0, 80) || text.slice(0, 80)
      return { code, title, statement: text, source: "import" }
    })
}
