import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { scanOpportunities } from '../lib/scanner.mjs';

const QUEUE_MARKER = '<!-- ghostforge-revenue-queue -->';
const QUEUE_TITLE = 'GhostForge revenue queue';

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function markdownFor(result) {
  const generated = new Date(result.scannedAt).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const totalValue = result.opportunities.reduce((sum, opportunity) => sum + opportunity.payout, 0);
  const lines = [
    QUEUE_MARKER,
    '# GhostForge revenue queue',
    '',
    `**Last scan:** ${generated} ET  `,
    `**Candidates scanned:** ${result.scanned}  `,
    `**Qualified leads:** ${result.qualified}  `,
    `**Qualified listed value:** ${money(totalValue)}`,
    '',
    '> A listing is not revenue. Verify funding, eligibility, claim rules, scope, and acceptance criteria before starting. Never send secrets or pay to apply.',
    '',
  ];

  if (!result.opportunities.length) {
    lines.push(
      '## No protected opportunities qualified',
      '',
      'GhostForge rejected listings without an explicit payout, recognized payment protection, recent activity, or a positive probability-adjusted score.',
    );
  } else {
    lines.push(
      '## Ranked opportunities',
      '',
      '| # | Opportunity | Payout | Est. | Expected $/h | Competition | Protection | Action |',
      '|---:|---|---:|---:|---:|---|---|---|',
    );

    result.opportunities.slice(0, 15).forEach((opportunity, index) => {
      const action = opportunity.recommendation === 'VERIFY FIRST' ? 'Verify first' : 'Review';
      lines.push(
        `| ${index + 1} | [${escapeCell(opportunity.title)}](${opportunity.sourceUrl})<br><sub>${escapeCell(opportunity.source)}</sub> | ${money(opportunity.payout)} | ${opportunity.hours}h | ${money(opportunity.moneyScore)} | ${escapeCell(opportunity.competition)} | ${escapeCell(opportunity.protection)} | **${action}** |`,
      );
    });

    lines.push('', '## Fast verification checklist', '');
    result.opportunities.slice(0, 5).forEach((opportunity) => {
      const risks = opportunity.riskFlags.length ? ` Risks: ${opportunity.riskFlags.join('; ')}.` : '';
      lines.push(`- [ ] [${escapeCell(opportunity.title)}](${opportunity.sourceUrl}) — confirm funding, eligibility, claim status, and acceptance tests.${risks}`);
    });
  }

  lines.push(
    '',
    '## Ranking method',
    '',
    result.methodology,
    '',
    '_Discovery and ranking are automated. Claiming work, agreeing to terms, submitting code, invoicing, and receiving payment remain human-approved._',
  );

  return `${lines.join('\n')}\n`;
}

async function githubRequest(token, method, endpoint, body) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'GhostForge-Revenue-Loop',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub issue sync failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  return response.status === 204 ? null : response.json();
}

async function syncQueueIssue(markdown) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository || process.env.GHOSTFORGE_UPDATE_ISSUE === 'false') return null;

  const issues = await githubRequest(token, 'GET', `/repos/${repository}/issues?state=all&per_page=100&sort=updated&direction=desc`);
  const queue = issues.find((issue) => !issue.pull_request && (
    issue.title === QUEUE_TITLE || String(issue.body || '').includes(QUEUE_MARKER)
  ));

  if (queue) {
    await githubRequest(token, 'PATCH', `/repos/${repository}/issues/${queue.number}`, {
      title: QUEUE_TITLE,
      body: markdown,
    });
    return queue.number;
  }

  const created = await githubRequest(token, 'POST', `/repos/${repository}/issues`, {
    title: QUEUE_TITLE,
    body: markdown,
  });
  return created.number;
}

async function main() {
  const outputDirectory = path.resolve(process.env.GHOSTFORGE_OUTPUT_DIR || '.ghostforge-output');
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const result = await scanOpportunities({ token, perPage: 50, maxResults: 24 });
  const markdown = markdownFor(result);

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDirectory, 'revenue-scan.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8'),
    writeFile(path.join(outputDirectory, 'revenue-queue.md'), markdown, 'utf8'),
  ]);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, 'utf8');
  }

  const issueNumber = await syncQueueIssue(markdown);
  console.log(JSON.stringify({
    scanned: result.scanned,
    qualified: result.qualified,
    issueNumber,
    outputDirectory,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
