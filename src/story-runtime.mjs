export const STORY_FLOOR_STATES = [
  'office',
  'handoff-to-workshop',
  'workshop',
  'handoff-to-office',
  'blocked',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createStoryRuntime() {
  const stories = new Map();
  const missions = new Map();

  function getStoryRecord(storyKey) {
    const story = stories.get(storyKey);
    if (!story) {
      throw new Error(`Unknown story: ${storyKey}`);
    }
    return story;
  }

  return {
    createStory({ key, title }) {
      const story = {
        key,
        title,
        floorState: 'office',
        activeMissionKey: null,
        acceptedOutcomes: [],
      };
      stories.set(key, story);
      return clone(story);
    },

    getStory(storyKey) {
      return clone(getStoryRecord(storyKey));
    },

    moveStoryToFloorState(storyKey, floorState) {
      if (!STORY_FLOOR_STATES.includes(floorState)) {
        throw new Error(`Unknown floor state: ${floorState}`);
      }
      const story = getStoryRecord(storyKey);
      story.floorState = floorState;
      return clone(story);
    },

    spawnMission(storyKey, { key, type }) {
      const story = getStoryRecord(storyKey);
      const mission = {
        key,
        storyKey,
        type,
        status: 'active',
      };
      missions.set(key, mission);
      story.activeMissionKey = key;
      return clone(mission);
    },

    acceptMissionOutcome(storyKey, missionKey, outcome) {
      const story = getStoryRecord(storyKey);
      const mission = missions.get(missionKey);
      if (!mission || mission.storyKey !== storyKey) {
        throw new Error(`Unknown mission for story: ${missionKey}`);
      }

      mission.status = outcome.status;
      story.acceptedOutcomes.push({
        missionKey,
        summary: outcome.summary,
        status: outcome.status,
      });
      story.activeMissionKey = null;

      return clone(story);
    },
  };
}
