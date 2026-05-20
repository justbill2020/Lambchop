---
name: Lambchop Autonomous Workflow
version: 1
automation:
  cadence: parked weekly cron anchor plus scheduler-visible run-now trigger after each completed active run
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
  dashboard_control_file: docs/lambchop/dashboard-control-requests.json
  hooks_file: .codex/hooks.json
  hooks_dir: .codex/hooks
  shared_capabilities_registry: $CODEX_HOME/lambchop/shared-capabilities.json
  core_upstream_skills_manifest: autonomous-coding-team/references/core-upstream-skills.json
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
  no_progress_pause_threshold: 3
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
6. `.codex/hooks.json` and `.codex/hooks/lambchop_*.py` provide repo-local active-session guardrails when trusted by Codex.
7. `autonomous-coding-team/` contains the skill, references, and templates.
8. Repository files and validation results are the source of truth for implemented behavior.

If these sources disagree, preserve explicit user intent first, then implemented passing behavior, then safety and data integrity. Update state/progress to match reality and record the reconciliation.

## Instruction Strength Glossary

Use instruction words consistently:

- `Must`, `need`, and `required` mean mandatory. If the run cannot comply, record the blocker and do not silently skip it.
- `Must not` and `forbidden` mean prohibited unless Bill explicitly changes the safety policy.
- `Should` means expected default. Follow it unless repo evidence shows a safer or more accurate path, then record the reason.
- `Could` and `may` mean allowed option, not required work.
- `Would` is explanatory or conditional and is not a command by itself.

When instructions conflict, follow explicit user intent first, then safety, then verified behavior, then convenience.

## Operational Glossary

- `scheduler-visible run-now trigger`: an app-native trigger or verified scheduler database update that causes the same Codex automation to run again while preserving or repairing its parked weekly RRULE.
- `parked weekly anchor`: the persisted cron RRULE set to the previous calendar day at noon in the operator's timezone. For example, on Thursday the anchor must be weekly Wednesday at 12:00. This keeps a valid weekly schedule for pause/resume/manual visibility without a same-day normal schedule colliding with active automation work.
- `main automation run`: the orchestrator that selects work, owns scheduler updates, integrates lane results, validates, updates ledgers/dashboard data, and commits coherent completed changes.
- `parallel lane`: one bounded work item assigned to a local worker or subagent with its own branch, worktree, lease, validation, and non-overlapping `exclusive_scope`.
- `exclusive_scope`: files, folders, or behavior a lane owns exclusively; overlapping live exclusive scopes block unsafe parallel dispatch.
- `shared_scope`: coordination files that may be touched by multiple lanes only when the orchestrator reconciles conflicts and records the integration risk.
- `project chat intake`: a normal interactive Codex chat in this repository where Bill reports a feature request, bug, regression, rough need, or "this is broken" style issue outside a scheduled automation run.
- `proposal_backlog`: candidate next work with `needs_user_review`; proposals are visible in the dashboard but are not executable work items until Bill approves or edits them.
- `reactive status stream`: the project API `/api/events` server-sent event stream and hub `/api/project-events` registry stream that publish real state/progress/backoff/dashboard changes.
- `dashboard control request`: a structured request queued through the dashboard hub/project API for the automation to execute later. Dashboard APIs may queue known commands such as `lambchop-update` or `dashboard-refresh`; they must not directly mutate arbitrary repo files or run shell commands.
- `repo-local hooks`: Codex lifecycle hooks installed under `.codex/` for active-session context, safety guardrails, evidence reminders, and completion checks. They improve automation and chat quality but do not replace the unattended cron automation.
- `shared capabilities`: first-run shared resources installed once into the Codex environment and reused by every Lambchop-managed repo. This includes the dashboard hub, Superpowers, Huashu Design, and future core upstream skills.
- `Lambchop source commit`: the git commit of the Lambchop skill/templates used during setup or in-place upgrade. Target repos must record it so later check-ins can compare the saved commit with the current Lambchop source and repair stale deployments.

## Allowed Actions
Automation may inspect the repo, create worktrees, create local `codex/lambchop-{work_item_key}` branches, edit skill/docs/templates for the active item, run validation commands, commit locally, and update state/progress/schedule ledgers.

## Forbidden Actions
Automation must not publish branches unless `docs/lambchop/state.json` explicitly sets `project.autonomy_policy.may_push=true` and Bill requested publishing for the current run. Automation must not open pull requests, deploy, modify production configuration, use external trackers, delete or revert user work, do implementation work directly in the main checkout after setup, overwrite another live lease, or mark work done without validation evidence.

