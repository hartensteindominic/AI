# GhostForge

A private, faceless developer revenue cockpit for finding, ranking, pursuing, and tracking fixed-scope coding opportunities.

## Core principle

Rank work by expected economic return rather than headline payout:

`Money Score = payout × modeled acceptance probability × automation fit ÷ estimated hours`

A listing is not income. GhostForge counts money only after work is accepted and paid.

## Live scanner

The dashboard calls `/api/opportunities` on load and whenever **Scan now** is pressed. A shared scanner queries current open GitHub issues, deduplicates results, extracts explicit dollar payouts, looks for payment-protection evidence, estimates effort conservatively, and ranks qualifying opportunities.

Ranking accounts for freshness, scope clarity, familiar-stack signals, visible competition, current assignees, automation fit, and risk flags. The highest-ranked item is marked as the top verification target.

GhostForge intentionally shows an honest empty state when nothing qualifies. Seeded or demo jobs are not used.

### Vercel environment

Set `GITHUB_TOKEN` to a fine-grained, read-only token for more reliable GitHub API limits. The dashboard can use unauthenticated public API access at a lower rate limit. Never expose the token with a `NEXT_PUBLIC_` prefix.

## Automated revenue loop

`.github/workflows/revenue-loop.yml` runs every two hours and can also be launched manually. It:

1. runs scanner tests,
2. scans current protected bounty listings,
3. updates one persistent **GhostForge revenue queue** issue,
4. publishes the full JSON and Markdown scan as a 14-day workflow artifact.

The loop discovers and ranks opportunities. It does not auto-claim work, agree to terms, submit code, invoice a buyer, or move money.

Run the same loop locally with:

```bash
npm run test
GITHUB_TOKEN=your_read_token npm run scan:revenue
```

Set `GHOSTFORGE_UPDATE_ISSUE=false` for a file-only local scan.

## Automated code upgrades

`.github/dependabot.yml` checks npm dependencies every weekday morning and opens grouped minor/patch upgrade pull requests. Major upgrades remain separate so they receive an explicit review. Existing CI must pass before any upgrade should be merged.

## Qualification boundary

An opportunity qualifies only when all are true:

- the GitHub issue is open,
- a dollar payout is explicitly present,
- recognized protection evidence is present (Algora, Polar, escrow, or funded milestone),
- it was updated within the last 45 days,
- the probability-adjusted Money Score is positive.

Before starting, verify eligibility, current funding, claim status, acceptance criteria, applicant competition, payout currency, and platform terms. Payment and acceptance are never guaranteed.

## Run and verify

```bash
npm install
npm run test
npm run build
npm start
```

GitHub Actions runs the production build for pushes to `main` and `ghostforge-v1`, and for pull requests into `main`.

## Guardrails

GhostForge does not auto-apply, submit code, accept terms, send outreach, move funds, or claim guaranteed earnings. Final pursuit, delivery, and payment collection require human approval.
