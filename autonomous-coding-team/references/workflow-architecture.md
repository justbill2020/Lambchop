# Workflow Architecture

## Generated Files
Every configured repo should contain:

- `WORKFLOW.md`: project-specific operating contract
- the generated state file under `docs/`: machine-readable queue and run state
- the generated progress file under `docs/`: human-readable proof log
- the generated backoff file under `docs/`: historical schedule/trigger ledger
- the generated scheduled work plan under `docs/`: roadmap and task-generation source
- the generated dashboard data, HTML, compose/env files, and server files under `docs/`: live visual operating picture
- `.codex/hooks.json` and `.codex/hooks/lambchop_*.py`: repo-local Codex hooks for active-session quality guardrails
- `.codex/environments/environment.toml`: optional local environment config when useful

## Operating Contract
`WORKFLOW.md` must be explicit enough for a future Codex run to continue without chat history. It defines:

- project identity, purpose, milestone, and sources of truth
- workflow/state/progress/backoff paths
- scheduled work plan path and planner rules
- automation memory paths
- allowed and forbidden actions
- project chat execution rules for diagnosing user-reported needs or breakages, implementing bounded work directly when safe, and deferring only when the work should continue in automation
- run loop and git preflight
- worktree and branch conventions
- work item schema and statuses
- adaptive 2-5 parallel subagent orchestration policy
- dashboard data and local visual dashboard paths
- repo-local hook paths, trust/fallback policy, and merge-namespaced upgrade behavior
- shared capability bootstrap status for Superpowers, Huashu Design, and future core upstream skills
- Lambchop source commit tracking for in-place upgrade checks
- cooperative lease rules
- review consolidation and blocked-work recheck rules
- local-only operator input rules for ignored private files, credentials, or fixtures
- parked weekly schedule anchor, no-progress pause guard, completion trigger, and pause-skip rules
- automation-maintenance pause/update/unpause rules for workflow, prompt, schedule, and status changes, including no run-now after maintenance unpause unless the user asks
- TDD, verification, commit, blocker, and reconciliation rules

## Run Loop
Every automation run:

1. Read `WORKFLOW.md` first.
2. Read state, progress, and backoff ledgers.
3. Resolve automation memory.
4. Inspect repo structure, git status, branches, remotes, worktrees, repo-local hook status, shared capability status, and saved Lambchop source commit.
5. Run git write-access preflight before selecting work.
6. Reconcile state/progress with repository reality.
7. Recheck blocked items whose next step is testable in the current environment.
8. Consolidate review items only after fresh validation evidence.
9. Build an adaptive sprint packet of 2 to 5 independent eligible work items when possible, create the next source-backed item from the scheduled work plan, or generate proposal backlog entries for user review when PRD/spec evidence suggests possible next advances.
10. Enforce a two-phase loop: if the run creates runnable new work items during planning, record the scheduling evidence and stop; do not implement newly created tasks in the same automation turn.
11. Claim each selected item with a lease.
12. Work in isolated worktrees and local branches.
13. Dispatch bounded Superpowers subagents for independent parallel lanes when available; otherwise record why parallelism was not useful and work the single eligible item.
14. Use the `tdd` skill for production behavior: one public-behavior test first, minimal implementation to green, repeat, then refactor while green.
15. Integrate subagent results one at a time, resolve shared-scope risks, and run relevant checks.
16. Commit coherent completed changes locally.
17. After completion, plan or select the next item before schedule finalization; if the queue is exhausted, create PRD/spec-backed proposals with `needs_user_review` instead of merely reporting all tasks complete.
18. Keep dashboard data current from real workflow evidence so the Dockerized dashboard server shows live status.
19. Update state, progress, shared capability evidence, schedule/trigger ledger, and automation memory.
20. Apply the no-progress pause guard before triggering: reset the counter after real work, increment it after no-progress, and pause the automation after 3 consecutive no-progress runs.
21. If the automation is ACTIVE and the no-progress guard did not pause or block triggering, first repair the parked weekly anchor to yesterday's weekday at noon, then trigger the next scheduler-visible run; if PAUSED or inactive, skip the trigger and record why.
22. Stop safely if blocked.

## Project Chat Execution
Interactive project chats may diagnose, plan, and implement directly when the work is bounded enough to leave validated source-of-truth evidence in the same turn.

A project chat may inspect files, run diagnostic or reproduction checks, identify likely ownership, and either implement the fix directly or defer it. When it implements directly, it still updates progress/dashboard/backoff/state, validates the change, and commits coherent source-of-truth work when appropriate. When it defers instead, it creates or updates bounded work items in the generated state file, appends a progress note, refreshes dashboard data when applicable, then hands off to the project automation: verify the parked weekly anchor, unpause the automation if needed or record that it was already active, trigger a scheduler-visible run-now for the same automation, and record the handoff evidence.

Completion must follow a source-of-truth gate. Validated work on a task branch is not done until the integration branch reflects the change and the state/progress/dashboard/backoff ledgers are reconciled from that canonical branch state. Memory-only notes, dashboard-only movement, or branch-local commits must not reset no-progress guards or advance dashboard next actions by themselves.