## Project Chat Intake
When Bill reports a new need, feature request, bug, regression, vague problem, or "this is broken" issue in an ordinary project chat, that chat session must act as an intake agent, not an implementation agent.

Any chat context that is not a fresh scheduled automation run must behave as intake/planning-only unless Bill explicitly overrides the execution mode for that chat.

The intake chat may investigate enough to produce a useful task. It may inspect relevant files, run safe read-only or diagnostic checks, reproduce the issue when practical, identify likely ownership, and update workflow ledgers. It must not edit production code, implement the feature, fix the bug, refactor nearby code, or mark the work done. If documentation-only clarification is required to make the task understandable, keep it limited to the work item/progress/dashboard ledgers.

The intake chat must create a brief task-creation plan, then create or update one or more bounded work items in `docs/lambchop/state.json` with source references, acceptance criteria, implementation notes, validation expectations, exclusive scope, shared scope, blockers if any, and a clear `next_step`. It must append an intake entry to `docs/lambchop/progress.md`, refresh `docs/lambchop/dashboard-data.json` when applicable, and set status to `todo` unless the item is blocked by a missing decision or unavailable local input.

After intake, the chat must hand off to the automation instead of stopping at a plan. It must verify the parked weekly anchor, unpause the project automation when it is paused or record that it was already active, trigger a scheduler-visible run-now for the same automation, and record the queued task, automation status, trigger result, and dashboard/progress/backoff evidence. The actual implementation must wait for the recurring coding automation or an explicit user instruction that overrides this intake-only rule for the current chat.

## Repo-Local Codex Hooks
When Codex project hooks are available and trusted, Lambchop must install or repair `.codex/hooks.json` and `.codex/hooks/lambchop_*.py` during setup and in-place upgrades. Hook installation must use merge-namespaced behavior: preserve unrelated existing hook handlers, remove stale Lambchop-owned handlers identified by `lambchop_` commands, then append the current Lambchop hook groups.

Hooks are an active-session quality layer. They load Lambchop context on session start, reinforce intake behavior for user prompts, block clearly forbidden local actions before supported tool calls, remind Codex to record evidence after risky or failed tool calls, and continue a turn when required Lambchop completion evidence is missing. For feature/bug chats, the hooks must steer the agent away from implementation in the chat and toward task creation, automation unpause or active-status evidence, and scheduler-visible run-now handoff. For GitHub repos where push is explicitly enabled or requested, the Stop hook must require commit and push evidence before completion; it must not blindly publish when workflow safety still forbids pushing. Hooks are not a complete enforcement boundary and they do not replace the parked weekly cron automation or scheduler-visible completion trigger.

If project hooks are unavailable, untrusted, or blocked by malformed existing hook config, record `hooks.status` as `unavailable` or `blocked` in state, progress, and dashboard data. Continue with the automation-only contract and make hook repair a visible next action.

## Shared Capabilities And Upstream Skills
Lambchop uses the same first-to-run, install-once pattern for shared skills that it uses for the dashboard hub. During setup, in-place upgrade, and automation maintenance, run or follow `autonomous-coding-team/tools/install-upstream-skills.ps1` with `autonomous-coding-team/references/core-upstream-skills.json`. Check the Codex shared skills root first; install only missing required skills; when a skill is already installed, record it as available instead of replacing it.

Required shared upstream skills are:

- Superpowers for planning, TDD, debugging, subagent dispatch, review, and verification workflows.
- Huashu Design for dashboard GUI, app UI, prototype, mockup, visual direction, motion, infographic, slide, and design critique work.

The bootstrapper records source commits in `$CODEX_HOME/lambchop/shared-capabilities.json`. If a later setup or upgrade finds that an upstream skill's saved `installed_commit` differs from the latest checked commit, record `update_available` and update only during an explicit setup/upgrade/maintenance path, not opportunistically mid-task.

Every Lambchop-managed repo must also record the Lambchop source commit used for setup or upgrade in its state/dashboard/progress evidence. Repo-local hooks and upgrade runs must check this saved commit against the current Lambchop source. If the target repo is behind, queue or perform the normal in-place Lambchop upgrade: repair workflow files, dashboard artifacts, hooks, shared-capability status, and automation prompt while preserving project history and unrelated local hooks.

For user-facing interface work, load Huashu Design before changing the dashboard or app UI. Use it as the design/prototype/critique layer, then implement the selected direction in the project code or Lambchop dashboard template.

