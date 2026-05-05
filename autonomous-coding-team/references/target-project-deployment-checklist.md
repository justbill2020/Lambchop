# Target Project Deployment Checklist

Use this checklist when deploying the autonomous coding team workflow into a new target repository (local path or GitHub clone).

## Pressure Scenario (What This Doc Must Cover)
- You have a target repo that should become “self-driving” across recurring Codex runs.
- You must install workflow files safely, validate them, and set up the automation without pushing/PRs/deploys.

## Inputs
- Target repo path (or clone target) and remote identity (if any).
- Project slug used for docs paths (example: `docs/<project-slug>/`).
- Integration branch name (`main` vs `master`) inferred from the repo.
- Automation id and desired cadence (default: 20 minutes active + adaptive backoff when idle).

## Discovery (Inspect Before Asking)
- `git status`, current branch, remotes, local branches, and `git worktree list --porcelain`.
- Existing autonomous files:
  - `WORKFLOW.md`
  - `docs/<project-slug>/state.json`
  - `docs/<project-slug>/progress.md`
  - `docs/<project-slug>/backoff.json`
  - `docs/<project-slug>/scheduled-work-plan.md`
- Stack/tooling markers and how to run checks (examples: `package.json` scripts, `Makefile`, CI config).
- Existing automations (avoid creating duplicates).

## Decisions (Ask Only What Cannot Be Inferred)
- Project purpose and current milestone definition of done.
- Safety boundaries: confirm local-only is the default (no push/PR/deploy/external trackers) unless explicitly enabled.
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
  - `docs/<project-slug>/backoff.json` (adaptive schedule ledger)
  - `docs/<project-slug>/scheduled-work-plan.md` (task-generation source)

## Git Preflight (Before Claiming Work)
Record evidence that the run can:
- create and delete a temporary branch
- create and remove a temporary worktree under `.worktrees/`
- write the state/progress/backoff files

If any preflight step fails, record the blocker (exact command + error) and stop safely.

## Automation Setup
- Create or update exactly one Codex automation for the target repo/workspace.
- Keep schedule/workspace/model/reasoning/execution-environment in automation fields (not in prose).
- Store the automation id in the progress ledger.

## Validation (Before Marking “Done”)
- `state.json` parses as JSON.
- `backoff.json` parses as JSON.
- `WORKFLOW.md` has no unresolved placeholders.
- Repo checks relevant to the change are run (tests/build/lint/typecheck as applicable).

## Proof Record (Progress Ledger Must Include)
- Target repo path and remote identity.
- Files created or updated.
- Automation id and desired cadence.
- First queued work item key/title.
- Validation results (including git preflight).
- Any skipped checks with: reason, risk, and what to run later.

## Non-Goals (v1)
- No requirement to use Cursor, Claude Code, or any other IDE/agent tooling.
