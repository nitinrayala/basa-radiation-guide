# BASA Radiation Guide

Mobile-first English and Telugu radiation therapy information chatbot.

The app helps patients ask general questions about radiation therapy, planning, treatment sessions, side effects and care before speaking with their treating doctor. It answers only from the supplied source documents in `source-docs/`.

Live frontend:

```text
https://nitinrayala.github.io/basa-radiation-guide/
```

Live API:

```text
https://basa-radiation-guide-api.botradiation.workers.dev/api/chat
```

## What This Is

- A single-page patient information chatbot.
- English and Telugu UI.
- Supports English, Telugu script, Romanised Telugu and mixed Telugu-English questions.
- Uses local document retrieval plus a two-stage Groq flow.
- Hosted as static frontend files on GitHub Pages.
- Uses a Cloudflare Worker for retrieval, safety checks and Groq calls.

## What This Is Not

This is not a diagnostic, treatment-selection or appointment system. It must not interpret reports, prescribe medicines, recommend treatment techniques, advise dose/session counts, predict cure/survival, or tell a patient to stop/skip/delay treatment.

## Repository Structure

```text
source-docs/                 Approved medical source documents
data/content/                Extracted corpus and structured chunks
scripts/content/             DOCX/PPTX extraction, chunking and validation
src/                         React/Vite frontend
src/features/retrieval/      Local retrieval engine
src/features/chat/           Chat client and UI state
src/data/knowledgeChunks.json Browser/Worker-shared generated chunks
worker/                      Cloudflare Worker API
.github/workflows/           GitHub Pages deployment workflow
```

## Source Documents

The approved knowledge base lives in `source-docs/`:

- `Counselling.docx`
- `HEAD AND NECK INSTRUCTIONS FOR PATIENTS.docx`
- `Oncology_Movement_Blueprint.pptx`
- `Radiation Planning-ChatBot.docx`
- `Radiation therapy Techniques.docx`
- `Radiation Therapy Workflow.docx`
- `Radiation_Care_Blueprint.pptx`
- `Radiation_Care_Field_Guide.pptx`
- `Rehabilitation.pptx`
- `RT - Side effects.docx`

Do not edit these original files directly unless the source content itself must change.

## Content Pipeline

Extraction and validation are repeatable:

```bash
npm run content:extract
npm run content:build
npm run content:validate
```

Outputs:

- `data/content/extracted-corpus.json`
- `data/content/knowledge-chunks.json`
- `src/data/knowledgeChunks.json`

DOCX text is extracted with document metadata. PPTX files are inspected in slide order; the current supplied PPTX files contain no extractable slide text.

## Retrieval

The local retrieval engine scores generated chunks using:

- normalized tokens
- exact phrase matching
- fuzzy token matching
- title/category/treatment-area boosts
- source-priority weighting
- Romanised Telugu aliases

Romanised Telugu examples such as `enduku`, `eppudu`, `noppi`, `manta`, `tindi`, `neellu`, `mingadam`, `gonthu` and related mixed-language phrasing are normalized for retrieval.

## Groq Flow

The Worker uses two stages:

1. **Interpretation:** Groq converts the patient question into compact retrieval metadata.
2. **Answer generation:** the Worker retrieves relevant chunks and sends only those chunks, the interpreted intent and recent history to Groq.

The frontend never calls Groq directly and never contains the Groq API key.

Configured model:

```text
llama-3.1-8b-instant
```

## Safety Behavior

The Worker blocks unsafe questions before answer generation, including:

- diagnosis/report/scan/pathology interpretation
- choosing or recommending treatment techniques
- starting/stopping/changing medicines
- stopping/skipping/delaying radiation
- dose or number-of-session advice
- cure/survival/life-expectancy predictions
- unrelated questions outside radiation therapy information

Blocked questions return a controlled response directing the patient to their treating doctor/team.

## Suggestions and Explain More

