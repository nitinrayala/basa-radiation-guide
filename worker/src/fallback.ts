import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatAnswer, ChatRequest, InterpretedQuestion } from './schemas'
import { buildFollowUpSuggestions } from './suggestions'

const unavailable = {
  en: 'I could not prepare the conversational version this time. Here is the most relevant information from the available documents.',
  te: '\u0c38\u0c02\u0c2d\u0c3e\u0c37\u0c23 \u0c30\u0c42\u0c2a\u0c02\u0c32\u0c4b \u0c35\u0c3f\u0c35\u0c30\u0c23\u0c28\u0c41 \u0c08\u0c38\u0c3e\u0c30\u0c3f \u0c38\u0c3f\u0c26\u0c4d\u0c27\u0c02 \u0c1a\u0c47\u0c2f\u0c32\u0c47\u0c15\u0c2a\u0c4b\u0c2f\u0c3e\u0c28\u0c41. \u0c05\u0c02\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41\u0c32\u0c4b \u0c09\u0c28\u0c4d\u0c28 \u0c2a\u0c24\u0c4d\u0c30\u0c3e\u0c32 \u0c28\u0c41\u0c02\u0c21\u0c3f \u0c05\u0c24\u0c4d\u0c2f\u0c02\u0c24 \u0c38\u0c02\u0c2c\u0c02\u0c27\u0c3f\u0c24 \u0c38\u0c2e\u0c3e\u0c1a\u0c3e\u0c30\u0c02 \u0c07\u0c15\u0c4d\u0c15\u0c21 \u0c09\u0c02\u0c26\u0c3f.',
}

const missing = {
  en: 'This information is not clearly covered in the available material and may depend on your individual treatment plan. Please discuss it with your treating doctor.',
  te: '\u0c08 \u0c38\u0c2e\u0c3e\u0c1a\u0c3e\u0c30\u0c02 \u0c05\u0c02\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41\u0c32\u0c4b \u0c09\u0c28\u0c4d\u0c28 \u0c2a\u0c24\u0c4d\u0c30\u0c3e\u0c32\u0c32\u0c4b \u0c38\u0c4d\u0c2a\u0c37\u0c4d\u0c1f\u0c02\u0c17\u0c3e \u0c32\u0c47\u0c26\u0c41 \u0c2e\u0c30\u0c3f\u0c2f\u0c41 \u0c2e\u0c40 \u0c35\u0c4d\u0c2f\u0c15\u0c4d\u0c24\u0c3f\u0c17\u0c24 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2a\u0c4d\u0c30\u0c23\u0c3e\u0c33\u0c3f\u0c15\u0c2a\u0c48 \u0c06\u0c27\u0c3e\u0c30\u0c2a\u0c21\u0c3f \u0c09\u0c02\u0c21\u0c35\u0c1a\u0c4d\u0c1a\u0c41. \u0c26\u0c2f\u0c1a\u0c47\u0c38\u0c3f \u0c2e\u0c40 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c1a\u0c47\u0c38\u0c47 \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d\u200c\u0c24\u0c4b \u0c1a\u0c30\u0c4d\u0c1a\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f.',
}

function defaultInterpreted(request: ChatRequest): InterpretedQuestion {
  return {
    detectedLanguage: request.language,
    responseLanguage: request.language,
    englishSearchQuery: request.question,
    category: 'unknown',
    treatmentAreas: ['general'],
    keyTerms: [],
    isOutsideScope: false,
  }
}

function sentenceLimit(text: string, maxSentences: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []

  return sentences.slice(0, maxSentences).join(' ').trim()
}

function formatFallbackBody(chunks: KnowledgeChunk[], expanded: boolean): string {
  const maxChunks = expanded ? 4 : 2
  const maxSentences = expanded ? 4 : 2

  return chunks
    .slice(0, maxChunks)
    .map((chunk) => {
      const summary = sentenceLimit(chunk.content, maxSentences)
      return summary ? `${chunk.title}\n- ${summary}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export function buildFallbackAnswer(
  request: ChatRequest,
  chunks: KnowledgeChunk[],
  conversationalFailure: boolean,
  interpreted: InterpretedQuestion = defaultInterpreted(request),
): ChatAnswer {
  const usefulChunks = chunks.filter((chunk) => chunk.content.trim().length > 0).slice(0, request.action === 'explain_more' ? 4 : 2)
  const sourceIds = usefulChunks.map((chunk) => chunk.id)
  const intro = conversationalFailure ? unavailable[request.language] : missing[request.language]
  const body = formatFallbackBody(usefulChunks, request.action === 'explain_more')

  return {
    answer: body ? `${intro}\n\n${body}` : intro,
    suggestions: buildFollowUpSuggestions(request, interpreted, usefulChunks),
    sourceIds,
    needsDoctorDiscussion: !body,
  }
}
