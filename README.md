# GhostForge

A private, faceless developer revenue cockpit for finding, ranking, pursuing, and tracking fixed-scope coding opportunities.

## Core principle

Rank work by expected economic return rather than headline payout:

`Money Score = payout × modeled acceptance probability ÷ estimated hours`

A listing is not income. GhostForge counts money only after work is accepted and paid.

## Live scanner

The dashboard now calls `/api/opportunities` on load and whenever **Scan now** is pressed. The server queries current open GitHub issues, deduplicates the results, extracts explicit dollar payouts, looks for payment-protection evidence, estimates effort conservatively, and ranks qualifying opportunities by Money Score. Ranking also accounts for freshness, scope clarity, familiar-stack signals, automation fit, and visible risk flags; the highest-ranked item is marked as the top verification target.

GhostForge intentionally shows an honest empty state when nothing qualifies. Seeded/demo jobs are not used.

### Vercel environment

Set `GITHUB_TOKEN` to a fine-grained, read-only token for more reliable GitHub API limits. The scanner can use unauthenticated public API access at a lower rate limit. Do not expose the token with a `NEXT_PUBLIC_` prefix.

## Qualification boundary

An opportunity currently qualifies only when all are true:

- the GitHub issue is open
- a dollar payout is explicitly present
- recognized protection evidence is present (Algora, Polar, escrow, or funded milestone)
- it was updated within the last 45 days
- the probability-adjusted Money Score is positive

Before starting, verify eligibility, current funding, acceptance criteria, applicant competition, payout currency, and platform terms at the linked source. Payment and acceptance are never guaranteed.

## Run and verify

```bash
npm install
npm run build
npm start
```

GitHub Actions runs the production build for pushes to `main` and `ghostforge-v1`, and for pull requests into `main`.

## Guardrails

GhostForge does not auto-apply, submit code, accept terms, move funds, or claim guaranteed earnings. Final pursuit and submission require human approval.
