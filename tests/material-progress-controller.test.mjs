import assert from 'node:assert/strict';
import test from 'node:test';

test('material progress controller rejects non-material activity and exposes wheel-spin pressure', async () => {
  const { createMaterialProgressController } = await import('../src/material-progress-controller.mjs');

  const controller = createMaterialProgressController();

  const pressure = controller.evaluate({
    evidence: [
      { type: 'meeting_completed', hasOutput: false, at: '2026-06-10T21:40:00Z' },
      { type: 'doc_updated', at: '2026-06-10T21:41:00Z' },
      { type: 'status_updated', at: '2026-06-10T21:42:00Z' },
      { type: 'mission_active', missionKey: 'mission-1', stale: true, at: '2026-06-10T21:43:00Z' },
      { type: 'replan_requested', repeated: true, at: '2026-06-10T21:44:00Z' },
    ],
  });

  assert.equal(pressure.materialProgressCount, 0);
  assert.equal(pressure.result, 'fail');
  assert.deepEqual(pressure.wheelSpinSignals, {
    meetingWithoutOutputStreak: 1,
    docOnlyStreak: 1,
    validationDrought: true,
    staleActiveMission: true,
    repeatedReplanLoop: true,
  });

  const greenPressure = controller.evaluate({
    evidence: [
      { type: 'mission_outcome_accepted', at: '2026-06-10T22:00:00Z' },
      { type: 'validation_passed', at: '2026-06-10T22:01:00Z' },
    ],
  });

  assert.equal(greenPressure.materialProgressCount, 2);
  assert.equal(greenPressure.result, 'pass');
  assert.equal(greenPressure.wheelSpinSignals.validationDrought, false);
});
