# PRD: Lambchop Portfolio Orchestrator Production Floor

## Problem Statement

Lambchop currently has the beginnings of an autonomous coding workflow, but it does not yet behave like a trustworthy AFK development studio. The current system still risks spinning wheels: status updates, doc churn, planning churn, and dashboard motion can happen without enough material progress. It also lacks a coherent multi-project operating model, a disciplined execution hierarchy, and a visual orchestration metaphor that makes active work, blockers, meetings, and self-improvement understandable at a glance.

Bill wants Lambchop to become the best AFK development tool available: a portfolio-level orchestrator that can manage multiple projects, run many specialized agents in parallel, use role-based prompts and skills such as Matt Pocock's skills and BMAD-style role agents, and make progress visible through a fun but truthful production-floor interface. The system must remain grounded in real outcomes, not AI theater. A reprompt-only recovery path should be treated as a Lambchop failure, not as acceptable orchestration.

The MVP path is explicit:

- MVPv0: Lambchop must be able to fully continue development of Lambchop from within Lambchop.
- MVPv1: Lambchop must be able to admit and orchestrate additional Projects beyond itself.

Bill also wants to get out of Codex as the host app as soon as practical. Lambchop should eventually be able to use local agent CLIs such as Codex CLI, Cursor CLI, and Claude CLI through adapter seams and local authentication flows, while making Codex CLI the first production-ready adapter because it has the most available usage capacity.

## Solution

Turn Lambchop into a portfolio-level orchestration product with one global heartbeat controller and a production-floor operating model. Projects live inside a Portfolio. Each Project contains Epics, Features, and Stories. Story is the required execution unit. A Story spawns Missions; it does not turn into one. Mission outcomes are accepted back into the Story before Story completion.

The orchestrator owns AFK execution, concurrency, capacity allocation, meeting discipline, floor handoffs, self-improvement escalation, and dashboard projection. The visual metaphor is a Studio Production Floor with two main floors:

- Office: a fluid planning floor for briefing, story shaping, architecture, planning, and course correction.
- Workshop: a structured execution floor with Build, Asset, and Integration zones.

The system uses GitHub Issues first and foremost for Story identity and human-visible work tracking, while a local run evidence module records machine-speed orchestration facts such as validation, scheduler state, handoffs, and mission/run history. The orchestration dashboard becomes a first-class adapter over this unified projection instead of an extra truth source.

The orchestrator should therefore target host independence: the host app is transitional, while the long-term execution model is Lambchop orchestrating local CLI agent adapters directly.

## User Stories

