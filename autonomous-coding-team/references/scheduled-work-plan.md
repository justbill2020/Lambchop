# Scheduled Work Plan

## Principle
A fully autonomous coding team needs a standing plan source, not only a static task queue. Each run completes or blocks one item, reconciles the queue, then either selects the next eligible queued item or creates the next item from the scheduled work plan.

## Generated File
Create the generated scheduled work plan under the project docs folder for each configured repo. It is the human-readable roadmap and task-generation source for future autonomous runs.

## Required Sections
- Mission: what the project is trying to become.
- Milestone: the current bounded outcome.
- Planning sources: specs, docs, TODOs, code gaps, tests, user goals, and prior progress.
- Planning cadence: when to generate more tasks.
- Task sizing: one coherent local commit per work item by default.
- Priority rules: safety, failing tests, blockers, milestone-critical work, validation, then polish.
- Stop conditions: user decision needed, unsafe mutation, no source of truth, or milestone complete.
- Backlog seeds: ordered candidate work the automation may convert into state items.
- Parallelization notes: where possible, backlog seeds should be splittable into independent work items with non-overlapping `exclusive_scope`.

## Planner Loop
Every run uses this loop after reading workflow/state/progress/backoff:

1. Reconcile state with repository reality.
2. If a live owned item exists, continue it.
3. If 2 to 5 independent eligible queued work items exist, select them as a parallel sprint packet.
4. If only one eligible queued work item exists, select it and record why parallelism was not useful.
5. If no eligible queued work exists, inspect the scheduled work plan and source files.
6. If the current milestone has remaining backlog seeds, create the next concrete work item in state.
7. If new source evidence reveals a needed task, add a bounded work item with source references and acceptance criteria.
8. If no source-backed task can be created, record no-work before schedule/trigger finalization.

## Task Generation Rules
Generated work items must include dependencies, acceptance criteria, source references, validation expectations, exclusive scope, shared scope, orchestration defaults, and a next step. Do not create vague tasks such as "improve project" or "clean up code".

When backlog seeds can be split safely, prefer several independent items over one broad item so the next automation run can dispatch parallel subagents. Do not split work that shares the same exclusive files, requires sequential decisions, or would create integration risk larger than the speed benefit.

## Proof
When the planner creates or declines to create a next task, append a progress entry with:

- source inspected
- candidate tasks considered
- task created or no-work reason
- dependency and scope rationale
- next interval decision
