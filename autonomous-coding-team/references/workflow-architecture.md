# Workflow Architecture

## Generated Files
Every configured repo should contain:

- `WORKFLOW.md`: project-specific operating contract
- the generated state file under `docs/`: machine-readable queue and run state
- the generated progress file under `docs/`: human-readable proof log
- the generated backoff file under `docs/`: historical schedule/trigger ledger
- the generated scheduled work plan under `docs/`: roadmap and task-generation source
- the generated dashboard data, HTML, compose/env files, and server files under `docs/`: live visual operating picture
- `.codex/environments/environment.toml`: optional local environment config when useful

## Operating Contract
`WORKFLOW.md` must be explicit enough for a future Codex run to continue without chat history. It defines:

- project identity, purpose, milestone, and sources of truth
- workflow/state/progress/backoff paths
- scheduled work plan path and planner rules
- automation memory paths
- allowed and forbidden actions
- project chat intake rules for turning user-reported needs or breakages into queued work without implementing them in the chat session
- run loop and git preflight
- worktree and branch conventions
- work item schema and statuses
- adaptive 2-5 parallel subagent orchestration policy
- dashboard data and local visual dashboard paths
- cooperative lease rules
- review consolidation and blocked-work recheck rules
- local-only operator input rules for ignored private files, credentials, or fixtures
- weekly schedule anchor, no-progress pause guard, completion trigger, and pause-skip rules
- TDD, verification, commit, blocker, and reconciliation rules

## Run Loop
Every automation run:

1. Read `WORKFLOW.md` first.
2. Read state, progress, and backoff ledgers.
3. Resolve automation memory.
4. Inspect repo structure, git status, branches, remotes, and worktrees.
5. Run git write-access preflight before selecting work.
6. Reconcile state/progress with repository reality.
7. Recheck blocked items whose next step is testable in the current environment.
8. Consolidate review items only after fresh validation evidence.
9. Build an adaptive sprint packet of 2 to 5 independent eligible work items when possible, create the next source-backed item from the scheduled work plan, or generate proposal backlog entries for user review when PRD/spec evidence suggests possible next advances.
10. Claim each selected item with a lease.
11. Work in isolated worktrees and local branches.
12. Dispatch bounded Superpowers subagents for independent parallel lanes when available; otherwise record why parallelism was not useful and work the single eligible item.
13. Use TDD for production behavior.
14. Integrate subagent results one at a time, resolve shared-scope risks, and run relevant checks.
15. Commit coherent completed changes locally.
16. After completion, plan or select the next item before schedule finalization; if the queue is exhausted, create PRD/spec-backed proposals with `needs_user_review` instead of merely reporting all tasks complete.
17. Keep dashboard data current from real workflow evidence so the Dockerized dashboard server shows live status.
18. Update state, progress, schedule/trigger ledger, and automation memory.
19. Apply the no-progress pause guard before triggering: reset the counter after real work, increment it after no-progress, and pause the automation after 3 consecutive no-progress runs.
20. If the automation is ACTIVE and the no-progress guard did not pause or block triggering, trigger the next scheduler-visible run while preserving the weekly RRULE; if PAUSED or inactive, skip the trigger and record why.
21. Stop safely if blocked.

## Project Chat Intake
Interactive project chats are intake sessions by default when the user says they need something, reports a bug, or says something is broken. They investigate and document; they do not implement.

An intake chat may inspect files, run diagnostic or reproduction checks, and identify likely ownership. It must then create or update bounded work items in the generated state file, append an intake note to progress, refresh dashboard data when applicable, and leave the item `todo` or `blocked`. Production code changes, bug fixes, feature implementation, refactors, and done-state promotion are reserved for the recurring coding automation unless the user explicitly overrides the intake-only rule for that chat.

## No-Progress Pause Guard

No-progress runs are runs that only repeat an existing blocker, fail to claim or advance eligible work, leave validation/tooling failures unchanged, or restate true no-work without creating new source-backed tasks or actionable proposals. Real work resets the counter only when state, progress, and dashboard evidence show a validated completion, a blocked/review item advanced with fresh evidence, a new source-backed item, a materially refreshed proposal backlog, or an app-visible scheduler repair.

Persist `consecutive_no_progress_runs`, `last_no_progress_reason`, `pause_recommended`, and `pause_after_consecutive_no_progress_runs` in the backoff ledger. When the counter reaches 3, pause the automation through Codex app automation tooling and skip any run-now trigger. If the app-visible pause cannot be persisted, leave the weekly anchor untouched, skip run-now anyway, and report manual scheduler repair as the next step.

## Parallel Sprint Orchestration
The main automation run is always the orchestrator. It should prefer parallel execution when 2 or more independent ready work items exist, up to a cap of 5 lanes.

Each lane needs a separate work item, branch, worktree, lease, acceptance criteria, validation expectation, and non-overlapping `exclusive_scope`. The orchestrator creates self-contained subagent prompts, reviews returned changes, runs integration validation, records lane outcomes, commits completed work, and regenerates the dashboard.

If Superpowers or multi-agent support is unavailable, record the blocker or `not_useful` reason and continue with the safest single-item local workflow.

## Visual Dashboard
The dashboard is live, repo-local, reactive, and Dockerized:

- `docs/<project-slug>/dashboard-data.json` contains normalized status from state, scheduled work, progress, backoff, validation, leases, blockers, commits, and next actions.
- `docs/<project-slug>/dashboard.html` is the single hub UI. It renders registered projects, roadmap, active sprint lanes, blocked work, validation/commit evidence, current run, progress tail, and next work.
- `docs/<project-slug>/dashboard.compose.yml`, `docs/<project-slug>/dashboard.env`, and `docs/<project-slug>/dashboard-server/` run Dockerized local services. The hub serves the single GUI and project registry stream. Each repo also runs a project API that mounts its docs folder read-only, serves `/api/status`, streams `/api/events`, and registers itself in the shared Docker volume `lambchop-dashboard-registry`.

Install or repair the dashboard files during setup and upgrade. Use only one GUI port for the hub, default `8765`. Choose a free per-project API port, defaulting to `8766` only when unused, and record it in `dashboard.env`, state, and progress. During every automation run, update the ledgers frequently enough for the project API to push current run progress with server-sent events. The dashboard is not a substitute for state/progress; it is a live visual projection of those sources.

## Git Preflight
Before claiming work, verify the run can:

- create and delete a temporary branch
- create and remove a temporary worktree under `.worktrees/`
- write the state/progress/backoff files

If preflight fails, record a blocked/no-work run with exact evidence and next steps.

## Forbidden By Default
- publishing branches
- opening PRs
- deploying
- modifying production config
- using external trackers
- deleting or reverting user work
- editing implementation code in the main checkout
- marking work done without validation evidence

## Local-Only Operator Inputs
When a work item depends on a user-owned local file, credential, service endpoint, or fixture:

- require an ignored local path or environment-only configuration
- prove tracked/ignored status before reading the input
- log only bounded metadata, pass/fail labels, and validation outcomes
- never quote, summarize, commit, or export private input content
- keep the item blocked when the required input is missing
## Tool Compatibility
These workflow files are designed to be mostly tool-agnostic, but the automation scheduler and memory conventions are Codex-specific.

- See: [`cursor-claude-compatibility.md`](cursor-claude-compatibility.md)
