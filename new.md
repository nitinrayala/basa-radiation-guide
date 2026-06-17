# Refactor the Chatbot into a Guided Radiation Journey with Optional AI Search

Read `AGENTS.md`, `PROJECT_SPEC.md`, `TASKS.md`, and inspect the current repository before making changes.

The project architecture has changed.

Refactor the existing chatbot so the main experience is a **guided, cached radiation-therapy explanation**, rather than a chatbot that generates every answer.

The AI chatbot should only be used when the patient types a specific doubt into the search/input box.

Do not rebuild the project from scratch. Preserve working extraction, retrieval, language, backend, and deployment code where useful.

---

## 1. New user experience

The application remains:

* Mobile-first
* Light and bright
* English and Telugu
* Single-page
* Designed for patients who may not be comfortable navigating websites

The screen should contain:

1. Small header
2. English/Telugu language selector
3. Scrollable conversation area
4. Exactly one guided-question button
5. Sticky question input at the bottom
6. Send button
7. Short disclaimer

Do not show several suggested questions.

At any moment, there must be only **one guided next-step question**.

---

## 2. Guided journey behaviour

When the patient first opens the website, show a short greeting and one question button:

English:

```text
What is radiation therapy?
```

Telugu:

```text
రేడియేషన్ థెరపీ అంటే ఏమిటి?
```

When the patient clicks the button:

1. Add the question to the conversation as a user message.
2. Add the corresponding cached answer as an assistant message.
3. Replace the button with the next question in the journey.

Example:

```text
What is radiation therapy?
        ↓
Why is radiation therapy used?
        ↓
What happens before treatment begins?
        ↓
What happens during the planning scan?
        ↓
Why is a mask or body mould used?
        ↓
What happens after the planning scan?
        ↓
Why does treatment planning take time?
        ↓
What happens during a radiation session?
        ↓
Will I feel the radiation?
        ↓
What side effects can occur?
        ↓
What care should I take during treatment?
        ↓
Why are rehabilitation exercises important?
        ↓
What happens after radiation treatment ends?
```

The exact wording can be improved using the supplied documents, but the order must take the patient through the complete radiation process.

The journey should feel like a conversation, not a slideshow or list of pages.

---

## 3. Cached answers

All guided-journey answers must be stored locally as static content.

They must not call Groq, Gemini, or any other AI API.

Create a structure such as:

```ts
interface JourneyStep {
  id: string;
  order: number;

  question: {
    en: string;
    te: string;
  };

  answer: {
    en: string;
    te: string;
  };

  nextStepId: string | null;

  sourceIds: string[];
}
```

Store the journey in a file such as:

```text
src/content/radiationJourney.ts
```

or:

```text
content/journey.json
```

Use whichever structure best fits the current project.

Every answer must:

* Be based on the supplied radiation documents
* Use simple patient-friendly wording
* Be concise enough for phone screens
* Explain medical terms clearly
* Avoid diagnosis or individual treatment recommendations
* Avoid medication recommendations
* Avoid assuming a particular treatment area
* Include only general information unless the step clearly states otherwise

The guided journey should cover the general radiation process, not detailed site-specific treatment advice.

---

## 4. Journey completion

At the final stage, replace the next-question button with:

English:

```text
Start the guide again
```

Telugu:

```text
మార్గదర్శకాన్ని మళ్లీ ప్రారంభించండి
```

Clicking it should:

* Clear only the guided journey messages
* Reset the journey to the first question
* Keep the selected language
* Avoid reloading the page

A separate clear-chat control may clear everything, including searched questions.

---

## 5. Search box for patient doubts

The input box remains visible throughout the guided journey.

The patient may type a question at any time.

Examples:

```text
Why does the mask feel tight?
```

```text
నోరు మండుతోంది ఎందుకు?
```

```text
Radiation planning enduku time padutundi?
```

Typed questions should use the existing document retrieval and AI-answer system.

The flow should be:

```text
Patient types a doubt
        ↓
Local document retrieval
        ↓
Relevant approved document chunks
        ↓
One AI request
        ↓
Grounded English or Telugu answer
```

Use only one model call per typed question.

Do not use an additional AI classification call unless the current implementation absolutely requires it.

---

## 6. Guided journey and search must remain separate

A typed search question must not change the guided journey stage.

Example:

1. Patient has completed the “planning scan” stage.
2. The next guided button is “Why is a mask used?”
3. Patient types: “Will contrast be used?”
4. The bot answers the typed question.
5. The guided button must still say “Why is a mask used?”

The patient can therefore ask doubts without losing their place in the journey.

Store the current journey step separately from normal chat history.

Suggested state shape:

```ts
interface ChatState {
  messages: ChatMessage[];
  currentJourneyStepId: string;
  selectedLanguage: "en" | "te";
  isSearching: boolean;
}
```

---

## 7. Single guided button design

The guided button should appear directly above the input box.

Requirements:

* Only one button
* Large touch target
* Rounded design
* Clearly visible
* Full width or nearly full width on phones
* Text may wrap to two lines
* Must look like the next question the patient can ask
* Must not look like a navigation menu

Example:

```text
┌─────────────────────────────────┐
│ What happens during planning?   │
└─────────────────────────────────┘
```

After clicking it, that question disappears and the next question replaces it.

Do not render old guided questions as buttons after they have been used. They should remain only as messages in the conversation.

---

## 8. Explain-more behaviour

Remove the old generic “Explain more” suggestion system.

