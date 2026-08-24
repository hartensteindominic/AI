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
  'is:issue is:open "algora.io" archived:false',
  'is:issue is:open "polar.sh" archived:false',
  'is:issue is:open "milestone funded" archived:false',
];

const MONEY_PATTERNS = [
  /(?:bounty|reward|budget|payout|prize)[^\d$]{0,24}\$\s?([\d,]+(?:\.\d{1,2})?)/i,
  /\$\s?([\d,]+(?:\.\d{1,2})?)\s?(?:usd|usdc|bounty|reward|budget|payout)/i,
];

function payoutOf(text: string) {
  for (const pattern of MONEY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const payout = Math.round(Number(match[1].replace(/,/g, '')));
      return payout >= 25 && payout <= 100_000 ? payout : 0;
    }
  }
  return 0;
}

function protectionOf(text: string) {
  if (/https?:\/\/(?:www\.)?algora\.io\/[^\s)]+/i.test(text)) return { label: 'Algora link', confidence: 0.88 };
  if (/https?:\/\/(?:www\.)?polar\.sh\/[^\s)]+/i.test(text)) return { label: 'Polar link', confidence: 0.86 };
  if (/escrow(?:ed)?|funds? (?:are )?(?:locked|secured)/i.test(text)) return { label: 'Escrow stated', confidence: 0.76 };
  if (/funded milestone|milestone funded/i.test(text)) return { label: 'Milestone stated', confidence: 0.7 };
  return { label: 'Unverified', confidence: 0 };
}

function automationOf(text: string, ageDays: number) {
  let score = 35;
  if (/acceptance criteria|definition of done|deliverables?|requirements?/i.test(text)) score += 18;
  if (/test(?:s|ing)?|reproduc(?:e|ible|tion)|expected behavior/i.test(text)) score += 14;
  if (/typescript|javascript|react|next\.js|node\.js|css|html/i.test(text)) score += 18;
  if (/good first issue|beginner|small|straightforward|self[- ]contained/i.test(text)) score += 10;
  if (ageDays > 14) score -= 12;
  if (/first come|first-come|already claimed|assigned to/i.test(text)) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function risksOf(text: string, ageDays: number) {
  const risks: string[] = [];
  if (ageDays > 14) risks.push('Older than 14 days');
  if (!/acceptance criteria|definition of done|deliverables?|requirements?/i.test(text)) risks.push('Acceptance criteria unclear');
  if (/first come|first-come/i.test(text)) risks.push('Speed race');
  if (/token|crypto|usdc|usdt|eth\b/i.test(text)) risks.push('Confirm payout currency');
  return risks;
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
      const automationScore = automationOf(text, ageDays);
      const riskFlags = risksOf(text, ageDays);
      const freshness = ageDays <= 7 ? 1 : ageDays <= 30 ? 0.86 : 0.65;
      const clarity = riskFlags.includes('Acceptance criteria unclear') ? 0.82 : 1;
      const probability = Math.min(0.9, Number((protection.confidence * freshness * clarity).toFixed(2)));
      const moneyScore = hours ? Math.round((payout * probability * (0.7 + automationScore / 333)) / hours) : 0;
      return {
        id: String(issue.id), title: issue.title, source: repoName(issue.repository_url),
        sourceUrl: issue.html_url, payout, hours, probability,
        competition: 'Check applicants', protection: protection.label,
        protectionVerified: protection.confidence > 0, updatedAt: issue.updated_at,
        ageDays: Math.round(ageDays), automationScore, riskFlags, moneyScore,
        recommendation: automationScore >= 70 && probability >= 0.65 && riskFlags.length <= 1 ? 'VERIFY FIRST' : 'REVIEW',
      };
    }).filter(o => o.payout >= 50 && o.protectionVerified && o.moneyScore > 0 && o.ageDays <= 45)
      .sort((a, b) => b.moneyScore - a.moneyScore || b.automationScore - a.automationScore).slice(0, 24);

    return NextResponse.json({
      opportunities,
      scannedAt: new Date().toISOString(),
      scanned: unique.size,
      qualified: opportunities.length,
      authenticated: Boolean(token),
      methodology: 'Open + explicit payout + linked/stated protection + updated within 45 days. Ranking adjusts expected return for clarity, freshness, and automation fit.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Scanner unavailable',
      opportunities: [],
    }, { status: 502 });
  }
}
