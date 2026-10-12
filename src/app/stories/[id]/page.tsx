"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { AcceptanceEditor } from "@/components/basis/acceptance"
import { ObjectRef, TypePill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { useBasis } from "@/lib/store"

export default function StoryPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { state } = useBasis()
  const story = state.stories.find((item) => item.id === id)

  if (!story) {
    return (
      <div className="grid gap-3">
        <h1 className="text-3xl text-ink">This story is not in the record</h1>
        <Button asChild variant="outline">
          <Link href="/stories">Back to stories</Link>
        </Button>
      </div>
    )
  }

  const epic = state.epics.find((item) => item.id === story.epicId)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)]">
      <div className="grid gap-8">
        <div>
          <Link href="/stories" className="text-sm text-primary">All epics and stories</Link>
          <div className="mt-3">
            <TypePill className="bg-[oklch(0.93_0.035_230)] text-[oklch(0.36_0.07_240)]">Story {story.code}</TypePill>
          </div>
          <h1 className="mt-3 text-4xl font-medium text-ink">{story.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed">{story.statement}</p>
          {epic ? <p className="mt-3 text-sm text-muted-foreground">Part of {epic.code} {epic.title}</p> : null}
        </div>
        <AcceptanceEditor parentKind="story" parentId={story.id} />
      </div>
      <aside className="grid gap-3">
        <h2 className="text-lg font-medium text-ink">Elaborates</h2>
        <ObjectRef id={story.requirementId} />
      </aside>
    </div>
  )
}