For coding work, load and follow the `tdd` skill. Lambchop and every Lambchop-managed repo must use one public-behavior test first, verify the expected failing result, make the minimal implementation needed to pass, repeat for the next behavior, and refactor while green. If a task cannot be tested first, record the reason, risk, and replacement validation evidence before implementation.

## Run Loop
This is a two-phase loop: planning/scheduling and execution are separate automation turns.

Every automation run must:

1. Generate a unique `run_id`.
2. Read this workflow plus state, progress, backoff, and scheduled work plan ledgers.
3. Resolve automation memory.
4. Inspect repository structure, git status, branches, remotes, and worktrees.
5. Inspect repo-local hook status and shared-capability status; repair Lambchop-owned hooks and check the saved Lambchop source commit during setup or in-place upgrade work.
6. Run git write-access preflight before selecting work.
7. Reconcile state/progress with repository reality.
8. Build an adaptive sprint packet of 2 to 5 independent eligible work items when possible, using dependency and lease rules plus non-overlapping `exclusive_scope`. If fewer than 2 independent items are available, select one eligible item and record why parallelism was not useful.
9. Recheck blocked work and consolidate any review-ready work only after fresh validation evidence.
10. Claim the selected item or sprint packet with leases.
11. Work in `.worktrees/{work_item_key}` on `codex/lambchop-{work_item_key}`.
12. When a sprint packet has 2 or more independent items and subagents are available, the main automation run orchestrates bounded parallel subagents. It dispatches one self-contained task per work item, requires Superpowers `dispatching-parallel-agents`, TDD, and verification guidance, and keeps ownership of integration, state, progress, dashboard regeneration, commits, and scheduler finalization.
13. Use the `tdd` skill for production behavior and skill behavior: write or identify one public-behavior test first, verify RED, make the minimal implementation needed for GREEN, repeat, then refactor while green.
14. Integrate subagent results one at a time, reconcile shared-scope risks, and mark each lane as completed, blocked, conflicted, failed_validation, or not_useful.
15. Run relevant validation.
16. Commit coherent completed changes locally with validation details.
17. After completing or blocking the active item or sprint packet, run the planner loop: reconcile state, inspect the scheduled work plan and PRD/spec sources, add the next bounded source-backed work item when work remains, or create a proposal backlog that needs user review. If the planner loop creates runnable new work items, schedule them, record the evidence, and stop; do not implement newly created tasks in the same run.
18. Keep the live dashboard inputs current by updating state, progress, backoff, scheduled work, and `docs/lambchop/dashboard-data.json`; the Dockerized project API reads those files and pushes reactive updates while it is running.
19. Update state, progress, shared-capability evidence, and the schedule/trigger ledger.
20. Apply the no-progress pause guard before any completion trigger: update the consecutive no-progress counter, pause the automation when the threshold is reached, and skip run-now when the guard pauses or recommends pausing.
21. Apply the completion trigger protocol: if the automation is ACTIVE and the no-progress guard did not pause or block triggering, request a scheduler-visible run-now trigger for the same automation; if it is PAUSED or inactive, skip the trigger and record that pause prevented the next run.

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
- `docs/lambchop/dashboard-control-requests.json`: optional queued dashboard commands written by the project API. The automation consumes these requests and performs the actual update/refresh work with normal validation, commits, and evidence.

The dashboard must use real workflow data only. Do not hand-write decorative status that cannot be traced back to state, progress, scheduled work, validation, or git evidence. Use the Dockerized status server instead of opening the HTML with `file://`. When installing or repairing Lambchop, keep one shared hub GUI port and choose a free per-project API port. Write `LAMBCHOP_PROJECT_API_PORT` and `LAMBCHOP_PROJECT_API_PUBLIC_URL` to `dashboard.env`, then verify the project appears in the hub registry. If the hub port is already occupied by a Lambchop hub, start only the project API for the current repo and tell the user to open the existing hub.

Project registration must be stable. The registry must keep stale projects visible with a stale/healthy marker instead of dropping them from the picker, and project API registration writes must be atomic so the hub never sees a zero-byte registration as a disappearance. The project API may expose `POST /api/dashboard-command` to queue allowed commands into `dashboard-control-requests.json`; the hub may forward `POST /api/project-command/<slug>` to the selected project API. The dashboard server queues requests only. The automation performs Lambchop updates, dashboard refreshes, validation, commits, and run-now handoff.

