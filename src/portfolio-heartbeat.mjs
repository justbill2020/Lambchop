function cloneProject(project) {
  return { ...project };
}

export function createPortfolioHeartbeat(options) {
  const portfolioKey = options.portfolioKey;
  const totalLanes = options.totalLanes;
  const projects = new Map();

  function ensureProject(project) {
    projects.set(project.key, cloneProject(project));
    return projects.get(project.key);
  }

  ensureProject({
    key: options.selfProject.key,
    title: options.selfProject.title,
    status: 'active',
  });

  function activeProjects() {
    return [...projects.values()].filter((project) => project.status === 'active');
  }

  function registeredProjects() {
    return [...projects.values()];
  }

  function capacitySnapshot() {
    const activeCount = activeProjects().length;
    const protectedLanesReserved = activeCount;
    return {
      totalLanes,
      protectedLanesReserved,
      availableLanes: Math.max(0, totalLanes - protectedLanesReserved),
    };
  }

  function snapshot() {
    return {
      portfolioKey,
      projects: {
        registered: registeredProjects().map(cloneProject),
        active: activeProjects().map(cloneProject),
      },
      capacity: capacitySnapshot(),
    };
  }

  return {
    registerProject(project) {
      return cloneProject(
        ensureProject({
          key: project.key,
          title: project.title,
          status: 'registered',
        }),
      );
    },

    activateProject(projectKey) {
      const project = projects.get(projectKey);
      if (!project) {
        throw new Error(`Unknown project: ${projectKey}`);
      }

      if (project.status === 'active') {
        return { activated: true, reason: 'already_active', project: cloneProject(project) };
      }

      if (capacitySnapshot().availableLanes < 1) {
        return { activated: false, reason: 'no_capacity', project: cloneProject(project) };
      }

      project.status = 'active';
      return { activated: true, reason: 'activated', project: cloneProject(project) };
    },

    heartbeat() {
      return snapshot();
    },

    snapshot,
  };
}
