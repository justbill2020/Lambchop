# Cursor / Claude Code Compatibility Notes

These notes are informational only. The v1 workflow is Codex-first and does not require Cursor or Claude Code.

## Pressure Scenario (What This Doc Must Cover)
- You want to run the same “autonomous coding team” workflow using Cursor or Claude Code instead of Codex.
- You want to keep the same local-only safety defaults (no push/PR/deploy/external trackers unless explicitly enabled).

## Codex-First vs Tool-Agnostic

### Tool-agnostic (portable)
These artifacts are plain files and git conventions that any agent/tool can use:
- `WORKFLOW.md` operating contract
- `docs/<project>/state.json`, `progress.md`, `backoff.json`, `scheduled-work-plan.md`, `dashboard-data.json`, `dashboard.html`, `dashboard.compose.yml`, and `dashboard-server/`
- Cooperative leases, work item statuses, and exclusive/shared scope conventions
- `.worktrees/<work_item_key>` worktree naming convention and `codex/<...>` branch naming convention
- Adaptive parallel sprint packets when the tool supports safe bounded subagents; otherwise the same single-item fallback is still valid.

### Codex-first (tool-specific)
These elements are Codex-specific and may need equivalents in other tools:
- The “automation” concept (schedule, workspace, prompt, and model settings stored in Codex automation configuration)
- Automation memory path conventions (for example `$CODEX_HOME/automations/<automation_id>/memory.md`)
- References to Codex-specific tools (for example `update_plan`, `functions.shell_command`)

## What Would Change For Cursor
- Replace Codex automation scheduling with a Cursor workflow (manual runbook, task runner, or an external scheduler).
- Store the prompt/operating contract as workspace docs (Cursor rules, README-style docs, or the repo’s own conventions).
- Ensure the agent can still:
  - read/write the same `docs/<project>/` ledgers
  - keep the live dashboard inputs current from real workflow data
  - create worktrees and local branches
  - run validation commands

## What Would Change For Claude Code
- Replace Codex automation scheduling with the Claude Code equivalent (manual loop or external scheduler).
- Replace Codex “memory.md” updates with a persistent note file the Claude Code workflow reliably maintains.
- Ensure the agent still follows the same safety defaults, parallel-lane ownership rules, dashboard regeneration, and ledger updates.

## Non-Goals (v1)
- Do not require installing Cursor or Claude Code to use this skill.
- Do not change the workflow to depend on tool-specific configuration files outside Codex.

