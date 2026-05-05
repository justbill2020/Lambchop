---
name: autonomous-coding-team
description: Use when setting up, operating, repairing, or continuing a repository as an autonomous Codex coding team with local workflow files, recurring automation, work queues, progress ledgers, worktrees, branches, tests, and local commits.
---

# Autonomous Coding Team

## Overview
Turn a new or existing repository into a Codex-first autonomous coding team. The user experience is conversational: Codex inspects the repo, asks only for missing product or policy decisions, creates the local workflow system, validates it, and prepares or updates the Codex automation.

Default autonomy is local-only: worktrees, branches, code changes, tests, docs, progress ledgers, adaptive backoff, and local commits are allowed. Pushes, PRs, deploys, production config changes, and external trackers are forbidden unless the user explicitly enables them.

## Local Installation (Codex)
Install this skill into your local Codex skill folder so it can be used across repositories.

- Local skill install: [`references/local-skill-install.md`](references/local-skill-install.md)


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
6. Load `references/github-repo-deployment.md` when the user points to a GitHub repo, remote URL, or local project path to receive the autonomous team.
7. Load `references/workflow-architecture.md`, `references/work-item-model.md`, `references/scheduled-work-plan.md`, `references/automation-prompt.md`, and `references/proof-of-work.md` before writing workflow, state, progress, backoff, schedule plan, or automation prompt content.
8. Copy and customize templates from `assets/templates/`; remove all placeholders before finishing.
9. Load `references/validation-checklist.md` and validate the generated setup before claiming completion.
10. Load `references/seeitai-lessons.md` when adapting, repairing, or extending the operating contract.

## Safety Defaults
- Create implementation work in a per-item `.worktrees/` folder on a `codex/` branch named for the project slug and work item.
- Use cooperative leases; a live `in_progress` item is not a global lock.
- Use TDD for production behavior and record RED/GREEN evidence.
- Commit coherent completed changes locally with validation in the commit body.
- Update state, progress, and backoff ledgers after every run.
- After completing one item, plan or select the next eligible item from the scheduled work plan before applying backoff.
- Never publish, deploy, or mutate external trackers unless explicitly enabled by the user.

## Common Mistakes
- Asking setup questions before inspecting the repo.
- Writing a large automation prompt instead of making `WORKFLOW.md` the operating contract.
- Skipping state, progress, or backoff ledgers.
- Doing implementation work in the main checkout.
- Treating one live lease as a global lock.
- Marking work done without validation evidence.
- Hiding adaptive schedule logic in prose instead of updating the actual automation schedule.
