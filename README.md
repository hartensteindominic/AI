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

The landing page previews all 30 assets and uses one repeated purchase CTA. When `NEXT_PUBLIC_CHECKOUT_URL` is configured, unpaid visitors are sent to checkout. A successful checkout should return to the storefront with `?paid=1`; the page then builds the complete ZIP in the browser and downloads it immediately.

Without a checkout URL, the CTA opens a prefilled purchase email so the offer still has a working fallback.

## Run locally

```bash
npm install
npm run dev
```
