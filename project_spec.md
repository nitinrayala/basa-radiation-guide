# Build a Mobile-First English and Telugu Radiation Information Chatbot

You are the lead engineer working inside an existing GitHub repository.

Inspect the entire repository before changing anything. Preserve useful existing code, but refactor or replace incomplete code where necessary.

Build a complete, production-ready radiation therapy information chatbot based on the medical documents supplied in this repository.

Do not merely describe the solution. Implement it, test it, and leave the repository in a working state.

Do not stop to ask unnecessary questions. Make sensible technical decisions and document them in the README.

---

# 1. Project purpose

Build a simple patient-facing chatbot that helps patients understand radiation therapy before meeting their treating doctor.

The application should:

* Accept natural patient questions
* Understand English
* Understand Telugu script
* Understand Telugu typed using English letters
* Understand mixed English and Telugu
* Retrieve the most relevant information from the supplied documents
* Explain that information in simple language
* Answer in English or Telugu
* Show useful follow-up question suggestions
* Allow the patient to request a more detailed explanation
* Direct the patient to their treating doctor when the answer is not covered by the supplied documents

This is an information bot only.

It is not:

* A doctor profile website
* A clinic website
* An appointment-booking system
* A hospital-management application
* A diagnostic chatbot
* A treatment-recommendation system
* A medical-record system

Do not add doctor names, clinic details, hospital information, appointment links, phone numbers, WhatsApp buttons, addresses or doctor photographs.

---

# 2. Core user experience

The application should be a simple, single-page chatbot.

Do not create a complicated website with multiple pages, menus or onboarding forms.

The main screen should contain:

1. A small top header
2. Bot title
3. English/Telugu language selector
4. Scrollable chat conversation area
5. Suggested-question buttons
6. A fixed typing box at the bottom
7. Send button
8. A short disclaimer

The patient should be able to open the website and immediately start asking a question.

Do not require:

* Login
* Registration
* Name
* Phone number
* Email
* Hospital number
* Diagnosis
* Reports
* Treatment-stage selection
* Treatment-area selection
* Multi-step onboarding

The chatbot should infer the topic and treatment area from the patient’s question whenever possible.

---

# 3. UI design requirements

The interface must be:

* Light
* Bright
* Clean
* Calm
* Friendly
* Easy to understand
* Designed mainly for phone usage
* Comfortable for older or non-technical patients

Use a mobile-first layout.

Suggested visual direction:

* White or very light background
* Soft blue, teal or similar healthcare accent
* High-contrast dark text
* Large readable typography
* Rounded message bubbles
* Clear spacing
* Minimal shadows
* Large touch targets
* No dark theme required
* No excessive animation
* No distracting illustrations
* No frightening cancer-related imagery
* No crowded dashboard design

The chat should feel like a straightforward messaging application, not an administrative hospital portal.

---

# 4. Chat layout based on the supplied sketch

Implement the following layout concept:

```text
┌──────────────────────────────┐
│ Header and language selector │
├──────────────────────────────┤
│                              │
│ Conversation messages        │
│                              │
│ Assistant response           │
│                              │
│ Suggested question           │
│ Suggested question           │
│ Explain more                 │
│                              │
├──────────────────────────────┤
│ Type your question...   Send │
└──────────────────────────────┘
```

The typing box must remain fixed or sticky at the bottom of the screen.

The suggested-question area must appear immediately above the typing box.

The conversation area should scroll independently.

When the phone keyboard opens:

* The input must remain visible
* The send button must remain usable
* Suggestions must not cover the input
* The page must not jump unpredictably
* Respect mobile safe-area insets

Automatically scroll to the latest message after:

* Sending a question
* Receiving an answer
* Selecting a suggested question
* Selecting “Explain more”

---

# 5. Suggested questions

Suggested questions are a core requirement, not an optional feature.

## Initial suggestions

Whenever the patient opens a new chat, show approximately four suggested questions.

English examples:

* What is radiation therapy?
* What happens during a planning scan?
* Will I feel pain during radiation?
* Why is a mask used?
* What side effects can occur?
* How long does radiation planning take?

Telugu examples:

