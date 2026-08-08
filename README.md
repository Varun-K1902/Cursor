# AIBA — Business Understanding Engine

AIBA helps a business **understand and confirm** what software it needs — before implementation.

Core loop:

**SAY → SEE → CHALLENGE → CORRECT → CONFIRM → FREEZE → BUILD**

This repository contains a vertical-slice prototype of the Functional Solution Workspace.

## Product invariants

- One **canonical model** — Flow and Live Functional Preview are projections, not separate sources of truth.
- Conversation is an **input modality**, not the product.
- Prefer **show → correct** over questionnaire authoring.
- Surface ambiguity **in place** (e.g. `Reject → ?`), never invent silent business rules.
- Distinguish **structural** completeness from **factual** completeness.
- The sketch is a **Functional Preview**, not final UI.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TypeScript, `@xyflow/react`, Vitest, handwritten CSS |
| Backend | FastAPI, Pydantic, Uvicorn, SQLite |

## Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend (optional persistence)

```bash
cd backend
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

### Tests

```bash
cd frontend
npm test
```

## Prototype walkthrough

1. Open the app → **Open Child Vaccination example** (or start blank and type).
2. Use the input bar or prompt chips to describe the process.
3. Watch **People / Things / Rules / Steps** appear on the left.
4. Inspect the **Functional Preview** (wireframe) and **Flow** — both from the same model.
5. Correct fields/actions in the preview; Flow stays aligned.
6. Resolve challenges (e.g. “Where does rejection go?”) without invented defaults.
7. Open **Provenance** to see why a step exists.
8. Freeze only after confirmation.

## Architecture (slice)

```
Business statement
        ↓
interpretStatement()  →  ProcessModel (canonical)
        ↓
   ┌────┴────┬────────────┐
   ↓         ↓            ↓
deriveFlow  deriveScreens  compileStory (Scene Graph)
   ↓         ↓            ↓
 Flow     Functional    Visual Story
          Preview
```

### Visual Story

First-class interactive storyboard renderer of the same canonical model:

- Deterministic Scene Graph compiler (finite scene grammar)
- Story World with stable character/location/object visual IDs
- Pause on unresolved outcomes — never invent the next step
- Real-world action → digital experience transition into the Live Sketch
- Corrections update the model; Flow + Preview + Story stay in sync
- MVP uses illustrated storyboard assets (no generative video)

Primary action: **Show me what you understood** — not Generate Video.

## Domains exercised

Same primitives across:

- Child Vaccination (Limpopo-style healthcare)
- Attendance Regularisation
- SAP → DAP site approval
