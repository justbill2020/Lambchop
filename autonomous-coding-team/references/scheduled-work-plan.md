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
- Stop conditions: unsafe mutation, no source of truth, or user decision needed after proposal generation.
- Backlog seeds: ordered candidate work the automation may convert into state items.
- Proposal backlog: candidate next feature sets or advancement sprints that need user review before becoming work items.
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
8. If no ready task can be created safely, inspect PRD/spec sources and create 3 to 7 proposal backlog entries with `needs_user_review` status.
9. If no source-backed task or proposal can be created, record true no-work before schedule/trigger finalization with the exact missing source of truth.

## Task Generation Rules
Generated work items must include dependencies, acceptance criteria, source references, validation expectations, exclusive scope, shared scope, orchestration defaults, and a next step. Do not create vague tasks such as "improve project" or "clean up code".

When backlog seeds can be split safely, prefer several independent items over one broad item so the next automation run can dispatch parallel subagents. Do not split work that shares the same exclusive files, requires sequential decisions, or would create integration risk larger than the speed benefit.

## Proposal Backlog
When the queue is exhausted and the PRD/specs contain enough product direction for more work but not enough certainty to choose for the user, create proposal backlog entries instead of ending with "all tasks complete." Proposals are not work items. They wait for user approval and must be visible in state, progress, and the dashboard.

Each proposal must include:

- stable proposal key
- title
- `status: needs_user_review`
- rationale tied to PRD/spec/repo evidence
- source references
- suggested acceptance criteria
- risk or open-decision notes
- parallelization notes

After the user approves or edits a proposal, convert it into one or more bounded `todo` work items with normal dependencies, scopes, validation, and orchestration fields.

## Proof
When the planner creates or declines to create a next task, append a progress entry with:

- source inspected
- candidate tasks considered
- task created, proposals created, or true no-work reason
- dependency and scope rationale
- next interval decision
