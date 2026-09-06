# ResumeMatch AI — MVP

A sellable AI résumé and application optimizer. Users upload a résumé or paste text, add a job description, and receive:

- ATS-style match estimate (0–100)
- matched and missing keywords
- section-level fit scores
- tailored résumé headline and summary
- rewritten experience bullets using only supported facts
- recommended skills ordering
- tailored cover letter
- prioritized action plan

## 1. Run locally

Requirements: Node.js 20.16+.

```bash
npm install
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-luna
PORT=3000
```

Node does not automatically load `.env`, so either export the values in your shell or run with Node's env-file option:

```bash
node --env-file=.env server.mjs
```

Then open:

```text
http://localhost:3000
```

## 2. Production deployment

This app is intentionally simple: one Node server plus static frontend. It can be deployed to services such as Render, Railway, Fly.io, a VPS, or any Node-compatible hosting provider.

Set these environment variables in your hosting dashboard:

- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-5.6-luna`
- `PORT` (many hosts inject this automatically)

Run command:

```bash
npm start
```

## 3. Whop product setup

Recommended commercial setup:

**Starter — $9 one-time**
- 1 optimized application
- résumé match report
- cover letter

**Pro — $19/month**
- 25 analyses/month
- saved application history
- multiple résumé versions
- priority models / deeper review

**Done-for-you — $79–149**
- personal résumé review
- LinkedIn rewrite
- 3 tailored applications

For a real paid product, add authentication and entitlement checks before `/api/analyze`. Whop can be used as the checkout/access layer; your backend should verify an active purchase or membership before allowing analysis.

## 4. Important product notes

- The app does **not** store résumé files in a database in this MVP.
- The OpenAI API key stays server-side.
- The score is an ATS-style estimate, not a score from a specific employer's ATS.
- The prompt explicitly prohibits invented employers, degrees, dates, metrics, tools, and achievements.
- Before public launch, add a privacy policy, terms, abuse controls, user accounts, usage quotas, billing/entitlement verification, deletion controls, and analytics.

## 5. File structure

```text
resume-ai-mvp/
├── .env.example
├── .gitignore
├── package.json
├── server.mjs
├── README.md
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```
