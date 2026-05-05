---
name: Lambchop Autonomous Workflow
version: 1
automation:
  cadence: every 20 minutes when active, adaptive backoff when idle
  external_issue_tracking: false
  specs_source: autonomous-coding-team/
  workflow_file: WORKFLOW.md
  state_file: docs/lambchop/state.json
  progress_file: docs/lambchop/progress.md
  backoff_file: docs/lambchop/backoff.json
  memory_file_primary: $CODEX_HOME/automations/lambchop-autonomous-coding-team/memory.md
  memory_file_fallback_windows: C:\Users\BillMartin\.codex\automations\lambchop-autonomous-coding-team\memory.md
  memory_file_fallback_unix: ~/.codex/automations/lambchop-autonomous-coding-team/memory.md
  worktree_root: .worktrees
  branch_prefix: codex/
  branch_name_template: codex/lambchop-{work_item_key}
  concurrency_mode: cooperative
  max_concurrent_runs: 3
  lease_minutes: 120
  integration_branch: master
  publish_default: local-branch
  repository_root: .
---

# Lambchop Autonomous Workflow

This file is the operating contract for recurring autonomous Codex implementation runs on Lambchop. Future automation runs must read this file first and follow it as-is. Treat this file as read-only unless Bill explicitly requests workflow changes.

Lambchop is the reusable Codex skill project for deploying autonomous coding teams into new or existing repositories. The current milestone is to make the skill itself a working autonomous coding team and a reusable deployment pattern for other projects.

## Sources Of Truth
Use these sources in this order:

1. `WORKFLOW.md` defines how the automation works.
2. `docs/lambchop/state.json` defines the local work queue and machine-readable status.
3. `docs/lambchop/progress.md` records human-readable proof of work.
4. `autonomous-coding-team/` contains the skill, references, and templates.
5. Repository files and validation results are the source of truth for implemented behavior.

If these sources disagree, preserve explicit user intent first, then implemented passing behavior, then safety and data integrity. Update state/progress to match reality and record the reconciliation.

## Allowed Actions
Automation may inspect the repo, create worktrees, create local `codex/lambchop-{work_item_key}` branches, edit skill/docs/templates for the active item, run validation commands, commit locally, and update state/progress/backoff.

## Forbidden Actions
Automation must not publish branches, open pull requests, deploy, modify production configuration, use external trackers, delete or revert user work, do implementation work directly in the main checkout after setup, overwrite another live lease, or mark work done without validation evidence.

## Run Loop
Every automation run must:

1. Generate a unique `run_id`.
2. Read this workflow plus state, progress, and backoff ledgers.
3. Resolve automation memory.
4. Inspect repository structure, git status, branches, remotes, and worktrees.
5. Run git write-access preflight before selecting work.
6. Reconcile state/progress with repository reality.
7. Select exactly one eligible work item using dependency and lease rules.
8. Claim it with a lease.
9. Work in `.worktrees/{work_item_key}` on `codex/lambchop-{work_item_key}`.
10. Use TDD-style proof for skill behavior: write or identify a pressure scenario first, then update the skill/templates, then validate that the scenario is addressed.
11. Run relevant validation.
12. Commit coherent completed changes locally with validation details.
13. Update state, progress, and backoff.
14. Attempt actual automation schedule persistence when tooling is available; otherwise record the infrastructure gap.

## Work Item Statuses
Use only `todo`, `in_progress`, `blocked`, `done`, and `skipped`.

## Cooperative Concurrency
A live `in_progress` item is not a global lock. Another run may select a different `todo` item only when dependencies are done, its `exclusive_scope` does not overlap any live leased item, and fewer than 3 live leases exist. Shared docs or root coordination files may appear in `shared_scope`; overlap there is an integration risk, not an automatic blocker.

Default lease duration is 120 minutes.

## Adaptive Backoff
Use `docs/lambchop/backoff.json`.

- Work found or continued: reset next interval to 20 minutes.
- No eligible work: double the current interval up to 1440 minutes.
- No-work includes all work complete, blocked dependencies, concurrency cap, overlapping exclusive scope, and git preflight failure.
- Persist the ledger, append the decision to progress, and update the actual Codex automation schedule when tooling is available.
- Record desired interval and actual scheduler persistence separately.

## Definition Of Done
A work item is done only when acceptance criteria are satisfied, validation evidence is recorded, state and progress agree, code/docs changes are locally committed when appropriate, and the next step is clear.

## Automation Prompt
The Codex cron automation should tell Codex to read `WORKFLOW.md` first and follow it as the operating contract. Schedule, workspace, model, reasoning effort, and execution environment belong in automation fields.
