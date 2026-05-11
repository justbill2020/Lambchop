---
name: Lambchop Autonomous Workflow
version: 1
automation:
  cadence: weekly cron anchor plus scheduler-visible run-now trigger after each completed active run
  external_issue_tracking: false
  specs_source: autonomous-coding-team/
  workflow_file: WORKFLOW.md
  state_file: docs/lambchop/state.json
  progress_file: docs/lambchop/progress.md
  backoff_file: docs/lambchop/backoff.json
  scheduled_work_plan_file: docs/lambchop/scheduled-work-plan.md
  dashboard_data_file: docs/lambchop/dashboard-data.json
  dashboard_file: docs/lambchop/dashboard.html
  dashboard_compose_file: docs/lambchop/dashboard.compose.yml
  dashboard_env_file: docs/lambchop/dashboard.env
  dashboard_server_dir: docs/lambchop/dashboard-server
  dashboard_hub_port: 8765
  project_api_default_port: 8766
  memory_file_primary: $CODEX_HOME/automations/lambchop-autonomous-coding-team/memory.md
  memory_file_fallback_windows: %USERPROFILE%\.codex\automations\lambchop-autonomous-coding-team\memory.md
  memory_file_fallback_unix: ~/.codex/automations/lambchop-autonomous-coding-team/memory.md
  worktree_root: .worktrees
  branch_prefix: codex/
  branch_name_template: codex/lambchop-{work_item_key}
  concurrency_mode: cooperative
  max_concurrent_runs: 5
  parallel_execution:
    mode: adaptive-subagents
    min_subagents: 2
    max_subagents: 5
    orchestrator: main-automation-run
  lease_minutes: 120
  integration_branch: main
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
4. `docs/lambchop/scheduled-work-plan.md` defines how future tasks are planned when the queue is empty.
5. `docs/lambchop/dashboard-data.json`, `docs/lambchop/dashboard.html`, `docs/lambchop/dashboard.compose.yml`, `docs/lambchop/dashboard.env`, and `docs/lambchop/dashboard-server/` provide the current visual operating picture.
6. `autonomous-coding-team/` contains the skill, references, and templates.
7. Repository files and validation results are the source of truth for implemented behavior.

If these sources disagree, preserve explicit user intent first, then implemented passing behavior, then safety and data integrity. Update state/progress to match reality and record the reconciliation.

## Instruction Strength Glossary

Use instruction words consistently:

- `Must`, `need`, and `required` mean mandatory. If the run cannot comply, record the blocker and do not silently skip it.
- `Must not` and `forbidden` mean prohibited unless Bill explicitly changes the safety policy.
- `Should` means expected default. Follow it unless repo evidence shows a safer or more accurate path, then record the reason.
- `Could` and `may` mean allowed option, not required work.
- `Would` is explanatory or conditional and is not a command by itself.

When instructions conflict, follow explicit user intent first, then safety, then verified behavior, then convenience.

## Allowed Actions
Automation may inspect the repo, create worktrees, create local `codex/lambchop-{work_item_key}` branches, edit skill/docs/templates for the active item, run validation commands, commit locally, and update state/progress/schedule ledgers.

## Forbidden Actions
Automation must not publish branches, open pull requests, deploy, modify production configuration, use external trackers, delete or revert user work, do implementation work directly in the main checkout after setup, overwrite another live lease, or mark work done without validation evidence.

## Run Loop
Every automation run must:

1. Generate a unique `run_id`.
2. Read this workflow plus state, progress, backoff, and scheduled work plan ledgers.
3. Resolve automation memory.
4. Inspect repository structure, git status, branches, remotes, and worktrees.
5. Run git write-access preflight before selecting work.
6. Reconcile state/progress with repository reality.
7. Build an adaptive sprint packet of 2 to 5 independent eligible work items when possible, using dependency and lease rules plus non-overlapping `exclusive_scope`. If fewer than 2 independent items are available, select one eligible item and record why parallelism was not useful.
8. Recheck blocked work and consolidate any review-ready work only after fresh validation evidence.
9. Claim it with a lease.
10. Work in `.worktrees/{work_item_key}` on `codex/lambchop-{work_item_key}`.
11. When a sprint packet has 2 or more independent items and subagents are available, the main automation run orchestrates bounded parallel subagents. It dispatches one self-contained task per work item, requires Superpowers `dispatching-parallel-agents`, TDD, and verification guidance, and keeps ownership of integration, state, progress, dashboard regeneration, commits, and scheduler finalization.
12. Use TDD-style proof for skill behavior: write or identify a pressure scenario first, then update the skill/templates, then validate that the scenario is addressed.
13. Integrate subagent results one at a time, reconcile shared-scope risks, and mark each lane as completed, blocked, conflicted, failed_validation, or not_useful.
14. Run relevant validation.
15. Commit coherent completed changes locally with validation details.
16. After completing or blocking the active item or sprint packet, run the planner loop: reconcile state, inspect the scheduled work plan and PRD/spec sources, add the next bounded source-backed work item when work remains, or create a proposal backlog that needs user review.
17. Keep the live dashboard inputs current by updating state, progress, backoff, scheduled work, and `docs/lambchop/dashboard-data.json`; the Dockerized project API reads those files and pushes reactive updates while it is running.
18. Update state, progress, and the schedule/trigger ledger.
19. Apply the completion trigger protocol: if the automation is ACTIVE, request a scheduler-visible run-now trigger for the same automation; if it is PAUSED or inactive, skip the trigger and record that pause prevented the next run.

