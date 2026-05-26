# Target Project Deployment Checklist

Use this checklist when deploying the autonomous coding team workflow into a new target repository (local path or GitHub clone).

## Pressure Scenario (What This Doc Must Cover)
- You have a target repo that should become “self-driving” across recurring Codex runs.
- You must install workflow files safely, validate them, and set up the automation without pushing/PRs/deploys.

## Inputs
- Target repo path (or clone target) and remote identity (if any).
- Project slug used for docs paths (example: `docs/<project-slug>/`).
- Integration branch name (`main` vs `master`) inferred from the repo.
- Automation id and desired cadence (default: parked weekly cron anchor on yesterday at noon plus end-of-run run-now trigger when ACTIVE).

## Discovery (Inspect Before Asking)
- `git status`, current branch, remotes, local branches, and `git worktree list --porcelain`.
- Existing autonomous files:
  - `WORKFLOW.md`
  - `docs/<project-slug>/state.json`
  - `docs/<project-slug>/progress.md`
  - `docs/<project-slug>/backoff.json`
  - `docs/<project-slug>/scheduled-work-plan.md`
  - `docs/<project-slug>/dashboard-data.json`
  - `docs/<project-slug>/dashboard.html`
  - `docs/<project-slug>/dashboard.compose.yml`
  - `docs/<project-slug>/dashboard.env`
  - `docs/<project-slug>/dashboard-server/`
- Stack/tooling markers and how to run checks (examples: `package.json` scripts, `Makefile`, CI config).
- Existing automations (avoid creating duplicates).

## Decisions (Ask Only What Cannot Be Inferred)
- Project purpose and current milestone definition of done.
- Safety boundaries: confirm local-first is the default (no push/PR/deploy/non-GitHub external trackers) unless explicitly enabled; GitHub Issues is the default issue tracker for GitHub-backed repos.
- Any required validation commands beyond what the repo already defines.

## Install / Repair Autonomous Files
- Create or repair `WORKFLOW.md` as the operating contract.
- Create or repair `docs/<project-slug>/state.json` with:
  - work queue
  - lease fields
  - exclusive/shared scopes
  - dependencies and acceptance criteria
- Create or repair:
  - `docs/<project-slug>/progress.md` (append-only proof)
  - `docs/<project-slug>/backoff.json` (historical schedule/trigger ledger)
  - `docs/<project-slug>/scheduled-work-plan.md` (task-generation source)
  - `docs/<project-slug>/dashboard-data.json` (machine-readable visual status)
  - `docs/<project-slug>/dashboard.html` (single hub visual dashboard UI)
  - `docs/<project-slug>/dashboard.compose.yml`, `docs/<project-slug>/dashboard.env`, and `docs/<project-slug>/dashboard-server/` (Dockerized hub/project API services)
- Configure the shared dashboard and per-project API:
  - keep one shared hub GUI port in `LAMBCHOP_DASHBOARD_PORT`, default `8765`
  - choose a free per-project API port in `LAMBCHOP_PROJECT_API_PORT`, default `8766` only if unused
  - set `LAMBCHOP_PROJECT_SLUG`, `LAMBCHOP_PROJECT_NAME`, and `LAMBCHOP_PROJECT_API_PUBLIC_URL`
  - record the selected hub URL, API status URL, API events URL, and registration result in state/progress
  - if the hub GUI port is already occupied by a Lambchop hub, start only the project API and tell the user to open the existing hub
  - if the project does not appear in the hub registry, report the exact blocker: API not running, wrong public URL, API port collision, Docker volume issue, or registry file missing
- Enable adaptive parallel sprint orchestration:
  - main automation run is the orchestrator
  - dispatch 2-5 independent Superpowers subagent lanes when dependencies and `exclusive_scope` allow it
  - fall back to one item and record why when fewer than 2 independent items are eligible
  - keep scheduler triggering, integration, dashboard regeneration, validation, and commits in the main run
- Enable queue-exhaustion proposal planning:
  - when no ready work remains, inspect PRD/specs/roadmap before declaring no-work
  - create 3-7 `proposal_backlog` entries with `needs_user_review` when plausible next feature sets exist
  - show proposals in state, progress, and dashboard status
  - check/install shared upstream skills once: Superpowers and Huashu Design
  - record shared capability status and source commits in state/progress/dashboard evidence
  - record the Lambchop source commit applied to the target repo for future in-place upgrade checks
  - convert proposals to `todo` work items only after user approval or edits

## Git Preflight (Before Claiming Work)
Record evidence that the run can:
- create and delete a temporary branch
- create and remove a temporary worktree under `.worktrees/`
- write the state/progress/backoff files

If any preflight step fails, record the blocker (exact command + error) and stop safely.

## Automation Setup
- Create or update exactly one Codex automation for the target repo/workspace.
- Keep schedule/workspace/model/reasoning/execution-environment in automation fields (not in prose).
- Before editing workflow files, automation prompts, schedule fields, or status fields for an existing autonomous project, pause that project's automation first; do not stop already-running processes, then unpause after successful validation without triggering run-now unless the user asks.
- Set the normal cron RRULE to yesterday's weekday at noon in the operator's timezone before saving or triggering the automation.
- Store the automation id in the progress ledger.

## Validation (Before Marking “Done”)
- `state.json` parses as JSON.
- `backoff.json` parses as JSON.
- `dashboard-data.json` parses as JSON.
- Dockerized project API responds at `http://127.0.0.1:<project-api-port>/api/status`.
- Dockerized project API streams `http://127.0.0.1:<project-api-port>/api/events`.
- Dashboard hub responds at `http://127.0.0.1:<dashboard-port>/dashboard.html`.
- Dashboard hub `/api/projects` includes this project registration.
- `WORKFLOW.md` has no unresolved placeholders.
- `WORKFLOW.md` includes adaptive 2-5 parallel subagent orchestration and dashboard regeneration.
- Repo checks relevant to the change are run (tests/build/lint/typecheck as applicable).

## Proof Record (Progress Ledger Must Include)
- Target repo path and remote identity.
- Files created or updated.
- Automation id and desired cadence.
- Parked weekly anchor RRULE and evidence it was set to yesterday at noon.
- Maintenance pause evidence when workflow or automation settings were changed: pause-before result, unpause-after result, and confirmation that no run-now was triggered after unpause unless explicitly requested.
- First queued work item key/title.
- Dashboard artifact paths and whether the live status server reads real workflow data.
- Proposal backlog entries created, approved, or true no-work reason.
- Whether parallel subagent orchestration was used, not useful, or unavailable.
- Validation results (including git preflight).
- Any skipped checks with: reason, risk, and what to run later.

## Non-Goals (v1)
- No requirement to use Cursor, Claude Code, or any other IDE/agent tooling.
