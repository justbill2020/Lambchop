import assert from 'node:assert/strict';
import test from 'node:test';

test('failed meetings spawn a required next action and block another meeting until it is worked', async () => {
  const { createMeetingGate } = await import('../src/meeting-gate.mjs');

  const gate = createMeetingGate();

  const request = gate.requestMeeting({
    threadKey: 'story-portfolio-floor',
    organizer: 'briefing-lead',
    requiredAttendees: ['architect'],
    optionalAttendees: ['planner'],
    expectedOutput: 'Choose the next office correction path.',
    accountableOwner: 'briefing-lead',
  });

  assert.equal(request.mode, 'party');
  assert.equal(request.requiredAttendees.length, 1);
  assert.equal(request.optionalAttendees.length, 1);

  gate.recordAttendeeResponse(request.meetingKey, 'architect', { decision: 'accept' });
  gate.recordAttendeeResponse(request.meetingKey, 'planner', {
    decision: 'decline',
    reason: 'Need a concrete architecture diff before joining.',
  });

  const failedMeeting = gate.completeMeeting(request.meetingKey, {
    result: 'fail',
    nextAction: {
      key: 'action-1',
      title: 'Draft the architecture diff first.',
      raci: {
        responsible: 'briefing-lead',
        accountable: 'briefing-lead',
        consulted: ['architect'],
        informed: ['planner'],
      },
    },
  });

  assert.equal(failedMeeting.result, 'fail');
  assert.equal(failedMeeting.nextAction.key, 'action-1');
  assert.equal(failedMeeting.attendees.planner.decision, 'decline');
  assert.match(failedMeeting.attendees.planner.reason, /architecture diff/i);

  assert.throws(
    () =>
      gate.requestMeeting({
        threadKey: 'story-portfolio-floor',
        organizer: 'briefing-lead',
        requiredAttendees: ['architect'],
        optionalAttendees: [],
        expectedOutput: 'Retry the same meeting.',
        accountableOwner: 'briefing-lead',
      }),
    /worked before another meeting is allowed/,
  );

  gate.markNextActionWorked('story-portfolio-floor', 'action-1');

  const reopened = gate.requestMeeting({
    threadKey: 'story-portfolio-floor',
    organizer: 'briefing-lead',
    requiredAttendees: ['architect'],
    optionalAttendees: [],
    expectedOutput: 'Review the drafted diff.',
    accountableOwner: 'briefing-lead',
  });

  assert.equal(reopened.threadKey, 'story-portfolio-floor');
});
