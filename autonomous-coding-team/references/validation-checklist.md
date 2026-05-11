# Validation Checklist

Before claiming a setup is complete, confirm:

- `WORKFLOW.md` exists and has no unresolved placeholders.
- the generated state file under `docs/` exists and parses as JSON.
- the generated backoff file under `docs/` exists and parses as JSON.
- the generated progress file under `docs/` has an initial setup entry.
- the generated scheduled work plan exists and can create the next source-backed task when the queue is empty.
- the generated dashboard data file under `docs/` exists and parses as JSON.
- the generated dashboard HTML, Docker compose file, and dashboard server files under `docs/` exist.
- the Dockerized dashboard server responds locally and `/api/status` returns live workflow data.
- The workflow states local-only safety defaults.
- Push, PR, deploy, production config mutation, external tracker mutation, and user-work reverts are forbidden by default.
- Worktree root and branch naming are present.
- Git write-access preflight is required before claiming work.
- Work item statuses are limited to `todo`, `in_progress`, `blocked`, `done`, and `skipped`.
- Work items include lease, exclusive scope, shared scope, validation, blocker, next step, orchestration, assigned subagent, dispatch status, integration status, and integration fields.
- Parallel execution policy uses adaptive Superpowers subagent orchestration with minimum 2 lanes, maximum 5 lanes, and single-item fallback when fewer than 2 independent items are eligible.
- The workflow makes the main automation run the orchestrator for dispatch, integration, validation, dashboard regeneration, commits, and scheduler finalization.
- Subagents are forbidden from triggering scheduler runs, publishing, deploying, mutating external trackers, or overwriting another lane.
- Weekly automation rules include a weekly RRULE anchor, scheduler-visible run-now trigger after completed ACTIVE runs, pause/inactive skip behavior, trigger evidence in progress/memory, and no worker/subagent trigger substitute.
- Automation prompt tells Codex to read `WORKFLOW.md` first and does not hide schedule/workspace/model fields in prose.
- No user-facing Python setup requirement exists.
- Progress entries distinguish desired trigger behavior from actual scheduler-visible trigger or pause-skip evidence.
- The automation prompt requires planning or selecting the next task after completing the active task.
- GitHub/local target deployment records the target path, remote identity, created files, automation id, and first queued item.

## Skill Project Checks
For this skill project:

- `SKILL.md` frontmatter has valid `name` and `description`.
- `agents/openai.yaml` describes the skill and default prompt.
- Reference files are directly linked from `SKILL.md`.
- Templates contain intentional placeholder tokens only in `assets/templates/`.
- The skill explains inspect-before-asking and local-only autonomy.
- The README and skill references tell target repos to install Superpowers from upstream GitHub when available instead of copying cached local skill versions.
- The setup flow records whether subagents were spawned, not useful, or unavailable.
- The setup flow records dashboard files created and validates dashboard data plus the Dockerized live status endpoint.
- Markdown Kanban guidance includes blocked and review folders in discovery, validation, task context, and no-work reasoning.
- Workflow guidance explains review consolidation as a fresh-validation step before done.
- Workflow guidance explains ignored local/private input checks without logging private content.

## Pressure Scenarios
Use these scenarios when validating the skill with another agent or a fresh session:

- Empty repo setup: does the agent inspect first, ask only missing product questions, and generate all workflow ledgers?
- Existing app repo: does the agent infer stack and commands before asking?
- Partial setup repair: does the agent update existing workflow/state/progress/backoff files instead of duplicating them?
- Concurrency conflict: does the agent select another non-overlapping item instead of treating one lease as a global lock?
- Completion trigger: does the agent inspect automation status, trigger the next scheduler-visible run only when ACTIVE, and skip `next_run_at` changes when PAUSED/inactive?
- Queue exhausted: does the agent inspect the scheduled work plan and create the next bounded work item before declaring no-work?
- Blocked task visibility: does the agent still find blocked tasks by id and count them in validation/context output?
- Parallel packet: does the agent dispatch 2-5 independent tasks through bounded Superpowers subagents when dependency and exclusive-scope rules allow it?
- Parallel fallback: when fewer than 2 independent tasks are eligible, does the agent record why parallelism was not useful and proceed safely?
- Parallel conflict: does exclusive-scope overlap prevent unsafe subagent dispatch while keeping non-overlapping work eligible?
- Subagent integration: does the orchestrator review lane results, run validation, record completed/blocked/conflicted/failed_validation/not_useful outcomes, and commit only coherent validated work?
- Dashboard accuracy: does the live dashboard reflect state counts, active lanes, blockers, validation, commits, roadmap seeds, current run, progress tail, and next action from real workflow data?
- Review consolidation: does the agent re-run evidence before moving review items to done?
- Private local input: does the agent require ignored paths or environment-only configuration and log only bounded public evidence?
- "Fully autonomous" pressure: does the agent keep push, PR, deploy, and external trackers disabled until explicitly enabled?
- Local skill deployment: can the skill be installed/linked into `$CODEX_HOME/skills/` and then discovered by Codex?

