"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { PageHeader } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBasis } from "@/lib/store"

export default function HomePage() {
  const { workspace, dispatch } = useBasis()
  const router = useRouter()
  const sample = workspace.projects.find((project) => project.initiative.sample)

  function openSample() {
    if (!sample) return
    dispatch({ type: "set-active", id: sample.initiative.id })
    router.push("/overview")
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Basis"
        title="Requirements, already structured"
        description="The workspace asks for the context, recommends a template, and keeps requirements as records. You do not start from a blank document."
        action={
          <Button asChild>
            <Link href="/projects/new">Create a project</Link>
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/documents">Import existing requirements</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/templates">Explore templates</Link>
        </Button>
        {sample ? (
          <Button variant="outline" onClick={openSample}>
            Open the sample project
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/settings">Restore the sample project</Link>
          </Button>
        )}
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>What you do</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            Answer a short setup, confirm the template, then fill guided sections. Requirements, rules, processes, and data stay linked.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What the assistant does</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            It suggests questions, flags ambiguous words, and drafts criteria. Nothing it writes is approved until you accept it. This prototype uses a local mock, not a live model.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projects in this browser</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {workspace.projects.length === 0 ? <p className="text-muted-foreground">None yet. Create one, or restore the sample in Settings.</p> : null}
            {workspace.projects.map((project) => (
              <button
                key={project.initiative.id}
                className="rounded-lg px-2 py-1 text-left hover:bg-accent"
                onClick={() => {
                  dispatch({ type: "set-active", id: project.initiative.id })
                  router.push("/overview")
                }}
              >
                {project.initiative.name}
                {project.initiative.sample ? " · sample" : ""}
                {project.initiative.draft ? " · draft" : ""}
              </button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
