import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatAnswer, ChatRequest, InterpretedQuestion } from './schemas'
import { buildFollowUpSuggestions } from './suggestions'

const unavailable = {
  en: 'I could not prepare a reliable answer right now. Please try again in a moment.',
  te: '\u0c07\u0c2a\u0c4d\u0c2a\u0c41\u0c21\u0c41 \u0c28\u0c2e\u0c4d\u0c2e\u0c26\u0c17\u0c3f\u0c28 \u0c38\u0c2e\u0c3e\u0c27\u0c3e\u0c28\u0c02 \u0c38\u0c3f\u0c26\u0c4d\u0c27\u0c02 \u0c1a\u0c47\u0c2f\u0c32\u0c47\u0c15\u0c2a\u0c4b\u0c2f\u0c3e\u0c28\u0c41. \u0c26\u0c2f\u0c1a\u0c47\u0c38\u0c3f \u0c15\u0c4a\u0c02\u0c1a\u0c46\u0c02 \u0c38\u0c47\u0c2a\u0c1f\u0c3f \u0c24\u0c30\u0c4d\u0c35\u0c3e\u0c24 \u0c2e\u0c33\u0c4d\u0c32\u0c40 \u0c2a\u0c4d\u0c30\u0c2f\u0c24\u0c4d\u0c28\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f.',
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
    treatmentAreaConfidence: 0,
    keyTerms: [],
    isOutsideScope: false,
  }
}

export function buildFallbackAnswer(
  request: ChatRequest,
  chunks: KnowledgeChunk[],
  conversationalFailure: boolean,
  interpreted: InterpretedQuestion = defaultInterpreted(request),
): ChatAnswer {
  const usefulChunks = chunks.filter((chunk) => chunk.content.trim().length > 0)

  return {
    answer: conversationalFailure ? unavailable[request.language] : missing[request.language],
    suggestions: buildFollowUpSuggestions(request, interpreted, usefulChunks),
    sourceIds: conversationalFailure ? [] : usefulChunks.slice(0, 2).map((chunk) => chunk.id),
    needsDoctorDiscussion: true,
  }
}
