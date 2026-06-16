import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatAnswer, ChatRequest } from './schemas'

const unavailable = {
  en: 'The conversational explanation is temporarily unavailable. Here is the most relevant information from the available documents.',
  te: 'సంభాషణ రూపంలోని వివరణ ప్రస్తుతం అందుబాటులో లేదు. అందుబాటులో ఉన్న పత్రాల నుండి అత్యంత సంబంధిత సమాచారం ఇక్కడ ఉంది.',
}

const missing = {
  en: 'This information is not clearly covered in the available material and may depend on your individual treatment plan. Please discuss it with your treating doctor.',
  te: 'ఈ సమాచారం అందుబాటులో ఉన్న పత్రాలలో స్పష్టంగా లేదు మరియు మీ వ్యక్తిగత చికిత్స ప్రణాళికపై ఆధారపడి ఉండవచ్చు. దయచేసి మీ చికిత్స చేస్తున్న వైద్యుడితో చర్చించండి.',
}

export function buildFallbackAnswer(request: ChatRequest, chunks: KnowledgeChunk[], conversationalFailure: boolean): ChatAnswer {
  const usefulChunks = chunks.filter((chunk) => chunk.content.trim().length > 0).slice(0, request.action === 'explain_more' ? 4 : 2)
  const sourceIds = usefulChunks.map((chunk) => chunk.id)
  const intro = conversationalFailure ? unavailable[request.language] : missing[request.language]
  const body = usefulChunks.map((chunk) => `${chunk.title}: ${chunk.content}`).join('\n\n')

  return {
    answer: body ? `${intro}\n\n${body}` : intro,
    suggestions: [
      {
        id: 'ask-planning',
        label: request.language === 'te' ? 'ప్లానింగ్ సమయంలో ఏమి జరుగుతుంది?' : 'What happens during planning?',
        action: 'question',
        question: request.language === 'te' ? 'ప్లానింగ్ సమయంలో ఏమి జరుగుతుంది?' : 'What happens during planning?',
      },
      {
        id: 'ask-side-effects',
        label: request.language === 'te' ? 'ఏ దుష్ప్రభావాలు రావచ్చు?' : 'What side effects can occur?',
        action: 'question',
        question: request.language === 'te' ? 'ఏ దుష్ప్రభావాలు రావచ్చు?' : 'What side effects can occur?',
      },
      {
        id: 'explain-more',
        label: request.language === 'te' ? 'మరింత వివరించండి' : 'Explain more',
        action: 'explain_more',
      },
    ],
    sourceIds,
    needsDoctorDiscussion: !body,
  }
}