1. As Bill, I want Lambchop to manage many Projects in one Portfolio, so that I can orchestrate real work across my whole studio instead of one repo at a time.
2. As Bill, I want Lambchop itself to be a first-class Project in that Portfolio, so that Lambchop can improve itself without becoming a special-case blind spot.
3. As Bill, I want Story to be the required execution unit, so that all AFK work, validation, meetings, and outputs stay anchored to concrete work.
4. As Bill, I want Stories to spawn Missions instead of turning into them, so that planning identity remains stable while execution can branch and retry.
5. As Bill, I want Story outcomes to be accepted back into the Story before completion, so that work does not disappear into branch-local or agent-local claims.
6. As Bill, I want Office and Workshop floors with different operating styles, so that planning work and execution work stop pretending to be the same kind of activity.
7. As Bill, I want the Office to feel collaborative and fluid, so that intake, grilling, architecture, and planning look like shared shaping rather than fake kanban.
8. As Bill, I want the Workshop to feel structured, so that build, asset production, and integration look like a real production flow.
9. As Bill, I want Story cards to be the main visual object on the production floor, so that GitHub-backed work identity stays central in the dashboard.
10. As Bill, I want role agents visibly assigned to Stories, so that I can see who is doing what without losing the Story as the center of truth.
11. As Bill, I want multiple specialized agents running in parallel, so that Lambchop can cover brainstorming, spec, build, review, assets, and repair at the same time.
12. As Bill, I want that parallelism governed by one global heartbeat controller, so that capacity, concurrency, meetings, and self-improvement do not fight each other.
13. As Bill, I want project admission to require available capacity, so that the Portfolio does not overcommit itself and pretend everything is actively orchestrated.
14. As Bill, I want registered but not yet active Projects to remain visible, so that waiting work stays on the radar instead of disappearing.
15. As Bill, I want one protected lane per active Project with elastic extra capacity, so that no active Project starves while hotter Projects can still expand.
16. As Bill, I want Lambchop self-improvement to be elastic and throttled first when external Projects need capacity, so that Lambchop does not become self-obsessed.
17. As Bill, I want course correction to return a Story fully to the Office until planning is complete, so that Workshop execution does not continue on half-corrected assumptions.
18. As Bill, I want explicit Story floor ownership states, so that Office, Workshop, and blocked handoffs are legible in the dashboard and in orchestration.
19. As Bill, I want BMAD-style role agents in the Office, so that collaborative planning can use specialized perspectives instead of one blended narrator.
20. As Bill, I want Matt Pocock-style small composable skills to be usable within roles and Missions, so that Lambchop can pull in focused behaviors like architecture review, grilling, prototype, diagnose, and TDD.
21. As Bill, I want party mode meetings where each participant speaks distinctly, so that planning and review conversations feel like a real team instead of one faceless assistant.
22. As Bill, I want to join Meetings in real time or review them later, so that AFK work stays inspectable and interruptible.
23. As Bill, I want Meetings to be first-class tracked objects, so that decisions, assignments, declines, and outcomes are reviewable instead of buried in chat.
24. As Bill, I want agents to be able to decline Meetings with reasons, so that poor meeting requests generate feedback and improve over time.
25. As Bill, I want required vs optional meeting attendees, so that the system stops oversummoning agents and diluting productivity.
26. As Bill, I want Meetings to declare expected outputs up front, so that planning conversations can be judged by outcomes instead of vibes.
27. As Bill, I want Meetings and Missions to be pass/fail only, so that the system cannot cheat with gray-area narrative outcomes.
28. As Bill, I want a failed Meeting to spawn a concrete next action and require work on that action before another Meeting on the same thread, so that meetings cannot recursively turn into more meetings.
29. As Bill, I want next actions to use RACI logic, so that responsibility and accountability are always explicit.
30. As Bill, I want blocked to mean real human interaction is required, so that a human reprompt is never treated as legitimate orchestration.
31. As Bill, I want Lambchop failures to spawn Lambchop self-improvement Stories, so that orchestration defects are treated as product work.
32. As Bill, I want severity thresholds for Lambchop failures, so that portfolio-wide harm can preempt normal work while minor usability issues do not.
33. As Bill, I want severity history to be visible in the dashboard, so that auto-escalation and overrides remain auditable.
34. As Bill, I want wheel-spin detection at Story, Project, and Portfolio scope, so that status theater is punished no matter where it appears.
35. As Bill, I want the Studio Production Floor visual metaphor to feel fun and alive, so that orchestration is engaging without becoming fake.
36. As a Floor Manager, I want to schedule Meetings only when they serve material progress, so that coordination time stays subordinate to real work.
37. As an Office role agent, I want to collaborate in party mode on Story shaping and architecture, so that specialized reasoning remains visible and attributable.
38. As a Workshop role agent, I want scoped execution lanes attached to Story Missions, so that build work stays parallelizable and auditable.
39. As a Portfolio controller, I want material progress rate as the top-level optimization target with guardrails, so that capacity decisions remain understandable and outcome-focused.
40. As a Project, I want project-level validation, stale-work, intervention, and meeting-load signals, so that my health can be compared honestly against other Projects.
41. As Lambchop, I want to improve agents, skills, and orchestration workflows through the same Story/Mission/Meeting model, so that self-improvement uses the same discipline as client work.
42. As Bill, I want MVPv0 to prove Lambchop can continue Lambchop development from within Lambchop, so that self-hosting is proven before the product broadens.
43. As Bill, I want MVPv1 to admit additional Projects only after the self-hosting path is real, so that the portfolio model expands from a proven core.
44. As Bill, I want Lambchop to use local CLI agent adapters instead of depending on a host app forever, so that orchestration can outgrow Codex-the-host.
45. As Bill, I want Codex CLI to be the first production-ready adapter, so that the first self-hosted path uses the tool with the most available usage capacity.
46. As Bill, I want Cursor CLI and Claude CLI to fit behind the same adapter seam later, so that Lambchop can choose between local agent runtimes without changing its orchestration model.

## Implementation Decisions