## Repo-Local Codex Hooks
When Codex project hooks are available and trusted, setup and in-place upgrades install or repair `.codex/hooks.json` plus `.codex/hooks/lambchop_*.py`. Hooks are Lambchop's active-session quality layer: they add workflow context at session start, reinforce diagnose-first behavior for user prompts, block clearly forbidden local actions before supported tool calls, remind Codex to record evidence after risky or failed tool calls, and continue a turn when required Lambchop completion evidence is missing. For feature/bug chats, hooks must allow bounded direct implementation when the current turn can leave validated source-of-truth evidence, and otherwise require queue + automation-status + scheduler-visible trigger evidence before the chat stops. For GitHub repos where pushing is enabled or explicitly requested, the Stop hook must require commit and push evidence before completion, while still recording a blocker instead of publishing when workflow safety forbids push.

Hook installation uses merge-namespaced behavior. Preserve unrelated existing hook handlers, remove stale Lambchop-owned handlers identified by `lambchop_` commands, then append the current Lambchop hook groups. If hooks are unavailable, untrusted, or malformed, record `hooks.status` as `unavailable` or `blocked` in state/progress/dashboard data and continue with the automation-only contract.

Hooks do not replace the recurring Codex cron automation. They are guardrails and context injectors for active Codex sessions; the parked weekly anchor plus scheduler-visible completion trigger remains the unattended execution path.

## Shared Capabilities And Source Check-In
Shared capabilities are installed once and reused across Lambchop-managed repos. Use `tools/install-upstream-skills.ps1` with `references/core-upstream-skills.json` during setup and in-place upgrade to check or install Superpowers and Huashu Design. The shared registry at `$CODEX_HOME/lambchop/shared-capabilities.json` stores `installed_commit`, `latest_commit`, status, and blockers.

Huashu Design is the required design/prototype/critique skill for dashboard GUI, app UI, mockup, visual direction, motion, infographic, and slide work. Superpowers remains the required workflow skill family for planning, TDD, debugging, review, verification, and subagent coordination. If either skill is unavailable, record the limitation and continue with the safest embedded Lambchop workflow.

Every target repo must record the Lambchop source commit used for setup or upgrade. Hooks and automation check-ins compare the saved commit with the current Lambchop source commit. If the repo is behind, run the normal in-place upgrade path: preserve workflow history, automation id, project ledgers, unrelated hooks, and dashboard evidence while repairing Lambchop-owned workflow files, hooks, dashboard artifacts, shared capability records, and automation prompt guidance.

## No-Progress Pause Guard

No-progress runs are runs that only repeat an existing blocker, fail to claim or advance eligible work, leave validation/tooling failures unchanged, or restate true no-work without creating new source-backed tasks or actionable proposals. Real work resets the counter only when state, progress, and dashboard evidence show a validated completion, a blocked/review item advanced with fresh evidence, a new source-backed item, a materially refreshed proposal backlog, or an app-visible scheduler repair.

Persist `consecutive_no_progress_runs`, `last_no_progress_reason`, `pause_recommended`, and `pause_after_consecutive_no_progress_runs` in the backoff ledger. When the counter reaches 3, pause the automation through Codex app automation tooling and skip any run-now trigger. If the app-visible pause cannot be persisted, leave the parked weekly anchor untouched unless it was safely repaired through automation tooling, skip run-now anyway, and report manual scheduler repair as the next step.

## Parallel Sprint Orchestration
The main automation run is always the orchestrator. It should prefer parallel execution when 2 or more independent ready work items exist, up to a cap of 5 lanes.

Each lane needs a separate work item, branch, worktree, lease, acceptance criteria, validation expectation, and non-overlapping `exclusive_scope`. The orchestrator creates self-contained subagent prompts, reviews returned changes, runs integration validation, records lane outcomes, commits completed work, and regenerates the dashboard.

If Superpowers or multi-agent support is unavailable, record the blocker or `not_useful` reason and continue with the safest single-item local workflow.

## Visual Dashboard
The dashboard is live, repo-local, reactive, and Dockerized:

- `docs/<project-slug>/dashboard-data.json` contains normalized status from state, scheduled work, progress, backoff, validation, leases, blockers, commits, and next actions.
- `docs/<project-slug>/dashboard.html` is the single hub UI. It renders registered projects, roadmap, active sprint lanes, blocked work, validation/commit evidence, current run, progress tail, and next work.
- `docs/<project-slug>/dashboard.compose.yml`, `docs/<project-slug>/dashboard.env`, and `docs/<project-slug>/dashboard-server/` run Dockerized local services. The hub serves the single GUI and project registry stream. Each repo also runs a project API that mounts its docs folder read-only, serves `/api/status`, streams `/api/events`, and registers itself in the shared Docker volume `lambchop-dashboard-registry`.
- `docs/<project-slug>/dashboard-control-requests.json` is an optional command queue written by the project API and consumed by the automation.

Install or repair the dashboard files during setup and upgrade. Use only one GUI port for the hub, default `8765`. Choose a free per-project API port, defaulting to `8766` only when unused, and record it in `dashboard.env`, state, and progress. During every automation run, update the ledgers frequently enough for the project API to push current run progress with server-sent events. The dashboard is not a substitute for state/progress; it is a live visual projection of those sources.

Project registration must not flicker. Registration writes are atomic, the hub ignores partial JSON files, and stale projects remain visible with `health: "stale"` instead of disappearing. This avoids confusing status churn when a project API is slow, idle, or briefly reconnecting.

The dashboard API is a control plane, not an executor. The hub may forward `POST /api/project-command/<slug>` to a project API, and the project API may queue allowed commands through `POST /api/dashboard-command`. Allowed v1 commands are `lambchop-update` and `dashboard-refresh`. The server writes structured queue entries only; automation performs updates, validation, commits, and scheduler handoff.

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
- using non-GitHub external trackers
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
