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

function sourcePoints(chunks: KnowledgeChunk[]): string[] {
  const seen = new Set<string>()
  const points: Array<{ point: string; score: number }> = []

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
        if (/\b(LS|Fd|wl|ope|ios|badge|marker|dashboard)\b/i.test(part)) return false
        if (/\bup towards your ears\b/i.test(part)) return false
        if (/\byour shoulder slowly your shoulder\b/i.test(part)) return false
        if (/\bthen bend z\b/i.test(part)) return false
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
