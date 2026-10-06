"use client"

import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  nextCode,
  qualityCharacteristics,
  qualityLabel,
  requirementKindLabel,
} from "@/lib/labels"
import { makeRequirement, useBasis } from "@/lib/store"
import type { QualityCharacteristic, RequirementKind, RuleKind } from "@/lib/types"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="grid gap-1.5">
      <span>{label}</span>
      {children}
    </Label>
  )
}

export function AddStakeholderDialog() {
  const { state, dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [roleTitle, setRoleTitle] = useState("")
  const [teamId, setTeamId] = useState(state.teams[0]?.id ?? "")
  const [interest, setInterest] = useState("")

  function save() {
    if (!name.trim() || !roleTitle.trim() || !interest.trim()) return
    dispatch({
      type: "add-stakeholder",
      stakeholder: {
        id: `sh-${crypto.randomUUID().slice(0, 8)}`,
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        teamId,
        kind: "consulted",
        influence: "medium",
        interest: interest.trim(),
      },
    })
    setName("")
    setRoleTitle("")
    setInterest("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add a stakeholder</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a stakeholder</DialogTitle>
          <DialogDescription>Someone who cares about this baseline, and why.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Role title">
            <Input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} />
          </Field>
          <Field label="Team">
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="What they need from the baseline">
            <Textarea value={interest} onChange={(event) => setInterest(event.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save stakeholder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddRequirementDialog() {
  const { state, dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<RequirementKind>("functional")
  const [quality, setQuality] = useState<QualityCharacteristic>("functional-suitability")
  const [title, setTitle] = useState("")
  const [statement, setStatement] = useState("")
  const [derivesFromId, setDerivesFromId] = useState("none")
  const [usesId, setUsesId] = useState("none")
  const ownerId = state.stakeholders.find((person) => person.kind === "author")?.id ?? state.stakeholders[0]?.id ?? ""

  function save() {
    if (!title.trim() || !statement.trim() || !ownerId) return
    const requirement = makeRequirement({
      state,
      kind,
      title,
      statement,
      quality,
      ownerId,
    })
    dispatch({
      type: "add-requirement",
      requirement,
      derivesFromId: derivesFromId === "none" ? undefined : derivesFromId,
      usesId: kind === "data" && usesId !== "none" ? usesId : undefined,
    })
    setTitle("")
    setStatement("")
    setOpen(false)
  }

  const sources = [...state.outcomes, ...state.needs]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add a requirement</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a solution requirement</DialogTitle>
          <DialogDescription>It starts as a draft. A baseline only changes when you mint a version.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
          <Field label="Kind">
            <Select value={kind} onValueChange={(value) => setKind(value as RequirementKind)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(requirementKindLabel) as RequirementKind[]).map((item) => (
                  <SelectItem key={item} value={item}>
                    {requirementKindLabel[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {kind === "quality" ? (
            <Field label="ISO/IEC 25010 characteristic">
              <Select value={quality} onValueChange={(value) => setQuality(value as QualityCharacteristic)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qualityCharacteristics.map((item) => (
                    <SelectItem key={item} value={item}>
                      {qualityLabel[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <Field label="Title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Statement">
            <Textarea value={statement} onChange={(event) => setStatement(event.target.value)} />
          </Field>
          <Field label="Derives from">
            <Select value={derivesFromId} onValueChange={setDerivesFromId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not yet</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.code} — {"title" in source ? source.title : source.statement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {kind === "data" ? (
            <Field label="Points at a dictionary row">
              <Select value={usesId} onValueChange={setUsesId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a data element" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose later</SelectItem>
                  {state.dataElements.map((element) => (
                    <SelectItem key={element.id} value={element.id}>
                      {element.code} {element.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={save}>Save draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddGlossaryDialog() {
  const { dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const [definition, setDefinition] = useState("")
  const [aliases, setAliases] = useState("")

  function save() {
    if (!term.trim() || !definition.trim()) return
    dispatch({
      type: "add-glossary",
      term: {
        id: `g-${crypto.randomUUID().slice(0, 8)}`,
        term: term.trim(),
        definition: definition.trim(),
        aliases: aliases.split(",").map((item) => item.trim()).filter(Boolean),
      },
    })
    setTerm("")
    setDefinition("")
    setAliases("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add a term</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a glossary term</DialogTitle>
          <DialogDescription>A shared meaning. Requirements and rules can point here.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Term">
            <Input value={term} onChange={(event) => setTerm(event.target.value)} />
          </Field>
          <Field label="Definition">
            <Textarea value={definition} onChange={(event) => setDefinition(event.target.value)} />
          </Field>
          <Field label="Aliases, comma separated">
            <Input value={aliases} onChange={(event) => setAliases(event.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save term</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddDataDialog() {
  const { state, dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [format, setFormat] = useState("")
  const ownerId = state.stakeholders.find((person) => person.id === "sh-rosa")?.id ?? state.stakeholders[0]?.id ?? ""

  function save() {
    if (!name.trim() || !description.trim() || !format.trim()) return
    dispatch({
      type: "add-data",
      element: {
        id: `de-${crypto.randomUUID().slice(0, 8)}`,
        code: nextCode(state.dataElements.map((item) => item.code), "DE-"),
        name: name.trim(),
        description: description.trim(),
        format: format.trim(),
        ownerId,
      },
    })
    setName("")
    setDescription("")
    setFormat("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add a dictionary row</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a data element</DialogTitle>
          <DialogDescription>This is the dictionary. A data requirement points at it. It is not the requirement.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label="Format">
            <Input value={format} onChange={(event) => setFormat(event.target.value)} placeholder="Identifier, dates, amounts" />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save row</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddRuleDialog() {
  const { state, dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<RuleKind>("operative")
  const [title, setTitle] = useState("")
  const [statement, setStatement] = useState("")
  const [source, setSource] = useState("")
  const [constrainsId, setConstrainsId] = useState("none")

  function save() {
    if (!title.trim() || !statement.trim() || !source.trim()) return
    const prefix = kind === "definitional" ? "BR-D-" : "BR-O-"
    dispatch({
      type: "add-rule",
      constrainsId: constrainsId === "none" ? undefined : constrainsId,
      rule: {
        id: `br-${crypto.randomUUID().slice(0, 8)}`,
        code: nextCode(state.rules.map((item) => item.code), prefix),
        kind,
        title: title.trim(),
        statement: statement.trim(),
        source: source.trim(),
      },
    })
    setTitle("")
    setStatement("")
    setSource("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add a rule</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a business rule</DialogTitle>
          <DialogDescription>Definitional rules fix meaning. Operative rules constrain what the solution may do.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Kind">
            <Select value={kind} onValueChange={(value) => setKind(value as RuleKind)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="definitional">Definitional</SelectItem>
                <SelectItem value="operative">Operative</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Statement">
            <Textarea value={statement} onChange={(event) => setStatement(event.target.value)} />
          </Field>
          <Field label="Source">
            <Input value={source} onChange={(event) => setSource(event.target.value)} />
          </Field>
          <Field label="Constrains">
            <Select value={constrainsId} onValueChange={setConstrainsId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nothing yet</SelectItem>
                {state.requirements.map((requirement) => (
                  <SelectItem key={requirement.id} value={requirement.id}>
                    {requirement.code} {requirement.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddStoryDialog() {
  const { state, dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [epicId, setEpicId] = useState(state.epics[0]?.id ?? "")
  const [requirementId, setRequirementId] = useState(state.requirements[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const [statement, setStatement] = useState("")

  function save() {
    if (!title.trim() || !statement.trim() || !epicId || !requirementId) return
    dispatch({
      type: "add-story",
      story: {
        id: `us-${crypto.randomUUID().slice(0, 8)}`,
        code: nextCode(state.stories.map((item) => item.code), "US-"),
        epicId,
        requirementId,
        title: title.trim(),
        statement: statement.trim(),
      },
    })
    setTitle("")
    setStatement("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add a story</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a user story</DialogTitle>
          <DialogDescription>A story elaborates a solution requirement. It does not replace it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Epic">
            <Select value={epicId} onValueChange={setEpicId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.epics.map((epic) => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.code} {epic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Elaborates">
            <Select value={requirementId} onValueChange={setRequirementId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.requirements.map((requirement) => (
                  <SelectItem key={requirement.id} value={requirement.id}>
                    {requirement.code} {requirement.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Story">
            <Textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="As a … I can … so that …" />
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save story</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddQuestionDialog() {
  const { state, dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [relatedId, setRelatedId] = useState("none")
  const raisedById = state.stakeholders.find((person) => person.kind === "author")?.id ?? ""

  function save() {
    if (!prompt.trim() || !raisedById) return
    dispatch({
      type: "add-question",
      question: {
        id: `q-${crypto.randomUUID().slice(0, 8)}`,
        code: nextCode(state.questions.map((item) => item.code), "Q-"),
        prompt: prompt.trim(),
        raisedById,
        status: "open",
        relatedId: relatedId === "none" ? undefined : relatedId,
      },
    })
    setPrompt("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Raise a question</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a question</DialogTitle>
          <DialogDescription>Leave it open until someone records a decision.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Question">
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </Field>
          <Field label="About">
            <Select value={relatedId} onValueChange={setRelatedId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">The initiative in general</SelectItem>
                {state.requirements.slice(0, 12).map((requirement) => (
                  <SelectItem key={requirement.id} value={requirement.id}>
                    {requirement.code} {requirement.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save question</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RecordDecisionDialog({ questionId }: { questionId: string }) {
  const { state, dispatch } = useBasis()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [outcome, setOutcome] = useState("")
  const [decidedById, setDecidedById] = useState(state.stakeholders[2]?.id ?? "")

  function save() {
    if (!title.trim() || !outcome.trim() || !decidedById) return
    dispatch({
      type: "record-decision",
      questionId,
      title: title.trim(),
      outcome: outcome.trim(),
      decidedById,
    })
    setTitle("")
    setOutcome("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Record a decision</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a decision</DialogTitle>
          <DialogDescription>This answers the question and keeps both in the record.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Decision title">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="What was decided">
            <Textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} />
          </Field>
          <Field label="Decided by">
            <Select value={decidedById} onValueChange={setDecidedById}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.stakeholders.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save decision</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
