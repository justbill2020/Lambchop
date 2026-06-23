#!/usr/bin/env node
import { createCoordinatorCli } from '../src/coordinator-cli.mjs';
import { createGhIssueClient } from '../src/github-issue-client.mjs';

const cli = createCoordinatorCli({
  issueClient: createGhIssueClient(),
});

const result = await cli.run(process.argv.slice(2));
process.exitCode = result.exitCode;