- Build Lambchop around a Portfolio -> Project -> Epic / Feature / Story planning hierarchy and a Story -> Mission -> Run Container -> Lane execution hierarchy.
- Keep Story as the required execution unit and GitHub-backed primary work record.
- Define Mission as a spawned execution slice from a Story. Missions can cover briefing, grill, spec, breakdown, implement, asset, review, validate, and repair work.
- Treat Mission as dashboard language for active Story work, not as a replacement for Story identity.
- Introduce a deep Orchestrator module that owns work selection, mission spawning, Codex CLI prompt execution, AFK visibility, integration, evidence projection, and scheduler finalization.
- Introduce a CLI agent adapter seam under the Orchestrator. The seam should support multiple local agent runtimes over time while presenting one orchestration interface to Lambchop.
- Make Codex CLI the first production-ready adapter behind that seam for MVPv0.
- Treat Cursor CLI and Claude CLI as follow-on adapters behind the same seam after the Codex CLI-backed self-hosting path is proven.
- Prefer local CLI agent prompt sessions as the native execution path behind the orchestrator seam. Embedded IDE hosts such as Cursor or in-app Codex remain optional adapters, not the primary orchestration runtime.
- Support both one-shot and long-lived execution through a common run container interface. Session type is an implementation choice; AFK visibility and drilldown are the real interface.
- Keep host independence explicit in the architecture: Codex-the-host is transitional, while Lambchop-as-orchestrator is the target product posture.
- Add a run evidence module with an append-only run evidence ledger for machine-speed facts. This module records run events, validation, scheduler facts, handoffs, commit facts, and mission/run outcomes, then projects them into dashboard, memory, and status adapters.
- Keep GitHub Issues first and foremost for Story identity, human-visible status, approval, and discussion. Use local evidence storage for fine-grained automation facts rather than flooding GitHub with every orchestration event.
- Use one orchestration dashboard projection interface consumed by the HTML dashboard, Godot dashboard, and project API. Stop treating `dashboard-data.json` and related files as parallel hand-maintained truth stores.
- Model the Studio Production Floor with two floors:
  - Office: fluid collaborative planning floor
  - Workshop: structured execution floor
- Use first Workshop zones:
  - Build
  - Asset
  - Integration
- Keep TDD inside Build as an operating rule, not as a standalone department.
- Use first Office role agents:
  - Briefing Lead
  - Story Designer
  - Architect
  - UX / Flow
  - Planner
- Allow additional BMAD-style role agents to act as floor managers and specialized collaborators when helpful, especially for party-mode Office work and coordination.
- Treat floor managers as coordination agents that watch heartbeat signals, schedule Meetings, escalate blockers, and reallocate effort within the global controller.
- Allow Projects to be registered without being active. A Project becomes active only when the controller admits it based on available capacity.
- Use one global heartbeat controller that consumes Story-, Project-, and Portfolio-level signals. Do not split concurrency, capacity, meetings, and self-improvement into competing subsystems.
- Optimize the controller for material progress rate, constrained by wheel-spin, validation health, stale work, intervention load, conflict rate, and blocker clearability.
- Use project-level signals including material progress rate, meeting load, validation health, stale-work count, and intervention rate.
- Allow the portfolio heartbeat to shift capacity across Projects, including throttling Lambchop self-improvement when external Projects are hotter.
- Use an initial portfolio capacity policy with one protected lane per active Project, elastic extra lanes for hotter Projects, and throttling for wheel-spin-heavy Projects.
- Let Office and Workshop each work different Projects simultaneously across the Portfolio. Avoid constant floor flipping for the same Story.
- When a Story needs course correction, return it fully to Office ownership until the planning/correction outcome is complete and accepted.
- Use explicit Story floor ownership states:
  - office
  - handoff-to-workshop
  - workshop
  - handoff-to-office
  - blocked
- Define blocked as requiring real human interaction or decision. A condition solvable by merely reprompting is a Lambchop failure, not a legitimate blocked state.
- Introduce Meetings as first-class tracked objects attached to Stories, Missions, agents, skills, or Lambchop self-improvement work.
- Use party mode as a Meeting format where each invited participant speaks distinctly.
- Evaluate Meeting requests per invited agent, from that agent's point of view.
- Allow meeting responses:
  - accept
  - decline with reason
- Capture required vs optional meeting attendees.
- Require each Meeting request to declare:
  - organizer
  - required attendees
  - optional attendees
  - expected output
  - accountable owner of that output
- Require each Meeting and Mission to declare expected output up front.
- Treat Meetings and Missions as pass/fail only. Do not add an in-between “useful deviation” outcome.
- Require every failed Meeting to spawn a concrete next action, and require that action to be worked before another Meeting on the same thread is acceptable.
- Use RACI for all Story and Mission next actions:
  - Responsible must be a specific agent, floor manager, or human
  - Accountable must be exactly one owner
  - Consulted can include multiple agents or humans
  - Informed can include agents, humans, Stories, Projects, or watchers
- Introduce wheel-spin detection signals including:
  - meeting-without-output streak
  - doc-only streak
  - validation drought
  - stale active Mission
  - repeated re-plan loop
