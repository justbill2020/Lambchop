function parseFeedback(body = '') {
  const lines = body.split(/\r?\n/);
  const firstContentLine = lines.find((line) => line.trim())?.trim();
  if (firstContentLine !== '/lambchop-feedback') {
    return null;
  }

  const fields = {};
  for (const line of lines) {
    const match = line.match(/^([a-z-]+):\s*(.+)$/i);
    if (match) {
      fields[match[1].toLowerCase()] = match[2].trim();
    }
  }
  return fields;
}

function notAuthorized(issueNumber) {
  return {
    status: 'not-authorized',
    issue_number: issueNumber,
    capability: 'open-linked-pr',
    may_open_pr: false,
    auto_merge: false,
  };
}

function isPrApproval(fields, issueNumber) {
  return fields?.intent === 'approve'
    && fields.target === `#${issueNumber}`
    && /linked PR|linked pull request|open.+PR|open.+pull request/i.test(fields.message ?? '');
}

export function createPrAuthorizationIntake(options = {}) {
  const issueClient = options.issueClient;

  return {
    fromComments({ issueNumber, comments }) {
      const matchingComment = (comments ?? []).find((comment) => (
        isPrApproval(parseFeedback(comment.body), issueNumber)
      ));

      if (!matchingComment) {
        return notAuthorized(issueNumber);
      }

      return {
        status: 'authorized',
        issue_number: issueNumber,
        capability: 'open-linked-pr',
        may_open_pr: true,
        auto_merge: false,
        source_comment_url: matchingComment.url ?? null,
        authorized_by: matchingComment.author?.login ?? null,
        authorized_at: matchingComment.createdAt ?? null,
        scope: 'single-dogfood-proof-run',
      };
    },

    async fromGithub({ repository, issueNumber }) {
      const comments = await issueClient.listComments({ repository, issueNumber });
      return this.fromComments({ issueNumber, comments });
    },
  };
}
