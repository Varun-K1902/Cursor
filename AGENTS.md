# AGENTS.md

Guidance for AI agents and developers working in this repository.

## Repository status

This repository currently contains only `README.md` (heading: "Cursor"). There is no application source code, dependency manifests (`package.json`, `requirements.txt`, etc.), Docker configuration, or CI workflows.

## Cursor Cloud specific instructions

### Services

| Service | Required? | Notes |
|---------|-----------|-------|
| — | — | No services are defined. Nothing to start for local development. |

### Dependency installation

No install step is required until application code and dependency manifests are added to the repo.

### Lint, test, and build

No lint, test, or build commands are defined yet.

### Environment variables

No environment variables or secrets are documented. Add a `.env.example` when the project needs configuration.

### VM capabilities (verified)

The Cursor Cloud VM provides Git, Node.js (v22), and Python 3.12. Docker is not pre-installed on this environment.

### When application code is added

Update this file with:

1. Install command (e.g. `npm install`, `pip install -r requirements.txt`)
2. How to run the dev server(s)
3. How to run lint and tests
4. Required environment variables and external services
