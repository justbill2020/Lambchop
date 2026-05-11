# Lambchop

Lambchop is a reusable Codex skill package for setting up a repository as an autonomous local coding team.

Use it when you want Codex to inspect a greenfield or brownfield repo, create the durable workflow files, install a local work queue, schedule recurring runs, and keep advancing implementation without relying on chat history.

## Why “Lambchop”?

The name comes from *Lamb Chop’s Play-Along*, where the closing bit was “The Song That Never Ends.” That idea matched the way this Codex team is meant to work: when a run finishes, it checks whether the automation is paused. If it is still active, it triggers the next scheduler-visible run and keeps going.

So Lambchop is the little autonomous workflow that keeps moving the project forward, one verified local step after another, until you tell it to stop.

## Quick Use From Another Repo

Paste this into Codex from the target repository:

```text
Use the latest Lambchop autonomous coding team skill from `git@github.com:justbill2020/Lambchop.git`, using the skill at `autonomous-coding-team/`.

Set up this repository as a local-only autonomous Codex coding team.

Before asking me questions, inspect the repo, git status, remotes, docs, specs, README, TODOs, package manifests, test/build/lint/typecheck commands, existing workflow files, and existing Codex automations.

Classify the repo as greenfield, docs/spec-only, existing app/library, partially configured, or already automated.

If required upstream skills are missing, install or link them from their current GitHub source when available. For Superpowers, use the upstream repo https://github.com/obra/superpowers and its Codex install guide instead of embedding or copying a cached local version.

Then generate or repair:
- WORKFLOW.md
- docs/{project-slug}/state.json
- docs/{project-slug}/progress.md
- docs/{project-slug}/backoff.json
- docs/{project-slug}/scheduled-work-plan.md
- docs/{project-slug}/dashboard-data.json
- docs/{project-slug}/dashboard.html
- docs/{project-slug}/dashboard.compose.yml
- docs/{project-slug}/dashboard-server/
- a Codex cron automation that reads WORKFLOW.md first
- a weekly Codex cron schedule that can be nudged with a scheduler-visible run-now trigger after each completed ACTIVE run

Default autonomy is local-only: worktrees, codex/ branches, code/docs edits, validation, local commits, state/progress/backoff updates, and scheduler updates are allowed. Pushes, PRs, deploys, production config changes, external trackers, and reverting user work are forbidden unless I explicitly enable them.

Use adaptive parallel sprint orchestration by default: when 2 to 5 independent work items are dependency-safe and have non-overlapping exclusive scope, the main automation run should dispatch bounded Superpowers subagents while remaining the orchestrator for integration, validation, dashboard regeneration, commits, and scheduler finalization. If fewer than 2 independent items are eligible, continue with one item and record why parallelism was not useful.

Install the repo-local live dashboard after setup and keep the workflow ledgers current during every automation run. The dashboard server reads real state, scheduled work, progress, backoff, validation, leases, blockers, commits, and next-action data while the automation is flowing.

When you want to view live status in a browser, start the Dockerized status server from the generated docs folder:

```bash
cd docs/{project-slug}
docker compose -f dashboard.compose.yml up --build
```

Then open `http://127.0.0.1:8765/dashboard.html`. The container mounts only that docs folder read-only and refreshes live status from `/api/status` every couple seconds.

Use the proven autonomous workflow pattern where it fits: repo-local workflow as the operating contract, durable Markdown or JSON task state, task work logs, small reviewable slices, review gates, automation memory, and clear handoff notes.

When the target project uses Markdown Kanban, include blocked and review folders in task discovery, validation, context lookup, and no-work reasoning. Treat review as pending fresh consolidation, not done.

If a task needs a private local file, credential, service, or operator-owned fixture, require an ignored path or environment-only configuration. Record only bounded public evidence and keep the private content out of commits, logs, generated docs, and public payloads.

Finish by reporting files created or updated, the automation id and cadence, the first queued work item, validation evidence, and exact blockers.
```

## What Lambchop Installs

The embedded skill lives at `autonomous-coding-team/`. It contains:

- `SKILL.md`: the trigger and required setup flow
- `references/`: setup, deployment, workflow, work item, automation prompt, validation, upstream skill, and lessons references
- `assets/templates/`: reusable workflow and ledger templates for target repos
- `tools/install-skill.ps1`: local install helper for Codex

Generated target repos get their own workflow and ledgers. Lambchop itself stays the reusable source package.

## Required Skills

Lambchop embeds the `autonomous-coding-team` skill only. It does not vendor Superpowers.

For disciplined planning, TDD, subagent coordination, debugging, and verification, install Superpowers from upstream when available:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

The current Codex guide for Superpowers is at:

- https://github.com/obra/superpowers/blob/main/docs/README.codex.md

That guide documents cloning `https://github.com/obra/superpowers.git`, linking its `skills/` folder into Codex skill discovery, and enabling Codex multi-agent support for subagent skills.

