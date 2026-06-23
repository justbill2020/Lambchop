import assert from 'node:assert/strict';
import test from 'node:test';

import { createFeedbackIntake } from '../src/feedback-intake.mjs';

test('feedback intake classifies explicit issue-comment feedback and links it to the active goal', () => {
  const intake = createFeedbackIntake();
  const result = intake.ingestComments({
    activeGoalIssue: 42,
    comments: [
      {
        id: 'comment-1',
        url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-1',
        author: { login: 'justbill2020' },
        body: [
          '/lambchop-feedback',
          'intent: revise',
          'target: #44',
          'scope: planning',
          'message: Use issue comments as the first feedback transport before dashboard controls exist.',
        ].join('\n'),
        createdAt: '2026-06-23T22:00:00Z',
      },
      {
        id: 'comment-2',
        url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-2',
        author: { login: 'justbill2020' },
        body: 'Ordinary discussion should not become structured feedback.',
        createdAt: '2026-06-23T22:01:00Z',
      },
    ],
  });

  assert.deepEqual(result.feedbackItems, [
    {
      key: 'feedback-comment-1',
      source: {
        type: 'github-comment',
        commentId: 'comment-1',
        url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-1',
        author: 'justbill2020',
        createdAt: '2026-06-23T22:00:00Z',
      },
      activeGoalIssue: 42,
      targetIssue: 44,
      intent: 'revise',
      scope: 'planning',
      message: 'Use issue comments as the first feedback transport before dashboard controls exist.',
      status: 'unapplied',
      safety: {
        result: 'allowed',
        reason: null,
      },
      nextAction: 'Apply revise feedback to #44.',
    },
  ]);
  assert.deepEqual(result.unappliedFeedback.map((item) => item.key), ['feedback-comment-1']);
  assert.deepEqual(result.status, {
    active_goal: 42,
    unapplied_feedback: 1,
    blocked_feedback: 0,
    next_feedback_action: 'Apply revise feedback to #44.',
  });
});

test('feedback intake blocks unsafe direct-execution feedback instead of applying it', () => {
  const intake = createFeedbackIntake();
  const result = intake.ingestComments({
    activeGoalIssue: 42,
    comments: [
      {
        id: 'comment-unsafe',
        url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-unsafe',
        author: { login: 'justbill2020' },
        body: [
          '/lambchop-feedback',
          'intent: loosen-policy',
          'target: #49',
          'scope: sandbox',
          'message: Run rm -rf C:\\Users\\BillMartin from the host machine.',
        ].join('\n'),
        createdAt: '2026-06-23T22:02:00Z',
      },
    ],
  });

  assert.equal(result.feedbackItems[0].status, 'blocked');
  assert.deepEqual(result.feedbackItems[0].safety, {
    result: 'blocked',
    reason: 'Feedback asks for direct host execution or destructive filesystem access.',
  });
  assert.equal(result.feedbackItems[0].nextAction, 'Escalate blocked loosen-policy feedback on #49.');
  assert.deepEqual(result.status, {
    active_goal: 42,
    unapplied_feedback: 0,
    blocked_feedback: 1,
    next_feedback_action: 'Escalate blocked loosen-policy feedback on #49.',
  });
});

test('feedback intake rejects unknown intents as blocked feedback', () => {
  const intake = createFeedbackIntake();
  const result = intake.ingestComments({
    activeGoalIssue: 42,
    comments: [
      {
        id: 'comment-unknown',
        url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-unknown',
        author: { login: 'justbill2020' },
        body: [
          '/lambchop-feedback',
          'intent: vibe-shift',
          'target: #42',
          'message: do it differently',
        ].join('\n'),
        createdAt: '2026-06-23T22:03:00Z',
      },
    ],
  });

  assert.equal(result.feedbackItems[0].intent, 'unknown');
  assert.equal(result.feedbackItems[0].status, 'blocked');
  assert.equal(result.feedbackItems[0].safety.reason, 'Unknown feedback intent: vibe-shift.');
});

test('feedback intake loads feedback from GitHub issue comments through an issue client', async () => {
  const calls = [];
  const intake = createFeedbackIntake({
    issueClient: {
      async listComments({ repository, issueNumber }) {
        calls.push({ repository, issueNumber });
        return [
          {
            id: 'comment-github',
            url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-github',
            author: { login: 'justbill2020' },
            body: [
              '/lambchop-feedback',
              'intent: retry',
              'target: #43',
              'scope: planning',
              'message: Regenerate the planning status after #43 lands.',
            ].join('\n'),
            createdAt: '2026-06-23T22:04:00Z',
          },
        ];
      },
    },
  });

  const result = await intake.ingestFromGithub({
    repository: 'justbill2020/Lambchop',
    activeGoalIssue: 42,
    issueNumber: 42,
  });

  assert.deepEqual(calls, [{ repository: 'justbill2020/Lambchop', issueNumber: 42 }]);
  assert.equal(result.feedbackItems[0].intent, 'retry');
  assert.equal(result.feedbackItems[0].targetIssue, 43);
});

test('feedback intake formats a durable feedback status comment', () => {
  const intake = createFeedbackIntake();
  const result = intake.ingestComments({
    activeGoalIssue: 42,
    comments: [
      {
        id: 'comment-1',
        url: 'https://github.com/justbill2020/Lambchop/issues/42#issuecomment-1',
        author: { login: 'justbill2020' },
        body: [
          '/lambchop-feedback',
          'intent: revise',
          'target: #44',
          'message: Prefer GitHub issue comments as the first feedback transport.',
        ].join('\n'),
        createdAt: '2026-06-23T22:05:00Z',
      },
    ],
  });

  assert.equal(
    intake.formatFeedbackStatusComment(result),
    [
      '> *This was generated by AI during triage.*',
      '',
      '## MVP feedback status',
      '',
      '- Active goal: #42',
      '- Unapplied feedback: 1',
      '- Blocked feedback: 0',
      '- Next feedback action: Apply revise feedback to #44.',
      '',
      'Feedback queue:',
      '- feedback-comment-1: revise for #44 - unapplied',
    ].join('\n'),
  );
});
