# PRD: Lambchop Godot Dashboard Plugin

## Problem Statement

Lambchop currently treats dashboard functionality as part of the project onboarding template. That creates a risk that every Lambchop-managed project grows its own dashboard behavior, UI surface, and maintenance burden. Bill wants a cleaner split: a shared, game-like dashboard experience built as a Codex plugin using the Godot engine, while each onboarded project only exposes a standardized API communicator to the shared Lambchop dashboard.

## Solution

Create a local Codex plugin concept called Lambchop Godot Dashboard. The plugin owns the dashboard user experience, Godot scene model, visual language, cross-project operating views, and dashboard control surface. Lambchop project onboarding should stop generating dashboard UI functionality. Instead, onboarding should generate or repair a small project API communicator that publishes standardized Lambchop data into the shared dashboard contract.

The dashboard should feel like an interactive operations game for autonomous coding work: agents, queues, blockers, leases, validation, scheduler health, and project status should be visible as meaningful state in a spatial interface. The game-like layer should make workflow status easier to understand and manage, not hide operational truth behind decoration.

Bill clarified that the emotional goal matters: the dashboard should reduce the feeling that every AI chat is spinning wheels and hard to orchestrate. The product should make agent work feel like a coordinated, inspectable game loop. Agents may have light personalities, roles, moods, or status expressions so the system feels alive and easier to manage, while still grounding every visible state in real Lambchop evidence.

## User Stories

1. As Bill, I want one shared Lambchop dashboard plugin, so that every project uses the same operating picture.
2. As Bill, I want onboarded projects to generate only an API communicator, so that dashboard UI code does not sprawl across projects.
3. As Bill, I want dashboard data standardized, so that I can compare autonomous coding projects consistently.
4. As Bill, I want the dashboard to feel game-like, so that agent/project management is easier to scan and more engaging.
5. As Bill, I want stale project APIs to remain visible, so that a missing project does not silently disappear.
6. As Bill, I want active agents and leases shown clearly, so that I can see what is running and what might be stuck.
7. As Bill, I want blockers to be visually obvious, so that I can intervene where a decision or repair is needed.
8. As Bill, I want validation evidence surfaced, so that the dashboard reflects real workflow progress instead of status-only movement.
9. As a Lambchop automation, I want dashboard control requests queued rather than executed directly, so that automation remains the executor of repo changes.
10. As a project API communicator, I want a stable schema, so that I can expose project state without understanding the dashboard UI.
11. As a future project maintainer, I want no project-local dashboard UI generation, so that onboarding remains small and easy to upgrade.
12. As a dashboard user, I want multi-project navigation, so that I can move between managed repos from one hub.
13. As a dashboard user, I want scheduler health and parked-anchor status visible, so that I can trust unattended automation state.
14. As a dashboard user, I want proposal/review needs visible, so that future work does not hide in local JSON.
15. As a dashboard user, I want control actions to be constrained, so that the dashboard cannot become an unsafe shell runner.
16. As Bill, I want agents to have light personalities or role identities, so that orchestration feels more engaging than managing anonymous chat threads.
17. As Bill, I want the dashboard to make stalled work obvious, so that I can tell the difference between real progress and wheel-spinning.
18. As Bill, I want orchestration to feel fun without becoming fake, so that the interface helps me stay engaged while preserving trustworthy workflow evidence.

## Implementation Decisions

- Build a personal Codex plugin named `lambchop-godot-dashboard`.
- The plugin owns dashboard design, dashboard behavior, Godot scene architecture, and shared operating metaphors.
- Lambchop-managed projects expose a project API communicator instead of project-local dashboard UI.
- The communicator publishes normalized Lambchop data: project identity, queue counts, work items, leases, blockers, validation, scheduler status, proposal backlog, issue tracker metadata, control requests, and event stream health.
- Dashboard control actions remain queued requests. Automation consumes and executes them through normal validation, ledger, and commit rules.
- Huashu Design is required before visual direction, prototype, motion, or dashboard UI decisions.
- Huashu Design should be used as the visual direction and prototype layer for this dashboard. The design should avoid generic dashboard tropes and explore playful, game-like orchestration metaphors that still serve repeated operational use.
- Agent identity is allowed as a UX layer: agents can have names, roles, status expressions, and lightweight personalities. These identities must map to real capabilities, assignments, state, and evidence rather than fictional progress.
- Agent personalities should start as role-based identities, not individual recurring characters. Initial roles include Scout for investigation/context gathering, Builder for implementation, Verifier for validation/evidence, Steward for ledgers/scheduler/handoff, and Strategist for planning/mission breakdown. Individual agent history can later add flavor such as repeated blockers, current mood, or recent success/failure patterns.
- The first core play loop is Mission Board -> Assign Crew -> Watch Turns -> Resolve Evidence. Issues appear as missions; role agents are assigned to missions; AI turns appear as inspectable moves; outcomes are resolved through real evidence such as validation passed, blocked, needs decision, shipped, or stale.
- The first visual/game metaphor is a studio production floor rather than a tactical operations map. Issues are productions or jobs, role agents are the crew, AI turns are work sessions, blockers are jams, validation is quality check, and shipped work moves to a release wall.
- The first spatial interaction model is a crew-map kanban board: small role-agent characters move issues, PRDs, MVP items, and other work cards between workflow rooms or buckets. The feeling can be inspired by the readable top-down movement of social-deduction crew games, but the dashboard must use original Lambchop visual language rather than copying third-party game characters, branding, maps, or assets. Selecting an issue/card drills down into specifics: current assignment, AI turns, evidence, validation, blockers, comments, queued control requests, and next action.
- The shared dashboard supports switching between connected Lambchop-managed projects. Each project appears through its API helper/communicator, and the dashboard uses that standardized feed to render the selected project's crew-map board, issue details, agent activity, scheduler state, validation evidence, and control-request queue.
- The first PRD stays local in `docs/lambchop/prds/`; it is not published to GitHub Issues per Bill's instruction.
- Existing Lambchop dashboard work should be treated as the current baseline to migrate away from, not as the target architecture.

## Testing Decisions

- Test the project API communicator contract as public behavior: given representative Lambchop state/progress/backoff/dashboard data, it returns the standardized dashboard payload.
- Test that project onboarding does not generate project-local dashboard UI files once the new architecture is implemented.
- Test dashboard control requests as queued data, not direct execution.
- Test stale project visibility and event-stream recovery behavior.
- Test validation evidence display using real ledger fields, not fabricated status.
- Godot-specific interaction tests can begin with scene-model tests or exported data fixtures before full engine integration is automated.

## Out of Scope

- Building the production Godot dashboard in this PRD drafting step.
- Publishing this PRD to GitHub Issues.
- Replacing task-22, the existing higher-priority work item for stopping status-only automation loops.
- Letting dashboard servers directly mutate arbitrary repository files.
- Designing project-specific bespoke dashboard screens during Lambchop onboarding.

## Further Notes

The key architectural shift is from "every project gets dashboard functionality" to "every project gets a communicator for the shared Lambchop dashboard." This should become a source-backed work item only after the main product boundary is confirmed and after the current real-work/source-of-truth gate is respected.