* రేడియేషన్ థెరపీ అంటే ఏమిటి?
* ప్లానింగ్ స్కాన్ సమయంలో ఏమి జరుగుతుంది?
* రేడియేషన్ సమయంలో నొప్పి ఉంటుందా?
* రేడియేషన్ మాస్క్ ఎందుకు ఉపయోగిస్తారు?
* ఏ దుష్ప్రభావాలు రావచ్చు?
* రేడియేషన్ ప్లానింగ్‌కు ఎంత సమయం పడుతుంది?

Display four suggestions at a time.

Use large, rounded buttons or cards.

Suggestions can wrap onto multiple lines on narrow screens.

## Suggestions after every answer

After every assistant response, update the suggestions based on:

* The patient’s question
* The retrieved document content
* The assistant’s answer
* The current conversation

Show three to five relevant suggestions.

Examples:

After answering about CT simulation:

* Why do I need to remain still?
* Will contrast be used?
* What happens after the planning scan?
* How long does planning take?
* Explain more

After answering about a head-and-neck mask:

* Will the mask feel tight?
* How long will I wear the mask?
* What happens if I move?
* What side effects may occur?
* Explain more

After answering about side effects:

* When do these side effects usually begin?
* What precautions are mentioned in the documents?
* Can side effects continue after treatment?
* What should I ask my doctor?
* Explain more

Suggestions must always be shown in the currently selected response language.

## Explain more behaviour

“Explain more” must behave exactly like a suggested-question button.

It must not be a separate page or modal.

When clicked:

* Add “Explain more” as the user’s next message
* Use the previous question and answer as context
* Retrieve additional relevant document sections
* Provide a more detailed answer
* Continue using only the supplied documents
* Generate another set of relevant follow-up suggestions

The expanded answer may be longer than a normal answer, but must remain readable.

Use headings and bullet points when helpful.

---

# 6. Supported languages

Support:

* English
* Telugu

The bot must understand:

### English

```text
Why is a mask used during radiation?
```

### Telugu script

```text
రేడియేషన్ సమయంలో మాస్క్ ఎందుకు వేస్తారు?
```

### Telugu written using English letters

```text
Radiation mask enduku vestaru?
```

### Mixed Telugu and English

```text
CT simulation ayyaka treatment eppudu start avuthundi?
```

Add a simple language selector in the header:

```text
English | తెలుగు
```

Use English as the initial interface language.

The selected language controls:

* Interface text
* Placeholder text
* Suggested questions
* Error messages
* Disclaimer
* Assistant response language

If the patient writes in Telugu script while English is selected, the application may automatically respond in Telugu.

If the patient writes Romanised Telugu, use the selected language to decide the response language.

Use simple, natural Telugu rather than highly academic or overly formal Telugu.

Keep standard medical terms in English where Telugu patients commonly recognise the English term. A Telugu explanation may include the English term in parentheses.

Example:

```text
ప్లానింగ్ సీటీ స్కాన్ (Planning CT Scan)
```

Use:

* `Noto Sans` for English
* `Noto Sans Telugu` for Telugu

Set the correct page language attribute dynamically.

---

# 7. Medical source documents

Search the repository for these expected files:

```text
Counselling.docx
HEAD AND NECK INSTRUCTIONS FOR PATIENTS.docx
Oncology_Movement_Blueprint.pptx
Radiation Planning-ChatBot.docx
Radiation therapy Techniques.docx
Radiation Therapy Workflow.docx
Radiation_Care_Blueprint.pptx
Radiation_Care_Field_Guide.pptx
Rehabilitation.pptx
RT - Side effects.docx
```

They may be located in:

```text
source-docs/
```

If they are somewhere else in the repository, use their actual location.

Do not move or delete the original source documents without a clear reason.

The source documents are the chatbot’s approved knowledge base.

Do not use live web search for patient answers.

Do not allow Groq to answer from unrestricted medical knowledge.

---

# 8. Content extraction

Create a repeatable build-time extraction pipeline.

## DOCX

Extract text using a suitable package such as:

```text
mammoth
```

Preserve where possible:

* Document filename
* Heading structure
* Paragraph order
* Lists
* Tables
* Page or section information
* Treatment-area headings

## PPTX

Extract text by reading the PPTX as a ZIP archive.

Use packages such as:

```text
jszip
fast-xml-parser
```

Process slides in slide-number order.

Preserve:

* Filename
* Slide number
* Text content
* Text ordering where reasonably possible

