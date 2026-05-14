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
- no-progress counter update, including whether the run reset the counter or incremented it
- automation-maintenance pause evidence when workflow, prompt, schedule, or status fields were edited, including pause-before result, confirmation that already-running processes were left alone, unpause-after result, and whether run-now was intentionally not triggered after unpause
- scheduler-visible trigger result, including whether pause/inactive status skipped the trigger and whether the parked weekly anchor was repaired to yesterday at noon
- review consolidation evidence when moving review items to done
- blocked-item recheck evidence before honoring or clearing a blocker
- private/operator-owned input safety evidence when local ignored inputs are used
- exact blocker and next step when blocked

## Schedule Proof
Weekly self-trigger scheduling has separate facts:

- Parked weekly anchor: the persisted automation RRULE, which must be weekly on yesterday's weekday at 12:00 in the operator's timezone.
- Trigger ledger: what local progress/backoff files say should happen next.
- Scheduler state: whether the actual automation row was ACTIVE or PAUSED, whether `next_run_at` or app-native run-now produced a new automation run, and whether the parked anchor moved the next normal schedule off today.

Record all three. Local ledger updates alone do not prove the scheduler-visible trigger happened or that the parked anchor was repaired. If Codex app run-now tooling is unavailable, use the `writing-automation` local scheduler DB run-now path; if that cannot verify a new run or the yesterday-at-noon RRULE, mark schedule finalization as blocked with evidence.

## No-Progress Pause Proof

Before any run-now trigger, prove whether the run accomplished real work. Real work is a validated completion, fresh evidence that advances a blocked/review item, creation of a new source-backed item, material proposal-backlog refresh, or an app-visible scheduler repair. If none of those happened, record the no-progress reason and increment the backoff ledger's `consecutive_no_progress_runs`.

At 3 consecutive no-progress runs, the proof entry must show the attempted app-visible pause, the parked weekly RRULE, the final automation status when it can be verified, and that no run-now trigger was requested. If pause persistence is blocked, record the app/runtime evidence and the manual scheduler repair needed.

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
