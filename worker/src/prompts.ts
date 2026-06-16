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
Do not paste document text as-is. Restructure the retrieved information into a clear explanation.
Prefer this answer shape:
1. Start with a direct 1-2 sentence answer to the patient's exact question.
2. Add a short "What this means" or equivalent section when it helps.
3. Use 2-5 short bullet points for steps, reasons, side effects or precautions.
4. End with a brief doctor/team reminder only when the documents require confirmation or the information may vary.

Keep normal answers compact, usually 120-180 words.
For Explain More answers, provide more detail but keep it readable, usually 220-320 words.
Use natural wording. Avoid sounding like a copied medical handout.

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
keyTerms: string[]
isOutsideScope: boolean

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

  return `Requested response language: ${interpreted.responseLanguage}
Original question: ${request.question}
Action: ${request.action}

Interpreted intent:
${JSON.stringify(interpreted)}

Recent conversation:
${history || 'None'}

APPROVED DOCUMENT CONTENT:
${approvedContent.join('\n\n')}

Write a patient-friendly answer using only the approved document content.

Answer-quality rules:
- Do not copy large document passages verbatim.
- Combine overlapping source information into a clean explanation.
- Remove repeated phrases and document headings that do not help the patient.
- Use short paragraphs and simple bullets.
- Explain why something is done, what the patient may experience, and what happens next when the approved content supports it.
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