Instead, the guided journey itself should provide the correct next explanation.

For typed AI questions, it is acceptable to show a small “Explain more” action inside or below that specific answer, but it must not replace the single guided journey button.

If “Explain more” is retained for AI answers:

* It must expand only the relevant typed answer.
* It must not advance the journey.
* It must use one additional model request.
* It must remain visually secondary.

The primary interaction must always be the single next-stage guided button.

---

## 9. Initial screen

On first load, display:

English:

```text
Hello. I can guide you through the radiation therapy process step by step. You can also type a question at any time.
```

Telugu:

```text
నమస్కారం. రేడియేషన్ థెరపీ ప్రక్రియను నేను మీకు దశలవారీగా వివరించగలను. మీకు సందేహం ఉన్నప్పుడు ఎప్పుడైనా ప్రశ్నను టైప్ చేయవచ్చు.
```

Below it, show only:

```text
What is radiation therapy?
```

or:

```text
రేడియేషన్ థెరపీ అంటే ఏమిటి?
```

Do not automatically dump the first explanation before the patient clicks.

---

## 10. Language behaviour

Switching between English and Telugu must:

* Translate the interface
* Translate the single next-step button
* Translate cached journey answers already displayed where practical
* Preserve the current journey stage
* Preserve typed-question history
* Not restart the journey

The cached journey must contain both English and Telugu content.

Do not translate cached journey answers using a live AI call.

---

## 11. Mobile layout

Use a layout similar to:

```text
┌─────────────────────────────┐
│ Radiation Guide   EN | తెలుగు │
├─────────────────────────────┤
│                             │
│ Greeting                    │
│                             │
│ Guided question             │
│ Cached answer               │
│                             │
│ Patient doubt               │
│ AI answer                   │
│                             │
├─────────────────────────────┤
│ Next guided question        │
├─────────────────────────────┤
│ Ask a doubt...        Send  │
└─────────────────────────────┘
```

Requirements:

* Conversation area scrolls
* Bottom controls remain visible
* Input stays visible when the mobile keyboard opens
* Respect safe-area insets
* Automatically scroll after new messages
* No horizontal scrolling
* Test at 320px, 375px, and 430px widths

---

## 12. AI search behaviour

For typed questions:

* Retrieve from the supplied documents
* Answer only from retrieved chunks
* Answer the exact question
* Understand English
* Understand Telugu script
* Understand Romanised Telugu
* Understand mixed Telugu-English
* Do not diagnose
* Do not prescribe
* Do not recommend treatment changes
* Do not interpret reports
* Do not invent information
* Refer the patient to the treating doctor when the material is insufficient

Keep the existing metadata-aware retrieval approach.

Do not create custom rules for every possible patient question.

Use broad metadata such as:

```ts
treatmentArea
topic
specificity
containsMedication
sourcePriority
```

When treatment area is unknown:

* Prefer general chunks
* Exclude treatment-specific medication content
* Avoid mixing unrelated treatment areas

---

## 13. API failure behaviour

If the AI request fails:

* Do not break the guided journey
* Keep the current next-step button visible
* Show the most relevant retrieved document content when possible
* Show a short failure message
* Allow retry

The cached guided journey must always work even when:

* The AI provider is unavailable
* The API key is missing
* The quota is exceeded
* The Worker is offline

This is one of the primary reasons for the new architecture.

---

## 14. Persistence

Persist locally:

* Selected language
* Current journey step
* Guided journey progress

Use `localStorage`.

Do not store:

* Full patient questions on a backend
* Patient identity
* Medical reports
* Personal data

Chat search history may remain only in the current browser session unless the current project already stores it locally.

---

## 15. Tests

Add or update tests for:

* Initial greeting appears
* Exactly one guided question appears
* Clicking the guided question adds its cached answer
* The button changes to the next journey question
* Repeated clicks advance through the journey correctly
* Final step shows “Start the guide again”
* Restart resets the journey
* Typed questions call the AI endpoint
* Typed questions do not change the journey stage
* API failure does not break the journey
* Language switching preserves progress
* English cached answers display correctly
* Telugu cached answers display correctly
* Only one guided button is visible at a time
* Mobile input remains usable

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Fix all errors.

---

## 16. Remove obsolete behaviour

Remove or refactor:

* Multiple suggested-question buttons
* Dynamic AI-generated suggestion lists
* Suggestion carousels
* Suggestion grids
* AI calls made solely to generate follow-up suggestions
* Any logic that advances the journey based on AI responses

Do not remove working document retrieval or AI search functionality.

---

## 17. Update documentation

Update:

```text
README.md
PROJECT_SPEC.md
TASKS.md
```

Explain:

* The guided journey is fully cached
* The AI is only used for patient doubts
* The guided journey works without an API
* How to edit the English and Telugu journey steps
* How to change journey order
* How to add a new journey stage
* How typed-question retrieval works
* How local progress is stored

---

## 18. Completion requirements

Do not claim completion until:

* Only one guided question is displayed at a time
* Each click advances to the next cached stage
* The full radiation process can be completed
* Search questions work independently
* Search questions do not change journey progress
* English works
* Telugu works
* The guide works without the AI backend
* Mobile layout works correctly
* Lint, typecheck, tests, and build pass

After implementation, summarise:

1. Files changed
2. Journey steps created
3. How cached answers are stored
4. How journey progress works
5. How typed questions use AI
6. How failure fallback works
7. How to edit journey content
8. Commands that passed