Some slides may contain text embedded in images. Do not build a large OCR system for version one.

Use extractable slide text and prioritise the DOCX documents when PowerPoint content is duplicated.

Create commands such as:

```bash
npm run content:extract
npm run content:build
npm run content:validate
```

Document extraction libraries must not be shipped to the browser.

They should run only during development or build time.

---

# 9. Knowledge-base structure

Convert extracted material into structured JSON chunks.

Use a schema similar to:

```ts
interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;

  category:
    | "overview"
    | "workflow"
    | "planning"
    | "technique"
    | "side_effect"
    | "precaution"
    | "nutrition"
    | "skin_care"
    | "oral_care"
    | "rehabilitation"
    | "follow_up";

  treatmentAreas: Array<
    | "general"
    | "head_neck"
    | "brain"
    | "breast"
    | "thorax_lung"
    | "abdomen"
    | "pelvis"
    | "prostate"
    | "cervix"
    | "bone_spine"
  >;

  sourceFile: string;
  sourceLocation?: string;
  sourcePriority: number;

  containsMedicationInstruction: boolean;
  requiresDoctorConfirmation: boolean;
}
```

Generate stable IDs.

Examples:

```text
planning-ct-simulation
planning-immobilisation-mask
planning-quality-assurance
technique-imrt
technique-vmat
head-neck-week-three-side-effects
pelvis-common-side-effects
rehab-neck-exercises
rehab-shoulder-exercises
```

Do not create one enormous chunk for an entire document.

Chunks should usually be between approximately 100 and 500 words.

---

# 10. Source priority and contradictions

Use this source priority:

1. Treatment-specific instruction documents
2. `RT - Side effects.docx`
3. `Counselling.docx`
4. `Radiation Planning-ChatBot.docx`
5. `Radiation therapy Techniques.docx`
6. `Radiation Therapy Workflow.docx`
7. PowerPoint material

When multiple chunks contain the same information, prefer the higher-priority source.

Do not combine conflicting numerical or medical instructions.

If retrieved documents conflict:

* Do not invent a compromise
* Do not select an average
* Do not present both as equally universal
* State that instructions may depend on the individual treatment plan
* Ask the patient to follow their treating doctor’s instructions

Medication, lotion, mouthwash and dose-related content must be marked clearly.

Do not turn a document’s example medication into a general recommendation.

---

# 11. Two-stage question understanding

The bot must understand natural and imperfect patient questions.

Simple keyword matching alone is not sufficient, especially for:

* Romanised Telugu
* Mixed Telugu and English
* Spelling mistakes
* Vague questions
* Informal patient wording

Use a two-stage pipeline.

## Stage 1: Question interpretation

Send a small request to the configured Groq model asking it to convert the patient’s question into structured retrieval information.

Expected output:

```ts
interface InterpretedQuestion {
  detectedLanguage: "en" | "te" | "mixed";
  responseLanguage: "en" | "te";
  englishSearchQuery: string;
  category:
    | "overview"
    | "workflow"
    | "planning"
    | "technique"
    | "side_effect"
    | "precaution"
    | "nutrition"
    | "skin_care"
    | "oral_care"
    | "rehabilitation"
    | "follow_up"
    | "unknown";
  treatmentAreas: string[];
  keyTerms: string[];
  isOutsideScope: boolean;
}
```

Examples:

Input:

```text
Radiation mask enduku vestaru?
```

Interpretation:

```json
{
  "detectedLanguage": "mixed",
  "responseLanguage": "te",
  "englishSearchQuery": "why is an immobilisation mask used during radiation therapy",
  "category": "planning",
  "treatmentAreas": ["head_neck"],
  "keyTerms": ["mask", "immobilisation", "positioning"],
  "isOutsideScope": false
}
```

Input:

```text
Planning complete ayyaka call chestara?
```

Interpretation:

```json
{
  "detectedLanguage": "mixed",
  "responseLanguage": "te",
  "englishSearchQuery": "patient notification after radiation planning is complete",
  "category": "workflow",
  "treatmentAreas": ["general"],
  "keyTerms": ["planning", "notification", "treatment start"],
  "isOutsideScope": false
}
```

Keep this first-stage prompt and output very small to control cost.

Limit its output tokens strictly.

## Stage 2: Retrieval and answer

