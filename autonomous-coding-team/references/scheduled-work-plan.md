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

## Planner Loop
Every run uses this loop after reading workflow/state/progress/backoff:

1. Reconcile state with repository reality.
2. If a live owned item exists, continue it.
3. If eligible queued work exists, select one item.
4. If no eligible queued work exists, inspect the scheduled work plan and source files.
5. If the current milestone has remaining backlog seeds, create the next concrete work item in state.
6. If new source evidence reveals a needed task, add a bounded work item with source references and acceptance criteria.
7. If no source-backed task can be created, record no-work and apply adaptive backoff.

## Task Generation Rules
Generated work items must include dependencies, acceptance criteria, source references, validation expectations, exclusive scope, shared scope, and a next step. Do not create vague tasks such as "improve project" or "clean up code".

## Proof
When the planner creates or declines to create a next task, append a progress entry with:

- source inspected
- candidate tasks considered
- task created or no-work reason
- dependency and scope rationale
- next interval decision
