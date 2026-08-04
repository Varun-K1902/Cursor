# Business-to-UX Translation Layer — Interactive Prototype

Clickable prototype of the **Translation Layer** compiler.

Business users explore journeys/activities/objects/rules.  
The prototype compiles that into Workspace Definitions and a semantic preview — **not** a page builder.

## Run

```bash
cd prototype
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Launch interactive studio**.

## What to try

1. **Business** — pick Search / Review / Administer / Record Growth; inspect objects & actions  
2. **Compile** — step through P1–P9; see pattern scores, navigation strategies, action ranking, rule bindings  
3. **Workspace preview** — semantic regions/actions from the compile  
4. Toggle **rules** and **runtime scenario** (eligible / overdue / duplicate) — watch affordances change  

## Architecture docs

See [`../docs/translation-layer/`](../docs/translation-layer/) and [`../examples/child-immunization/`](../examples/child-immunization/).
