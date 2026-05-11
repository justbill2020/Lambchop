# Proof Of Work

## Principle
Autonomous runs must prove behavior with durable local evidence, not just summaries. The proof trail should let a future agent or user answer: what changed, why, how it was verified, what remains blocked, and whether automation scheduling actually matched the ledger.

## Required Evidence
Every run appends a progress entry with:

- run id, branch, worktree, active item, and lease status
- repo inspection and reconciliation notes
- files changed and why
- RED/GREEN evidence for production behavior
- validation commands and pass/fail results
- skipped checks with reason, risk, and later command
- local commit id when code changed
- state and schedule/trigger ledger updates
- scheduler-visible trigger result, including whether pause/inactive status skipped the trigger
- review consolidation evidence when moving review items to done
- blocked-item recheck evidence before honoring or clearing a blocker
- private/operator-owned input safety evidence when local ignored inputs are used
- exact blocker and next step when blocked

## Schedule Proof
Weekly self-trigger scheduling has separate facts:

- Weekly anchor: the persisted automation RRULE.
- Trigger ledger: what local progress/backoff files say should happen next.
- Scheduler state: whether the actual automation row was ACTIVE or PAUSED and whether `next_run_at` or app-native run-now produced a new automation run.

Record all three. Local ledger updates alone do not prove the scheduler-visible trigger happened. If Codex app run-now tooling is unavailable, use the `writing-automation` local scheduler DB run-now path; if that cannot verify a new run, mark schedule finalization as blocked with evidence.

## Completion Rule
Do not mark a work item done unless the progress entry includes validation evidence and state points to the same result. If validation could not run, the item is blocked or in progress, not done.

## Private Input Proof
For user-owned files, credentials, local services, or private fixtures, proof must show the boundary rather than the content:

- where the input is expected
- whether it exists
- whether it is ignored or environment-only
- which command consumed it
- bounded public output from the check

Do not include raw content, excerpts, secret values, source-only paths in public payloads, or generated artifacts derived from private content unless the user explicitly permits that output.
