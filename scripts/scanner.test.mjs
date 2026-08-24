import assert from 'node:assert/strict';
import test from 'node:test';
import { scanOpportunities } from '../lib/scanner.mjs';

function issue(overrides = {}) {
  return {
    id: 101,
    html_url: 'https://github.com/acme/rocket/issues/7',
    title: 'Fix TypeScript checkout race — bounty $500 USD',
    body: 'Acceptance criteria: add tests and document expected behavior. Funded at https://algora.io/bounties/example',
    updated_at: new Date().toISOString(),
    repository_url: 'https://api.github.com/repos/acme/rocket',
    labels: [{ name: 'bounty' }],
    comments: 2,
    assignees: [],
    ...overrides,
  };
}

function response(items, ok = true) {
  return {
    ok,
    status: ok ? 200 : 403,
    headers: new Headers(),
    async json() { return { items }; },
  };
}

test('deduplicates, qualifies, and ranks protected paid work', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([issue()]);
  try {
    const result = await scanOpportunities({ token: 'test', maxResults: 10 });
    assert.equal(result.scanned, 1);
    assert.equal(result.qualified, 1);
    assert.equal(result.opportunities[0].payout, 500);
    assert.equal(result.opportunities[0].source, 'acme/rocket');
    assert.equal(result.opportunities[0].competition, 'Low visible');
    assert.equal(result.opportunities[0].recommendation, 'VERIFY FIRST');
    assert.ok(result.opportunities[0].moneyScore > 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects listings without recognized payment protection', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([issue({ body: 'Acceptance criteria: add tests. No escrow or platform link.' })]);
  try {
    const result = await scanOpportunities();
    assert.equal(result.qualified, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects assigned or visibly claimed work', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([issue({ assignees: [{ login: 'other-dev' }] })]);
  try {
    const result = await scanOpportunities();
    assert.equal(result.qualified, 0);
    assert.equal(result.rejectionSummary['Already assigned'], 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects grant applications owned by another applicant', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([issue({
    title: 'Grant Application - Existing Privacy Network',
    body: 'Applicant Information. Requested Grant Amount (USD): $50,000. Milestone funded. Covers 400 hours.',
    repository_url: 'https://api.github.com/repos/example/community-grants',
    labels: [{ name: 'Grant Application' }],
    assignees: [],
  })]);
  try {
    const result = await scanOpportunities();
    assert.equal(result.qualified, 0);
    assert.equal(result.rejectionSummary['Grant ownership record'], 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects already awarded or in-progress projects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([issue({
    title: 'Build mobile combat system — reward $30,000 USD',
    body: 'Acceptance criteria and funded milestone at https://algora.io/bounties/example. Milestone 1: Closed / Paid.',
    labels: [{ name: 'Awarded' }],
    assignees: [],
  })]);
  try {
    const result = await scanOpportunities();
    assert.equal(result.qualified, 0);
    assert.equal(result.rejectionSummary['Already awarded or in progress'], 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('penalizes visible competition on otherwise actionable work', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([issue({ comments: 22 })]);
  try {
    const result = await scanOpportunities();
    assert.equal(result.qualified, 1);
    assert.equal(result.opportunities[0].competition, 'High');
    assert.ok(result.opportunities[0].riskFlags.includes('High visible competition'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
