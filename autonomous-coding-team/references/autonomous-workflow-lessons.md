# Autonomous Workflow Lessons

Preserve these field-tested patterns from prior autonomous workflow runs:

- Make `WORKFLOW.md` the operating contract; keep the automation prompt focused on reading and following it.
- State and progress files make the project resumable across runs and tools.
- The default continuous-work pattern is a weekly cron anchor plus a scheduler-visible run-now trigger after each completed ACTIVE run.
- Pause/inactive status must prevent the next trigger by leaving `next_run_at` untouched.
- Local schedule ledgers are not scheduler proof; verify app-native run-now or a new scheduler DB automation run/thread.
- Git write-access preflight is required before claiming work.
- Worktrees prevent the main checkout from becoming the automation scratchpad.
- Leases allow concurrent runs without treating one active task as a global lock.
- Blockers must include exact evidence and next steps.
- Local commits should include validation details.
- Every run should reconcile state/progress with repo reality before starting new work.
- No eligible work due to blocked dependencies, concurrency caps, overlapping exclusive scope, or git preflight failure must still be recorded before trigger finalization.
- Automation runs may not always receive Codex app automation-update tooling; record ledger updates, attempted scheduler persistence, actual scheduler state, and tool availability separately.
- Tooling must include blocked items in task discovery, validation counts, context packets, and blocker rechecks.
- Review consolidation is separate from implementation: re-run evidence, move validated review items to done, and then queue the next source-backed packet.
- Private operator-owned inputs must stay local and ignored; record only bounded public evidence, never private content.
- Packetized work is useful when tasks share a milestone but have non-overlapping ownership, explicit shared scope, and fresh combined validation.

## Repair Heuristics
When repairing a project:

- If `WORKFLOW.md` exists but state files do not, preserve the workflow and generate missing ledgers.
- If state says `in_progress` but the lease is stale, inspect branch, worktree, progress notes, and git status before reclaiming.
- If an automation already exists, update it instead of creating a duplicate.
- If source files disagree, preserve explicit user intent, then implemented passing behavior, then safety and data integrity.
- If schedule persistence fails because automation tooling is unavailable, keep the ledger accurate, record the infrastructure failure, and make scheduler repair an explicit next step instead of pretending the schedule changed.
- If a tool cannot find a blocked task by id or reports a suspiciously low task count, repair status-folder discovery before doing new feature work.
- If a review item has old validation evidence, leave it in review until a fresh gate confirms it can move to done.
- If a blocker depends on a human-owned file or credential, recheck the exact missing condition and keep the task blocked until the input exists in an ignored local path.
