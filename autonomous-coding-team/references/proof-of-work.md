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
- state/backoff updates
- scheduler persistence result
- exact blocker and next step when blocked

## Schedule Proof
Adaptive backoff has two separate facts:

- Ledger state: what `backoff.json` says the next interval should be.
- Scheduler state: what the actual Codex automation schedule is set to.

Record both. If Codex automation update tooling is unavailable in an automation run, mark schedule finalization as an infrastructure failure, keep the ledger correct, and include the needed manual or future-tooling repair step.

## Completion Rule
Do not mark a work item done unless the progress entry includes validation evidence and state points to the same result. If validation could not run, the item is blocked or in progress, not done.
