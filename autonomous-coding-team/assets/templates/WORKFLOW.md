---
name: <PROJECT_NAME> Autonomous Workflow
version: 1
automation:
  cadence: weekly cron anchor plus scheduler-visible run-now trigger after each completed active run
  external_issue_tracking: false
  specs_source: <SPECS_SOURCE>
  workflow_file: WORKFLOW.md
  state_file: docs/<PROJECT_SLUG>/state.json
  progress_file: docs/<PROJECT_SLUG>/progress.md
  backoff_file: docs/<PROJECT_SLUG>/backoff.json
  scheduled_work_plan_file: docs/<PROJECT_SLUG>/scheduled-work-plan.md
  dashboard_data_file: docs/<PROJECT_SLUG>/dashboard-data.json
  dashboard_file: docs/<PROJECT_SLUG>/dashboard.html
  memory_file_primary: $CODEX_HOME/automations/<AUTOMATION_ID>/memory.md
  memory_file_fallback_windows: %USERPROFILE%\.codex\automations\<AUTOMATION_ID>\memory.md
  memory_file_fallback_unix: ~/.codex/automations/<AUTOMATION_ID>/memory.md
  worktree_root: .worktrees
  branch_prefix: codex/
  branch_name_template: codex/<PROJECT_SLUG>-<work-item-key>
  concurrency_mode: cooperative
  max_concurrent_runs: 5
  parallel_execution:
    mode: adaptive-subagents
    min_subagents: 2
    max_subagents: 5
    orchestrator: main-automation-run
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
5. `docs/<PROJECT_SLUG>/dashboard-data.json` and `docs/<PROJECT_SLUG>/dashboard.html` provide the current visual operating picture.
6. `<SPECS_SOURCE>` contains project requirements, plans, specs, TODOs, or user instructions.
7. Repository code and tests are the source of truth for implemented behavior.
8. Existing documentation explains expected operation and should be updated when behavior changes.

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
- regenerate dashboard data and the local visual dashboard

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
- private local files, credentials, fixtures, or services that must remain untracked
- existing features, incomplete work, risks, and blockers
- existing automations or workflow ledgers

Record the discovery result in `docs/<PROJECT_SLUG>/progress.md` and normalize `docs/<PROJECT_SLUG>/state.json`.

## Run Loop
Every automation run must:

1. Generate a unique `run_id`, such as `run-<yyyyMMdd-HHmmss>-<short-random>`.
2. Read `WORKFLOW.md`, `docs/<PROJECT_SLUG>/state.json`, `docs/<PROJECT_SLUG>/progress.md`, `docs/<PROJECT_SLUG>/backoff.json`, and `docs/<PROJECT_SLUG>/scheduled-work-plan.md`.
3. Resolve automation memory:
   - primary: `$CODEX_HOME/automations/<AUTOMATION_ID>/memory.md`
   - Windows fallback: `%USERPROFILE%\.codex\automations\<AUTOMATION_ID>\memory.md`
   - Unix fallback: `~/.codex/automations/<AUTOMATION_ID>/memory.md`
4. Inspect repository structure, git status, current branch, remotes, local branches, and `git worktree list --porcelain`.
5. Run git write-access preflight:
   - create and delete a temporary branch
   - create and remove a temporary worktree under `.worktrees/`
   - confirm state, progress, and backoff files can be updated
6. Reconcile state/progress with repository reality before selecting work.
7. Re-test any blocker before honoring a `blocked` item.
8. Consolidate review-ready work only after fresh validation evidence.
9. Apply cooperative concurrency rules before selecting work.
10. Build an adaptive sprint packet of 2 to 5 independent eligible work items when possible, using dependency and lease rules plus non-overlapping `exclusive_scope`. If fewer than 2 independent items are available, select one eligible item and record why parallelism was not useful.
11. Create or reuse `.worktrees/<work-item-key>` for the active item.
12. Use branch `codex/<PROJECT_SLUG>-<work-item-key>`.
13. Work only the active item or sprint packet until complete or blocked.
14. When a sprint packet has 2 or more independent items and subagents are available, the main automation run orchestrates bounded parallel subagents. It dispatches one self-contained task per work item, requires Superpowers `dispatching-parallel-agents`, TDD, and verification guidance, and keeps ownership of integration, state, progress, dashboard regeneration, commits, and scheduler finalization.
15. Use TDD for production behavior: RED, GREEN, refactor when needed.
16. Integrate subagent results one at a time, reconcile shared-scope risks, and mark each lane as completed, blocked, conflicted, failed_validation, or not_useful.
17. Run relevant verification for the changed behavior.
18. Update documentation when behavior, setup, commands, architecture, or limitations change.
19. Commit coherent completed changes locally with validation details in the commit body.
20. After completing or blocking the active item or sprint packet, run the planner loop: reconcile state, inspect the scheduled work plan, add the next bounded source-backed work item when work remains, or record the no-work reason.
21. Regenerate `docs/<PROJECT_SLUG>/dashboard-data.json` and `docs/<PROJECT_SLUG>/dashboard.html` from real state, roadmap, progress, validation, leases, blockers, commits, and next actions.
22. Update state, progress, and the schedule/trigger ledger.
23. Apply the completion trigger protocol: if the automation is ACTIVE, request a scheduler-visible run-now trigger for the same automation; if it is PAUSED or inactive, skip the trigger and record that pause prevented the next run.
24. Append an operator summary for the user.

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

