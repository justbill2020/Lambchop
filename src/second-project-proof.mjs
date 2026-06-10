import { createPortfolioHeartbeat } from './portfolio-heartbeat.mjs';

export function runSecondProjectAdmissionProof() {
  const portfolio = createPortfolioHeartbeat({
    portfolioKey: 'lambchop-portfolio',
    totalLanes: 1,
    selfProject: { key: 'lambchop', title: 'Lambchop' },
  });

  portfolio.registerProject({ key: 'client-beta', title: 'Client Beta' });
  const activation = portfolio.activateProject('client-beta');
  const snapshot = portfolio.snapshot();

  return {
    activation,
    snapshot,
  };
}
