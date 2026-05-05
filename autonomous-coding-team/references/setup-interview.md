# Setup Interview

## Principle
Inspect first, ask second. The setup should feel like Codex interviewing the project while the user clarifies only real product or policy choices.

## Inspection Pass
Collect repo facts before asking:

- project folder name, current branch, remotes, and git status
- docs, specs, plans, TODOs, and existing `WORKFLOW.md`
- package manifests and stack markers such as `package.json`, `pyproject.toml`, `Cargo.toml`, `.sln`, `go.mod`, or `pom.xml`
- test, build, lint, typecheck, and dev commands
- config, environment, deployment, and CI files
- existing project state, progress, and backoff ledgers under `docs/`
- existing Codex automations with overlapping name, workspace, or prompt

## Repo Classification
- Empty repo: no product files yet; create workflow from user brief.
- Docs/spec-only repo: source work queue from plans/specs.
- Existing app/library repo: source queue from docs, code gaps, tests, TODOs, and user goals.
- Partially configured repo: repair missing or stale workflow/state/progress/backoff files.
- Already automated repo: update existing setup; do not duplicate automations.

## Questions To Ask
Ask only what cannot be inferred safely:

- What is the project trying to become?
- Which source of truth should drive the first work queue?
- What milestone should the automation work toward first?
- Should default autonomy remain local commits only?
- What initial cadence should the cron automation use?
- What checks are required before a work item can be marked done?

## Defaults
- Source of truth: existing specs/plans first, then README/docs, then TODOs, then user brief.
- Autonomy: local branches, worktrees, edits, tests, docs, and local commits only.
- Publishing: disabled.
- External trackers: disabled.
- Initial cadence: 20 minutes when active; adaptive backoff handles idle periods.
- Worktree root: `.worktrees`.
- Branch prefix: `codex/`.
- Integration branch: current main branch, preferring `main`, then `master`.
