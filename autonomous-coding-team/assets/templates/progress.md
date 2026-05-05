# <PROJECT_NAME> Autonomous Progress

This file is the human-readable proof-of-work log for the `<PROJECT_NAME>` autonomous workflow. Automation runs append entries here after inspecting the workflow, state, repository, and active work item.

## <ISO8601_TIMESTAMP> - workflow-initialized

- Status: initialized
- Branch: `<INTEGRATION_BRANCH>`
- Worktree: `<REPOSITORY_ROOT>`
- Changes:
  - Created `WORKFLOW.md` as the project operating contract.
  - Created `docs/<PROJECT_SLUG>/state.json` as the machine-readable work queue.
  - Created `docs/<PROJECT_SLUG>/backoff.json` as the adaptive schedule ledger.
  - Created this progress log.
- Validation:
  - Workflow placeholder check: pending final customization.
  - State JSON parse: pending final customization.
  - Backoff JSON parse: pending final customization.
- Safety:
  - Default autonomy is local commits only.
  - Push, PR, deploy, production config mutation, external trackers, and user-work reverts are disabled by default.
- Next step:
  - Run first-run discovery and replace setup placeholders with project-specific work items.
