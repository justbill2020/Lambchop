function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createMeetingGate() {
  const meetings = new Map();
  const threadState = new Map();
  let nextMeetingId = 1;

  function getThreadState(threadKey) {
    if (!threadState.has(threadKey)) {
      threadState.set(threadKey, {
        blockedByNextAction: null,
      });
    }
    return threadState.get(threadKey);
  }

  return {
    requestMeeting({
      threadKey,
      organizer,
      requiredAttendees,
      optionalAttendees,
      expectedOutput,
      accountableOwner,
    }) {
      const state = getThreadState(threadKey);
      if (state.blockedByNextAction && !state.blockedByNextAction.worked) {
        throw new Error('A spawned next action must be worked before another meeting is allowed on this thread.');
      }

      const meetingKey = `meeting-${nextMeetingId++}`;
      const meeting = {
        meetingKey,
        threadKey,
        mode: 'party',
        organizer,
        requiredAttendees,
        optionalAttendees,
        expectedOutput,
        accountableOwner,
        attendees: {},
        result: null,
        nextAction: null,
      };
      meetings.set(meetingKey, meeting);
      return clone(meeting);
    },

    recordAttendeeResponse(meetingKey, attendee, response) {
      const meeting = meetings.get(meetingKey);
      if (!meeting) {
        throw new Error(`Unknown meeting: ${meetingKey}`);
      }
      meeting.attendees[attendee] = clone(response);
      return clone(meeting);
    },

    completeMeeting(meetingKey, { result, nextAction }) {
      const meeting = meetings.get(meetingKey);
      if (!meeting) {
        throw new Error(`Unknown meeting: ${meetingKey}`);
      }

      meeting.result = result;
      if (result === 'fail') {
        if (!nextAction) {
          throw new Error('Failed meetings must spawn a concrete next action.');
        }
        meeting.nextAction = clone(nextAction);
        const state = getThreadState(meeting.threadKey);
        state.blockedByNextAction = {
          key: nextAction.key,
          worked: false,
        };
      }

      return clone(meeting);
    },

    markNextActionWorked(threadKey, actionKey) {
      const state = getThreadState(threadKey);
      if (!state.blockedByNextAction || state.blockedByNextAction.key !== actionKey) {
        throw new Error(`Unknown next action for thread: ${actionKey}`);
      }
      state.blockedByNextAction.worked = true;
    },
  };
}
