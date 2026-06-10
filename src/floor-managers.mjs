export function createFloorManagers({ meetingGate }) {
  return {
    office: {
      respond({ story, heartbeat }) {
        if (story.floorState === 'office' && heartbeat.result === 'fail') {
          const meeting = meetingGate.requestMeeting({
            threadKey: story.key,
            organizer: 'briefing-lead',
            requiredAttendees: ['architect'],
            optionalAttendees: ['planner'],
            expectedOutput: 'Choose the next concrete correction path.',
            accountableOwner: 'briefing-lead',
          });

          return {
            action: 'schedule_meeting',
            meeting,
          };
        }

        return { action: 'continue_work' };
      },

      handleDecline({ threadKey, attendee, reason }) {
        return {
          action: 'reallocate_work',
          reason,
          nextAction: {
            threadKey,
            title: `Produce the concrete artifact requested by ${attendee}.`,
            responsible: 'briefing-lead',
            accountable: 'briefing-lead',
            consulted: [attendee],
            informed: ['planner'],
          },
        };
      },
    },

    workshop: {
      respond({ heartbeat }) {
        if (heartbeat.result === 'pass') {
          return { action: 'continue_work' };
        }

        return { action: 'escalate' };
      },
    },
  };
}
