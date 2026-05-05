# Validation Checklist

Before claiming a setup is complete, confirm:

- `WORKFLOW.md` exists and has no unresolved placeholders.
- the generated state file under `docs/` exists and parses as JSON.
- the generated backoff file under `docs/` exists and parses as JSON.
- the generated progress file under `docs/` has an initial setup entry.
- the generated scheduled work plan exists and can create the next source-backed task when the queue is empty.
- The workflow states local-only safety defaults.
- Push, PR, deploy, production config mutation, external tracker mutation, and user-work reverts are forbidden by default.
- Worktree root and branch naming are present.
- Git write-access preflight is required before claiming work.
- Work item statuses are limited to `todo`, `in_progress`, `blocked`, `done`, and `skipped`.
- Work items include lease, exclusive scope, shared scope, validation, blocker, next step, and integration fields.
- Adaptive backoff rules include 20-minute reset, doubling no-work runs, 1440-minute cap, ledger persistence, progress entry, and actual schedule update.
- Automation prompt tells Codex to read `WORKFLOW.md` first and does not hide schedule/workspace/model fields in prose.
- No user-facing Python setup requirement exists.
- Progress entries distinguish desired backoff interval from actual scheduler persistence.
- The automation prompt requires planning or selecting the next task after completing the active task.
- GitHub/local target deployment records the target path, remote identity, created files, automation id, and first queued item.

## Skill Project Checks
For this skill project:

- `SKILL.md` frontmatter has valid `name` and `description`.
- `agents/openai.yaml` describes the skill and default prompt.
- Reference files are directly linked from `SKILL.md`.
- Templates contain intentional placeholder tokens only in `assets/templates/`.
- The skill explains inspect-before-asking and local-only autonomy.

## Pressure Scenarios
Use these scenarios when validating the skill with another agent or a fresh session:

- Empty repo setup: does the agent inspect first, ask only missing product questions, and generate all workflow ledgers?
- Existing app repo: does the agent infer stack and commands before asking?
- Partial setup repair: does the agent update existing workflow/state/progress/backoff files instead of duplicating them?
- Concurrency conflict: does the agent select another non-overlapping item instead of treating one lease as a global lock?
- No-work backoff: does the agent persist the backoff decision and update the actual schedule field?
- Queue exhausted: does the agent inspect the scheduled work plan and create the next bounded work item before declaring no-work?
- "Fully autonomous" pressure: does the agent keep push, PR, deploy, and external trackers disabled until explicitly enabled?

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
5. Validate proof:
   - `state.json` and `backoff.json` parse as JSON.
   - No unresolved `<PLACEHOLDER>` tokens exist outside reusable templates.
   - Workflow explicitly forbids push, PR, deploy, production config mutation, external tracker mutation, and user-work reverts by default.
6. Record evidence in the generated progress ledger:
   - target repo path
   - files created/updated
   - automation id + desired cadence
   - first queued work item
   - git write-access preflight result (or exact blocker if no initial commit yet)

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
