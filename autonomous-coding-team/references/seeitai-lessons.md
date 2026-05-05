# SeeItAI Lessons

Preserve these field-tested patterns from the SeeItAI automation:

- Make `WORKFLOW.md` the operating contract; keep the automation prompt focused on reading and following it.
- State and progress files make the project resumable across runs and tools.
- Adaptive backoff requires both a ledger and actual schedule updates.
- Git write-access preflight is required before claiming work.
- Worktrees prevent the main checkout from becoming the automation scratchpad.
- Leases allow concurrent runs without treating one active task as a global lock.
- Blockers must include exact evidence and next steps.
- Local commits should include validation details.
- Every run should reconcile state/progress with repo reality before starting new work.
- No eligible work due to blocked dependencies, concurrency caps, overlapping exclusive scope, or git preflight failure counts as no-work for backoff.
- Automation runs may not always receive Codex app automation-update tooling; record ledger updates, attempted scheduler persistence, actual scheduler state, and tool availability separately.

## Repair Heuristics
When repairing a project:

- If `WORKFLOW.md` exists but state files do not, preserve the workflow and generate missing ledgers.
- If state says `in_progress` but the lease is stale, inspect branch, worktree, progress notes, and git status before reclaiming.
- If an automation already exists, update it instead of creating a duplicate.
- If source files disagree, preserve explicit user intent, then implemented passing behavior, then safety and data integrity.
- If schedule persistence fails because automation tooling is unavailable, keep the ledger accurate, record the infrastructure failure, and make scheduler repair an explicit next step instead of pretending the schedule changed.
