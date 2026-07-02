import { createGroqChatCompletion } from './groq'
import { answerSystemPrompt, buildAnswerPrompt } from './prompts'
import { buildFollowUpSuggestions, ensureExplainMoreSuggestion } from './suggestions'
import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatAnswer, ChatRequest, Env, InterpretedQuestion } from './schemas'

function extractJsonObject(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found.')
  }

  return text.slice(start, end + 1)
}

function cleanRawAnswer(text: string): string {
  return text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function hasDetailedSourceContent(chunks: KnowledgeChunk[]): boolean {
  const combined = chunks.map((chunk) => chunk.content).join(' ')
  return wordCount(combined) >= 55
}

function isThinAnswer(answer: ChatAnswer, chunks: KnowledgeChunk[]): boolean {
  if (!hasDetailedSourceContent(chunks)) return false
  if (wordCount(answer.answer) >= 85) return false
  return !/not clearly covered|could not prepare|try again|discuss it with/i.test(answer.answer)
}

function cleanSourcePoint(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s.,;:()/%+-]/gu, ' ')
    .replace(/\b[A-Z]\s+\d+%?\s+[A-Z]\b/g, ' ')
    .replace(/\b[()A-Z]{1,3}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
}

function sourcePointScore(point: string): number {
  let score = Math.min(point.length, 160)
  if (/\b(slowly|gently|support|bend|lift|roll|stretch|scan|planning|mask|drink|avoid|tell|ask|pain|swelling|stiffness|swallow|skin|mouth|food|water|fist|release|relaxed|straighten)\b/i.test(point)) {
    score += 80
  }
  if (/[()\\=]/.test(point)) score -= 90
  if (/\b(level|module|badge|dashboard|marker|towards your ears and then straighten)\b/i.test(point)) score -= 80
  if ((point.match(/[.,;]/g) ?? []).length > 4) score -= 20
  return score
}

function isReadableSourcePoint(point: string): boolean {
  const hasActionOrCareTerm = /\b(slowly|gently|support|bend|lift|roll|stretch|scan|planning|mask|drink|avoid|tell|ask|pain|swelling|stiffness|swallow|skin|mouth|food|water|fist|release|relaxed|straighten|lymphedema|exercise)\b/i.test(point)
  if (!hasActionOrCareTerm) return point.length >= 45
  if (point.length < 22 || point.length > 220) return false
  if (/[()\\=]/.test(point)) return false
  if (/,\s*\.?$/.test(point)) return false
  if (/\b(sachet|teaspoon|mouth gargles|swish|spit|medications?|tablet|capsule)\b/i.test(point)) return false
  if (/\b\d+(?:\.\d+)?\s*(?:ml|mg|litre|liter)\b/i.test(point)) return false
  if (/\b(LS|Fd|wl|ope|ios|badge|marker|dashboard)\b/i.test(point)) return false
  if (/\bup towards your ears\b/i.test(point)) return false
  if (/\byour shoulder slowly your shoulder\b/i.test(point)) return false
  if (/\bthen bend z\b/i.test(point)) return false
  if (/^shoulder rolls elbow stretch\.?$/i.test(point)) return false
  if (/^support your elbow on a pillow\.?$/i.test(point)) return false
  return true
}

