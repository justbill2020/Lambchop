# <PROJECT_NAME> Scheduled Work Plan

This file is the task-generation source for the `<PROJECT_NAME>` autonomous workflow. Automation runs use it to create the next source-backed work item when the state queue has no eligible task.

## Mission
<PROJECT_PURPOSE>

## Current Milestone
<CURRENT_MILESTONE>

## Planning Sources
- `WORKFLOW.md`
- `docs/<PROJECT_SLUG>/state.json`
- `docs/<PROJECT_SLUG>/progress.md`
- `<SPECS_SOURCE>`
- repository code, tests, docs, TODOs, and validation failures

## Planning Cadence
After each run completes, blocks, or skips one active work item, the automation must reconcile state and then either select the next eligible queued item or create the next source-backed item from this plan.

## Task Sizing
Default to one coherent local commit per work item. Split work when acceptance criteria require unrelated files, unrelated behavior, or different validation commands.

## Priority Rules
1. Safety, data integrity, and broken workflow repair.
2. Failing tests or broken builds.
3. Blockers preventing autonomous operation.
4. Current milestone acceptance criteria.
5. Validation and proof gaps.
6. Documentation needed to operate the system.
7. Polish only when the milestone is otherwise complete.

## Stop Conditions
Do not invent work when there is no source of truth. Stop and record a blocker when a user decision is required, a requested action is unsafe, source files conflict in a way that changes product intent, or the current milestone is complete.

## Backlog Seeds
- <BACKLOG_SEED_1>
- <BACKLOG_SEED_2>
- <BACKLOG_SEED_3>
