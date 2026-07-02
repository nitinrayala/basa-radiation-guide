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

function cleanPoint(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s.,;:()/%+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
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
  const points: Array<{ point: string; score: number }> = []

  for (const point of canonicalSourcePoints(chunks)) {
    seen.add(point.toLowerCase())
    points.push({ point, score: 260 })
  }

  for (const chunk of chunks) {
    const parts = chunk.content
      .replace(/\n+/g, '. ')
      .split(/(?<=[.!?])\s+|;\s+|[•]\s+|-\s+/)
      .map(cleanPoint)
      .filter((part) => {
        const hasActionOrCareTerm = /\b(slowly|gently|support|bend|lift|roll|stretch|scan|planning|mask|drink|avoid|tell|ask|pain|swelling|stiffness|swallow|skin|mouth|food|water|fist|release|relaxed|straighten|lymphedema|exercise)\b/i.test(part)
        if (hasActionOrCareTerm && (part.length < 22 || part.length > 220)) return false
        if (!hasActionOrCareTerm && part.length < 45) return false
        if (/[()\\=]/.test(part)) return false
        if (/,\s*\.?$/.test(part)) return false
        if (/\b(sachet|teaspoon|mouth gargles|swish|spit|medications?|tablet|capsule)\b/i.test(part)) return false
        if (/\b\d+(?:\.\d+)?\s*(?:ml|mg|litre|liter)\b/i.test(part)) return false
        if (/\b(LS|Fd|wl|ope|ios|badge|marker|dashboard)\b/i.test(part)) return false
        if (/\bup towards your ears\b/i.test(part)) return false
        if (/\byour shoulder slowly your shoulder\b/i.test(part)) return false
        if (/\bthen bend z\b/i.test(part)) return false
        if (/^shoulder rolls elbow stretch\.?$/i.test(part)) return false
        if (/^support your elbow on a pillow\.?$/i.test(part)) return false
        return true
      })
      .filter((part) => /[a-zA-Z]{4,}/.test(part))

    for (const part of parts) {
      const key = part.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      let score = Math.min(part.length, 160)
      if (/\b(slowly|gently|support|bend|lift|roll|stretch|scan|planning|mask|drink|avoid|tell|ask|pain|swelling|stiffness|swallow|skin|mouth|food|water|fist|release|relaxed|straighten)\b/i.test(part)) score += 80
      points.push({ point: part.endsWith('.') ? part : `${part}.`, score })
    }
  }

  return points
    .sort((left, right) => right.score - left.score)
    .filter((candidate) => !/\b(week\s*\d|mucositis|eesophagitis|medications?|nutrition supplements|mouth gargles|swish|spit|sachet|teaspoon)\b/i.test(candidate.point))
    .slice(0, 5)
    .map((candidate) => candidate.point)
}

function buildSourceFallback(request: ChatRequest, chunks: KnowledgeChunk[]): string | undefined {
  const points = sourcePoints(chunks)
  if (points.length < 2) return undefined

  if (request.language === 'te') {
    return [
      '\u0c38\u0c02\u0c2d\u0c3e\u0c37\u0c23 \u0c30\u0c42\u0c2a\u0c02\u0c32\u0c4b\u0c28\u0c3f \u0c35\u0c3f\u0c35\u0c30\u0c23 \u0c24\u0c3e\u0c24\u0c4d\u0c15\u0c3e\u0c32\u0c3f\u0c15\u0c02\u0c17\u0c3e \u0c05\u0c02\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41\u0c32\u0c4b \u0c32\u0c47\u0c26\u0c41. \u0c05\u0c02\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41\u0c32\u0c4b \u0c09\u0c28\u0c4d\u0c28 \u0c2a\u0c24\u0c4d\u0c30\u0c3e\u0c32 \u0c28\u0c41\u0c02\u0c21\u0c3f \u0c38\u0c02\u0c2c\u0c02\u0c27\u0c3f\u0c24 \u0c05\u0c02\u0c36\u0c3e\u0c32\u0c41:',
      '',
      ...points.map((point) => `- ${point}`),
      '',
      '\u0c16\u0c1a\u0c4d\u0c1a\u0c3f\u0c24\u0c2e\u0c48\u0c28 \u0c38\u0c42\u0c1a\u0c28\u0c32\u0c41 \u0c2e\u0c40 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2a\u0c4d\u0c30\u0c23\u0c3e\u0c33\u0c3f\u0c15\u0c2a\u0c48 \u0c06\u0c27\u0c3e\u0c30\u0c2a\u0c21\u0c3f \u0c2e\u0c3e\u0c30\u0c35\u0c1a\u0c4d\u0c1a\u0c41. \u0c26\u0c2f\u0c1a\u0c47\u0c38\u0c3f \u0c2e\u0c40 \u0c30\u0c47\u0c21\u0c3f\u0c2f\u0c47\u0c37\u0c28\u0c4d \u0c1f\u0c40\u0c2e\u0c4d\u200c\u0c24\u0c4b \u0c16\u0c30\u0c3e\u0c30\u0c41 \u0c1a\u0c47\u0c38\u0c41\u0c15\u0c4b\u0c02\u0c21\u0c3f.',
    ].join('\n')
  }

  return [
    'The conversational explanation is temporarily unavailable. Here are the most relevant points from the available material:',
    '',
    ...points.map((point) => `- ${point}`),
    '',
    "Some instructions can change based on your treatment area and plan, so confirm the exact details with your radiation team.",
  ].join('\n')
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
  const sourceFallback = conversationalFailure ? buildSourceFallback(request, usefulChunks) : undefined

  return {
    answer: sourceFallback ?? (conversationalFailure ? unavailable[request.language] : missing[request.language]),
    suggestions: buildFollowUpSuggestions(request, interpreted, usefulChunks),
    sourceIds: sourceFallback || !conversationalFailure ? usefulChunks.slice(0, 2).map((chunk) => chunk.id) : [],
    needsDoctorDiscussion: true,
  }
}
