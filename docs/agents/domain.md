# Domain Docs

How engineering skills should consume Lambchop's domain documentation when exploring this repo.

## Before exploring, read these

- `WORKFLOW.md` for the live autonomous operating contract.
- `docs/lambchop/state.json` for the executable automation queue and project policy.
- `docs/lambchop/progress.md` for proof, incidents, scheduler evidence, and root-cause history.
- `docs/lambchop/scheduled-work-plan.md` for source-backed future work planning.
- `autonomous-coding-team/SKILL.md` and `autonomous-coding-team/references/` for reusable skill behavior.
- `autonomous-coding-team/assets/templates/` when setup, upgrade, hooks, dashboard, workflow, or target-repo defaults change.

If `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` are added later, read the relevant files before changing terminology or architecture.

## Self-hosting recursion

Lambchop is recursive by design: the active autonomous coding agent may run inside this repository while this repository is the reusable autonomous coding agent system being changed. Treat that as a first-class project constraint, not a novelty.

When changing workflow, hooks, schedules, dashboards, source-commit tracking, issue-tracker policy, or automation prompts, record explicit evidence in state/progress/dashboard/backoff so the running system can distinguish real source-of-truth changes from status-only self-talk.

## Vocabulary

- **Lambchop**: the reusable Codex skill and template project for deploying autonomous coding teams.
- **Main automation run**: the orchestrator that selects work, validates, updates ledgers, commits, and handles scheduler finalization.
- **Project chat intake**: an ordinary chat that triages user requests into bounded work and hands them to automation unless Bill explicitly requests maintenance or direct implementation.
- **GitHub Issues tracker**: the default durable issue/PRD tracker for this repository and for GitHub-backed Lambchop-managed repos.
- **Local execution queue**: `docs/lambchop/state.json`, which remains the machine-readable automation queue even when a GitHub issue exists.
