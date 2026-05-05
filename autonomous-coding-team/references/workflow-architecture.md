# Workflow Architecture

## Generated Files
Every configured repo should contain:

- `WORKFLOW.md`: project-specific operating contract
- the generated state file under `docs/`: machine-readable queue and run state
- the generated progress file under `docs/`: human-readable proof log
- the generated backoff file under `docs/`: adaptive schedule ledger
- `.codex/environments/environment.toml`: optional local environment config when useful

## Operating Contract
`WORKFLOW.md` must be explicit enough for a future Codex run to continue without chat history. It defines:

- project identity, purpose, milestone, and sources of truth
- workflow/state/progress/backoff paths
- automation memory paths
- allowed and forbidden actions
- run loop and git preflight
- worktree and branch conventions
- work item schema and statuses
- cooperative lease rules
- adaptive backoff rules
- TDD, verification, commit, blocker, and reconciliation rules

## Run Loop
Every automation run:

1. Read `WORKFLOW.md` first.
2. Read state, progress, and backoff ledgers.
3. Resolve automation memory.
4. Inspect repo structure, git status, branches, remotes, and worktrees.
5. Run git write-access preflight before selecting work.
6. Reconcile state/progress with repository reality.
7. Select one eligible work item.
8. Claim it with a lease.
9. Work in an isolated worktree and local branch.
10. Use TDD for production behavior.
11. Run relevant checks.
12. Commit coherent completed changes locally.
13. Update state, progress, backoff, and automation schedule.
14. Stop safely if blocked.

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
