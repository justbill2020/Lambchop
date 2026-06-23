import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('live dashboard feed includes the unified production-floor projection', () => {
  const dashboard = JSON.parse(readFileSync('docs/lambchop/dashboard-data.json', 'utf8'));

  assert.equal(dashboard.projectFloor.project.slug, 'lambchop');
  assert.ok(dashboard.projectFloor.studio.floors.upstairs.storyKeys.length > 0);
  assert.ok(dashboard.projectFloor.studio.floors.downstairs.storyKeys.length > 0);

  const projectedStory = dashboard.projectFloor.stories.find(
    (story) => story.mission && story.placement && story.crewLocation,
  );

  assert.ok(projectedStory, 'expected at least one story with mission, placement, and crew location');
  assert.match(projectedStory.placement.station, /desk|bay|bench/);
});
