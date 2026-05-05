# GitHub Repo Deployment

## Principle
The user can point Codex at a GitHub repository URL, remote name, or local repo path and ask Lambchop to deploy an autonomous coding team there. Codex does the setup work; the user should not have to run a generator.

## Supported Inputs
- GitHub HTTPS URL
- GitHub SSH URL
- `owner/repo` shorthand when GitHub access is configured
- existing local repo path
- current working directory

## Deployment Flow
1. Resolve the target:
   - If local path exists, inspect it in place.
   - If a GitHub URL or shorthand is provided and no local checkout exists, ask where to place the checkout unless an obvious workspace root is already established.
   - Clone only after confirming the destination when there is any risk of writing into the wrong folder.
2. Inspect before asking:
   - git status, branch, remotes, default branch, worktrees
   - README/docs/specs/plans/TODOs
   - stack markers, package manager, test/build/lint/typecheck commands
   - CI and deployment config
   - existing workflow/state/progress/backoff/scheduled-plan files
   - existing overlapping Codex automations
3. Classify the repo:
   - new empty repo
   - docs/spec-only repo
   - existing app/library
   - partially configured autonomous repo
   - already automated repo that should be updated
4. Ask only missing decisions:
   - project purpose if not inferable
   - first milestone if no spec/plan exists
   - source of truth when multiple docs conflict
   - initial automation cadence if 20-minute active default is not acceptable
   - whether local commits remain the default safety boundary
5. Install project-specific autonomous files:
   - `WORKFLOW.md`
   - generated state, progress, backoff, and scheduled work plan under the target project's `docs/` folder
   - optional local Codex environment config when needed
6. Create or update the Codex cron automation:
   - Use one automation per target repo.
   - Update an overlapping automation instead of creating a duplicate.
   - Keep schedule, workspace, model, reasoning, and execution environment in automation fields.
7. Validate and record proof:
   - JSON ledgers parse.
   - No unresolved placeholders remain outside reusable templates.
   - Workflow forbids push, PR, deploy, production config changes, external trackers, and user-work reverts by default.
   - Git preflight passes or records a blocker.
   - Automation registry audit runs and any unrelated failures are called out separately.

## Output Contract
Report:

- target repo path and remote
- files created or updated
- automation id and cadence
- first queued work item
- validation evidence
- blockers and exact next step

## Safety Defaults
Do not push to GitHub, open PRs, deploy, or mutate external issue trackers during deployment. A remote URL is a source and destination identity, not permission to publish.
