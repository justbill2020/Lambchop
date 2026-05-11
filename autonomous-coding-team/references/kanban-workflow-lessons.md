# Kanban Workflow Lessons

## What Worked
Prior autonomous coding team runs proved a practical workflow pattern:

- A repo-local workflow file acted as the operating contract.
- Agents built from specs and durable repo files, not from chat memory.
- Markdown Kanban provided visible, editable task state when external Kanban tools were unavailable.
- Each task had objective, context, likely files, acceptance criteria, test plan, review checklist, and work log.
- Automation memory recorded what was read, what was claimed, validation evidence, commit/merge results, and exact scheduler limitations.
- Small vertical slices beat phase-sized work.
- Review gates promoted tasks only after validation evidence.
- Subagents were evaluated explicitly and used only when their work could be bounded and non-overlapping.
- Blocked work remained visible to tooling, context commands, and validation instead of falling out of the queue.
- Review consolidation runs moved validated review items to done only after fresh evidence, then created the next ready packet.
- Operator-owned local inputs were handled through ignored paths, bounded checks, and public evidence instead of being inspected, committed, quoted, or logged.

## Patterns To Replicate

### Operating Contract First
Every recurring run should read `WORKFLOW.md` first. The automation prompt should stay short and point to the workflow instead of carrying the whole system in prose.

### Durable Work State
Use repo-local task state so another run can continue without chat history. Lambchop's default is JSON state plus progress/backoff ledgers; Markdown Kanban can be used when a target repo already has it.

### Inspect Before Asking
Read specs, docs, plans, package files, source, tests, TODOs, prior progress, automation memory, and existing task files before asking the user for decisions.

### Kanban-First, Not Phase-First
Use the board or state file to decide what is ready, blocked, in progress, reviewable, or done. Phases are grouping labels; they do not override the queue.

### Task Claiming
Before edits, claim either one task or a dependency-safe parallel sprint packet, record each branch/worktree, and note whether subagents were spawned, not useful, or unavailable.

### Blocked Work Is Still Work
Context, validation, and planning tools must scan blocked items as well as ready, active, review, and done items. A blocked item should include the exact missing condition, the proof that it is still blocked, and the single next recheck command or user action. Do not let blocked work disappear from status counts, task context lookup, or no-work reasoning.

### Review Consolidation
Treat review as a real workflow state, not a synonym for done. A consolidation run should re-run the relevant checks, move only freshly validated items to done, record the evidence, and then create the next ready packet. If validation is stale or partial, leave the item in review with the missing check named.

### Reviewable Slices
Default each work item to one coherent local commit. Move broad work into follow-up tasks instead of expanding scope inside the active task.

### Milestone Packets
Related tasks can be advanced as a packet when each task has a distinct acceptance criterion and write scope. Record which files or behavior each local or delegated worker owns. Shared contracts, route boundaries, root configs, and generated artifacts must be named as shared scope and reconciled before review consolidation.

### Local-Only Operator Inputs
When a task depends on a private local file, credential, fixture, or other operator-owned input, keep it in an ignored path and prove that with local checks. Public logs may record bounded metadata and pass/fail labels, but must not include the private content itself. If the input is missing, block the task with the exact path or decision needed; do not fabricate substitute work unless the workflow explicitly calls for a synthetic smoke path.

### Proof Logs
Record RED/GREEN or equivalent validation evidence in the task work log or progress ledger. Do not mark done from code changes alone.

### Scheduler Honesty
If app-native scheduler controls are unavailable, say so. Do not present worker agents, local trigger artifacts, or memory notes as scheduler-visible automation triggers.

## Brownfield Additions
For an existing repo, infer commands from package scripts, CI, Makefiles, or equivalent project files. Preserve existing task/history files and reconcile them instead of replacing them.

## Greenfield Additions
For a new repo, ask only for project purpose, first milestone, slug, integration branch, and whether local-only autonomy remains the safety boundary. Then generate the workflow and ledgers.
