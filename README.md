# Basis

Basis is a structured business-analysis workspace for project BAs and product BAs. The source of truth is objects — stakeholders, outcomes, requirements, rules, data, flows, stories, questions, and named baselines. Word, PDF, and Excel are views, not the record.

The sample initiative is **Commonwealth Benefits Access Modernization (CBAM)**: a Department of Human Services program replacing three eligibility systems for SNAP, Medicaid, and childcare.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run lint
```

## What you can do

- Move through teams, RACI, outcomes, requirements, glossary, the data register, rules, flows, stories, questions, trace, and baseline.
- Open a requirement and follow **derives from**, **constrained by**, **elaborates**, and **uses** without a spreadsheet.
- Add stakeholders, requirements, glossary terms, dictionary rows, rules, stories, and questions. Add acceptance criteria in plain language or Given / When / Then on a requirement, story, or flow.
- See the approved baseline **Eligibility Core 2026.1**, the proposed **2026.2** minted by a real change, and mint another version yourself. The approved baseline stays put.

Edits live in the browser (`localStorage`). Use the header menu to reset the sample.

## Quality model

Quality requirements use the ISO/IEC 25010:2023 characteristics: functional suitability, performance efficiency, compatibility, interaction capability, reliability, security, maintainability, flexibility, and safety.

## Out of scope

Full application lifecycle management, test execution, a wiki, a BPMN engine, and a financial business case.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui. State is client-side and seeded. No database.
