# Automation Prompt

## Classification
Use a Codex `cron` automation by default. Use `heartbeat` only when the user wants the current thread to wake up later.

## Prompt Design
The automation prompt is task-only and self-contained. Schedule, workspace, model, reasoning effort, and execution environment belong in automation fields.

## Default Prompt Pattern
When writing the real automation prompt, replace the descriptive bracketed phrases below with project-specific values. Do not leave them as placeholders in the final automation.

```text
You are running the autonomous implementation loop for [project name].

Read WORKFLOW.md first and follow it as the operating contract for this run. Treat WORKFLOW.md as read-only unless the user explicitly requested a workflow change. Then read the configured state, progress, backoff, and scheduled work plan files under docs/[project slug]/. Resolve the automation memory path described in WORKFLOW.md, inspect the repository structure, git status, branches, remotes, and worktrees, and run the git write-access preflight before selecting work.

Plan the next phase and execute an adaptive sprint packet of 2 to 5 independent eligible work items when dependency and exclusive-scope rules allow it. The main automation run is the orchestrator: select the packet, claim leases, dispatch one bounded Superpowers subagent per work item, integrate results one at a time, run validation, update state/progress/dashboard artifacts, and commit coherent completed changes. If fewer than 2 independent items are eligible, execute the single eligible item and record why parallelism was not useful. If no eligible queued item exists, inspect the scheduled work plan, PRD/spec sources, and newly discovered source evidence. Create the next bounded work item when source-backed implementation work is clear. If the PRD/specs imply plausible next advances but the user must choose, create 3 to 7 `proposal_backlog` entries with `status: needs_user_review`, update dashboard/progress, and tell the user to review/approve them instead of reporting that all tasks are complete. Red-team your own plan before and after implementation so you do not get tunnel vision around one file or one symptom. Review what may have been left incomplete by the previous phase, then continue eligible incomplete work until it is implemented, verified, documented when needed, committed locally, and reflected in state, progress, and the dashboard.

After completing or blocking the active item, run the planner loop before schedule finalization: reconcile state with repository reality, inspect the scheduled work plan and PRD/spec sources, add the next dependency-safe work item when source-backed work remains, or create a proposal backlog with `needs_user_review` when user selection is required. Record task generation, proposals, or true no-work in progress.

Support cooperative concurrent runs and orchestrated parallel subagents. Generate a unique run_id at startup and use the lease fields in the configured state file. If an in_progress item has a live lease owned by another run_id, do not steal it, overwrite it, or treat it as a global lock. Instead, select the next eligible todo item whose dependencies are done and whose exclusive_scope does not overlap any live leased in_progress item. For parallel packets, dispatch only independent work items with satisfied dependencies and non-overlapping exclusive_scope, with 2 lanes minimum and 5 lanes maximum. Each subagent prompt must include the work item key, files in scope, acceptance criteria, validation commands, TDD expectations, forbidden actions, and required summary. Subagents must not trigger scheduler runs, update automation schedule fields, publish, deploy, mutate external trackers, or overwrite another lane. If no dependency-safe item with non-overlapping exclusive_scope is available, inspect the scheduled work plan before recording no-work.

Use test-driven development for production behavior: write or confirm the failing test first, verify the expected RED state, implement the smallest useful change, then verify GREEN. Run relevant validation before claiming completion. Document skipped checks with reason, risk, and what should be run later.

Install or repair docs/[project slug]/dashboard.html, docs/[project slug]/dashboard.compose.yml, docs/[project slug]/dashboard.env, and docs/[project slug]/dashboard-server/ during setup and upgrade. The dashboard architecture is one shared GUI hub plus many per-project APIs. Keep `LAMBCHOP_DASHBOARD_PORT` as the single hub GUI port unless the user explicitly changes the hub. Choose a free `LAMBCHOP_PROJECT_API_PORT` for this repo, set `LAMBCHOP_PROJECT_API_PUBLIC_URL` to that local API URL, and record both values in dashboard.env, state, and progress. The project API must register itself in the shared Docker volume `lambchop-dashboard-registry`; the hub must show the registered project and subscribe to the selected project's `/api/events` stream. If the hub port is already used by a Lambchop hub, start only this repo's project API and tell the user to open the existing hub. During every automation run, keep state, scheduled work, progress, backoff, validation, leases, blockers, commits, next actions, and dashboard-data.json current so the API can push live status with server-sent events. Do not hand-write decorative status that cannot be traced back to workflow evidence.

Use a weekly cron automation as the persisted schedule anchor. At the end of every run, write automation memory, update progress and the configured schedule/trigger ledger, then trigger the next scheduler-visible run only if this automation is ACTIVE. If status is PAUSED or inactive, do not advance next_run_at; report that pause skipped the trigger. Prefer app-native run-now tooling when exposed. If it is not exposed, use the writing-automation local scheduler DB run-now path: back up the scheduler DB, set only this automation's next_run_at to now or a few seconds ahead, preserve status, rrule, prompt, cwds, model, and reasoning fields, wait briefly, and verify a new automation run or thread. Worker/subagent fallback is forbidden for triggering. Preserve the weekly RRULE after the run-now trigger.

Do not delete or revert user work. Do not publish branches, create pull requests, deploy, use external issue trackers, or modify production configuration unless WORKFLOW.md or the user explicitly asks for that.
```

## Duplicate Check
Before creating an automation, inspect existing automation configs. Update an existing automation when name, prompt topic, workspace, or project slug overlaps substantially.

## Recommended Fields
- `kind`: `cron`
- `status`: `ACTIVE`
- `rrule`: `RRULE:FREQ=WEEKLY;BYHOUR=12;BYMINUTE=0;BYDAY=SU,MO,TU,WE,TH,FR,SA`
- `executionEnvironment`: `local`
- `reasoningEffort`: `high`
- `cwds`: target repo root
