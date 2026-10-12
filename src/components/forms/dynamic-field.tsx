import type { AnswerValue } from "@/lib/types"
import type { FieldDefinition } from "@/lib/re/templates"

export function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
}) {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : ""
  const common = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
  if (field.type === "long-text" || field.type === "structured-list") {
    return (
      <textarea
        className={`${common} min-h-28`}
        value={text}
        aria-label={field.label}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }
  if (field.type === "single-select") {
    return (
      <select className={common} value={text} aria-label={field.label} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }
  if (field.type === "multi-select") {
    const selected = Array.isArray(value) ? value : []
    return (
      <div className="grid gap-1">
        {(field.options ?? []).map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() =>
                onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])
              }
            />
            {option}
          </label>
        ))}
      </div>
    )
  }
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    )
  }
  if (field.type === "readonly") {
    return <p className="text-sm text-muted-foreground">{text || "Nothing generated yet."}</p>
  }
  const inputType = field.type === "date" ? "date" : field.type === "number" ? "number" : "text"
  return (
    <input className={common} type={inputType} value={text} aria-label={field.label} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} />
  )
}
