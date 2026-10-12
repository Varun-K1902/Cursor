"use client"

import { PageHeader, TypePill } from "@/components/basis/bits"
import { AddGlossaryDialog } from "@/components/basis/dialogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBasis } from "@/lib/store"

export default function GlossaryPage() {
  const { state } = useBasis()

  return (
    <div>
      <PageHeader
        kicker="Language"
        title="Glossary"
        description="One meaning for the words this baseline depends on. If a rule and a requirement use the word, they should mean this."
        action={<AddGlossaryDialog />}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {state.glossary.map((term) => (
          <Card key={term.id} id={term.id} className="scroll-mt-24">
            <CardHeader>
              <TypePill className="bg-[oklch(0.94_0.04_130)] text-[oklch(0.36_0.06_140)]">Term</TypePill>
              <CardTitle className="text-2xl">{term.term}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <p className="leading-relaxed">{term.definition}</p>
              {term.aliases.length > 0 ? (
                <p className="text-sm text-muted-foreground">Also called {term.aliases.join(", ")}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
