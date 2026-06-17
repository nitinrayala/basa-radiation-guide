import type { ChatRequest, InterpretedQuestion } from './schemas'
import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'

export const answerSystemPrompt = `You are a bilingual radiation therapy information assistant.

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
If the requested language is Telugu, translate the approved English source content into natural Telugu. Do not leave full English sentences in the answer.
Keep common medical terms in English only when helpful, preferably with a short Telugu explanation or in parentheses.
Write like a calm patient educator, not like a document search result.
Do not paste document text as-is. Restructure the retrieved information into a clear explanation.

Prefer this answer shape:
1. Start with a direct 1-2 sentence answer to the patient's exact question.
2. Add brief context so the patient understands why this matters.
3. Add one short heading such as "What this means", "What to expect", "What you can do", or a natural Telugu equivalent.
4. Use 3-6 short bullets for steps, reasons, side effects, precautions or next steps.
5. End with a brief doctor/team reminder only when the documents require confirmation or the information may vary.

Normal answers should be useful on their own, usually 220-360 words.
For Explain More answers, provide more detail but keep it readable, usually 380-600 words.
Use natural wording. Avoid sounding like a copied medical handout.
Avoid phrases like "the document says" unless you need to explain that information is limited.
Do not mention source filenames, slide numbers or internal metadata in the answer.

When medicines, lotions, mouthwashes or specific instructions appear in the documents, clearly state that the patient should use them only as advised by their treating team.
When the documents do not contain enough information, say that the topic may depend on the individual treatment plan and should be discussed with the treating doctor.

Return only valid JSON matching this schema:
{"answer":"string","suggestions":[{"id":"string","label":"string","action":"question|explain_more","question":"string optional"}],"sourceIds":["string"],"needsDoctorDiscussion":true}`

export function buildInterpretPrompt(request: ChatRequest): string {
  return `Convert this patient question into compact retrieval metadata.

Return only valid JSON with:
detectedLanguage: "en" | "te" | "mixed"
responseLanguage: "en" | "te"
englishSearchQuery: string
category: "overview" | "workflow" | "planning" | "technique" | "side_effect" | "precaution" | "nutrition" | "skin_care" | "oral_care" | "rehabilitation" | "follow_up" | "unknown"
treatmentAreas: string[]
treatmentAreaConfidence: number between 0 and 1
keyTerms: string[]
isOutsideScope: boolean

Use treatmentAreaConfidence only for how clearly the patient or conversation states the treatment area.
Use 0 when the area is unknown.
Use below 0.7 when it is inferred weakly or only from a vague symptom.
Use 0.7 or above only when the area is clearly stated, for example breast radiation, head and neck radiation, pelvic radiation, prostate, cervix, brain, lung or abdomen.

Selected UI language: ${request.language}
Action: ${request.action}
Question: ${request.question}`
}

export function buildAnswerPrompt(request: ChatRequest, interpreted: InterpretedQuestion, chunks: KnowledgeChunk[]): string {
  const approvedContent = chunks.map((chunk, index) => {
    return `SOURCE ${index + 1}
id: ${chunk.id}
title: ${chunk.title}
source: ${chunk.sourceFile}${chunk.sourceLocation ? `, ${chunk.sourceLocation}` : ''}
category: ${chunk.category}
treatmentAreas: ${chunk.treatmentAreas.join(', ')}
containsMedicationInstruction: ${chunk.containsMedicationInstruction}
requiresDoctorConfirmation: ${chunk.requiresDoctorConfirmation}
content:
${chunk.content}`
  })

  const history = request.history
    .slice(-6)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n')
  const answerPlan = buildAnswerPlan(interpreted)

  return `Requested response language: ${interpreted.responseLanguage}
Original question: ${request.question}
Action: ${request.action}

Interpreted intent:
${JSON.stringify(interpreted)}

Recent conversation:
${history || 'None'}

Answer plan:
${answerPlan}

APPROVED DOCUMENT CONTENT:
${approvedContent.join('\n\n')}

Write a patient-friendly answer using only the approved document content.

Answer-quality rules:
- Do not copy large document passages verbatim.
- Combine overlapping source information into a clean explanation.
- Remove repeated phrases and document headings that do not help the patient.
- Use short paragraphs and simple bullets.
- Give enough background for a patient who has never heard the term before.
- Explain why something is done, what the patient may experience, and what happens next when the approved content supports it.
- Make the answer feel freshly written for this exact question, not copied from source order.
- Do not assume a cancer type, treatment area or treatment week unless the retrieved content and interpreted intent support it.
- Do not use treatment-specific or medication instructions unless they are present in the approved content supplied to you.
- If the approved content is thin, say that clearly instead of padding.
- Do not include source filenames in the answer text.

Suggestion rules:
- Include three to five follow-up suggestions.
- Suggestions must be specific to the patient question, retrieved content and recent conversation.
- Always include one suggestion with action "explain_more".
- For normal question suggestions, include a complete "question" field.
- Suggestions must use the requested response language.

If Action is "explain_more", use the recent conversation to expand the previous answer with more detail from the approved content. Do not merely repeat the same answer.`
}

function buildAnswerPlan(interpreted: InterpretedQuestion): string {
  switch (interpreted.category) {
    case 'planning':
      return `Explain the purpose first, then what usually happens during planning, what the patient may feel, and what may happen next if the approved content supports it.`
    case 'workflow':
      return `Organize the answer as before, during and after the visit or treatment step when the approved content supports that structure.`
    case 'side_effect':
      return `Separate expected effects from symptoms to report. Include timing, practical precautions and doctor/team guidance only when present in the approved content.`
    case 'skin_care':
      return `Explain possible skin changes, what care steps are mentioned, what to avoid if stated, and when to ask the treating team.`
    case 'oral_care':
      return `Explain mouth or swallowing care in simple steps. Mention medicines or mouthwashes only as instructions from the treating team.`
    case 'nutrition':
      return `Give practical food or eating guidance only from the approved content. Avoid inventing diet plans.`
    case 'rehabilitation':
      return `Explain the purpose of exercises or rehabilitation, the documented steps at a high level, and remind the patient to follow the team if confirmation is required.`
    case 'technique':
      return `Explain the technique in plain language without recommending it or comparing it as a treatment choice.`
    case 'precaution':
      return `State the precaution clearly, explain why it matters if the content says so, and list the specific do or do-not steps that are documented.`
    default:
      return `Answer the exact question directly. If the approved content only partially covers it, say what is known and what should be discussed with the treating team.`
  }
}
