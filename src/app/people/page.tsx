"use client"

import { AddStakeholderDialog } from "@/components/basis/dialogs"
import { PageHeader, TypePill } from "@/components/basis/bits"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initials } from "@/lib/labels"
import { useBasis } from "@/lib/store"

const kindLabel = {
  author: "Author",
  sponsor: "Sponsor",
  owner: "Owner",
  consulted: "Consulted",
}

export default function PeoplePage() {
  const { state } = useBasis()

  return (
    <div>
      <PageHeader
        kicker="People"
        title="Teams and stakeholders"
        description="The people who author the baseline, and the people who have to live with it."
        action={<AddStakeholderDialog />}
      />
      <div className="grid gap-8">
        {state.teams.map((team) => {
          const people = state.stakeholders.filter((person) => person.teamId === team.id)
          return (
            <section key={team.id}>
              <h2 className="text-2xl font-medium text-ink">{team.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{team.purpose}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {people.map((person) => (
                  <Card key={person.id} id={person.id} className="scroll-mt-24">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            {initials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{person.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{person.roleTitle}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <div className="flex flex-wrap gap-2">
                        <TypePill className="bg-accent text-accent-foreground">{kindLabel[person.kind]}</TypePill>
                        <TypePill className="bg-muted text-muted-foreground">{person.influence} influence</TypePill>
                      </div>
                      <p className="text-sm leading-relaxed">{person.interest}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
