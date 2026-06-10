import assert from 'node:assert/strict';
import test from 'node:test';

test('run evidence appends orchestration facts once and projects coherent dashboard-facing status', async () => {
  const { createRunEvidence } = await import('../src/run-evidence.mjs');

  const evidence = createRunEvidence();

  evidence.append({
    type: 'run_started',
    runId: 'run-123',
    storyKey: 'story-portfolio-floor',
    summary: 'Started workshop implementation.',
    at: '2026-06-10T21:15:00Z',
  });
  evidence.append({
    type: 'validation_passed',
    runId: 'run-123',
    summary: 'Focused runtime tests passed.',
    at: '2026-06-10T21:16:00Z',
  });
  evidence.append({
    type: 'run_completed',
    runId: 'run-123',
    storyKey: 'story-portfolio-floor',
    summary: 'Completed the workshop implementation slice.',
    at: '2026-06-10T21:17:00Z',
  });

  const projection = evidence.projectDashboard({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
      phase: 'portfolio-orchestrator-mvp0',
    },
    workItems: [
      { key: 'task-31-story-mission-floor-state-model', status: 'done', title: 'Story mission floor state' },
      { key: 'task-32-run-evidence-dashboard-projection', status: 'todo', title: 'Run evidence dashboard projection' },
    ],
    nextAction: 'Run task-32-run-evidence-dashboard-projection.',
  });

  assert.equal(evidence.entries().length, 3);
  assert.deepEqual(projection.summary, {
    todo: 1,
    in_progress: 0,
    blocked: 0,
    done: 1,
    skipped: 0,
    proposals_need_review: 0,
    active_parallel_lanes: 0,
    next_action: 'Run task-32-run-evidence-dashboard-projection.',
  });
  assert.equal(projection.last_run.run_id, 'run-123');
  assert.equal(projection.last_run.active_work_item, 'story-portfolio-floor');
  assert.equal(projection.last_run.summary, 'Completed the workshop implementation slice.');
  assert.match(projection.last_run.validation, /Focused runtime tests passed/);
  assert.deepEqual(projection.latest_progress, [
    '2026-06-10T21:17:00Z: Completed the workshop implementation slice.',
    '2026-06-10T21:16:00Z: Focused runtime tests passed.',
    '2026-06-10T21:15:00Z: Started workshop implementation.',
  ]);
  assert.deepEqual(projection.active_lanes, []);
});
