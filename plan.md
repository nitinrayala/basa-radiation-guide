# Plan: Upgrade Chatbot to Cloudflare-Native RAG With Reviewed OCR

## Summary

Build a stronger RAG architecture while preserving the current deployment model: GitHub Pages frontend, Cloudflare Worker backend, Groq chat generation, no frontend API keys, no local model hosting.

The upgraded system adds review-gated OCR ingestion for image-only DOCX/PPTX content, Cloudflare Workers AI embeddings, Cloudflare Vectorize hybrid retrieval, stricter grounding before Groq answer generation, better validation, tests and documentation.

## Key Changes

### Content And OCR Pipeline

- Extend extraction so DOCX/PPTX embedded images are discovered as OCR candidates.
- Generate `data/content/ocr-review.json` with `sourceFile`, `sourceLocation`, `imageId`, `rawOcrText`, `proposedText`, `status` and optional `notes`.
- Do not add OCR text to chatbot chunks unless `status` is `approved`.
- Add approved OCR text into the normal chunk build process with source metadata such as `Slide 4 image 2` or `Section 3 image 1`.
- Mark OCR chunks with `contentSource: "ocr_reviewed"` and `reviewStatus: "approved"`.
- Keep validation strict: reject unreviewed OCR, corrupted text, contact info, patient identifiers, decorative/storyboard text and unsupported source files.

### Hosted RAG Index

- Add Cloudflare Vectorize as the primary retrieval index.
- Add Cloudflare Workers AI embedding binding for generating embeddings.
- Keep the existing lexical/fuzzy retriever as fallback and as part of hybrid scoring.
- Add command flow: `content:extract`, `content:ocr`, `content:build`, `content:validate`, `rag:index`.
- Store chunk vectors with metadata for chunk ID, category, treatment areas, source priority, source location, specificity, safety flags and content source.
- Retrieve from Vectorize first, then merge/rerank with lexical results.

### Worker RAG Flow

- Keep typed questions on the Worker-only path.
- Keep guided journey answers cached and local; they must not call Vectorize or Groq.
- For typed questions: safety check, Groq interpretation, Workers AI embedding, Vectorize retrieval, lexical retrieval, hybrid rerank, Groq answer generation, JSON/source validation and response.
- If Vectorize or embedding fails, fall back to existing local lexical retrieval.
- If Groq fails, return the existing safe document-grounded fallback.

## Test Plan

- Content tests cover OCR candidate generation, unapproved OCR exclusion, approved OCR inclusion and validation rejection of unsafe OCR text.
- Retrieval tests cover vector retrieval, hybrid dedupe/rerank, treatment-area confidence, medication gating and lexical fallback.
- Worker tests cover safety prechecks, Groq-only-after-retrieval behavior, source filtering and fallback when Vectorize or Groq fails.
- Frontend tests ensure the guided journey remains unchanged and no API keys are exposed.
- Required final checks: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run content:validate`, `npm.cmd run build`.

## Assumptions

- Use Cloudflare Vectorize for hosted vector search.
- Use Cloudflare Workers AI for embeddings.
- Use Groq `llama-3.1-8b-instant` for interpretation and answer generation.
- Use review-gated OCR, not automatic unreviewed OCR ingestion.
- Keep GitHub Pages as the frontend host.
- Keep the Worker as the only place where API keys and hosted retrieval calls happen.
- Do not add login, database-backed user history, appointments, uploads, analytics or doctor profiles.
