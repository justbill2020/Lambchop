# Lambchop

Lambchop is a reusable Codex skill package for setting up a repository as an autonomous local coding team.

Use it when you want Codex to inspect a greenfield or brownfield repo, create the durable workflow files, install a local work queue, schedule recurring runs, and keep advancing implementation without relying on chat history.

When the active queue runs out, Lambchop should not stop at "all tasks complete" if the PRD, roadmap, specs, or repository evidence still imply possible next advances. It creates a proposal backlog with candidate next feature sets, marks them as needing user review, shows them in the dashboard, and waits for approval before converting them into executable work items.

## Why “Lambchop”?

The name comes from *Lamb Chop’s Play-Along*, where the closing bit was “The Song That Never Ends.” That idea matched the way this Codex team is meant to work: when a run finishes, it checks whether the automation is paused. If it is still active, it triggers the next scheduler-visible run and keeps going.

So Lambchop is the little autonomous workflow that keeps moving the project forward, one verified local step after another, until you tell it to stop.

## Quick Use From Another Repo

Paste this into Codex from the target repository:

```text
Use the latest Lambchop instructions from https://github.com/justbill2020/Lambchop.

Review the README and the `autonomous-coding-team/` skill before changing this repository. If you cannot access GitHub or cannot read those files, stop and tell me exactly what access is missing.

Set up or upgrade this repository as a local-only autonomous Codex coding team using Lambchop's current contract. Preserve existing project work, inspect before asking questions, keep default safety local-only, install or repair the workflow ledgers and dashboard project API, register this repo with the single Lambchop dashboard hub, and report files changed, automation cadence, first queued work, validation evidence, dashboard status, and blockers.
```

The prompt is intentionally short. The detailed behavior lives in this repo so future installs review the current website/source instead of relying on a stale pasted wall of text.

## What Lambchop Installs

The embedded skill lives at `autonomous-coding-team/`. It contains:

- `SKILL.md`: the trigger and required setup flow
- `references/`: setup, deployment, workflow, work item, automation prompt, validation, upstream skill, and lessons references
- `assets/templates/`: reusable workflow and ledger templates for target repos
- `tools/install-skill.ps1`: local install helper for Codex

Generated target repos get their own workflow and ledgers. Lambchop itself stays the reusable source package.

## Instruction Words

Lambchop uses these words deliberately so future AI runs know how strict an instruction is:

- `Must` / `need` / `required`: mandatory. The run should treat this as part of the contract and record a blocker if it cannot comply.
- `Must not` / `forbidden`: prohibited unless the user explicitly changes the safety policy.
- `Should`: expected default. Follow it unless repo evidence shows a safer or more accurate path, then record why.
- `Could` / `may`: allowed option, not required.
- `Would`: explanatory or conditional, not a command by itself.

When instructions conflict, preserve explicit user intent first, then safety, then passing validated behavior, then convenience. If a mandatory instruction cannot be completed, Lambchop should leave clear feedback in `progress.md`, `state.json`, and the final user report.

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
4. Let Lambchop create or repair `WORKFLOW.md`, `docs/{project-slug}/state.json`, `progress.md`, `backoff.json`, `scheduled-work-plan.md`, `dashboard-data.json`, `dashboard.html`, `dashboard.compose.yml`, `dashboard.env`, `dashboard-server/`, and the weekly Codex cron automation.
5. Confirm the first queued work item and validation commands look right.
6. Let the automation run locally. It should work in `.worktrees/`, use `codex/` branches, dispatch 2-5 safe Superpowers subagent lanes when independent work exists, validate changes, commit locally, update ledgers and the dashboard, and avoid push/PR/deploy/external trackers unless you explicitly enable them.
7. Keep the automation ACTIVE while you want continuous autonomous work. Each completed run should trigger the next scheduler-visible run while preserving the weekly RRULE; PAUSED or inactive status must skip that trigger.

## Updating A Repo That Already Has Lambchop

If you previously ran Lambchop in a target repo, do not delete the existing workflow files. Ask Codex to repair and migrate the installed workflow so it preserves real project history.

Paste this from the already-configured target repo:

```text
Use the latest Lambchop instructions from https://github.com/justbill2020/Lambchop.

Review the README and the `autonomous-coding-team/` skill before changing this repository. If you cannot access GitHub or cannot read those files, stop and tell me exactly what access is missing.

This repository already has Lambchop workflow files. Upgrade the existing setup in place using Lambchop's current contract. Preserve existing work items, progress history, commits, blockers, validation evidence, leases, and automation id. Add any missing parallel orchestration, dashboard hub/project API registration, reactive status streaming, glossary, state fields, validation checks, and automation prompt updates. Keep default safety local-only and report files changed, automation cadence, first queued or next work, validation evidence, dashboard status, and blockers.
```

Expected result:

- existing history remains intact
- old work items gain the new orchestration/dashboard fields
- future runs can dispatch parallel subagents when safe
- exhausted queues generate user-review proposal backlog entries when PRD/spec evidence suggests more possible work
- the repo has a current project API that registers with the shared visual dashboard
- the first project can start the shared GUI with `docker compose --env-file docs/{project-slug}/dashboard.env -f docs/{project-slug}/dashboard.compose.yml --profile hub up --build`
- later projects can join the same dashboard with `docker compose --env-file docs/{project-slug}/dashboard.env -f docs/{project-slug}/dashboard.compose.yml up --build`
- the existing Codex automation is updated rather than duplicated