Each run or orchestrated parallel lane must:

1. Count live leases before claiming work. If there are already 5 non-expired live leases, record a no-work concurrency-cap entry and apply adaptive backoff.
2. Treat an `in_progress` item with a non-expired `lease.expires_at` owned by a different `run_id` as actively owned by another run.
3. Never overwrite another active run's lease, branch, worktree, validation, blocker, or completion fields.
4. Select another eligible `todo` item only when all dependencies are `done` and its `exclusive_scope` does not overlap any live leased item.
5. If an item has `status: in_progress` but its lease is expired, inspect the branch, worktree, git status, and progress notes before reclaiming it.
6. On completion, set `status` to `done`, record validation and commit, set integration status, clear or expire the lease, and append proof.
7. On blocker, set `status` to `blocked`, record evidence, clear or expire the lease, and append the exact next step.

Shared files such as root manifests, lockfiles, configs, and docs may appear in `shared_scope`. Shared scope overlap does not automatically block work, but it must be recorded as an integration risk and reconciled later.

## Parallel Sprint Orchestration
The main automation run is the orchestrator. It must prefer a parallel sprint packet whenever at least 2 independent eligible work items exist, up to a hard cap of 5 lanes.

Each parallel lane must have its own work item, branch, worktree, lease, acceptance criteria, validation expectation, and non-overlapping `exclusive_scope`. The orchestrator must give each subagent a self-contained prompt with source references, files in scope, TDD expectations, forbidden actions, and required output.

Subagents may implement and validate their assigned lane only. They must not trigger scheduler runs, update automation schedule fields, publish, deploy, mutate external trackers, or overwrite another lane. The orchestrator reviews each result, runs integration validation, records outcomes, updates dashboard data, and commits coherent completed changes.

If multi-agent support or Superpowers is unavailable, record the blocker or `not_useful` reason and continue with the safest single-item local workflow.

## Visual Project Dashboard
Every setup and run must maintain:

- `docs/<PROJECT_SLUG>/dashboard-data.json`: normalized machine-readable status from state, scheduled work plan, progress, backoff, leases, validation, blockers, commits, and next actions.
- `docs/<PROJECT_SLUG>/dashboard.html`: a self-contained local dashboard that renders roadmap status, current sprint lanes, blocked work, validation/commit evidence, and what is next.

The dashboard must use real workflow data only. Do not hand-write decorative status that cannot be traced back to state, progress, scheduled work, validation, or git evidence.

## Review Consolidation
If this repo uses a `review` queue or equivalent pending-review state, treat it as not done. Re-run the relevant checks, record fresh validation evidence, and only then move the work to `done`. If validation is missing, stale, or partial, leave the item in review and name the missing check.

## Local-Only Operator Inputs
If a task requires a private file, credential, local service, or other operator-owned input:

- require an ignored local path or environment-only configuration
- prove the input is not tracked before consuming it
- record bounded metadata and pass/fail labels only
- never quote, summarize, commit, or export the private content
- keep the task blocked with the exact missing condition when the input is unavailable

## Weekly Schedule And Completion Trigger
Use a weekly cron automation as the persisted schedule anchor, not a minute-interval automation. The default RRULE is weekly with all seven days selected at the chosen wall-clock hour, matching Codex's weekly schedule representation.

The automation should keep itself moving by triggering the next scheduler-visible run when a run completes:

- Before triggering, inspect the automation row/config for the same automation id.
- If status is `ACTIVE`, request a run-now trigger for the same automation.
- If app-native run-now tooling is unavailable, use the `writing-automation` run-now path: back up the scheduler DB, set only `automations.next_run_at` to now or a few seconds ahead, preserve `status`, `rrule`, `prompt`, `cwds`, model, and reasoning fields, then verify a new automation run or thread appears.
- If status is `PAUSED` or otherwise inactive, do not advance `next_run_at`; record that the next trigger was skipped because the automation is paused.
- Never spawn a worker/subagent or write a local artifact as a substitute for a scheduler-visible trigger.
- Preserve the weekly RRULE after any run-now trigger so the automation can still be manually nudged, paused, or resumed from the scheduler.
- Record trigger result, pause status, scheduler evidence, and any blocker in progress and memory.

Use `docs/<PROJECT_SLUG>/backoff.json` as a historical schedule/trigger ledger until templates are renamed. It records desired trigger behavior and actual scheduler persistence; it is not proof that the app-visible schedule changed.

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
