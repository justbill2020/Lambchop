function labelNames(issue) {
  return (issue.labels ?? []).map((label) => label.name ?? label);
}

function issueRef(number) {
  return `#${number}`;
}

function summarizeIssue(issue) {
  if (!issue) {
    return null;
  }

  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
  };
}

function parseSection(body, heading) {
  const pattern = new RegExp(`##\\s+${heading}\\s*\\n(?<body>[\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  return body.match(pattern)?.groups?.body?.trim() ?? '';
}

function parentRefs(issue) {
  return [...parseSection(issue.body ?? '', 'Parent').matchAll(/#(\d+)/g)]
    .map((match) => Number(match[1]));
}

function blockedByRefs(issue) {
  const section = parseSection(issue.body ?? '', 'Blocked by');
  const bodyRefs = !section || /none/i.test(section)
    ? []
    : [...section.matchAll(/#(\d+)/g)].map((match) => Number(match[1]));
  const commentRefs = (issue.comments ?? [])
    .filter((comment) => String(comment.body ?? '').includes('/lambchop-dependency'))
    .flatMap((comment) => (
      [...String(comment.body ?? '').matchAll(/^blocked-by:\s*#(\d+)/gim)]
        .map((match) => Number(match[1]))
    ));
  return Array.from(new Set([...bodyRefs, ...commentRefs]));
}

function isClosed(issue) {
  return String(issue.state ?? '').toUpperCase() === 'CLOSED';
}

function isHumanIssue(issue) {
  return labelNames(issue).includes('ready-for-human');
}

function isAgentReady(issue) {
  return labelNames(issue).includes('ready-for-agent');
}

function orderIssues(issues) {
  return [...issues].sort((left, right) => left.number - right.number);
}

function unresolvedBlockers(issue, byNumber) {
  return blockedByRefs(issue).filter((number) => !isClosed(byNumber.get(number) ?? {}));
}

export function createMvpPlanningLoop(options = {}) {
  const issueClient = options.issueClient ?? null;
  const planner = {
    plan({ goalIssueNumber, issues }) {
      const byNumber = new Map(issues.map((issue) => [issue.number, issue]));
      const activeGoal = byNumber.get(goalIssueNumber);
      if (!activeGoal) {
        throw new Error(`Unknown MVP goal issue: ${goalIssueNumber}`);
      }

      const childIssues = orderIssues(
        issues.filter((issue) => issue.number !== goalIssueNumber && parentRefs(issue).includes(goalIssueNumber)),
      );
      const enrichedChildren = childIssues.map((issue) => ({
        ...issue,
        blockedBy: blockedByRefs(issue),
        unresolvedBlockers: unresolvedBlockers(issue, byNumber),
      }));
      const readyIssues = enrichedChildren.filter((issue) => (
        !isClosed(issue)
        && isAgentReady(issue)
        && !isHumanIssue(issue)
        && issue.unresolvedBlockers.length === 0
      ));
      const blockedIssues = enrichedChildren.filter((issue) => (
        !isClosed(issue)
        && issue.unresolvedBlockers.length > 0
      ));
      const doneIssues = enrichedChildren.filter(isClosed);
      const humanIssues = enrichedChildren.filter((issue) => !isClosed(issue) && isHumanIssue(issue));
      const nextIssue = readyIssues[0] ?? null;

      return {
        activeGoal: summarizeIssue(activeGoal),
        childIssues: enrichedChildren,
        nextIssue: summarizeIssue(nextIssue),
        readyIssues,
        blockedIssues,
        doneIssues,
        humanIssues,
        parallelizableCandidates: readyIssues,
        status: {
          active_goal: summarizeIssue(activeGoal),
          next_issue: summarizeIssue(nextIssue),
          counts: {
            child_issues: childIssues.length,
            ready: readyIssues.length,
            blocked: blockedIssues.length,
            done: doneIssues.length,
            human: humanIssues.length,
          },
          blockers: blockedIssues.map((issue) => ({
            number: issue.number,
            title: issue.title,
            blocked_by: issue.unresolvedBlockers,
          })),
          parallelizable_candidates: readyIssues.map(summarizeIssue),
          source: 'github-issues',
          bootstrap_context: 'chat-derived plan is now represented by GitHub issues',
        },
      };
    },

    async planFromGithub({ repository, goalIssueNumber }) {
      if (!issueClient?.listIssues) {
        throw new Error('GitHub issue client with listIssues is required.');
      }

      const issues = await issueClient.listIssues({ repository, state: 'all' });
      return planner.plan({ goalIssueNumber, issues });
    },

    async postPlanningComment({ repository, plan }) {
      if (!issueClient?.createComment) {
        throw new Error('GitHub issue client with createComment is required.');
      }

      return issueClient.createComment({
        repository,
        issueNumber: plan.activeGoal.number,
        body: planner.formatPlanningComment(plan),
      });
    },

    formatPlanningComment(plan) {
      const ready = plan.parallelizableCandidates.map((issue) => issueRef(issue.number)).join(', ') || 'none';
      const blocked = plan.blockedIssues
        .map((issue) => `${issueRef(issue.number)} blocked by ${issue.unresolvedBlockers.map(issueRef).join(', ')}`)
        .join('; ') || 'none';
      const next = plan.nextIssue
        ? `${issueRef(plan.nextIssue.number)} ${plan.nextIssue.title}`
        : 'none';

      return [
        '> *This was generated by AI during triage.*',
        '',
        '## MVP planning status',
        '',
        `- Active goal: ${issueRef(plan.activeGoal.number)} ${plan.activeGoal.title}`,
        `- Next issue: ${next}`,
        `- Ready candidates: ${ready}`,
        `- Blocked issues: ${blocked}`,
        `- Done child issues: ${plan.doneIssues.length}`,
        '',
        'Bootstrap note: chat-derived planning context has been moved into GitHub Issues and Lambchop planning output.',
      ].join('\n');
    },
  };

  return planner;
}
