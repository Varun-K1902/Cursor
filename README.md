# Business Exploration Platform — Design

This branch contains **architecture design** for the core IP:

## Business-to-UX Translation Layer

Business users describe journeys, activities, objects, roles, goals, information, decisions, rules, actions, and exceptions.

A compiler lowers that **Specification Graph** into framework-agnostic **Workspace Definitions** — never the other way around.

UI is a consequence of business understanding, not a separate design activity.

### Start here

- [`docs/translation-layer/README.md`](docs/translation-layer/README.md) — thesis, passes, principles
- [`docs/translation-layer/architecture.md`](docs/translation-layer/architecture.md) — IR schemas
- [`docs/translation-layer/classifiers.md`](docs/translation-layer/classifiers.md) — deterministic scorecards
- [`docs/translation-layer/workspace-definition.schema.yaml`](docs/translation-layer/workspace-definition.schema.yaml) — output contract
- [`examples/child-immunization/`](examples/child-immunization/) — full compile example

### Diagrams

See artifacts generated with this design (`b2ux-*.png`).
