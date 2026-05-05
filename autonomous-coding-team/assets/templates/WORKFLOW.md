---
name: <PROJECT_NAME> Autonomous Workflow
version: 1
automation:
  cadence: every 20 minutes when active, adaptive backoff when idle
  external_issue_tracking: false
  specs_source: <SPECS_SOURCE>
  workflow_file: WORKFLOW.md
  state_file: docs/<PROJECT_SLUG>/state.json
  progress_file: docs/<PROJECT_SLUG>/progress.md
  backoff_file: docs/<PROJECT_SLUG>/backoff.json
  scheduled_work_plan_file: docs/<PROJECT_SLUG>/scheduled-work-plan.md
  memory_file_primary: $CODEX_HOME/automations/<AUTOMATION_ID>/memory.md
  memory_file_fallback_windows: C:\Users\<WINDOWS_USERNAME>\.codex\automations\<AUTOMATION_ID>\memory.md
  memory_file_fallback_unix: ~/.codex/automations/<AUTOMATION_ID>/memory.md
  worktree_root: .worktrees
  branch_prefix: codex/
  branch_name_template: codex/<PROJECT_SLUG>-<work-item-key>
  concurrency_mode: cooperative
  max_concurrent_runs: 3
  lease_minutes: 120
  integration_branch: <INTEGRATION_BRANCH>
  publish_default: local-branch
  repository_root: .
---

# <PROJECT_NAME> Autonomous Workflow

This file is the operating contract for recurring autonomous Codex implementation runs on `<PROJECT_NAME>`. Future automation runs must read this file first and follow it as-is. Treat this file as read-only unless the user explicitly requests workflow changes.

`<PROJECT_NAME>` is <PROJECT_PURPOSE>. The current milestone is <CURRENT_MILESTONE>.

## Sources Of Truth
Use these sources in this order:

1. `WORKFLOW.md` defines how the automation works.
2. `docs/<PROJECT_SLUG>/state.json` defines the local work queue and machine-readable status.
3. `docs/<PROJECT_SLUG>/progress.md` records human-readable proof of work.
4. `docs/<PROJECT_SLUG>/scheduled-work-plan.md` defines how future tasks are planned when the queue is empty.
5. `<SPECS_SOURCE>` contains project requirements, plans, specs, TODOs, or user instructions.
6. Repository code and tests are the source of truth for implemented behavior.
7. Existing documentation explains expected operation and should be updated when behavior changes.

If these sources disagree, stop and reconcile them in this order:

1. Preserve explicit user intent.
2. Preserve implemented passing behavior unless it clearly conflicts with requirements.
3. Preserve safety, security, and data integrity.
4. Update local state and progress to match reality.
5. Record the conflict and resolution in `docs/<PROJECT_SLUG>/progress.md`.

## Allowed Actions
By default, automation may:

- inspect the repository and documentation
- create and use isolated worktrees under `.worktrees/`
- create local branches named `codex/<PROJECT_SLUG>-<work-item-key>`
- edit code, tests, docs, and local workflow ledgers for the active work item
- run tests, builds, typechecks, linters, and smoke checks
- commit coherent completed changes locally with validation evidence
- update state, progress, backoff, and automation schedule fields

## Forbidden Actions
Automation must not:

- publish branches
- open pull requests
- deploy
- modify production configuration
- use or mutate external issue trackers
- delete or revert user work
- do implementation work directly in the main checkout
- overwrite another live lease
- mark work done without validation evidence

These actions require explicit user permission and a workflow update.

## First Run Discovery
On the first run, or whenever required project details are missing, inspect before selecting work:

- project name and slug
- primary purpose and current milestone
- framework, language stack, and package manager
- test, build, lint, typecheck, and dev commands
- documentation, specs, plans, TODOs, and source-of-truth files
- config, environment, deployment, and CI files
- persistence layer and data safety concerns
- existing features, incomplete work, risks, and blockers
- existing automations or workflow ledgers

Record the discovery result in `docs/<PROJECT_SLUG>/progress.md` and normalize `docs/<PROJECT_SLUG>/state.json`.

## Run Loop
Every automation run must:

1. Generate a unique `run_id`, such as `run-<yyyyMMdd-HHmmss>-<short-random>`.
2. Read `WORKFLOW.md`, `docs/<PROJECT_SLUG>/state.json`, `docs/<PROJECT_SLUG>/progress.md`, `docs/<PROJECT_SLUG>/backoff.json`, and `docs/<PROJECT_SLUG>/scheduled-work-plan.md`.
3. Resolve automation memory:
   - primary: `$CODEX_HOME/automations/<AUTOMATION_ID>/memory.md`
   - Windows fallback: `C:\Users\<WINDOWS_USERNAME>\.codex\automations\<AUTOMATION_ID>\memory.md`
   - Unix fallback: `~/.codex/automations/<AUTOMATION_ID>/memory.md`