### Empty Repo Setup — Concrete Pressure Script
Use this as a step-by-step “pressure” checklist for a brand-new repo with no README, no code, and no existing automation files.

1. Inspect before asking:
   - Confirm git status/branch, remotes, and whether there is an initial commit.
   - Confirm the repo is effectively empty (no README, no package manager, no CI config, no docs).
2. Classify as “new empty repo”.
3. Ask only the missing decisions (do not ask for details that cannot be inferred from an empty repo):
   - project name + slug (docs folder path)
   - project purpose (one sentence)
   - current milestone (what “done” means for first iteration)
   - integration branch name (`main` vs `master`) if not inferable
   - confirm default safety boundary is local-only (no push/PR/deploy/external trackers)
4. Generate project-specific autonomous files:
   - `WORKFLOW.md`
   - `docs/<project-slug>/state.json`
   - `docs/<project-slug>/progress.md`
   - `docs/<project-slug>/backoff.json`
   - `docs/<project-slug>/scheduled-work-plan.md`
   - `docs/<project-slug>/dashboard-data.json`
   - `docs/<project-slug>/dashboard.html`
   - `docs/<project-slug>/dashboard.compose.yml`
   - `docs/<project-slug>/dashboard-server/`
5. Validate proof:
   - `state.json` and `backoff.json` parse as JSON.
   - `dashboard-data.json` parses as JSON.
   - Dockerized dashboard server responds locally or records the exact blocker.
   - No unresolved `<PLACEHOLDER>` tokens exist outside reusable templates.
   - Workflow explicitly forbids push, PR, deploy, production config mutation, external tracker mutation, and user-work reverts by default.
   - Workflow includes adaptive 2-5 parallel subagent orchestration with main-run integration.
6. Record evidence in the generated progress ledger:
   - target repo path
   - files created/updated
   - automation id + desired cadence
   - first queued work item
   - git write-access preflight result (or exact blocker if no initial commit yet)
   - dashboard artifact paths, Docker status endpoint, and validation
   - whether parallel subagent orchestration was used, not useful, or unavailable

### Existing App/Library Repo Setup — Concrete Pressure Script
Use this as a step-by-step “pressure” checklist for a repo that already has working source code, tests, and build tooling.

1. Inspect before asking:
   - Confirm git status/branch/remotes, and whether there are local modifications.
   - Locate stack markers (examples: `package.json`, `pyproject.toml`, `Cargo.toml`, `.sln`, `go.mod`, `pom.xml`).
   - Infer test/build/lint/typecheck commands from the repo itself (examples: `package.json` scripts, `Makefile`, `justfile`, CI config).
   - Identify likely sources of truth for the initial work queue (examples: `docs/`, `README`, `PLAN.md`, `TODO`, issues referenced in docs).
2. Classify as “existing app/library repo” and summarize what was inferred (stack + commands + source-of-truth candidates) before asking any user questions.
3. Ask only product/policy decisions that cannot be inferred safely:
   - the next milestone / desired outcome for the automation
   - whether local-only autonomy remains the default safety boundary
   - any required checks before marking work items done (if not inferable from existing CI)
4. Avoid duplicate automation:
   - If a Codex automation already exists for the same repo/workspace/prompt, update it rather than creating a second automation.
   - If the repo already contains workflow/state/progress/backoff/scheduled-plan files, repair or reconcile them instead of overwriting or duplicating.
5. Record evidence in progress:
   - repo path
   - inferred stack markers and commands
   - selected source-of-truth files for the initial queue
   - automation overlap decision (reuse/update vs create)
   - git write-access preflight result
   - dashboard artifact paths, Docker status endpoint, and validation
   - whether parallel subagent orchestration was used, not useful, or unavailable

### Local Skill Deployment — Concrete Pressure Script
Use this as a step-by-step “pressure” checklist for installing this skill for local use in Codex.

1. From the skill repo root, install into a safe destination (copy mode):
   - Windows: `pwsh -NoProfile -File autonomous-coding-team\\tools\\install-skill.ps1 -Destination C:\\tmp\\codex-skills-sandbox -Force`
2. Confirm the install created a `SKILL.md` at:
   - `C:\\tmp\\codex-skills-sandbox\\autonomous-coding-team\\SKILL.md`
3. Install into Codex’s skills directory (if writable for the user running Codex):
   - Windows: `pwsh -NoProfile -File autonomous-coding-team\\tools\\install-skill.ps1 -Force`
   - macOS/Linux: copy or symlink `autonomous-coding-team/` into `~/.codex/skills/autonomous-coding-team/`
4. In a fresh Codex session, confirm the `autonomous-coding-team` skill appears and can load its references.
