// Local-only guide review tool (terminal version). Run: npm run review
// For a browser-based version with a rendered preview, see: npm run review:web

import readline from 'node:readline/promises';
import {
  loadDevVars,
  parseSubmissionData,
  listPendingIssues,
  approveSubmission,
  rejectSubmission
} from './review-lib.mjs';

async function main() {
  const { token, repo } = await loadDevVars().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });

  const issues = await listPendingIssues(repo, token);
  if (issues.length === 0) {
    console.log('No pending submissions.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(`${issues.length} pending submission(s).\n`);

  for (const issue of issues) {
    const submission = parseSubmissionData(issue.body);
    console.log('='.repeat(60));
    console.log(`#${issue.number}: ${issue.title}`);
    console.log(`  ${issue.html_url}`);
    console.log('-'.repeat(60));
    console.log(issue.body?.replace(/<!-- SUBMISSION_DATA[\s\S]*?-->/, '').trim());
    console.log('='.repeat(60));

    if (!submission) {
      console.log('(No structured data on this submission - it predates the review tool.)');
      const action = await rl.question('[r]eject / [s]kip / [q]uit: ');
      if (action === 'q') break;
      if (action === 'r') {
        const reason = await rl.question('Reason (blank to skip explaining): ');
        await rejectSubmission({ repo, token, issue, reason });
        console.log(`Closed issue #${issue.number}.\n`);
      }
      continue;
    }

    const action = await rl.question('[a]pprove / [r]eject / [s]kip / [q]uit: ');
    if (action === 'q') break;
    if (action === 'a') {
      const { slug } = await approveSubmission({ repo, token, issue, submission });
      console.log(`Wrote src/content/guides/en/${slug}.md and closed issue #${issue.number}.`);
      console.log(`Run "npm run build" to see it live locally.\n`);
    } else if (action === 'r') {
      const reason = await rl.question('Reason (shown to the submitter, blank to skip explaining): ');
      await rejectSubmission({ repo, token, issue, reason });
      console.log(`Closed issue #${issue.number}.\n`);
    }
  }

  rl.close();
}

main();
