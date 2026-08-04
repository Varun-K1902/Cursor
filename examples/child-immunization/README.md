# Example: Child Immunization Journey

End-to-end compilation from business semantics → UX semantics.
**No pages. No components. No pixels.**

## Business input (what humans author)

**Journey:** Child Immunization  

**Activities:** Search Child → Review Child → Administer Vaccine → Record Growth  

**Primary object:** Child  

**Related:** Vaccinations, Growth Records, Visits, Documents, Family  

**Rules:**
- Cannot administer vaccine before eligibility
- Show overdue vaccines
- Block duplicate administration

---

## Compiled artefacts (this folder)

| File | Pass output |
|------|-------------|
| `specification-graph.yaml` | Input IR |
| `translation-output.yaml` | P1–P9 + ApplicationModel |

---

## Narrative result (Review Child)

| Question | Answer |
|----------|--------|
| User goal? | Comprehend child clinical readiness to act safely |
| Workspace type? | **Profile Workspace** (alt: Timeline) |
| Navigation? | Identity strip + peer nav Overview/Vaccinations/Growth/Visits; Family panel; Documents expandable |
| Actions? | Primary Administer Vaccine; Secondary Record Growth, Refer; overflow Print/Transfer |
| Alerts? | Overdue badge on Vaccinations; warning banner; disable Administer when ineligible; block duplicate dose |
| Info priority? | Identity+eligibility Critical; schedule Important; family Supporting; documents Reference |

Search Child → Search Workspace.  
Administer Vaccine / Record Growth → Capture Workspaces linked by transitions.
