import assert from 'node:assert/strict';
import test from 'node:test';

test('a second project can be registered without becoming active when capacity is exhausted', async () => {
  const { createPortfolioHeartbeat } = await import('../src/portfolio-heartbeat.mjs');

  const portfolio = createPortfolioHeartbeat({
    portfolioKey: 'lambchop-portfolio',
    totalLanes: 1,
    selfProject: { key: 'lambchop', title: 'Lambchop' },
  });

  portfolio.registerProject({ key: 'client-beta', title: 'Client Beta' });

  const activation = portfolio.activateProject('client-beta');
  const snapshot = portfolio.snapshot();

  assert.equal(activation.activated, false);
  assert.equal(activation.reason, 'no_capacity');
  assert.deepEqual(snapshot.projects.registered.map((project) => project.key), ['lambchop', 'client-beta']);
  assert.deepEqual(snapshot.projects.active.map((project) => project.key), ['lambchop']);
});
