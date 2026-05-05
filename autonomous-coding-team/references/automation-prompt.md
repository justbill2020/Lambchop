# Automation Prompt

## Classification
Use a Codex `cron` automation by default. Use `heartbeat` only when the user wants the current thread to wake up later.

## Prompt Design
The automation prompt is task-only and self-contained. Schedule, workspace, model, reasoning effort, and execution environment belong in automation fields.

## Default Prompt Pattern
When writing the real automation prompt, replace the descriptive bracketed phrases below with project-specific values. Do not leave them as placeholders in the final automation.

```text
You are running the autonomous implementation loop for [project name].

Read WORKFLOW.md first and follow it as the operating contract for this run. Treat WORKFLOW.md as read-only unless the user explicitly requested a workflow change. Then read the configured state, progress, and backoff files under docs/[project slug]/. Resolve the automation memory path described in WORKFLOW.md, inspect the repository structure, git status, branches, remotes, and worktrees, and run the git write-access preflight before selecting work.

Plan the next phase and execute exactly one eligible work item unless the workflow says there is no eligible work. Red-team your own plan before and after implementation so you do not get tunnel vision around one file or one symptom. Review what may have been left incomplete by the previous phase, then continue one eligible incomplete work item until it is implemented, verified, documented when needed, committed locally, and reflected in state and progress.

Support cooperative concurrent runs. Generate a unique run_id at startup and use the lease fields in the configured state file. If an in_progress item has a live lease owned by another run_id, do not steal it, overwrite it, or treat it as a global lock. Instead, select the next eligible todo item whose dependencies are done and whose exclusive_scope does not overlap any live leased in_progress item. If no dependency-safe item with non-overlapping exclusive_scope is available, record the reason in progress and count this as a no-work run for adaptive backoff.

Use test-driven development for production behavior: write or confirm the failing test first, verify the expected RED state, implement the smallest useful change, then verify GREEN. Run relevant validation before claiming completion. Document skipped checks with reason, risk, and what should be run later.

Apply adaptive automation backoff at the end of every run using the configured backoff file. If work was found or continued, set the next interval to 20 minutes. If no eligible work was found, double the current interval up to 1440 minutes. Persist the decision in backoff.json, append it to progress.md, and update the actual automation schedule field. Do not store schedule logic only in prose.

Do not delete or revert user work. Do not publish branches, create pull requests, deploy, use external issue trackers, or modify production configuration unless WORKFLOW.md or the user explicitly asks for that.
```

## Duplicate Check
Before creating an automation, inspect existing automation configs. Update an existing automation when name, prompt topic, workspace, or project slug overlaps substantially.

## Recommended Fields
- `kind`: `cron`
- `status`: `ACTIVE`
- `rrule`: `FREQ=MINUTELY;INTERVAL=20`
- `executionEnvironment`: `local`
- `reasoningEffort`: `high`
- `cwds`: target repo root
