"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { PageHeader } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBasis } from "@/lib/store"

export default function ProjectsPage() {
  const { workspace, dispatch } = useBasis()
  const router = useRouter()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="Projects"
        title="Workspaces"
        description="Each project keeps its own template, answers, and requirements in this browser."
        action={
          <Button asChild>
            <Link href="/projects/new">Create a project</Link>
          </Button>
        }
      />
      {workspace.projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet. Create one, or restore the Employee Leave Management sample from Settings.</p>
      ) : null}
      <div className="grid gap-3">
        {workspace.projects.map((project) => (
          <Card key={project.initiative.id}>
            <CardHeader>
              <CardTitle className="text-2xl">{project.initiative.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p className="text-muted-foreground">{project.initiative.description || project.initiative.problem}</p>
              <p>
                {project.requirements.length} requirements
                {project.initiative.sample ? " · Sample" : ""}
                {project.initiative.draft ? " · Draft" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    dispatch({ type: "set-active", id: project.initiative.id })
                    router.push("/overview")
                  }}
                >
                  Open
                </Button>
                {pendingDelete === project.initiative.id ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        dispatch({ type: "delete-project", id: project.initiative.id })
                        setPendingDelete(null)
                      }}
                    >
                      Confirm delete
                    </Button>
                    <Button variant="outline" onClick={() => setPendingDelete(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setPendingDelete(project.initiative.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
