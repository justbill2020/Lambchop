# Lambchop Context

## Terms

- **Lambchop**: the reusable Codex skill and template project for deploying autonomous coding teams.
- **GitHub Issues module**: the primary module for work identity, human-visible status, discussion, approval, and major progress across Lambchop work.
- **Epic**: a larger product or project outcome that groups related Features and Stories.
- **Feature**: a user-visible or operator-visible capability that can span multiple Stories and assets.
- **Story**: the primary GitHub-backed work item for Lambchop orchestration; a concrete unit of work with a clear objective, acceptance shape, and drilldown history.
- **Mission**: the orchestration-dashboard view of active work. In the preferred model, a Mission usually maps to one Story, while Epics and Features provide the higher-level hierarchy above it.
- **Meeting**: a real-time or reviewable multi-agent conversation attached to a Story or Mission, where role agents and the operator can collaborate, question, decide, and record outcomes.
- **Party mode**: a Meeting format where multiple specialized agents speak as distinct participants rather than collapsing into one blended narrator.
- **Meeting request**: a proposed Meeting with declared expected output, organizer, participants, and justification.
- **Meeting decline**: an explicit refusal by an invited agent or manager to join a Meeting, including a reason that can be used to improve future Meeting requests or agent behavior.
- **Local execution queue**: `docs/lambchop/state.json`, the local coordination ledger that mirrors executable queue state, project policy, and run next-action state for automation.
- **Orchestrator**: the primary module that selects work, spawns Codex CLI prompt sessions, integrates results, updates projections, and finalizes scheduler state.
- **Floor manager**: a role agent responsible for keeping one floor or department moving by watching heartbeat signals, scheduling Meetings, escalating blockers, and reallocating effort.
- **Embedded IDE adapter**: an optional adapter such as Cursor or in-app Codex hosting that may be used when available, but is not the native execution model for orchestration.
- **AFK functionality**: unattended project work that continues through the Orchestrator without requiring the operator to stay in an embedded IDE session.
- **Run container**: the inspectable AFK execution record for one Story or Mission attempt, including state, evidence, transcript, artifacts, child lanes, and controls.
- **Lane**: one concurrent agent track inside a run container, usually scoped to one asset or one bounded slice of a Story.
- **Asset**: any concrete output Lambchop can orchestrate, including code, docs, specs, designs, dashboard UI, tests, or other production artifacts.
- **Run evidence module**: the deepened module responsible for recording run events, validation facts, scheduler facts, handoff facts, and commit facts, then projecting those facts into human-readable and dashboard-facing adapters.
- **Run evidence ledger**: the append-only ledger owned by the run evidence module.
- **Orchestration dashboard**: the primary operator-facing adapter for live Lambchop orchestration, consumed through the HTML dashboard, Godot dashboard, and project API.
- **Dashboard projection**: the adapter-facing status view consumed by the orchestration dashboard.
- **Execution policy**: the rules that decide when Lambchop implements directly, defers to automation, blocks completion, or requires source-of-truth evidence.
