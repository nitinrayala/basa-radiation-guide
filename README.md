# BASA Radiation Guide

Mobile-first English and Telugu radiation therapy information chatbot.

This repository is being rebuilt in phases. Phase 1 establishes the React, Vite, TypeScript, content-processing, and Cloudflare Worker foundation without implementing the full chatbot or modifying medical source documents.

## Current Structure

- `src/` - React single-page frontend foundation.
- `scripts/content/` - build-time content extraction and validation scripts.
- `source-docs/` - approved medical source documents. Do not edit these directly.
- `worker/` - Cloudflare Worker API foundation.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run content:validate
npm run build
```

## Environment

Copy `.env.example` to `.env.local` for frontend development.

The Groq API key must never be placed in frontend environment files. It belongs only in a Cloudflare Worker secret:

```bash
npx wrangler secret put GROQ_API_KEY --config worker/wrangler.toml
```
