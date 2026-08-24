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

function payoutOf(text) {
  for (const pattern of MONEY_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const payout = Math.round(Number(match[1].replace(/,/g, '')));
    return payout >= 25 && payout <= 100_000 ? payout : 0;
  }
  return 0;
}

function protectionOf(text) {
  if (/https?:\/\/(?:www\.)?algora\.io\/[^\s)]+/i.test(text)) return { label: 'Algora link', confidence: 0.88 };
  if (/https?:\/\/(?:www\.)?polar\.sh\/[^\s)]+/i.test(text)) return { label: 'Polar link', confidence: 0.86 };

  const positiveText = text.replace(
    /\b(?:no|not|without|unfunded|unsecured)\b[^\n.!?]{0,28}\b(?:escrow|funded milestone|milestone funded|funds? locked|funds? secured)\b/gi,
    '',
  );
  if (/escrow(?:ed)?|funds? (?:are )?(?:locked|secured)/i.test(positiveText)) return { label: 'Escrow stated', confidence: 0.76 };
  if (/funded milestone|milestone funded/i.test(positiveText)) return { label: 'Milestone stated', confidence: 0.7 };
  return { label: 'Unverified', confidence: 0 };
}

function automationOf(text, ageDays) {
  let score = 35;
  if (/acceptance criteria|definition of done|deliverables?|requirements?/i.test(text)) score += 18;
  if (/test(?:s|ing)?|reproduc(?:e|ible|tion)|expected behavior/i.test(text)) score += 14;
  if (/typescript|javascript|react|next\.js|node\.js|css|html/i.test(text)) score += 18;
  if (/good first issue|beginner|small|straightforward|self[- ]contained/i.test(text)) score += 10;
  if (ageDays > 14) score -= 12;
  if (/first come|first-come|already claimed|assigned to/i.test(text)) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function risksOf(text, ageDays, assigneeCount, comments) {
  const risks = [];
  if (ageDays > 14) risks.push('Older than 14 days');
  if (!/acceptance criteria|definition of done|deliverables?|requirements?/i.test(text)) risks.push('Acceptance criteria unclear');
  if (/first come|first-come/i.test(text)) risks.push('Speed race');
  if (/token|crypto|usdc|usdt|eth\b/i.test(text)) risks.push('Confirm payout currency');
  if (assigneeCount > 0) risks.push('Already has assignee');
  if (comments >= 15) risks.push('High visible competition');
  return risks;
}

function hoursOf(text) {
  const explicit = text.match(/(?:estimate|estimated|effort|time)\D{0,16}(\d+(?:\.\d+)?)\s*(?:h|hours?)/i);
  if (explicit) return Math.max(1, Math.min(80, Number(explicit[1])));
  const length = text.length;
  return length < 1200 ? 4 : length < 3000 ? 8 : 14;
}

function repoName(url) {
  return url.replace('https://api.github.com/repos/', '');
}

function competitionOf(comments, assigneeCount) {
  if (assigneeCount > 0 || comments >= 15) return 'High';
  if (comments >= 6) return 'Medium';
  return 'Low visible';
}

async function githubSearch(query, headers, perPage) {
  const response = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${perPage}`,
    { headers, cache: 'no-store' },
  );

  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const detail = remaining === '0' && reset
      ? `; rate limit resets ${new Date(Number(reset) * 1000).toISOString()}`
      : '';
    throw new Error(`GitHub scanner returned ${response.status}${detail}`);
  }

  return response.json();
}

export async function scanOpportunities(options = {}) {
  const token = options.token;
  const perPage = Math.max(1, Math.min(50, Number(options.perPage || 30)));
  const maxResults = Math.max(1, Math.min(50, Number(options.maxResults || 24)));
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GhostForge-Revenue-Loop',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const payloads = await Promise.all(QUERIES.map((query) => githubSearch(query, headers, perPage)));
  const unique = new Map();

  payloads.flatMap((payload) => payload.items || []).forEach((issue) => {
    if (!issue.pull_request) unique.set(issue.id, issue);
  });

  const now = Date.now();
  const opportunities = Array.from(unique.values()).map((issue) => {
    const labels = (issue.labels || []).map((label) => typeof label === 'string' ? label : label.name || '').join(' ');
    const text = `${issue.title}\n${issue.body || ''}\n${labels}`;
    const payout = payoutOf(text);
    const protection = protectionOf(text);
    const hours = hoursOf(text);
    const ageDaysExact = Math.max(0, (now - new Date(issue.updated_at).getTime()) / 86_400_000);
    const ageDays = Math.round(ageDaysExact);
    const assigneeCount = Array.isArray(issue.assignees) ? issue.assignees.length : issue.assignee ? 1 : 0;
    const comments = Math.max(0, Number(issue.comments || 0));
    const automationScore = automationOf(text, ageDaysExact);
    const riskFlags = risksOf(text, ageDaysExact, assigneeCount, comments);
    const freshness = ageDaysExact <= 7 ? 1 : ageDaysExact <= 30 ? 0.86 : 0.65;
    const clarity = riskFlags.includes('Acceptance criteria unclear') ? 0.82 : 1;
    const competition = assigneeCount > 0 ? 0.55 : comments >= 15 ? 0.68 : comments >= 6 ? 0.82 : 1;
    const probability = Math.min(0.9, Number((protection.confidence * freshness * clarity * competition).toFixed(2)));
    const moneyScore = hours ? Math.round((payout * probability * (0.7 + automationScore / 333)) / hours) : 0;
    const recommendation = automationScore >= 70 && probability >= 0.55 && riskFlags.length <= 1
      ? 'VERIFY FIRST'
      : 'REVIEW';

    return {
      id: String(issue.id),
      title: issue.title,
      source: repoName(issue.repository_url),
      sourceUrl: issue.html_url,
      payout,
      hours,
      probability,
      competition: competitionOf(comments, assigneeCount),
      protection: protection.label,
      protectionVerified: protection.confidence > 0,
      updatedAt: issue.updated_at,
      ageDays,
      automationScore,
      assigneeCount,
      comments,
      riskFlags,
      moneyScore,
      recommendation,
    };
  }).filter((opportunity) => (
    opportunity.payout >= 50
    && opportunity.protectionVerified
    && opportunity.moneyScore > 0
    && opportunity.ageDays <= 45
  )).sort((a, b) => (
    b.moneyScore - a.moneyScore
    || b.automationScore - a.automationScore
    || b.payout - a.payout
  )).slice(0, maxResults);

  return {
    opportunities,
    scannedAt: new Date().toISOString(),
    scanned: unique.size,
    qualified: opportunities.length,
    authenticated: Boolean(token),
    methodology: 'Open + explicit payout + linked/stated protection + updated within 45 days. Ranking adjusts expected return for clarity, freshness, visible competition, and automation fit.',
  };
}
