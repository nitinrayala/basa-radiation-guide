# Project Instructions

Build a mobile-first English and Telugu radiation therapy information chatbot.

Before making changes:

1. Read `PROJECT_SPEC.md`.
2. Inspect the existing repository.
3. Check `TASKS.md`.
4. Inspect all documents in `source-docs/`.

Non-negotiable requirements:

* Single-page chatbot, mainly designed for phones.
* Light, bright and highly readable interface.
* English and Telugu support.
* Understand English, Telugu script, Romanised Telugu and mixed Telugu-English questions.
* Show suggested questions when the chat opens.
* Show updated suggested questions after every answer.
* “Explain more” must behave like a suggested follow-up question.
* Use only information retrieved from the supplied documents.
* Do not diagnose, prescribe, interpret reports, recommend treatment or invent medical information.
* Frontend API keys are forbidden.
* Store the Groq key only in a Cloudflare Worker secret.
* GitHub Pages hosts the frontend.
* Use TypeScript and preserve strict type safety.
* Do not add doctor profiles, appointments, logins, databases, report uploads or unnecessary pages.
* Do not claim completion until lint, typecheck, tests, content validation and build pass.

Work in phases. Complete only the phase requested in the current Codex message.

After each phase:

* Run relevant checks.
* Fix errors.
* Update `TASKS.md`.
* Summarise files changed and remaining work.
