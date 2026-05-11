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
After each run completes, blocks, or skips one active work item, the automation must reconcile state and then either select the next eligible queued item, create the next source-backed item from this plan, or generate proposal backlog entries for user review when the PRD/specs imply possible next advances but the user must choose.

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
Do not invent work when there is no source of truth. When a user decision is required but PRD/spec/repo evidence suggests plausible next advances, create proposal backlog entries with `needs_user_review` status instead of ending with "all tasks complete." Stop and record a blocker only when a requested action is unsafe, source files conflict in a way that changes product intent, or no meaningful source-backed proposal can be made.

## Backlog Seeds
- <BACKLOG_SEED_1>
- <BACKLOG_SEED_2>
- <BACKLOG_SEED_3>

## Proposal Backlog
Proposals here need user review before Lambchop converts them into `todo` work items.

- Status: none yet
