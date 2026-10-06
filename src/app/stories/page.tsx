"use client"

import Link from "next/link"

import { ObjectRef, PageHeader, TypePill } from "@/components/basis/bits"
import { AddStoryDialog } from "@/components/basis/dialogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBasis } from "@/lib/store"

export default function StoriesPage() {
  const { state } = useBasis()

  return (
    <div>
      <PageHeader
        kicker="Behavior"
        title="Epics and stories"
        description="Stories elaborate a solution requirement. They are how a team picks up the work. They are not a second source of truth."
        action={<AddStoryDialog />}
      />
      <div className="grid gap-6">
        {state.epics.map((epic) => {
          const stories = state.stories.filter((story) => story.epicId === epic.id)
          return (
            <section key={epic.id} id={epic.id} className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <TypePill className="bg-[oklch(0.93_0.04_275)] text-[oklch(0.36_0.08_275)]">Epic {epic.code}</TypePill>
                  <CardTitle className="text-2xl">{epic.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="max-w-3xl leading-relaxed">{epic.statement}</p>
                  <ObjectRef id={epic.requirementId} />
                  <div className="grid gap-2">
                    {stories.map((story) => (
                      <Link
                        key={story.id}
                        href={`/stories/${story.id}`}
                        className="rounded-xl bg-muted/60 px-4 py-3 transition-colors hover:bg-accent"
                      >
                        <p className="text-xs font-mono text-muted-foreground">{story.code}</p>
                        <p className="font-medium">{story.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{story.statement}</p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )
        })}
      </div>
    </div>
  )
}
