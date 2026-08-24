# CutCare Website

This is the public CutCare website for the landing page, support page, Privacy Policy, User Privacy Choices page, and Terms of Use.

The website is a standalone Next.js app and does not depend on the CutCare mobile frontend, backend, Firebase configuration, or AI service.

## Local Development

```bash
cd website
npm install
npm run dev
```

## Production Build

```bash
cd website
npm run build
```

## Vercel

When deploying to Vercel, use:

```text
website
```

as the project Root Directory.

## Launch Notes

- Current public support contact: `jaylinhernandez25@gmail.com`.
- Use `https://cutcare.jaylinhernandez.com/privacy` as the required App Store Privacy Policy URL only after the site is publicly deployed.
- Use `https://cutcare.jaylinhernandez.com/privacy/choices` as the optional User Privacy Choices URL only after the site is publicly deployed and the support contact is finalized.
- Revisit privacy and terms copy if CutCare adds payments, subscriptions, analytics, crash reporting, or additional service providers.
