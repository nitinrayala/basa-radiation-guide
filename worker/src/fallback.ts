import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatAnswer, ChatRequest, InterpretedQuestion } from './schemas'
import { buildFollowUpSuggestions } from './suggestions'

const unavailable = {
  en: 'The conversational explanation is temporarily unavailable. Here is the most relevant information from the available documents.',
  te: 'సంభాషణ రూపంలోని వివరణ ప్రస్తుతం అందుబాటులో లేదు. అందుబాటులో ఉన్న పత్రాల నుండి అత్యంత సంబంధిత సమాచారం ఇక్కడ ఉంది.',
}

const missing = {
  en: 'This information is not clearly covered in the available material and may depend on your individual treatment plan. Please discuss it with your treating doctor.',
  te: 'ఈ సమాచారం అందుబాటులో ఉన్న పత్రాలలో స్పష్టంగా లేదు మరియు మీ వ్యక్తిగత చికిత్స ప్రణాళికపై ఆధారపడి ఉండవచ్చు. దయచేసి మీ చికిత్స చేసే డాక్టర్‌తో చర్చించండి.',
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

export function buildFallbackAnswer(
  request: ChatRequest,
  chunks: KnowledgeChunk[],
  conversationalFailure: boolean,
  interpreted: InterpretedQuestion = defaultInterpreted(request),
): ChatAnswer {
  const usefulChunks = chunks.filter((chunk) => chunk.content.trim().length > 0).slice(0, request.action === 'explain_more' ? 4 : 2)
  const sourceIds = usefulChunks.map((chunk) => chunk.id)
  const intro = conversationalFailure ? unavailable[request.language] : missing[request.language]
  const body = usefulChunks.map((chunk) => `${chunk.title}: ${chunk.content}`).join('\n\n')

  return {
    answer: body ? `${intro}\n\n${body}` : intro,
    suggestions: buildFollowUpSuggestions(request, interpreted, usefulChunks),
    sourceIds,
    needsDoctorDiscussion: !body,
  }
}
