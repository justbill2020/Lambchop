function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function countStatuses(workItems) {
  const counts = {
    todo: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
    skipped: 0,
  };

  for (const item of workItems) {
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
  }

  return counts;
}

export function createRunEvidence() {
  const ledger = [];

  return {
    append(event) {
      ledger.push(clone(event));
    },

    entries() {
      return clone(ledger);
    },

    projectDashboard({ project, workItems, nextAction, projectFloor = null }) {
      const counts = countStatuses(workItems);
      const latestEvents = [...ledger].sort((left, right) => right.at.localeCompare(left.at));
      const completedRun = latestEvents.find((event) => event.type === 'run_completed') ?? null;
      const validationEvent = latestEvents.find((event) => event.type === 'validation_passed') ?? null;

      return {
        project: clone(project),
        ...(projectFloor ? { projectFloor: clone(projectFloor) } : {}),
        summary: {
          ...counts,
          proposals_need_review: 0,
          active_parallel_lanes: 0,
          next_action: nextAction,
        },
        active_lanes: [],
        latest_progress: latestEvents.map((event) => `${event.at}: ${event.summary}`),
        last_run: completedRun
          ? {
              run_id: completedRun.runId,
              active_work_item: completedRun.storyKey ?? null,
              summary: completedRun.summary,
              validation: validationEvent?.summary ?? '',
            }
          : null,
      };
    },
  };
}
