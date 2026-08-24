import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type GithubIssue = {
  id: number; html_url: string; title: string; body: string | null;
  created_at: string; updated_at: string; repository_url: string;
  labels: Array<{ name?: string } | string>;
  pull_request?: unknown;
};

const QUERIES = [
  'is:issue is:open label:bounty archived:false',
  'is:issue is:open label:reward archived:false',
  'is:issue is:open "milestone funded" archived:false',
];

const MONEY_PATTERNS = [
  /(?:bounty|reward|budget|payout|prize)[^\d$]{0,24}\$\s?([\d,]+(?:\.\d{1,2})?)/i,
  /\$\s?([\d,]+(?:\.\d{1,2})?)\s?(?:usd|usdc|bounty|reward|budget|payout)/i,
];

function payoutOf(text: string) {
  for (const pattern of MONEY_PATTERNS) {
    const match = text.match(pattern);
    if (match) return Math.round(Number(match[1].replace(/,/g, '')));
  }
  return 0;
}

function protectionOf(text: string) {
  if (/algora|polar\.sh|polar bounty/i.test(text)) return { label: 'Platform bounty', confidence: 0.82 };
  if (/escrow(?:ed)?|funds? (?:are )?(?:locked|secured)/i.test(text)) return { label: 'Escrow stated', confidence: 0.76 };
  if (/funded milestone|milestone funded/i.test(text)) return { label: 'Milestone stated', confidence: 0.7 };
  return { label: 'Unverified', confidence: 0 };
}

function hoursOf(text: string) {
  const explicit = text.match(/(?:estimate|estimated|effort|time)\D{0,16}(\d+(?:\.\d+)?)\s*(?:h|hours?)/i);
  if (explicit) return Math.max(1, Math.min(80, Number(explicit[1])));
  const length = text.length;
  return length < 1200 ? 4 : length < 3000 ? 8 : 14;
}

function repoName(url: string) {
  return url.replace('https://api.github.com/repos/', '');
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const responses = await Promise.all(QUERIES.map(q =>
      fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=30`, {
        headers, cache: 'no-store',
      })
    ));

    if (responses.some(r => !r.ok)) {
      const failed = responses.find(r => !r.ok)!;
      throw new Error(`GitHub scanner returned ${failed.status}`);
    }

    const payloads = await Promise.all(responses.map(r => r.json()));
    const unique = new Map<number, GithubIssue>();
    payloads.flatMap(p => p.items as GithubIssue[]).forEach(issue => {
      if (!issue.pull_request) unique.set(issue.id, issue);
    });

    const now = Date.now();
    const opportunities = Array.from(unique.values()).map(issue => {
      const labels = issue.labels.map(label => typeof label === 'string' ? label : label.name || '').join(' ');
      const text = `${issue.title}\n${issue.body || ''}\n${labels}`;
      const payout = payoutOf(text);
      const protection = protectionOf(text);
      const hours = hoursOf(text);
      const ageDays = Math.max(0, (now - new Date(issue.updated_at).getTime()) / 86400000);
      const freshness = ageDays <= 7 ? 1 : ageDays <= 30 ? 0.86 : 0.65;
      const probability = Math.min(0.9, Number((protection.confidence * freshness).toFixed(2)));
      return {
        id: String(issue.id), title: issue.title, source: repoName(issue.repository_url),
        sourceUrl: issue.html_url, payout, hours, probability,
        competition: 'Check applicants', protection: protection.label,
        protectionVerified: protection.confidence > 0, updatedAt: issue.updated_at,
        moneyScore: hours ? Math.round((payout * probability) / hours) : 0,
      };
    }).filter(o => o.payout >= 50 && o.protectionVerified && o.moneyScore > 0)
      .sort((a, b) => b.moneyScore - a.moneyScore).slice(0, 24);

    return NextResponse.json({
      opportunities,
      scannedAt: new Date().toISOString(),
      scanned: unique.size,
      qualified: opportunities.length,
      authenticated: Boolean(token),
      methodology: 'Only open issues with an explicit payout and payment-protection evidence qualify.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Scanner unavailable',
      opportunities: [],
    }, { status: 502 });
  }
}
