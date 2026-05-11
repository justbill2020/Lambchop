---
name: autonomous-coding-team
description: Use when setting up, operating, repairing, or continuing a repository as an autonomous Codex coding team with local workflow files, recurring automation, work queues, progress ledgers, worktrees, branches, tests, and local commits.
---

# Autonomous Coding Team

## Overview
Turn a new or existing repository into a Codex-first autonomous coding team. The user experience is conversational: Codex inspects the repo, asks only for missing product or policy decisions, creates the local workflow system, validates it, and prepares or updates the Codex automation. The generated workflow treats the main automation run as a sprint orchestrator that uses adaptive parallel Superpowers subagents when independent work exists.

Default autonomy is local-only: worktrees, branches, code changes, tests, docs, progress ledgers, repo-local dashboard artifacts, weekly automation anchors, scheduler-visible completion triggers, and local commits are allowed. Pushes, PRs, deploys, production config changes, and external trackers are forbidden unless the user explicitly enables them.

## Local Installation (Codex)
Install this skill into your local Codex skill folder so it can be used across repositories.

- Local skill install: [`references/local-skill-install.md`](references/local-skill-install.md)
- Upstream skill dependencies: [`references/upstream-skills.md`](references/upstream-skills.md)


## Local Installation (this repo)
See [`references/local-skill-install.md`](references/local-skill-install.md) for scripted copy installs and optional junction installs.

## Cursor / Claude Code Notes
These notes are informational and do not change the Codex-first v1 workflow.

- Tool compatibility notes: [`references/cursor-claude-compatibility.md`](references/cursor-claude-compatibility.md)

## When To Use
- User asks to set up a repo as an autonomous coding team, self-driving repo, recurring Codex worker, or autonomous implementation loop.
- User wants Codex to keep advancing a project across runs without relying on chat history.
- A repo has partial workflow/state/progress files that need repair or completion.
- A recurring automation needs safe local work queues, worktrees, leases, backoff, or resumable proof logs.

## When Not To Use
- The user only wants a one-time implementation task.
- The user asks for a general coding plan without recurring automation.
- The requested default is publishing, deployment, or external issue-tracker mutation before local safety rules are established.

## Required Flow
1. Inspect before asking: repo files, git status, branches, remotes, docs, package manifests, configs, existing `WORKFLOW.md`, existing project state files under `docs/`, and existing automations when available.
2. Classify the repo as empty, docs/spec-only, existing app/library, partially configured, or already automated.
3. Ask only for decisions that cannot be inferred, such as project purpose, source of truth, initial cadence, autonomy limits, and current milestone definition of done.
4. Load `references/setup-interview.md` for the interview and setup sequence.
5. Load `references/local-skill-install.md` when installing or linking this skill for local use.
6. Load `references/upstream-skills.md` before installing or recommending general workflow skills such as Superpowers; prefer current upstream GitHub sources over cached embedded copies.
7. Load `references/github-repo-deployment.md` when the user points to a GitHub repo, remote URL, or local project path to receive the autonomous team.
8. Load `references/kanban-workflow-lessons.md` when adapting the proven Markdown Kanban, automation memory, task work log, review gate, or subagent-evaluation pattern.
9. Load `references/workflow-architecture.md`, `references/work-item-model.md`, `references/scheduled-work-plan.md`, `references/automation-prompt.md`, and `references/proof-of-work.md` before writing workflow, state, progress, backoff, schedule plan, or automation prompt content.
10. Copy and customize templates from `assets/templates/`; remove all placeholders before finishing.
11. Load `references/validation-checklist.md` and validate the generated setup before claiming completion.
12. Load `references/autonomous-workflow-lessons.md` when adapting, repairing, or extending the operating contract.

## Safety Defaults
- Create implementation work in a per-item `.worktrees/` folder on a `codex/` branch named for the project slug and work item.
- Use cooperative leases; a live `in_progress` item is not a global lock.
- Prefer adaptive parallel sprint packets of 2 to 5 independent work items when dependencies and `exclusive_scope` allow it.
- Keep the main automation run as orchestrator for subagent dispatch, integration, validation, dashboard regeneration, commits, and scheduler finalization.
- Use TDD for production behavior and record RED/GREEN evidence.
- Use Superpowers `dispatching-parallel-agents` for bounded non-overlapping subagent lanes when available and useful.
- Fall back to single-item local work when fewer than 2 independent tasks exist or multi-agent support is unavailable, and record why.
- Install `docs/<project-slug>/dashboard.html`, `dashboard.compose.yml`, and `dashboard-server/`; keep dashboard data current from real workflow files during setup and every run.
- Keep blocked work visible to discovery, validation, context lookup, and backoff decisions.
- Treat review/pending-review work as unfinished until fresh validation evidence promotes it.
- Keep private operator-owned files, credentials, fixtures, and service config in ignored local paths or environment-only settings; log bounded public evidence only.
- Advance related milestone packets only when ownership, shared scope, and combined validation are explicit.
- Commit coherent completed changes locally with validation in the commit body.
- Update state, progress, and schedule/trigger ledgers after every run.
- After completing one item, plan or select the next eligible item from the scheduled work plan before trigger finalization.
- Use a weekly cron RRULE as the persisted schedule anchor.
- Trigger the next scheduler-visible run after a completed ACTIVE run; skip the trigger when the automation is PAUSED or inactive.
- Never use a worker/subagent or local artifact as a substitute for a scheduler-visible run-now trigger.
- Never publish, deploy, or mutate external trackers unless explicitly enabled by the user.

## Common Mistakes
- Asking setup questions before inspecting the repo.
- Writing a large automation prompt instead of making `WORKFLOW.md` the operating contract.
- Skipping state, progress, or backoff ledgers.
- Using a minute-interval automation as the default instead of a weekly anchor plus completion trigger.
- Triggering the next run while the automation is paused.
- Doing implementation work in the main checkout.
- Treating one live lease as a global lock.
- Serializing independent sprint work when 2 to 5 safe subagent lanes are available.
- Letting a subagent act as orchestrator, update scheduler fields, or overwrite another lane.
- Letting the dashboard drift from state/progress/roadmap evidence.
- Losing blocked tasks because tooling only scans ready/done queues.
- Calling review work done without a fresh review gate.
- Logging private local input content instead of bounded safety evidence.
- Bundling related tasks without distinct ownership and shared-scope reconciliation.
- Marking work done without validation evidence.
- Hiding adaptive schedule logic in prose instead of updating the actual automation schedule.
