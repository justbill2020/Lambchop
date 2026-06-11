import assert from 'node:assert/strict';
import test from 'node:test';

import { createProductionFloorProjection } from '../src/production-floor-projection.mjs';

test('production-floor projection maps story-owned work into office, workshop zones, and blocked lanes', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    stories: [
      {
        key: 'story-office',
        title: 'Shape the production floor',
        floorState: 'office',
        activeMissionKey: 'mission-brief',
        acceptedOutcomes: [],
      },
      {
        key: 'story-build',
        title: 'Implement build zone projection',
        floorState: 'workshop',
        activeMissionKey: 'mission-build',
        acceptedOutcomes: [],
      },
      {
        key: 'story-blocked',
        title: 'Resolve human blocker',
        floorState: 'blocked',
        activeMissionKey: 'mission-blocked',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-brief', storyKey: 'story-office', type: 'brief', status: 'active' },
      { key: 'mission-build', storyKey: 'story-build', type: 'implement', status: 'active' },
      { key: 'mission-blocked', storyKey: 'story-blocked', type: 'repair', status: 'active' },
    ],
    evidence: [
      { type: 'validation_passed', storyKey: 'story-build', at: '2026-06-11T15:00:00Z', summary: 'Build proof passed.' },
      { type: 'human_blocked', storyKey: 'story-blocked', at: '2026-06-11T15:05:00Z', summary: 'Waiting on Bill decision.' },
    ],
  });

  assert.equal(projection.project.slug, 'lambchop');
  assert.deepEqual(projection.regions.office.storyKeys, ['story-office']);
  assert.deepEqual(projection.regions.workshop.zones.build.storyKeys, ['story-build']);
  assert.deepEqual(projection.regions.workshop.zones.asset.storyKeys, []);
  assert.deepEqual(projection.regions.workshop.zones.integration.storyKeys, []);
  assert.deepEqual(projection.regions.blocked.storyKeys, ['story-blocked']);

  assert.deepEqual(
    projection.stories.map((story) => ({
      key: story.key,
      region: story.placement.region,
      zone: story.placement.zone,
      missionType: story.mission?.type ?? null,
      validation: story.validation,
      blocker: story.blocker,
    })),
    [
      {
        key: 'story-office',
        region: 'office',
        zone: 'planning',
        missionType: 'brief',
        validation: 'unknown',
        blocker: null,
      },
      {
        key: 'story-build',
        region: 'workshop',
        zone: 'build',
        missionType: 'implement',
        validation: 'passed',
        blocker: null,
      },
      {
        key: 'story-blocked',
        region: 'blocked',
        zone: 'blocked',
        missionType: 'repair',
        validation: 'unknown',
        blocker: 'Waiting on Bill decision.',
      },
    ],
  );
});

test('production-floor projection preserves handoff states while mapping asset and integration work to workshop zones', async () => {
  const projection = createProductionFloorProjection().projectFloor({
    project: {
      name: 'Lambchop',
      slug: 'lambchop',
    },
    stories: [
      {
        key: 'story-handoff-out',
        title: 'Hand story into workshop',
        floorState: 'handoff-to-workshop',
        activeMissionKey: 'mission-prototype',
        acceptedOutcomes: [],
      },
      {
        key: 'story-asset',
        title: 'Produce floor art',
        floorState: 'workshop',
        activeMissionKey: 'mission-asset',
        acceptedOutcomes: [],
      },
      {
        key: 'story-handoff-back',
        title: 'Return story to office',
        floorState: 'handoff-to-office',
        activeMissionKey: 'mission-validate',
        acceptedOutcomes: [],
      },
    ],
    missions: [
      { key: 'mission-prototype', storyKey: 'story-handoff-out', type: 'prototype', status: 'active' },
      { key: 'mission-asset', storyKey: 'story-asset', type: 'asset', status: 'active' },
      { key: 'mission-validate', storyKey: 'story-handoff-back', type: 'validate', status: 'active' },
    ],
    evidence: [],
  });

  assert.deepEqual(
    projection.stories.map((story) => ({
      key: story.key,
      floorState: story.floorState,
      region: story.placement.region,
      zone: story.placement.zone,
      missionType: story.mission?.type ?? null,
    })),
    [
      {
        key: 'story-handoff-out',
        floorState: 'handoff-to-workshop',
        region: 'office',
        zone: 'planning',
        missionType: 'prototype',
      },
      {
        key: 'story-asset',
        floorState: 'workshop',
        region: 'workshop',
        zone: 'asset',
        missionType: 'asset',
      },
      {
        key: 'story-handoff-back',
        floorState: 'handoff-to-office',
        region: 'workshop',
        zone: 'integration',
        missionType: 'validate',
      },
    ],
  );

  assert.deepEqual(projection.regions.office.storyKeys, ['story-handoff-out']);
  assert.deepEqual(projection.regions.workshop.zones.asset.storyKeys, ['story-asset']);
  assert.deepEqual(projection.regions.workshop.zones.integration.storyKeys, ['story-handoff-back']);
});