- Track wheel-spin at Story, Project, and Portfolio levels.
- Define material progress as accepted Story outcomes, accepted Mission outputs, validated source-of-truth changes, real blocker surfacing, and genuine portfolio throughput improvements. Explicitly exclude meetings, docs, summaries, status motion, branch-only motion, and dashboard-only changes from counting on their own.
- Treat Lambchop self-improvement work as ordinary Portfolio work with explicit issue categories:
  - workflow failure
  - orchestrator failure
  - agent-role failure
  - dashboard/visibility failure
  - capacity/heartbeat failure
- Use Lambchop self-improvement severity levels:
  - P0 portfolio-wide harm
  - P1 single-project severe harm
  - P2 localized orchestration defect
  - P3 usability or visibility problem
- Allow agents to propose severity, floor managers to escalate, the portfolio controller to auto-raise on hard signals, and the human to override.
- Make severity state changes visible and reviewable in the dashboard, including source, timestamp, evidence, and whether the change was agent-proposed, manager-escalated, controller-raised, or human-overridden.
- Allow Meetings aimed at improving an agent, a skill, or Lambchop itself, but subject them to the same pass/fail and concrete-next-action rules as work Meetings.
- Use the prototype skill before committing to the production-floor visual adapter implementation. The first prototype should compare visual metaphor directions, with Studio Production Floor as the lead concept.
- Borrow what fits from Matt Pocock's skills and Sandcastle:
  - small composable skill-style execution
  - worktree-aware parallel execution
  - AFK run containers
  - captured/reviewable sessions
- Borrow what fits from BMAD:
  - specialized role agents
  - party-mode collaboration in Office work
  - role-specific prompt discipline
  - scale-adaptive process thinking

## Testing Decisions

- Good tests verify external behavior through public interfaces, not internal implementation details. The orchestration controller, meeting gate, and projection systems should be tested by their observable outcomes and state transitions.
- Test the Orchestrator through public behavior: given portfolio/project/story/mission state plus heartbeat signals, it admits work, allocates capacity, throttles meetings, and changes floor ownership correctly.
- Test the run evidence module as a deep module with a small interface: append evidence events and read projections; verify that projections remain coherent across dashboard, memory, and scheduler-facing adapters.
- Test Story/Mission behavior through public state transitions: Story spawns Mission, Mission passes/fails, Mission outcomes attach back to Story, Story ownership moves between Office and Workshop, blocked only occurs for real human-required dependencies.
- Test meeting discipline through public outcomes:
  - Meeting pass/fail
  - failed Meeting must spawn a concrete next action
  - another Meeting on the same thread is rejected until the next action has been worked
  - per-agent accept/decline behavior and reasons are recorded and surfaced
- Test wheel-spin detection through externally visible signals rather than transcript heuristics alone.
- Test capacity and admission through portfolio behavior: registered-but-not-active Projects remain visible; active admission is denied when no capacity is available.
- Test severity logic through public escalation behavior and audit trails.
- Test the dashboard projection and floor visual model through public payloads and prototype interactions rather than implementation details of the rendering layer.
- Relevant modules to test first:
  - global heartbeat controller
  - project admission and capacity allocator
  - story/mission state model
  - meeting request gate and pass/fail rules
  - run evidence module and projection interface
  - severity/escalation model
- Prior art already exists in the repo for:
  - workflow-contract behavior tests
  - hook behavior tests
  - dashboard projection and registry tests
  - Godot dashboard behavior tests

## Out of Scope

- Full production implementation of the portfolio orchestrator, floor managers, heartbeat controller, or meeting system in this PRD drafting step.
- Full support for every planned local CLI adapter in MVPv0. Codex CLI-first implementation is in scope first; Cursor CLI and Claude CLI support can follow behind the shared seam.
- Settling every future specialized agent role beyond the first Office set and first floor-manager shape.
- Locking the final rendering technology for the orchestration dashboard before the prototype comparison proves the visual direction.
- Modeling every possible Mission type, severity nuance, or wheel-spin signal in the first release.
- Replacing GitHub Issues with a bespoke issue tracker.
- Treating meetings, docs, or dashboard updates as material progress by default.

## Further Notes

The main product risk this PRD is designed to counter is AI wheel-spin: the system appearing active while not producing enough material outcomes. Every major design choice in this PRD should be evaluated against that failure mode.

The production-floor metaphor matters because it gives the operator a studio-level mental model, but the metaphor must remain an adapter over real orchestration truth rather than becoming the source of truth itself.

This PRD should remain local for now. It is intended to guide the next prototype, design, and implementation planning steps inside Lambchop before deciding how to break the work into executable Stories and Missions.