function canonicalSourcePoints(chunks: KnowledgeChunk[]): string[] {
  const text = chunks.map((chunk) => chunk.content).join('\n').toLowerCase()
  const points: string[] = []
  const add = (condition: boolean, point: string) => {
    if (condition && !points.includes(point)) points.push(point)
  }

  add(
    /shoulder rolls|lift shoulders? slowly|lift your shoulder slowly|roll backwards?|roll backward/.test(text),
    'Lift your shoulders slowly toward your ears, then roll them backward in a continuous motion.',
  )
  add(
    /elbow stretch|touch your shoulder|straighten (your )?elbow|fully extend/.test(text),
    'Bend your elbow and touch your shoulder with your hand, then straighten the elbow fully.',
  )
  add(
    /wrist|support your elbow on a pillow|bend wrist back and forth/.test(text),
    'Support your elbow on a pillow, keep your hand relaxed, and bend your wrist back and forth.',
  )
  add(
    /hand squeeze|make a (slow,? )?(tight )?fist|open fingers|release fingers/.test(text),
    'Make a slow fist, squeeze gently, then open and relax your fingers.',
  )
  add(
    /wall crawl|fingers to pull your hands|crawl up the wall|slide back down/.test(text),
    'For wall crawl, stand facing a wall and use your fingers to move your hands upward, then slide back down slowly.',
  )
  add(
    /arm lift|lift arms over your head|clasp hands|hands behind neck|hands on head/.test(text),
    'For arm and chest stretching, clasp your hands and lift or stretch within your comfort level.',
  )
  add(
    /chin tuck|shoulder blades together|anchor your spine/.test(text),
    'For neck and upper-back posture, gently tuck your chin and squeeze your shoulder blades together.',
  )
  add(
    /bend head forward, back, left, and right|gently bend head forward|cervical/.test(text),
    'For neck mobility, gently bend your head forward, back, left, and right while keeping posture controlled.',
  )
  add(
    /clasp hands in front|stretch your head|elbows backwards|hands behind neck/.test(text),
    'For chest and shoulder extension, clasp your hands as instructed and gently stretch the elbows backward.',
  )
  add(
    /sharp pain|sudden discomfort|comfort level/.test(text),
    'Stay within your comfort level, and pause if you feel sharp pain or sudden discomfort.',
  )
  add(
    /shoulder stiffness|lymph ?edema|lymphedema/.test(text),
    'Regular movement can help reduce the risk of shoulder stiffness and lymphedema.',
  )

  return points
}

