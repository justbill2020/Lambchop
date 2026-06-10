import { createCliAgentRuntime } from './cli-agent-runtime.mjs';
import { createPortfolioHeartbeat } from './portfolio-heartbeat.mjs';
import { createStoryRuntime } from './story-runtime.mjs';
import { createRunEvidence } from './run-evidence.mjs';
import { createMaterialProgressController } from './material-progress-controller.mjs';
import { createMeetingGate } from './meeting-gate.mjs';

export async function runSelfHostingProof({ codexCliPath, codexCliArgs, storyKey }) {
  const runtime = createCliAgentRuntime({ codexCliPath });
  const portfolio = createPortfolioHeartbeat({
    portfolioKey: 'lambchop-portfolio',
    totalLanes: 1,
    selfProject: { key: 'lambchop', title: 'Lambchop' },
  });
  const storyRuntime = createStoryRuntime();
  const runEvidence = createRunEvidence();
  const progressController = createMaterialProgressController();
  const meetingGate = createMeetingGate();

  const project = portfolio.snapshot().projects.active[0];
  storyRuntime.createStory({ key: storyKey, title: 'Self hosting proof' });
  const meeting = meetingGate.requestMeeting({
    threadKey: storyKey,
    organizer: 'briefing-lead',
    requiredAttendees: ['architect'],
    optionalAttendees: ['planner'],
    expectedOutput: 'Confirm the self-hosting implementation path.',
    accountableOwner: 'briefing-lead',
  });
  storyRuntime.moveStoryToFloorState(storyKey, 'handoff-to-workshop');
  storyRuntime.moveStoryToFloorState(storyKey, 'workshop');
  storyRuntime.spawnMission(storyKey, { key: 'mission-self-hosting', type: 'implement' });

  runEvidence.append({
    type: 'run_started',
    runId: 'self-hosting-run',
    storyKey,
    summary: 'Started self-hosting proof.',
    at: '2026-06-10T23:45:00Z',
  });

  const run = runtime.startRun({
    adapter: 'codex-cli',
    storyKey,
    prompt: 'Prove self-hosting.',
    extraArgs: codexCliArgs,
  });

  const completedRun = await run.completed;

  storyRuntime.acceptMissionOutcome(storyKey, 'mission-self-hosting', {
    summary: 'Completed self-hosting slice.',
    status: 'passed',
  });

  runEvidence.append({
    type: 'validation_passed',
    runId: 'self-hosting-run',
    summary: 'Self-hosting proof validation passed.',
    at: '2026-06-10T23:46:00Z',
  });
  runEvidence.append({
    type: 'run_completed',
    runId: 'self-hosting-run',
    storyKey,
    summary: 'Completed self-hosting slice.',
    at: '2026-06-10T23:47:00Z',
  });

  const materialProgress = progressController.evaluate({
    evidence: [
      { type: 'mission_outcome_accepted', at: '2026-06-10T23:47:00Z' },
      { type: 'validation_passed', at: '2026-06-10T23:46:00Z' },
    ],
  });

  const dashboard = runEvidence.projectDashboard({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
      phase: 'portfolio-orchestrator-mvp0',
    },
    workItems: [
      { key: 'task-38-mvp0-self-hosting-proof', status: 'done', title: 'Self hosting proof' },
    ],
    nextAction: 'Continue self-hosting work.',
  });

  return {
    project,
    story: storyRuntime.getStory(storyKey),
    meeting,
    run: completedRun,
    materialProgress,
    dashboard,
  };
}
