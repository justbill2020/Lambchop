# Domain Docs

How engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `WORKFLOW.md` for the live autonomous operating contract.
- `docs/<PROJECT_SLUG>/state.json` for the executable automation queue and project policy.
- `docs/<PROJECT_SLUG>/progress.md` for proof, incidents, scheduler evidence, and root-cause history.
- `docs/<PROJECT_SLUG>/scheduled-work-plan.md` for source-backed future work planning.
- `<SPECS_SOURCE>` for project requirements, specs, TODOs, or user instructions.

If `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` are added later, read the relevant files before changing terminology or architecture.

## Issue tracking model

GitHub Issues is the default durable issue/PRD tracker for GitHub-backed repos. The local `docs/<PROJECT_SLUG>/state.json` queue remains the source of truth for what the autonomous implementation loop may execute next.
