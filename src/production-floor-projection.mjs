function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function missionZone(missionType, floorState) {
  if (floorState === 'office' || floorState === 'handoff-to-workshop') {
    return 'planning';
  }

  if (floorState === 'blocked') {
    return 'blocked';
  }

  if (floorState === 'handoff-to-office') {
    return 'integration';
  }

  switch (missionType) {
    case 'asset':
    case 'prototype':
      return 'asset';
    case 'integrate':
    case 'validate':
    case 'review':
      return 'integration';
    default:
      return 'build';
  }
}

function validationState(evidence) {
  if (evidence.some((event) => event.type === 'validation_passed')) {
    return 'passed';
  }

  if (evidence.some((event) => event.type === 'validation_failed')) {
    return 'failed';
  }

  return 'unknown';
}

function blockerSummary(floorState, evidence) {
  if (floorState !== 'blocked') {
    return null;
  }

  return evidence.find((event) => event.type.includes('blocked'))?.summary ?? 'Blocked';
}

function blockedPosture(floorState, evidence) {
  if (floorState !== 'blocked') {
    return null;
  }

  if (evidence.some((event) => event.type === 'human_blocked')) {
    return 'waiting-on-human';
  }

  if (evidence.some((event) => event.type === 'agent_blocked')) {
    return 'waiting-on-agent';
  }

  return 'blocked';
}

function studioPlacement(missionType, floorState) {
  if (floorState === 'blocked') {
    return {
      floor: 'downstairs',
      room: 'workshop',
      station: 'blocked-bay',
      handoffTarget: null,
    };
  }

  if (floorState === 'office') {
    return {
      floor: 'upstairs',
      room: 'office',
      station: missionType === 'brief' ? 'briefing-desk' : 'story-shaping-desk',
      handoffTarget: null,
    };
  }

  if (floorState === 'handoff-to-workshop') {
    return {
      floor: 'upstairs',
      room: 'office',
      station: 'story-shaping-desk',
      handoffTarget: {
        floor: 'downstairs',
        room: 'workshop',
        station: 'build-bay',
      },
    };
  }

  if (floorState === 'handoff-to-office') {
    return {
      floor: 'downstairs',
      room: 'workshop',
      station: 'integration-bay',
      handoffTarget: {
        floor: 'upstairs',
        room: 'office',
        station: 'course-correction-desk',
      },
    };
  }

  switch (missionType) {
    case 'asset':
    case 'prototype':
      return {
        floor: 'downstairs',
        room: 'workshop',
        station: 'asset-bench',
        handoffTarget: null,
      };
    case 'integrate':
    case 'validate':
    case 'review':
      return {
        floor: 'downstairs',
        room: 'workshop',
        station: 'integration-bay',
        handoffTarget: null,
      };
    default:
      return {
        floor: 'downstairs',
        room: 'workshop',
        station: 'build-bay',
        handoffTarget: null,
      };
  }
}

export function createProductionFloorProjection() {
  return {
    projectFloor({ project, stories = [], missions = [], evidence = [] }) {
      const missionsByStoryKey = new Map(
        missions.map((mission) => [mission.storyKey, clone(mission)]),
      );
      const evidenceByStoryKey = new Map();

      for (const event of evidence) {
        const storyEvents = evidenceByStoryKey.get(event.storyKey) ?? [];
        storyEvents.push(clone(event));
        evidenceByStoryKey.set(event.storyKey, storyEvents);
      }

      const projectedStories = stories.map((story) => {
        const mission = missionsByStoryKey.get(story.key) ?? null;
        const storyEvidence = evidenceByStoryKey.get(story.key) ?? [];
        const region = story.floorState === 'blocked'
          ? 'blocked'
          : story.floorState === 'office' || story.floorState === 'handoff-to-workshop'
            ? 'office'
            : 'workshop';
        const zone = missionZone(mission?.type ?? null, story.floorState);
        const studio = studioPlacement(mission?.type ?? null, story.floorState);

        return {
          key: story.key,
          title: story.title,
          floorState: story.floorState,
          mission,
          acceptedOutcomes: clone(story.acceptedOutcomes ?? []),
          placement: {
            region,
            zone,
            floor: studio.floor,
            room: studio.room,
            station: studio.station,
            handoffTarget: studio.handoffTarget,
          },
          validation: validationState(storyEvidence),
          blocker: blockerSummary(story.floorState, storyEvidence),
          blockedPosture: blockedPosture(story.floorState, storyEvidence),
          crewLocation: {
            floor: studio.floor,
            room: studio.room,
            station: studio.station,
            ...(story.floorState === 'blocked'
              ? { posture: blockedPosture(story.floorState, storyEvidence) }
              : {}),
          },
        };
      });

      return {
        project: clone(project),
        studio: {
          floors: {
            upstairs: {
              label: 'Office',
              roomKeys: ['office'],
              storyKeys: projectedStories
                .filter((story) => story.placement.floor === 'upstairs')
                .map((story) => story.key),
            },
            downstairs: {
              label: 'Workshop',
              roomKeys: ['workshop'],
              storyKeys: projectedStories
                .filter((story) => story.placement.floor === 'downstairs')
                .map((story) => story.key),
            },
          },
        },
        regions: {
          office: {
            storyKeys: projectedStories
              .filter((story) => story.placement.region === 'office')
              .map((story) => story.key),
          },
          workshop: {
            zones: {
              build: {
                storyKeys: projectedStories
                  .filter((story) => story.placement.region === 'workshop' && story.placement.zone === 'build')
                  .map((story) => story.key),
              },
              asset: {
                storyKeys: projectedStories
                  .filter((story) => story.placement.region === 'workshop' && story.placement.zone === 'asset')
                  .map((story) => story.key),
              },
              integration: {
                storyKeys: projectedStories
                  .filter((story) => story.placement.region === 'workshop' && story.placement.zone === 'integration')
                  .map((story) => story.key),
              },
            },
          },
          blocked: {
            storyKeys: projectedStories
              .filter((story) => story.placement.region === 'blocked')
              .map((story) => story.key),
          },
        },
        stories: projectedStories,
      };
    },
  };
}