## Greenfield Setup

For a new or empty repo, Lambchop should:

1. Inspect git status, branch, remotes, and whether an initial commit exists.
2. Ask only for missing project purpose, first milestone, project slug, and safety policy decisions.
3. Generate the workflow and ledgers from templates.
4. Create the first source-backed setup or implementation item.
5. Validate JSON ledgers, placeholder removal, local-only safety defaults, and git preflight.

## Brownfield Setup

For an existing app/library repo, Lambchop should:

1. Infer the stack and commands from repo files before asking questions.
2. Use existing specs, docs, README, plans, TODOs, tests, and failing checks as the first queue source.
3. Reuse or update any overlapping Codex automation instead of creating a duplicate.
4. Repair existing workflow/state/progress/backoff files instead of overwriting useful history.
5. Create small, reviewable work items with validation expectations and isolated write scopes.

## Local Installation

To make the skill available in Codex from this checkout:

```powershell
pwsh -NoProfile -File autonomous-coding-team\tools\install-skill.ps1
```

For live editing during Lambchop development:

```powershell
pwsh -NoProfile -File autonomous-coding-team\tools\install-skill.ps1 -Mode junction
```

Restart Codex after installing or linking so skill discovery refreshes.

## Applying Lambchop To A New Project

1. Open Codex in the target project checkout.
2. Paste the prompt from “Quick Use From Another Repo.”
3. Answer only the project decisions Codex cannot infer after inspection, such as the first milestone and any autonomy limits.
4. Let Lambchop create or repair `WORKFLOW.md`, `docs/{project-slug}/state.json`, `progress.md`, `backoff.json`, `scheduled-work-plan.md`, `dashboard-data.json`, `dashboard.html`, `dashboard.compose.yml`, `dashboard-server/`, and the weekly Codex cron automation.
5. Confirm the first queued work item and validation commands look right.
6. Let the automation run locally. It should work in `.worktrees/`, use `codex/` branches, dispatch 2-5 safe Superpowers subagent lanes when independent work exists, validate changes, commit locally, update ledgers and the dashboard, and avoid push/PR/deploy/external trackers unless you explicitly enable them.
7. Keep the automation ACTIVE while you want continuous autonomous work. Each completed run should trigger the next scheduler-visible run while preserving the weekly RRULE; PAUSED or inactive status must skip that trigger.

## Updating A Repo That Already Has Lambchop

If you previously ran Lambchop in a target repo, do not delete the existing workflow files. Ask Codex to repair and migrate the installed workflow so it preserves real project history.

Paste this from the already-configured target repo:

```text
Use the latest Lambchop autonomous coding team skill from `git@github.com:justbill2020/Lambchop.git`, using the skill at `autonomous-coding-team/`.

This repository already has Lambchop workflow files. Upgrade the existing setup in place instead of overwriting history.

Before editing, inspect WORKFLOW.md, docs/{project-slug}/state.json, progress.md, backoff.json, scheduled-work-plan.md, any dashboard files, git status, worktrees, branches, validation commands, and existing Codex automations.

Migrate the installed workflow to the latest Lambchop contract:
- preserve existing work items, progress history, commits, blockers, validation evidence, leases, and automation id
- add adaptive parallel sprint orchestration with 2-5 Superpowers subagent lanes when independent work exists
- keep the main automation run as orchestrator for dispatch, integration, validation, dashboard regeneration, commits, and scheduler finalization
- add or repair docs/{project-slug}/dashboard-data.json and docs/{project-slug}/dashboard.html
- add or repair docs/{project-slug}/dashboard.compose.yml and docs/{project-slug}/dashboard-server/ so the dashboard can be viewed through a local Dockerized status server
- add any missing state fields such as parallel_execution, dashboard_policy, orchestration, assigned_subagent, parallel_group, dispatch_status, and integration_status
- update the automation prompt so it reads WORKFLOW.md first and follows the upgraded contract
- keep local-only safety defaults unless I explicitly enable push, PR, deploy, production config changes, or external trackers

Validate the upgraded setup by parsing JSON ledgers, checking for unresolved placeholders outside templates, confirming the Dockerized live dashboard serves `/api/status`, and recording the upgrade evidence in progress.md.
```

Expected result:

- existing history remains intact
- old work items gain the new orchestration/dashboard fields
- future runs can dispatch parallel subagents when safe
- the repo has a current visual dashboard
- the dashboard can be viewed live with `docker compose -f docs/{project-slug}/dashboard.compose.yml up --build`
- the existing Codex automation is updated rather than duplicated