function sourcePoints(chunks: KnowledgeChunk[]): string[] {
  const seen = new Set<string>()
  const candidates: Array<{ point: string; score: number }> = []

  for (const point of canonicalSourcePoints(chunks)) {
    seen.add(point.toLowerCase())
    candidates.push({ point, score: 260 })
  }

  for (const chunk of chunks) {
    const parts = chunk.content
      .split(/\n|(?<=[.!?])\s+|;\s+|[•]\s+|-\s+/)
      .map(cleanSourcePoint)
      .filter(isReadableSourcePoint)
      .filter((part) => /[a-zA-Z]{4,}/.test(part))

    for (const part of parts) {
      const key = part.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      candidates.push({ point: part.endsWith('.') ? part : `${part}.`, score: sourcePointScore(part) })
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => !/\b(week\s*\d|mucositis|eesophagitis|medications?|nutrition supplements|mouth gargles|swish|spit|sachet|teaspoon)\b/i.test(candidate.point))
    .slice(0, 5)
    .map((candidate) => candidate.point)
}

function repairThinAnswer(answer: ChatAnswer, chunks: KnowledgeChunk[], request: ChatRequest): ChatAnswer {
  const points = sourcePoints(chunks)
  if (points.length < 2) return answer

  const heading = request.language === 'te' ? '\u0c2a\u0c4d\u0c30\u0c27\u0c3e\u0c28 \u0c05\u0c02\u0c36\u0c3e\u0c32\u0c41:' : 'Main points from the available material:'
  const note = request.language === 'te'
    ? '\u0c16\u0c1a\u0c4d\u0c1a\u0c3f\u0c24\u0c2e\u0c48\u0c28 \u0c38\u0c42\u0c1a\u0c28\u0c32\u0c41 \u0c2e\u0c40 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2c\u0c43\u0c02\u0c26\u0c02 \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c3f\u0c28\u0c1f\u0c4d\u0c32\u0c41 \u0c05\u0c28\u0c41\u0c38\u0c30\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f.'
    : 'Follow the specific routine and timing recommended by your treating team.'

  return {
    ...answer,
    answer: [answer.answer.replace(/:\s*$/, '.'), '', heading, ...points.map((point) => `- ${point}`), '', note].join('\n'),
    sourceIds: answer.sourceIds.length > 0 ? answer.sourceIds : chunks.slice(0, 2).map((chunk) => chunk.id),
    needsDoctorDiscussion: true,
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function sanitizeSuggestions(value: unknown): ChatAnswer['suggestions'] {
  if (!Array.isArray(value)) return []

  return value
    .slice(0, 5)
    .flatMap((item): ChatAnswer['suggestions'] => {
      if (!item || typeof item !== 'object') return []
      const record = item as Record<string, unknown>
      const action = record.action === 'explain_more' ? 'explain_more' : 'question'
      const label = typeof record.label === 'string' ? record.label.trim() : ''
      if (!label) return []

      return [
        {
          id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          label,
          action,
          question: typeof record.question === 'string' && record.question.trim() ? record.question.trim() : undefined,
        },
      ]
    })
}

function parseChatAnswer(text: string, request: ChatRequest, interpreted: InterpretedQuestion, chunks: KnowledgeChunk[]): ChatAnswer {
  let parsed: Record<string, unknown>

  try {
    parsed = JSON.parse(extractJsonObject(text)) as Record<string, unknown>
  } catch {
    const answer = cleanRawAnswer(text)
    if (!answer) throw new Error('Answer is empty.')
    if (/^\s*[{[]/.test(answer)) throw new Error('Invalid structured answer.')

    return {
      answer,
      suggestions: buildFollowUpSuggestions(request, interpreted, chunks),
      sourceIds: chunks.slice(0, 2).map((chunk) => chunk.id),
      needsDoctorDiscussion: chunks.some((chunk) => chunk.requiresDoctorConfirmation),
    }
  }

  const answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : ''
  if (!answer) throw new Error('Answer is empty.')

  const knownIds = new Set(chunks.map((chunk) => chunk.id))
  const sourceIds = Array.isArray(parsed.sourceIds)
    ? parsed.sourceIds.filter((id): id is string => typeof id === 'string' && knownIds.has(id))
    : []
  const suggestions = ensureExplainMoreSuggestion(
    [...buildFollowUpSuggestions(request, interpreted, chunks), ...sanitizeSuggestions(parsed.suggestions)],
    request.language,
  )

  return {
    answer,
    suggestions,
    sourceIds: sourceIds.length > 0 ? sourceIds : chunks.slice(0, 2).map((chunk) => chunk.id),
    needsDoctorDiscussion: parsed.needsDoctorDiscussion === true,
  }
}

async function createAnswerCompletion(
  apiKey: string,
  request: ChatRequest,
  interpreted: InterpretedQuestion,
  chunks: KnowledgeChunk[],
  env: Env,
  enforceCompleteAnswer = false,
): Promise<string> {
  const maxOutputTokens = request.action === 'explain_more' ? env.MAX_OUTPUT_TOKENS_EXPANDED : env.MAX_OUTPUT_TOKENS_NORMAL
  const prompt = enforceCompleteAnswer
    ? `${buildAnswerPrompt(request, interpreted, chunks)}

Quality correction:
The previous answer was too brief for the available source content. Rewrite it as a complete patient-friendly answer using the same global structure for every topic:
- direct explanation,
- concrete bullet points from the approved content,
- key notes or a treating-team reminder when supported.
Do not add unsupported medical advice.`
    : buildAnswerPrompt(request, interpreted, chunks)

  return createGroqChatCompletion(apiKey, {
    model: env.GROQ_MODEL || 'llama-3.1-8b-instant',
    systemInstruction: answerSystemPrompt,
    messages: [
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    maxOutputTokens: Number.parseInt(maxOutputTokens || '', 10) || (request.action === 'explain_more' ? 1400 : 850),
    topP: 1,
    responseFormat: 'json_object',
  })
}

export async function generateAnswer(
  request: ChatRequest,
  interpreted: InterpretedQuestion,
  chunks: KnowledgeChunk[],
  env: Env,
): Promise<ChatAnswer> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.')
  }

  let text: string
  try {
    text = await createAnswerCompletion(env.GROQ_API_KEY, request, interpreted, chunks, env)
  } catch {
    await sleep(250)
    text = await createAnswerCompletion(env.GROQ_API_KEY, request, interpreted, chunks, env)
  }

  const answer = parseChatAnswer(text, request, interpreted, chunks)
  if (!isThinAnswer(answer, chunks)) return answer

  try {
    const detailedText = await createAnswerCompletion(env.GROQ_API_KEY, request, interpreted, chunks, env, true)
    const detailedAnswer = parseChatAnswer(detailedText, request, interpreted, chunks)
    return isThinAnswer(detailedAnswer, chunks) ? repairThinAnswer(detailedAnswer, chunks, request) : detailedAnswer
  } catch {
    return repairThinAnswer(answer, chunks, request)
  }
}