## Weekly Schedule And Completion Trigger
Use a parked weekly cron automation as the persisted schedule anchor, not a minute-interval automation. Before any automation update or scheduler-visible run-now trigger, compute yesterday in the operator's timezone and persist the automation RRULE as weekly on that weekday at 12:00. For example, on Thursday, May 14, 2026, set the anchor to Wednesday at noon: `RRULE:FREQ=WEEKLY;BYHOUR=12;BYMINUTE=0;BYDAY=WE`. A future normal run about one week out is expected; the safety goal is to avoid a same-day normal schedule colliding with currently running automations.

## Automation Maintenance Pause Protocol
Before any chat, automation run, or repair session edits this workflow, updates the automation prompt, changes automation schedule/status fields, or performs other Lambchop automation-maintenance work, it must pause `lambchop-autonomous-coding-team` through Codex app automation tooling first. This creates a quiet maintenance window so the scheduler cannot start another run while the operating contract is being changed. Do not stop or interfere with automation runs that are already in progress; the pause only prevents additional scheduler starts during maintenance.

During the maintenance window, make the requested workflow or automation updates, update state/progress/backoff/dashboard evidence, and verify the parked weekly anchor. When the maintenance work is complete, unpause the automation unless Bill explicitly asked to leave it paused or validation found a blocker that would make unpausing unsafe. After unpausing from maintenance, do not trigger run-now unless Bill explicitly asks to start another automation run.

Record all three facts in progress, backoff, dashboard data, and automation memory: pause result before maintenance, parked-anchor RRULE/scheduler evidence, and final unpause or leave-paused reason.

The automation should keep itself moving by triggering the next scheduler-visible run when a run completes:

- Before triggering, inspect the automation row/config for the same automation id.
- Before triggering or editing the automation, verify the parked weekly anchor. If the current RRULE is not weekly on yesterday's weekday at 12:00, update it through Codex app automation tooling while preserving status, prompt, `cwds`, model, reasoning, and execution environment.
- If status is `ACTIVE`, request a run-now trigger for the same automation.
- If app-native run-now tooling is unavailable, use the `writing-automation` run-now path: back up the scheduler DB, set `automations.next_run_at` to now or a few seconds ahead, set the normal RRULE to yesterday-at-noon weekly if it is stale, preserve `status`, `prompt`, `cwds`, model, and reasoning fields, then verify a new automation run or thread appears.
- If status is `PAUSED` or otherwise inactive, do not advance `next_run_at`; record that the next trigger was skipped because the automation is paused.
- Never spawn a worker/subagent or write a local artifact as a substitute for a scheduler-visible trigger.
- After any run-now trigger, verify the parked weekly anchor still points to yesterday's weekday at noon. Do not leave a daily, all-days, today, or tomorrow scheduled anchor behind.
- Record trigger result, pause status, parked-anchor RRULE, scheduler evidence, and any blocker in progress and memory.

Use `docs/lambchop/backoff.json` as a historical schedule/trigger ledger until templates are renamed. It records desired trigger behavior and actual scheduler persistence; it is not proof that the app-visible schedule changed.

## No-Progress Pause Guard

The automation must pause itself after 3 consecutive runs that accomplish no real work. This guard runs before the completion trigger and takes precedence over continuing the loop.

Real work means at least one of these happened and was recorded in state, progress, and dashboard data:

- a work item was completed with validation evidence
- a blocked or review item changed state because fresh evidence cleared or advanced it
- a new source-backed work item was created from the scheduled work plan or repo evidence
- a proposal backlog was newly created or materially refreshed with actionable choices for the user
- a scheduler/tooling repair changed app-visible automation behavior

No-progress runs include repeated reports of the same blocker, inability to claim or work any eligible item, validation/tooling failures that leave the same next step, skipped triggers caused by missing automation tooling, and true no-work findings that only restate previously recorded evidence.

For every run, update `docs/lambchop/backoff.json` with:

- `last_work_found`: whether real work was accomplished
- `consecutive_no_progress_runs`: reset to `0` after real work, otherwise increment by `1`
- `last_no_progress_reason`: the exact blocker or no-op reason when no real work happened
- `pause_recommended`: `true` once the counter reaches `3`
- `pause_after_consecutive_no_progress_runs`: `3`

When `consecutive_no_progress_runs >= 3`, attempt to pause this automation through Codex app automation tooling by setting status to `PAUSED` while preserving or repairing the parked weekly anchor and all unrelated fields. If the pause succeeds, record the app-visible paused status in progress, backoff, dashboard data, and memory. If pause persistence is unavailable or fails, do not trigger run-now; record that pause persistence is blocked, leave the parked weekly anchor unchanged unless it was safely repaired through automation tooling, and tell the user manual scheduler repair is needed.

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
