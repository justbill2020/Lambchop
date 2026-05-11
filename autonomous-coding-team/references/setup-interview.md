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
- existing project state, progress, backoff, scheduled work, and dashboard files under `docs/`
- existing Codex automations with overlapping name, workspace, or prompt
- if the user supplied GitHub input, the resolved local checkout path and remote identity

## Repo Classification
- Empty repo: no product files yet; create workflow from user brief.
- Docs/spec-only repo: source work queue from plans/specs.
- Existing app/library repo: source queue from docs, code gaps, tests, TODOs, and user goals.
- Partially configured repo: repair missing or stale workflow/state/progress/backoff/scheduled-plan/dashboard files.
- Already automated repo: update existing setup; do not duplicate automations.

## Existing App/Library Repo Expectations
Before asking questions, summarize what the repo already tells you:

- Stack markers found (examples: `package.json`, `pyproject.toml`, `Cargo.toml`, `.sln`, `go.mod`, `pom.xml`).
- Inferred commands (test/build/lint/typecheck) pulled from repo scripts/config, not from the user.
- Candidate sources of truth for the first queue (plans/specs, `README`, `docs/`, TODOs).
- Automation overlap check (reuse/update an existing Codex automation rather than creating duplicates).

## Questions To Ask
Ask only what cannot be inferred safely:

- Where should this GitHub repo be cloned if no local checkout exists and no safe default is obvious?
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
- Initial cadence: weekly cron anchor with an end-of-run scheduler-visible run-now trigger when ACTIVE; pausing the automation must prevent the next trigger.
- Worktree root: `.worktrees`.
- Branch prefix: `codex/`.
- Integration branch: current main branch, preferring `main`, then `master`.
- Parallel execution: adaptive 2-5 Superpowers subagent lanes when independent work exists; otherwise record why single-item execution is safer.
- Visual status: static repo-local dashboard under `docs/<project-slug>/dashboard.html` backed by `dashboard-data.json`.
