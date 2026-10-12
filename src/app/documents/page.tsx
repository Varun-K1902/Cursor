"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { documentHtml, projectSummary, projectToJson, requirementsToCsv } from "@/lib/re/export-doc"
import { extractBlocks, mapBlocks, type MappedRow } from "@/lib/re/import-map"
import { createRequirement } from "@/lib/re/requirements"
import { activeTemplate } from "@/lib/re/templates"
import { useBasis } from "@/lib/store"
import type { Requirement } from "@/lib/types"

export default function DocumentsPage() {
  const { state, dispatch } = useBasis()
  const [rows, setRows] = useState<MappedRow[]>([])
  const [raw, setRaw] = useState("")
  const [fileName, setFileName] = useState("")
  const [format, setFormat] = useState("")
  const [message, setMessage] = useState("")
  const template = activeTemplate(state.initiative.templateIds, state.initiative.hiddenSectionIds)

  async function onFile(file: File) {
    setFileName(file.name)
    const lower = file.name.toLowerCase()
    if (lower.endsWith(".pdf")) {
      setFormat("pdf")
      setRows([])
      setRaw("")
      setMessage("PDF text extraction and OCR are unavailable in this prototype. Use DOCX, XLSX, CSV, or TXT.")
      return
    }
    let text = ""
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const book = XLSX.read(buffer, { type: "array" })
      const sheet = book.Sheets[book.SheetNames[0]]
      text = XLSX.utils.sheet_to_csv(sheet)
      setFormat("xlsx")
    } else if (lower.endsWith(".docx")) {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
      text = result.value
      setFormat("docx")
    } else if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
      text = await file.text()
      setFormat(lower.endsWith(".csv") ? "csv" : "txt")
    } else {
      setMessage("That file type is not supported. Use DOCX, XLSX, CSV, TXT, or a PDF to see the PDF limitation.")
      return
    }
    setRaw(text)
    setRows(mapBlocks(extractBlocks(text), template))
    setMessage(`Parsed ${file.name}. Confirm the mapping before anything is saved.`)
  }

  function download(filename: string, contents: string, type: string) {
    const blob = new Blob([contents], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function commit() {
    const requirements: Requirement[] = []
    let working = state
    const texts: string[] = []
    for (const row of rows) {
      if (row.block.kind === "requirement") {
        const created = createRequirement(
          working,
          {
            title: row.block.text.slice(0, 80),
            statement: row.block.text,
            kind: "functional",
            ownerId: state.stakeholders[0]?.id ?? "owner",
            source: `Imported from ${fileName}`,
          },
          new Date().toISOString().slice(0, 10),
          `req-${crypto.randomUUID().slice(0, 8)}`
        )
        const wanted = row.block.requirementCode
        const code = wanted && !working.requirements.some((item) => item.code === wanted) && !requirements.some((item) => item.code === wanted) ? wanted : created.code
        const requirement = { ...created, code }
        requirements.push(requirement)
        working = { ...working, requirements: [...working.requirements, requirement] }
      } else {
        texts.push(row.block.text)
      }
    }
    dispatch({
      type: "commit-import",
      fileName,
      format,
      originalText: raw,
      requirements,
      sectionId: rows[0]?.sectionId || template.sections[0]?.id || "business-context",
      sectionText: texts.join("\n"),
    })
    setMessage(`Saved ${requirements.length} requirements. The original file text is kept with the import.`)
    setRows([])
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-medium">Documents and exports</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Import parses the file and waits for you to confirm the mapping. Export uses the saved project, not a fixed sample. DOCX generation is unavailable; the formatted document is HTML.
        </p>
      </div>
      <label className="grid max-w-xl gap-2 rounded-xl border border-dashed border-border p-6 text-sm">
        Drop or choose a DOCX, XLSX, CSV, TXT, or PDF file
        <input
          type="file"
          accept=".docx,.xlsx,.xls,.csv,.txt,.pdf"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onFile(file)
          }}
        />
      </label>
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {rows.length > 0 ? (
        <div className="grid gap-3">
          <h2 className="text-lg font-medium">Proposed mapping</h2>
          {rows.map((row, index) => (
            <div key={`${row.block.text}-${index}`} className="grid gap-1 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
              <p className={row.confidence === "ambiguous" ? "text-destructive" : "text-muted-foreground"}>{row.note}</p>
              <p>{row.block.text}</p>
              <label className="text-xs">
                Section
                <select
                  className="ml-2 rounded border border-input bg-card"
                  value={row.sectionId}
                  onChange={(event) => {
                    const section = template.sections.find((item) => item.id === event.target.value)
                    setRows((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, sectionId: event.target.value, sectionTitle: section?.title ?? item.sectionTitle, confidence: "matched", note: "Section chosen by the BA." }
                          : item
                      )
                    )
                  }}
                >
                  {template.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
          <Button onClick={commit}>Save imported records</Button>
        </div>
      ) : null}
      {state.imports.length > 0 ? (
        <div>
          <h2 className="text-lg font-medium">Kept source files</h2>
          {state.imports.map((item) => (
            <p key={item.id} className="text-sm">
              {item.fileName} · {item.format} · {item.savedAt} · {item.originalText.length} characters kept
            </p>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => download("requirements.csv", requirementsToCsv(state), "text/csv")}>
          Requirements CSV
        </Button>
        <Button variant="outline" onClick={() => download("project.json", projectToJson(state), "application/json")}>
          JSON project export
        </Button>
        <Button variant="outline" onClick={() => download("requirements.html", documentHtml(state, "template"), "text/html")}>
          Formatted document
        </Button>
        <Button variant="outline" onClick={() => download("summary.txt", projectSummary(state), "text/plain")}>
          Project summary
        </Button>
        <Button variant="outline" onClick={() => download("brd.html", documentHtml(state, "brd"), "text/html")}>
          BRD view
        </Button>
        <Button variant="outline" onClick={() => download("frd.html", documentHtml(state, "frd"), "text/html")}>
          FRD view
        </Button>
        <Button variant="outline" onClick={() => download("srs.html", documentHtml(state, "srs"), "text/html")}>
          SRS view
        </Button>
        <Button variant="outline" onClick={() => download("prd.html", documentHtml(state, "prd"), "text/html")}>
          PRD view
        </Button>
      </div>
    </div>
  )
}
