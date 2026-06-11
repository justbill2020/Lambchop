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

        return {
          key: story.key,
          title: story.title,
          floorState: story.floorState,
          mission,
          acceptedOutcomes: clone(story.acceptedOutcomes ?? []),
          placement: {
            region,
            zone,
          },
          validation: validationState(storyEvidence),
          blocker: blockerSummary(story.floorState, storyEvidence),
        };
      });

      return {
        project: clone(project),
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