## Work Item Statuses
Use only `todo`, `in_progress`, `blocked`, `done`, and `skipped`.

## Cooperative Concurrency
A live `in_progress` item is not a global lock. Another run or orchestrated subagent lane may select a different `todo` item only when dependencies are done, its `exclusive_scope` does not overlap any live leased item, and fewer than 5 live leases exist. Shared docs or root coordination files may appear in `shared_scope`; overlap there is an integration risk, not an automatic blocker.

Default lease duration is 120 minutes.

## Parallel Sprint Orchestration
The main automation run is the orchestrator. It must prefer a parallel sprint packet whenever at least 2 independent eligible work items exist, up to a hard cap of 5 lanes.

Each parallel lane must have its own work item, branch, worktree, lease, acceptance criteria, validation expectation, and non-overlapping `exclusive_scope`. The orchestrator must give each subagent a self-contained prompt with source references, files in scope, TDD expectations, forbidden actions, and required output.

Subagents may implement and validate their assigned lane only. They must not trigger scheduler runs, update automation schedule fields, publish, deploy, mutate external trackers, or overwrite another lane. The orchestrator reviews each result, runs integration validation, records outcomes, updates dashboard data, and commits coherent completed changes.

If multi-agent support or Superpowers is unavailable, record the blocker or `not_useful` reason and continue with the safest single-item local workflow.

## Visual Project Dashboard
Every setup and run must maintain:

- `docs/lambchop/dashboard-data.json`: normalized machine-readable status from state, scheduled work plan, progress, backoff, leases, validation, blockers, commits, and next actions.
- `docs/lambchop/dashboard.html`: the single hub browser UI. It subscribes to the hub project registry with `/api/project-events`, then subscribes to the selected project API with `/api/events`.
- `docs/lambchop/dashboard.compose.yml`, `docs/lambchop/dashboard.env`, and `docs/lambchop/dashboard-server/`: Dockerized local services. `lambchop-dashboard-hub` owns the one GUI port, default `8765`. `lambchop-project-api` owns the per-project API port, default `8766`, and registers itself in the shared Docker volume `lambchop-dashboard-registry`.

The dashboard must use real workflow data only. Do not hand-write decorative status that cannot be traced back to state, progress, scheduled work, validation, or git evidence. Use the Dockerized status server instead of opening the HTML with `file://`. When installing or repairing Lambchop, keep one shared hub GUI port and choose a free per-project API port. Write `LAMBCHOP_PROJECT_API_PORT` and `LAMBCHOP_PROJECT_API_PUBLIC_URL` to `dashboard.env`, then verify the project appears in the hub registry. If the hub port is already occupied by a Lambchop hub, start only the project API for the current repo and tell the user to open the existing hub.

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

Use `docs/lambchop/backoff.json` as a historical schedule/trigger ledger until templates are renamed. It records desired trigger behavior and actual scheduler persistence; it is not proof that the app-visible schedule changed.

## Scheduled Work Planning
Use `docs/lambchop/scheduled-work-plan.md` as the roadmap and task-generation source.

Before declaring no-work, inspect the scheduled work plan, PRD/spec sources, skill files, validation gaps, and current source files. If source-backed work remains, create the next bounded work item in `docs/lambchop/state.json` with dependencies, acceptance criteria, source references, validation expectations, exclusive scope, shared scope, and next step.

If no ready task can be created safely but the PRD/specs/repo evidence suggest possible next product advances, do not report that all tasks are complete as the final status. Create or refresh `proposal_backlog` in state with 3 to 7 candidate next feature sets or advancement sprints. Each proposal must include `key`, `title`, `status: "needs_user_review"`, `rationale`, `source_refs`, `suggested_acceptance_criteria`, `risk_notes`, and `parallelization_notes`. Set `last_run.next_action` to tell the user that proposed next work needs review/approval, update dashboard data, and append the proposal summary to progress. Only convert a proposal into `work_items` after the user approves or edits it.

Only record true no-work when no source-backed task can be created and no meaningful PRD/spec-backed proposal can be made. The true no-work entry must list the sources inspected and the exact missing source of truth.

## Field-Tested Patterns
Lambchop should preserve reusable lessons from target projects without project-specific names or private content:

- blocked tasks stay visible to context, validation, and no-work reasoning
- review consolidation requires fresh evidence before marking done
- private local inputs require ignored paths or environment-only configuration and bounded public logs
- milestone packets are allowed only with distinct ownership, explicit shared scope, and combined validation

## Definition Of Done
A work item is done only when acceptance criteria are satisfied, validation evidence is recorded, state and progress agree, code/docs changes are locally committed when appropriate, and the next step is clear.

## Automation Prompt
The Codex cron automation should tell Codex to read `WORKFLOW.md` first and follow it as the operating contract. Schedule, workspace, model, reasoning effort, and execution environment belong in automation fields.
