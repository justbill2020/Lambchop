import assert from 'node:assert/strict';
import test from 'node:test';

test('floor managers respond to heartbeat pressure without bypassing the meeting gate', async () => {
  const { createMeetingGate } = await import('../src/meeting-gate.mjs');
  const { createFloorManagers } = await import('../src/floor-managers.mjs');

  const meetingGate = createMeetingGate();
  const managers = createFloorManagers({ meetingGate });

  const officeAction = managers.office.respond({
    story: {
      key: 'story-portfolio-floor',
      floorState: 'office',
    },
    heartbeat: {
      result: 'fail',
      wheelSpinSignals: {
        meetingWithoutOutputStreak: 0,
        docOnlyStreak: 1,
        validationDrought: true,
        staleActiveMission: false,
        repeatedReplanLoop: false,
      },
    },
  });

  assert.equal(officeAction.action, 'schedule_meeting');
  assert.equal(officeAction.meeting.threadKey, 'story-portfolio-floor');

  meetingGate.recordAttendeeResponse(officeAction.meeting.meetingKey, 'architect', {
    decision: 'decline',
    reason: 'Need a concrete diff before another planning pass.',
  });

  const declineFollowup = managers.office.handleDecline({
    meetingKey: officeAction.meeting.meetingKey,
    threadKey: 'story-portfolio-floor',
    attendee: 'architect',
    reason: 'Need a concrete diff before another planning pass.',
  });

  assert.equal(declineFollowup.action, 'reallocate_work');
  assert.equal(declineFollowup.nextAction.responsible, 'briefing-lead');
  assert.match(declineFollowup.reason, /concrete diff/i);

  const workshopAction = managers.workshop.respond({
    story: {
      key: 'story-build',
      floorState: 'workshop',
    },
    heartbeat: {
      result: 'pass',
      wheelSpinSignals: {
        meetingWithoutOutputStreak: 0,
        docOnlyStreak: 0,
        validationDrought: false,
        staleActiveMission: false,
        repeatedReplanLoop: false,
      },
    },
  });

  assert.equal(workshopAction.action, 'continue_work');
});