4. Inspect repository structure, git status, current branch, remotes, local branches, and `git worktree list --porcelain`.
5. Run git write-access preflight:
   - create and delete a temporary branch
   - create and remove a temporary worktree under `.worktrees/`
   - confirm state, progress, and backoff files can be updated
6. Reconcile state/progress with repository reality before selecting work.
7. Re-test any blocker before honoring a `blocked` item.
8. Apply cooperative concurrency rules before selecting work.
9. Select exactly one eligible work item, or create the next source-backed item from `docs/<PROJECT_SLUG>/scheduled-work-plan.md` when no queued item is eligible.
10. Create or reuse `.worktrees/<work-item-key>` for the active item.
11. Use branch `codex/<PROJECT_SLUG>-<work-item-key>`.
12. Work only the active item until complete or blocked.
13. Use TDD for production behavior: RED, GREEN, refactor when needed.
14. Run relevant verification for the changed behavior.
15. Update documentation when behavior, setup, commands, architecture, or limitations change.
16. Commit coherent completed changes locally with validation details in the commit body.
17. After completing or blocking the active item, run the planner loop: reconcile state, inspect the scheduled work plan, add the next bounded source-backed work item when work remains, or record the no-work reason.
18. Update state, progress, and backoff ledgers.
19. Update the actual automation schedule field after applying adaptive backoff.
20. Append an operator summary for the user.

If the active item cannot be finished in one run, leave it `in_progress` or `blocked` with an exact next step.

## Work Item Statuses
Use only:

- `todo`: ready or waiting for dependencies
- `in_progress`: claimed by a live or recently live automation run
- `blocked`: cannot proceed without a specific external fix or decision
- `done`: completed, verified, and locally committed when code changed
- `skipped`: intentionally not needed, with rationale

## Work Item Model
Each item in `docs/<PROJECT_SLUG>/state.json` must include:

- `key`
- `title`
- `type`
- `status`
- `priority`
- `dependencies`
- `source_refs`
- `acceptance_criteria`
- `implementation_notes`
- `validation`
- `branch`
- `worktree`
- `commit`
- `blocker`
- `exclusive_scope`
- `shared_scope`
- `lease`
- `next_step`
- `integration`
- `updated_at`

## Cooperative Concurrency
Concurrent runs are allowed when they coordinate through state leases and separate worktrees.

Each run must:

1. Count live leases before claiming work. If there are already 3 non-expired live leases, record a no-work concurrency-cap entry and apply adaptive backoff.
2. Treat an `in_progress` item with a non-expired `lease.expires_at` owned by a different `run_id` as actively owned by another run.
3. Never overwrite another active run's lease, branch, worktree, validation, blocker, or completion fields.
4. Select another eligible `todo` item only when all dependencies are `done` and its `exclusive_scope` does not overlap any live leased item.
5. If an item has `status: in_progress` but its lease is expired, inspect the branch, worktree, git status, and progress notes before reclaiming it.
6. On completion, set `status` to `done`, record validation and commit, set integration status, clear or expire the lease, and append proof.
7. On blocker, set `status` to `blocked`, record evidence, clear or expire the lease, and append the exact next step.

Shared files such as root manifests, lockfiles, configs, and docs may appear in `shared_scope`. Shared scope overlap does not automatically block work, but it must be recorded as an integration risk and reconciled later.

## Adaptive Backoff
Use `docs/<PROJECT_SLUG>/backoff.json` as the interval ledger.

- If work was found or continued, set next interval to 20 minutes.
- If no eligible work was found, set next interval to `min(current_interval_minutes * 2, 1440)`.
- If already at 1440 minutes and no work is found, keep it at 1440.
- Persist `current_interval_minutes`, `last_work_found`, `last_result`, and `updated_at`.
- Append the decision to `docs/<PROJECT_SLUG>/progress.md`.
- Update the actual Codex automation schedule field to match the computed interval.

No-work includes all work complete, blocked dependencies, concurrency cap reached, no dependency-safe item with non-overlapping exclusive scope, and git preflight failure.

## Scheduled Work Planning
Use `docs/<PROJECT_SLUG>/scheduled-work-plan.md` as the roadmap and task-generation source.

Before declaring no-work, inspect the scheduled work plan and current source files. If source-backed work remains, create the next bounded work item in state with dependencies, acceptance criteria, source references, validation expectations, exclusive scope, shared scope, and next step. If no source-backed task can be created, append the inspected sources and no-work reason to progress.

## Definition Of Done
A work item is done only when:

- acceptance criteria are satisfied
- relevant tests/checks pass or skipped checks are documented with reason and risk
- state and progress are updated
- code changes are locally committed with validation evidence
- the next step is clear

## Automation Prompt
The Codex automation should be a cron automation whose prompt tells Codex to read this file first and follow it as the operating contract. Keep schedule, workspace, model, reasoning effort, and execution environment in automation fields.
