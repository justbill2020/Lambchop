import assert from 'node:assert/strict';
import test from 'node:test';

test('story spawns missions, accepts outcomes, and exposes explicit floor ownership states', async () => {
  const { createStoryRuntime, STORY_FLOOR_STATES } = await import('../src/story-runtime.mjs');

  const runtime = createStoryRuntime();
  const story = runtime.createStory({
    key: 'story-portfolio-floor',
    title: 'Portfolio floor model',
  });

  assert.equal(story.floorState, 'office');
  assert.deepEqual(STORY_FLOOR_STATES, [
    'office',
    'handoff-to-workshop',
    'workshop',
    'handoff-to-office',
    'blocked',
  ]);

  runtime.moveStoryToFloorState(story.key, 'handoff-to-workshop');
  runtime.moveStoryToFloorState(story.key, 'workshop');

  const mission = runtime.spawnMission(story.key, {
    key: 'mission-1',
    type: 'implement',
  });

  assert.equal(mission.storyKey, story.key);
  assert.equal(runtime.getStory(story.key).activeMissionKey, 'mission-1');
  assert.equal(runtime.getStory(story.key).key, story.key);

  runtime.acceptMissionOutcome(story.key, mission.key, {
    summary: 'Implemented the first workshop slice.',
    status: 'passed',
  });

  const updatedStory = runtime.getStory(story.key);
  assert.equal(updatedStory.acceptedOutcomes.length, 1);
  assert.deepEqual(updatedStory.acceptedOutcomes[0], {
    missionKey: 'mission-1',
    summary: 'Implemented the first workshop slice.',
    status: 'passed',
  });
  assert.equal(updatedStory.activeMissionKey, null);
});
