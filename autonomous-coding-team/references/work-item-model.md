# Work Item Model

## State File Shape
The generated state file under `docs/` includes:

- `project`: identity, workflow paths, branch/worktree conventions, autonomy policy
- `project.parallel_execution`: adaptive 2-5 subagent policy and fallback
- `project.dashboard_policy`: dashboard data and HTML regeneration policy
- `work_items`: ordered queue
- `proposal_backlog`: optional candidate next work that needs user review before becoming work items
- `last_run`: latest summary, active item, and next action

## Statuses
Use only:

- `todo`
- `in_progress`
- `blocked`
- `done`
- `skipped`

If Markdown Kanban folders are used instead of JSON state, include every status folder in task discovery and validation, including blocked and review. Blocked and review items are active workflow states, not archive folders.

`needs_user_review` is not a work item status. Use it only on entries in `proposal_backlog`, where the user must approve, reject, or edit suggested next feature sets before Lambchop converts them into `todo` work items.

## Proposal Backlog Shape
```json
{
  "key": "proposal-01-next-feature-set",
  "title": "Candidate next feature set",
  "status": "needs_user_review",
  "rationale": "Why this follows from the PRD, roadmap, or repo evidence.",
  "source_refs": ["PRD.md#section"],
  "suggested_acceptance_criteria": ["Observable result the user could approve."],
  "risk_notes": "Known unknowns or decisions the user should consider.",
  "parallelization_notes": "Whether this can split into independent work items."
}
```

## Required Work Item Fields
Each item includes:

- `key`
- `title`
- `type`
- `status`
- `priority`
- `dependencies`
- `source_refs`
- `acceptance_criteria`
- `implementation_notes`
- `validation`
- `branch`
- `worktree`
- `commit`
- `blocker`
- `orchestration`
- `assigned_subagent`
- `parallel_group`
- `dispatch_status`
- `integration_status`
- `exclusive_scope`
- `shared_scope`
- `lease`
- `next_step`
- `integration`
- `updated_at`

For tasks that require private local inputs, include the expected ignored path or environment variable in `implementation_notes`, the safety checks in `validation`, and the missing condition in `blocker` when unavailable.

For milestone packets, each item still needs distinct acceptance criteria, exclusive scope, validation, and ownership notes. Shared files belong in `shared_scope`.

## Lease Shape
```json
{
  "run_id": null,
  "owner": null,
  "claimed_at": null,
  "expires_at": null,
  "heartbeat_at": null
}
```

## Orchestration Shape
```json
{
  "mode": "single-item",
  "parallel_group": null,
  "orchestrator_run_id": null,
  "parallelism_reason": "Fewer than 2 independent eligible work items were available."
}
```

`mode` is `single-item` or `parallel-lane`. `dispatch_status` is one of `not_dispatched`, `dispatched`, `completed`, `blocked`, `conflicted`, `failed_validation`, or `not_useful`. `integration_status` records whether the orchestrator has integrated the lane into the target branch or left it blocked for follow-up.

Default lease duration is 120 minutes. Default max concurrent runs is 5.

## Integration Shape
```json
{
  "target_branch": "main",
  "status": "not_ready",
  "merged_at": null,
  "merge_commit": null,
  "reconciled_at": null
}
```

## Concurrency Rules
A live `in_progress` item is not a global lock. Another run may select a different eligible item only when:

- dependencies are satisfied
- the item is `todo`
- its `exclusive_scope` does not overlap any live leased item
- concurrency cap has not been reached

The parallel sprint packet uses the same dependency and scope rules, but selects 2 to 5 independent items and assigns one bounded subagent lane per item. If fewer than 2 independent items are eligible, record why parallelism was not useful and continue with one item.

Shared files such as root manifests, lockfiles, configs, and docs belong in `shared_scope`. Shared scope overlap does not automatically block work, but it must be recorded as an integration risk and reconciled later.

## Review State
`review` is not part of the default JSON status set. If a target repo already uses a Markdown Kanban with `review`, treat it as pending fresh consolidation. Do not mark review items done until the relevant checks have just passed and the proof log records the result.
