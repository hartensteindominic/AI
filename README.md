# Voxel Creator Pack

A direct-response digital product built for paid social traffic: 30 original voxel-style SVG assets for $9.99 with commercial-use rights in finished projects.

## Product

- 30 separate scalable SVG assets
- Transparent backgrounds
- Recolorable and editable vector files
- Commercial use in finished work and client projects
- README + license included in the generated ZIP
- No subscription or crypto

## Sales flow

The landing page previews all 30 assets and uses one repeated purchase CTA. `POST /api/checkout` creates a $9.99 Stripe Checkout Session. Stripe returns the buyer with a Checkout Session ID; `GET /api/verify` verifies that Stripe reports the session as paid and that it belongs to this product. Only then does the page expose the ZIP download action.

Set `STRIPE_SECRET_KEY` in the production hosting environment. If Stripe is not configured or is temporarily unavailable, the purchase button falls back to a prefilled purchase email rather than becoming a dead end.

## Run locally

```bash
npm install
npm run dev
```