Use the interpreted English query and metadata to retrieve approximately four to six relevant chunks.

Then send only:

* System instructions
* Patient question
* Interpreted intent
* Relevant chunks
* Last few conversation messages

to the answer-generation model.

Do not send all documents with every request.

If question interpretation fails, fall back to local lexical and fuzzy retrieval.

---

# 12. Local retrieval

Implement a lightweight local retrieval engine.

Use:

* Metadata filtering
* Exact phrase matching
* Normalised token matching
* Fuzzy matching
* Title weighting
* Category weighting
* Treatment-area weighting
* Source-priority weighting

Normalise:

* Case
* Punctuation
* Common plural forms
* Basic spelling variations
* Common Romanised Telugu words

Add a small alias dictionary for common terms such as:

```text
mask
planning
scan
radiation
burning
pain
mouth
swallowing
food
water
urine
motion
skin
hair
neck
breast
chest
stomach
pelvis
exercise
```

Include common Romanised Telugu variants where useful:

```text
enduku
enti
eppudu
noppi
manta
tindi
neellu
mingadam
norulo
gonthu
juttu
charma
```

Do not attempt to build a complete Telugu language engine. The Groq interpretation stage handles semantic understanding.

---

# 13. Answer-generation behaviour

The chatbot must:

* Answer using only retrieved document content
* Use simple patient-friendly language
* Respond in English or Telugu
* Explain medical terminology
* Use short paragraphs
* Use bullet points when useful
* Avoid overwhelming the patient
* Be reassuring without promising results
* Mention when instructions vary by patient
* Admit when information is unavailable
* Generate relevant follow-up suggestions

The chatbot must not:

* Diagnose
* Interpret scans
* Interpret pathology reports
* Recommend a radiation dose
* Select a treatment technique
* Predict survival
* Predict cure
* Recommend starting medication
* Recommend stopping medication
* Recommend changing medication
* Advise stopping radiation
* Advise skipping a session
* State that a symptom is harmless
* Invent missing information
* Search the web
* Ask for private medical records

---

# 14. System prompt

Use a strict system prompt similar to:

```text
You are a bilingual radiation therapy information assistant.

Your purpose is to help patients understand radiation therapy before speaking with their treating doctor.

Use only the APPROVED DOCUMENT CONTENT supplied in this request.

Do not use outside medical knowledge.
Do not invent missing information.
Do not diagnose.
Do not interpret reports, scans or pathology.
Do not recommend treatment techniques, radiation doses or numbers of sessions.
Do not recommend starting, stopping or changing medication.
Do not advise the patient to stop, skip or delay treatment.
Do not provide survival or cure predictions.

Answer in the requested language, English or Telugu.

Use simple and respectful language suitable for patients without medical training.

If the question is written in Romanised Telugu, understand its meaning and answer in the selected response language.

When medicines, lotions, mouthwashes or specific instructions appear in the documents, clearly state that the patient should use them only as advised by their treating team.

When the documents do not contain enough information, say that the topic may depend on the individual treatment plan and should be discussed with the treating doctor.

Generate useful follow-up suggestions based on the answer.

Return valid JSON matching the required schema.
```

---

# 15. Structured answer format

Require JSON output:

```ts
interface ChatAnswer {
  answer: string;
  suggestions: Array<{
    id: string;
    label: string;
    action: "question" | "explain_more";
    question?: string;
  }>;
  sourceIds: string[];
  needsDoctorDiscussion: boolean;
}
```

Example:

```json
{
  "answer": "A radiation mask helps keep your head and neck in the same position during each treatment session. This improves the accuracy of treatment. The mask is made specifically for you during the planning stage.",
  "suggestions": [
    {
      "id": "mask-tight",
      "label": "Will the mask feel tight?",
      "action": "question",
      "question": "Will the radiation mask feel tight?"
    },
    {
      "id": "mask-duration",
      "label": "How long is the mask used?",
      "action": "question",
      "question": "How long will the mask be used during treatment?"
    },
    {
      "id": "explain-more",
      "label": "Explain more",
      "action": "explain_more"
    }
  ],
  "sourceIds": [
    "planning-immobilisation-mask"
  ],
  "needsDoctorDiscussion": false
}
```

Validate all responses with `zod`.

Reject:

