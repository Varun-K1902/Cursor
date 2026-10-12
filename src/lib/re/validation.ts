import type { AnswerValue } from "@/lib/types"
import type { FieldDefinition, TemplateSection } from "@/lib/re/templates"

export type SectionCompletion = "not-started" | "in-progress" | "needs-clarification" | "complete" | "skipped"

function present(value: AnswerValue | undefined) {
  if (typeof value === "boolean") return true
  if (typeof value === "number") return !Number.isNaN(value)
  if (Array.isArray(value)) return value.length > 0
  return typeof value === "string" && value.trim().length > 0
}

export function fieldError(field: FieldDefinition, value: AnswerValue | undefined) {
  if (!present(value)) {
    return field.required ? `${field.label} is required.` : null
  }
  if (typeof value === "string") {
    for (const rule of field.validation ?? []) {
      if (rule.kind === "minLength" && value.trim().length < (rule.value ?? 0)) return rule.message
      if (rule.kind === "maxLength" && value.trim().length > (rule.value ?? 0)) return rule.message
    }
  }
  return null
}

export function sectionCompletion(
  section: TemplateSection,
  answers: Record<string, AnswerValue> | undefined,
  flag?: "needs-clarification" | "skipped"
): SectionCompletion {
  if (flag === "skipped" && !section.required) return "skipped"
  if (flag === "needs-clarification") return "needs-clarification"
  const values = section.completionFieldIds.map((id) => answers?.[id])
  const any = values.some((value) => present(value)) || Object.values(answers ?? {}).some((value) => present(value))
  const missing = section.completionFieldIds.filter((id) => {
    const definition = section.fields.find((field) => field.id === id)
    return definition ? Boolean(fieldError(definition, answers?.[id])) : !present(answers?.[id])
  })
  if (!any) return "not-started"
  if (missing.length > 0) return "in-progress"
  return "complete"
}
