# Lambchop Scheduled Work Plan

This file is the task-generation source for Lambchop's autonomous workflow. Automation runs use it to create the next source-backed work item when the state queue has no eligible task.

## Mission
Build a Codex-first skill project that can deploy a safe, local autonomous coding team into any new or existing repository.

## Current Milestone
Prove the reusable deployment flow with Lambchop itself, then validate the skill against empty-repo and existing-repo scenarios before local installation.

## Planning Sources
- `WORKFLOW.md`
- `docs/lambchop/state.json`
- `docs/lambchop/progress.md`
- `autonomous-coding-team/SKILL.md`
- `autonomous-coding-team/references/`
- `autonomous-coding-team/assets/templates/`
- SeeItAI workflow lessons and proof records
- repository validation output and git history

## Planning Cadence
After each run completes, blocks, or skips one active work item, the automation must reconcile state and then either select the next eligible queued item or create the next source-backed item from this plan.

## Task Sizing
Default to one coherent local commit per work item. Split work when acceptance criteria require unrelated files, unrelated behavior, or different validation commands.

## Priority Rules
1. Safety, data integrity, and broken workflow repair.
2. Failing validation or broken automation registry state.
3. Blockers preventing autonomous operation.
4. Current milestone validation tasks.
5. Proof gaps in progress/state/backoff/scheduler evidence.
6. Documentation needed to apply the skill to another project.
7. Polish only when the milestone is otherwise complete.

## Stop Conditions
Do not invent work when there is no source of truth. Stop and record a blocker when Bill's decision is required, a requested action would push/PR/deploy/mutate external trackers, source files conflict in a way that changes product intent, or the current milestone is complete.

## Backlog Seeds
- Pressure-test empty repo setup and record proof.
- Pressure-test existing repo setup and record proof.
- Install or link the skill into local Codex skills after validation.
- Add and validate a GitHub/local target-project deployment method.
- Add a target-project deployment checklist after the first successful external repo setup.
- Add Cursor/Claude Code compatibility notes only after the Codex-first flow is proven.