* Invalid JSON
* Unknown source IDs
* Empty answers
* More than five suggestions
* Suggestions with unsupported action types

If structured generation fails, return a safe answer built directly from the retrieved chunks.

---

# 16. Chat API

Create a Cloudflare Worker endpoint:

```text
POST /api/chat
```

Request:

```ts
interface ChatRequest {
  language: "en" | "te";
  question: string;
  action?: "normal" | "explain_more";
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

For `explain_more`:

* Use the previous user question
* Use the previous assistant answer
* Retrieve additional chunks
* Produce a more detailed explanation
* Do not simply repeat the same text

Response:

```ts
interface ChatResponse {
  answer: string;
  suggestions: Array<{
    id: string;
    label: string;
    action: "question" | "explain_more";
    question?: string;
  }>;
  sources: Array<{
    id: string;
    label: string;
  }>;
  needsDoctorDiscussion: boolean;
}
```

Validation rules:

* Maximum question length: 1,000 characters
* Maximum retained history: last six messages
* Reject empty questions
* Reject unsupported languages
* Limit normal answer length
* Allow a larger limit for explain-more answers
* Do not log full patient questions in production

Configure CORS for:

* Local development
* The deployed GitHub Pages origin

---

# 17. Cost controls

The model must be configurable through environment variables.

Use:

```text
GROQ_API_KEY
GROQ_MODEL
```

Do not hardcode the API key.

Do not expose the key to the frontend.

Use a currently available low-cost Groq production model selected through `GROQ_MODEL`.

Cost controls:

* Keep the interpretation response very small
* Retrieve only four to six chunks
* Do not send all documents
* Send only the last six messages
* Limit answer output tokens
* Use a smaller normal-answer limit
* Use a slightly larger limit for explain more
* Avoid repeatedly sending assistant answers that are no longer relevant
* Do not use Google Search grounding
* Do not enable unrelated tools
* Do not generate images
* Do not store long conversations

Add a configurable maximum such as:

```text
MAX_OUTPUT_TOKENS_NORMAL
MAX_OUTPUT_TOKENS_EXPANDED
MAX_HISTORY_MESSAGES
```

Use reasonable defaults.

---

# 18. Caching

Implement lightweight response caching in the Worker where appropriate.

Create a cache key from:

* Normalised question
* Selected language
* Action type
* Knowledge-base version
* Model name

Do not place the raw patient question in the cache key.

Hash the normalised content using SHA-256.

Use a modest cache lifetime such as 12 to 24 hours.

Do not cache questions that appear to contain:

* Phone numbers
* Email addresses
* Long number sequences
* Report-like data
* Obvious personal identifiers

Caching must not be required for the bot to function.

---

# 19. Frontend behaviour

Build the frontend with:

* React
* Vite
* TypeScript

Use a simple single-page application.

Recommended component structure:

```text
src/
├── components/
│   ├── ChatHeader.tsx
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── SuggestionButtons.tsx
│   ├── LanguageToggle.tsx
│   ├── TypingIndicator.tsx
│   ├── Disclaimer.tsx
│   └── ErrorMessage.tsx
├── features/
│   └── chat/
│       ├── chatApi.ts
│       ├── chatTypes.ts
│       ├── initialSuggestions.ts
│       └── useChat.ts
├── locales/
│   ├── en.ts
│   └── te.ts
├── styles/
├── App.tsx
└── main.tsx
```

Use whichever structure best fits the existing repository.

---

# 20. Chat message design

User messages:

* Aligned to the right
* Compact
* Clearly distinguishable

Assistant messages:

* Aligned to the left
* Slightly wider
* Easy to read
* Support paragraphs and bullet points
* Never render arbitrary HTML from the model
* Render only safely parsed text or controlled Markdown

Display a subtle typing indicator while waiting.

Disable duplicate submissions while a request is active.

Allow the user to retry a failed message.

Add a clear-chat button in the header, but keep it visually secondary.

Do not add copy buttons, sharing, downloads or unnecessary controls unless already present and useful.

---

# 21. Initial greeting

When the chatbot first opens, display a short greeting.

English:

```text
Hello. You can ask me questions about radiation therapy, planning, treatment, side effects and care.
```

Telugu:

```text
నమస్కారం. రేడియేషన్ థెరపీ, ప్లానింగ్, చికిత్స, దుష్ప్రభావాలు మరియు సంరక్షణ గురించి మీరు నన్ను ప్రశ్నలు అడగవచ్చు.
```

Immediately show the initial suggested questions below the greeting.

Do not require the patient to dismiss an introductory popup.

---

# 22. Privacy and disclaimer

Show a short disclaimer beneath the chat input or at the bottom of the conversation.

English:

```text
This chatbot provides general information from the supplied radiation therapy documents. It does not replace advice from your treating doctor.
```

Telugu:

```text
ఈ చాట్‌బాట్ అందించిన రేడియేషన్ థెరపీ పత్రాల ఆధారంగా సాధారణ సమాచారాన్ని మాత్రమే అందిస్తుంది. ఇది మీ చికిత్స చేస్తున్న వైద్యుడి సలహాకు ప్రత్యామ్నాయం కాదు.
```

Also display:

English:

```text
Do not enter your name, phone number, hospital number or medical reports.
```

Telugu:

```text
మీ పేరు, ఫోన్ నంబర్, ఆసుపత్రి నంబర్ లేదా వైద్య నివేదికలను నమోదు చేయవద్దు.
```

Keep these visible but not alarming.

---

# 23. Missing-information response

When the documents do not contain enough relevant information, use:

English:

```text
This information is not clearly covered in the available material and may depend on your individual treatment plan. Please discuss it with your treating doctor.
```

Telugu:

```text
ఈ సమాచారం అందుబాటులో ఉన్న పత్రాలలో స్పష్టంగా లేదు మరియు మీ వ్యక్తిగత చికిత్స ప్రణాళికపై ఆధారపడి ఉండవచ్చు. దయచేసి మీ చికిత్స చేస్తున్న వైద్యుడితో చర్చించండి.
```

Do not invent an answer merely to avoid showing this message.

Still show useful suggestions such as:

* Ask another question
* What happens during planning?
* What should I discuss with my doctor?

---

# 24. API failure fallback

If either Groq request fails:

1. Retry once for temporary network or rate-limit errors
2. Do not repeatedly retry
3. Run local retrieval
4. Display the best matching approved document content directly
5. Inform the patient that the conversational explanation is temporarily unavailable
6. Continue showing suggested questions

English:

```text
The conversational explanation is temporarily unavailable. Here is the most relevant information from the available documents.
```

Telugu:

```text
సంభాషణ రూపంలోని వివరణ ప్రస్తుతం అందుబాటులో లేదు. అందుబాటులో ఉన్న పత్రాల నుండి అత్యంత సంబంధిత సమాచారం ఇక్కడ ఉంది.
```

The chat interface must never become a blank error screen.

---

# 25. Accessibility

Implement:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* ARIA labels
* `aria-live` for new assistant answers
* Minimum 44px touch targets
* Readable font sizes
* Strong contrast
* Support for browser zoom
* Reduced-motion support
* Correct Telugu font rendering

Do not place essential text inside images.

---

# 26. GitHub Pages deployment

Configure the frontend for GitHub Pages.

Requirements:

* Correct Vite `base`
* Work under a repository subpath
* No broken assets
* No routing issues on refresh
* Prefer no router because this is a single-page chatbot
* Add a GitHub Actions Pages deployment workflow

Create or update:

```text
.github/workflows/deploy-pages.yml
```

The frontend must read the Worker URL from:

```text
VITE_CHAT_API_URL
```

Create:

```text
.env.example
```

Example:

```text
VITE_CHAT_API_URL=http://localhost:8787/api/chat
VITE_USE_MOCK_CHAT=false
```

---

# 27. Cloudflare Worker

Create a complete Worker project.

Suggested structure:

```text
worker/
├── src/
│   ├── index.ts
│   ├── interpretQuestion.ts
│   ├── retrieve.ts
│   ├── answer.ts
│   ├── groq.ts
│   ├── prompts.ts
│   ├── schemas.ts
│   ├── cache.ts
│   └── fallback.ts
├── wrangler.toml
└── .dev.vars.example
```

Worker environment example:

```text
GROQ_API_KEY=
GROQ_MODEL=
ALLOWED_ORIGIN=http://localhost:5173
MAX_OUTPUT_TOKENS_NORMAL=500
MAX_OUTPUT_TOKENS_EXPANDED=900
MAX_HISTORY_MESSAGES=6
```

Document these commands:

```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler dev
npx wrangler deploy
```

Never commit the real API key.

---

# 28. Mock development mode

Implement:

```text
VITE_USE_MOCK_CHAT=true
```

Mock mode must:

* Use the real extracted knowledge chunks
* Simulate assistant answers
* Show realistic suggestions
* Support explain-more behaviour
* Allow frontend development without a Groq key

Do not use meaningless placeholder responses.

---

# 29. Tests

Add meaningful tests.

Test at least:

## Retrieval

* English question retrieval
* Telugu-script query interpretation
* Romanised Telugu retrieval
* Mixed-language query handling
* Treatment-area matching
* Category matching
* Source-priority weighting
* Fuzzy matching
* Empty-result fallback

## Structured responses

* Valid answer parsing
* Invalid JSON
* Unknown source IDs
* Too many suggestions
* Missing explain-more action
* Missing answer
* Model failure fallback

## Frontend

* Initial greeting
* Initial suggestions displayed
* Clicking a suggestion submits it
* Suggestions update after an answer
* Explain more creates a follow-up request
* Language switching
* Telugu interface rendering
* Input remains usable
* Clear chat resets initial suggestions
* Error fallback is displayed

Use:

* Vitest
* React Testing Library

Add and ensure these pass:

```bash
npm run lint
npm run typecheck
npm run test
npm run content:validate
npm run build
```

---

# 30. README

Write a complete README covering:

* Project purpose
* Architecture
* Repository structure
* Source-document location
* Content extraction
* Knowledge-base generation
* Local retrieval
* Two-stage Groq flow
* English and Telugu handling
* Suggested-question behaviour
* Explain-more behaviour
* Local development
* Mock mode
* Groq API setup
* Cloudflare Worker setup
* GitHub Pages deployment
* Environment variables
* Testing
* Updating documents
* Rebuilding the knowledge base
* Cost-control measures
* Privacy limitations
* Known limitations

Use exact commands.

---

# 31. Important restrictions

Do not add:

* Doctor profile
* Hospital profile
* Clinic contact section
* Appointment booking
* Authentication
* Patient accounts
* Database
* Report upload
* File upload
* Medical-record storage
* Admin dashboard
* Analytics containing full questions
* Multiple informational web pages
* Complicated treatment selectors
* Voice features
* Dark theme
* Unnecessary animations
* Unrelated AI features

Keep the application focused.

---

# 32. Implementation order

Complete the work in this order:

1. Inspect the repository
2. Inspect available source documents
3. Repair or create the React/Vite/TypeScript frontend
4. Build document extraction
5. Build structured knowledge chunks
6. Add content validation
7. Implement local retrieval
8. Implement the mobile-first chat UI
9. Implement initial suggestions
10. Implement dynamic suggestions
11. Implement explain-more behaviour
12. Implement language switching
13. Implement the Cloudflare Worker
14. Implement question interpretation
15. Implement answer generation
16. Implement structured validation
17. Implement fallback behaviour
18. Add mock mode
19. Add tests
20. Add deployment configuration
21. Run all checks
22. Fix all errors
23. Complete the README

Do not leave unfinished placeholder functions when they can reasonably be implemented.

---

# 33. Completion requirements

Do not claim completion until all of the following work:

```bash
npm run lint
npm run typecheck
npm run test
npm run content:validate
npm run build
```

Also manually verify:

* The interface works on a narrow mobile viewport
* The input remains visible when the keyboard opens
* Initial suggestions appear
* Suggestions update after each answer
* Explain more works
* English works
* Telugu works
* Romanised Telugu questions are understood
* Mixed-language questions are understood
* The API key is never exposed to the client
* The application still provides document-based information when Groq fails

---

# 34. Final response after implementation

After implementing everything, report:

1. What was built
2. Important files created or changed
3. How document extraction works
4. How retrieval works
5. How Romanised Telugu is handled
6. How the two Groq stages work
7. How suggestions are generated
8. How explain more works
9. How to run locally
10. How to enable mock mode
11. How to configure the Groq API key
12. How to deploy the Worker
13. How to deploy GitHub Pages
14. Which commands passed
15. Any genuine remaining blockers

Build the application now. Do not only provide an implementation plan.
