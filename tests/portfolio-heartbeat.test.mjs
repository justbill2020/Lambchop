import assert from 'node:assert/strict';
import test from 'node:test';

test('portfolio heartbeat keeps Lambchop active, distinguishes registered projects, and denies activation without capacity', async () => {
  const { createPortfolioHeartbeat } = await import('../src/portfolio-heartbeat.mjs');

  const portfolio = createPortfolioHeartbeat({
    portfolioKey: 'studio',
    totalLanes: 1,
    selfProject: {
      key: 'lambchop',
      title: 'Lambchop',
    },
  });

  const backlogProject = portfolio.registerProject({
    key: 'client-alpha',
    title: 'Client Alpha',
  });

  assert.equal(backlogProject.status, 'registered');

  const initialSnapshot = portfolio.snapshot();
  assert.equal(initialSnapshot.projects.registered.length, 2);
  assert.deepEqual(
    initialSnapshot.projects.active.map((project) => project.key),
    ['lambchop'],
  );
  assert.equal(initialSnapshot.capacity.protectedLanesReserved, 1);
  assert.equal(initialSnapshot.capacity.availableLanes, 0);

  const deniedActivation = portfolio.activateProject('client-alpha');

  assert.equal(deniedActivation.activated, false);
  assert.equal(deniedActivation.reason, 'no_capacity');

  const heartbeat = portfolio.heartbeat();
  assert.deepEqual(
    heartbeat.projects.registered.map((project) => project.key),
    ['lambchop', 'client-alpha'],
  );
  assert.deepEqual(
    heartbeat.projects.active.map((project) => project.key),
    ['lambchop'],
  );
  assert.equal(heartbeat.capacity.protectedLanesReserved, 1);
  assert.equal(heartbeat.capacity.availableLanes, 0);
});
