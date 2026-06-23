# Lambchop product north star

Lambchop is a model-agnostic AI engineering operations dashboard and orchestrator for all coding projects, with sandboxed execution and session analytics to reduce slop and churn.

## Primary goal

Move AI coding work out of scattered prompts, IDE sessions, and machine-local context into one visible orchestration layer.

The operator should be able to see, coordinate, and improve AI coding work across:

- projects
- repositories
- machines
- AI models
- CLI adapters
- sandboxes
- branches
- pull requests
- validation and review loops

Lambchop itself is the first managed project, not the only project.

## Durable work truth

GitHub Issues and pull requests are the durable work truth for GitHub-backed projects.

- Issues own backlog identity, acceptance discussion, labels, and human decisions.
- Pull requests own integration, review, CI state, merge, and issue closure.
- Issue and PR comments carry durable progress summaries and feedback.
- Local Lambchop files are runtime cache, policy, evidence, and local work logs, not the authoritative backlog.

## Orchestration model

Lambchop coordinates work through a head coordinator and machine peers.

- The coordinator provides the live dashboard, assignment decisions, feedback loop, and GitHub reconciliation.
- Machine peers report capabilities, load, heartbeat, leases, and local evidence.
- Peers create project sandboxes and issue worktrees locally.
- Claude CLI, Codex CLI, and future adapters run inside sandboxes.
- The orchestrator, not the worker, owns GitHub side effects such as issue comments and PR updates.

## Visibility model

The dashboard is the primary operator surface.

It should show:

- every managed project
- current issues and PRs
- active and historical run containers
- model/adapter choice
- host machine and sandbox
- validation and CI status
- blockers and feedback requests
- issue/PR comments posted by Lambchop
- efficiency and churn metrics

The dashboard is not just a status board. It is the control room for feedback, prioritization, and system improvement.

## Session analytics

Lambchop should analyze AI coding sessions to reduce waste.

Track:

- repeated failed validations
- retry loops
- reverted or churned files
- unnecessary prompt turns
- weak issue acceptance criteria
- model/adapter mismatch
- review rework
- time from issue claim to PR
- time from PR to merge
- human intervention points
- guardrail/policy denials

Use that analysis to improve:

- issue shape
- guardrails
- model selection
- adapter selection
- sandbox policy
- validation strategy
- orchestration scheduling

## Priority rule

Prioritize the minimum working AI engineering operations loop before additional visual polish.

The first useful loop is:

1. Discover GitHub Issues as the work source of truth.
2. Register Lambchop itself as a managed project.
3. Show Lambchop in the dashboard as one project in a portfolio.
4. Claim one issue through the coordinator.
5. Run a sandboxed Codex or Claude worker.
6. Produce a branch and linked pull request.
7. Post issue/PR progress comments.
8. Observe validation/CI/review state.
9. Feed session analytics back into the dashboard.

Production-floor and Godot views remain valuable as orchestration-view projections, but they should consume canonical runtime state rather than define execution semantics.