The chat shows initial suggestions on open. After every answer, the Worker returns three to five follow-up suggestions based on the patient question, retrieval metadata and retrieved chunks.

`Explain more` is always returned as a suggestion button. Clicking it adds a normal user message and sends the recent conversation as context so the Worker can retrieve and explain in more detail.

## Fallbacks

If Groq fails:

- the Worker retries answer generation once
- if Groq returns useful non-JSON text, the Worker can still use it safely
- otherwise it returns a document-based fallback from retrieved chunks
- the chat still shows suggestions

## Local Development

Install dependencies:

```bash
npm install
```

Frontend dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

For local frontend API config, copy `.env.example` to `.env.local`:

```text
VITE_CHAT_API_URL=http://localhost:8787/api/chat
VITE_USE_MOCK_CHAT=false
```

To call the deployed Worker from local frontend:

```text
VITE_CHAT_API_URL=https://basa-radiation-guide-api.botradiation.workers.dev/api/chat
VITE_USE_MOCK_CHAT=false
```

## Mock Mode

Mock frontend mode avoids Worker/Groq calls:

```text
VITE_USE_MOCK_CHAT=true
```

Tests automatically use mock chat mode.

## Worker Development

Copy `worker/.dev.vars.example` to `worker/.dev.vars`:

```text
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_OUTPUT_TOKENS_NORMAL=500
MAX_OUTPUT_TOKENS_EXPANDED=900
MAX_HISTORY_MESSAGES=6
```

Run the Worker locally:

```bash
npm run worker:dev
```

Set the deployed Groq secret:

```bash
npx wrangler secret put GROQ_API_KEY --config worker/wrangler.toml
```

Deploy the Worker:

```bash
npm run worker:deploy
```

The real key must never be committed.

## GitHub Pages Deployment

Production frontend config is in `.env.production`:

```text
VITE_CHAT_API_URL=https://basa-radiation-guide-api.botradiation.workers.dev/api/chat
VITE_USE_MOCK_CHAT=false
```

GitHub Pages deployment is handled by:

```text
.github/workflows/deploy-pages.yml
```

Pages settings should use:

```text
Source: GitHub Actions
```

The Vite production build uses relative, stable assets:

```text
./assets/index.js
./assets/index.css
```

This avoids broken assets under the `/basa-radiation-guide/` repository subpath.

## Testing

Run the full validation gate:

```bash
npm run lint
npm run typecheck
npm run test
npm run content:validate
npm run build
```

Current test coverage includes:

- retrieval behavior for English, Telugu script, Romanised Telugu and mixed-language questions
- safety guardrails
- suggestion generation
- Worker Groq/fallback behavior
- frontend chat behavior
- deployment configuration

## Updating Documents

1. Add or replace approved files in `source-docs/`.
2. Run:

```bash
npm run content:extract
npm run content:build
npm run content:validate
```

3. Run the full validation gate.
4. Deploy the Worker if generated knowledge chunks changed and are used by the API.
5. Push to GitHub to redeploy the frontend if frontend/generated browser assets changed.

## Cost Controls

- Interpretation output is small.
- The Worker sends only retrieved chunks, not all documents.
- Only the latest six history messages are retained.
- Normal and expanded answer token limits are configurable.
- Safety-blocked questions do not call Groq.

Typical limits are controlled by:

```text
MAX_OUTPUT_TOKENS_NORMAL
MAX_OUTPUT_TOKENS_EXPANDED
MAX_HISTORY_MESSAGES
```

## Privacy

The UI tells users not to enter names, phone numbers, hospital numbers or reports. The app does not provide login, accounts, uploads, databases or medical-record storage.

## Known Limitations

- PPTX files currently have no extractable slide text without OCR.
- Telugu quality depends on the Groq model output and the source material.
- The bot is informational only and should not replace the treating doctor.
- Groq free-tier rate/token limits can affect live usage.
