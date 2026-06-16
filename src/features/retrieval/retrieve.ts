import knowledgeChunks from '../../data/knowledgeChunks.json'
import { expandQueryTokens, levenshteinDistance, normalizeText, tokenize } from './normalize'
import type { Category, KnowledgeChunk, RetrievalQuery, RetrievalResult, TreatmentArea } from './retrievalTypes'

export const defaultKnowledgeChunks = knowledgeChunks as KnowledgeChunk[]

const categoryHints: Array<[Category, RegExp]> = [
  ['planning', /\b(mask|planning|scan|simulation|ct|immobili[sz]ation|position|contrast)\b/],
  ['technique', /\b(imrt|vmat|srs|sbrt|3dcrt|technique|machine|linac)\b/],
  ['side_effect', /\b(side effect|pain|burning|mucositis|diarrhea|nausea|vomiting|fatigue|hair|skin reaction)\b/],
  ['skin_care', /\b(skin|soap|lotion|cream|shaving|burn)\b/],
  ['oral_care', /\b(mouth|oral|gargle|mouthwash|teeth|throat|swallow)\b/],
  ['nutrition', /\b(food|diet|water|liquid|fluid|nutrition|eat|meal)\b/],
  ['rehabilitation', /\b(exercise|rehab|shoulder|physio|movement)\b/],
  ['workflow', /\b(start|call|inform|notify|schedule|after|workflow|step)\b/],
]

const treatmentAreaHints: Array<[TreatmentArea, RegExp]> = [
  ['head_neck', /\b(head|neck|mask|mouth|oral|throat|swallow|gonthu)\b/],
  ['brain', /\b(brain|srs|headache)\b/],
  ['breast', /\b(breast|axilla)\b/],
  ['thorax_lung', /\b(chest|thorax|lung|pneumonitis|esophagus|oesophagus)\b/],
  ['abdomen', /\b(abdomen|stomach|nausea|vomiting|bowel)\b/],
  ['pelvis', /\b(pelvis|pelvic|urine|bladder|rectal|proctitis)\b/],
  ['prostate', /\b(prostate)\b/],
  ['cervix', /\b(cervix|cervical)\b/],
  ['bone_spine', /\b(bone|spine|spinal)\b/],
]

function inferCategory(query: string): Category | undefined {
  const normalized = normalizeText(query)
  return categoryHints.find(([, pattern]) => pattern.test(normalized))?.[0]
}

function inferTreatmentAreas(query: string): TreatmentArea[] {
  const normalized = normalizeText(query)
  return treatmentAreaHints.filter(([, pattern]) => pattern.test(normalized)).map(([area]) => area)
}

function hasFuzzyMatch(token: string, targetTokens: Set<string>): boolean {
  if (token.length < 5) return false

  for (const targetToken of targetTokens) {
    const maxDistance = token.length > 7 ? 2 : 1
    if (Math.abs(token.length - targetToken.length) <= maxDistance && levenshteinDistance(token, targetToken) <= maxDistance) {
      return true
    }
  }

  return false
}

function scoreChunk(chunk: KnowledgeChunk, query: RetrievalQuery): RetrievalResult {
  const queryText = [query.query, ...(query.keyTerms ?? [])].join(' ')
  const normalizedQuery = normalizeText(queryText)
  const queryTokens = expandQueryTokens(tokenize(queryText))
  const titleTokens = new Set(tokenize(chunk.title))
  const contentTokens = new Set(tokenize(chunk.content))
  const combinedTokens = new Set([...titleTokens, ...contentTokens])
  const normalizedTitle = normalizeText(chunk.title)
  const normalizedContent = normalizeText(chunk.content)
  const category = query.category && query.category !== 'unknown' ? query.category : inferCategory(queryText)
  const treatmentAreas = query.treatmentAreas?.length ? query.treatmentAreas : inferTreatmentAreas(queryText)

  let score = 0
  const matchReasons: string[] = []
  let lexicalHits = 0

  if (normalizedQuery.length > 4 && normalizedContent.includes(normalizedQuery)) {
    score += 24
    lexicalHits += 1
    matchReasons.push('exact content phrase')
  }

  if (normalizedQuery.length > 4 && normalizedTitle.includes(normalizedQuery)) {
    score += 30
    lexicalHits += 1
    matchReasons.push('exact title phrase')
  }

  for (const token of queryTokens) {
    if (titleTokens.has(token)) {
      score += 5
      lexicalHits += 1
      matchReasons.push(`title:${token}`)
    } else if (contentTokens.has(token)) {
      score += 1.4
      lexicalHits += 1
      matchReasons.push(`content:${token}`)
    } else if (hasFuzzyMatch(token, combinedTokens)) {
      score += 0.7
      lexicalHits += 1
      matchReasons.push(`fuzzy:${token}`)
    }
  }

  if (category && chunk.category === category) {
    score += 10
    matchReasons.push(`category:${category}`)
  }

  for (const treatmentArea of treatmentAreas) {
    if (chunk.treatmentAreas.includes(treatmentArea)) {
      score += treatmentArea === 'general' ? 2 : 9
      matchReasons.push(`area:${treatmentArea}`)
    }
  }

  if (lexicalHits > 0) {
    score += Math.max(0, 8 - chunk.sourcePriority) * 0.8
    matchReasons.push(`priority:${chunk.sourcePriority}`)
  }

  return { chunk, score, matchReasons }
}

export function retrieveChunks(
  query: RetrievalQuery,
  chunks: KnowledgeChunk[] = defaultKnowledgeChunks,
  limit = 6,
): RetrievalResult[] {
  const scoredResults = chunks
    .map((chunk) => scoreChunk(chunk, query))
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.chunk.sourcePriority - right.chunk.sourcePriority
    })

  if (scoredResults.length > 0) {
    return scoredResults.slice(0, limit)
  }

  return chunks
    .slice()
    .sort((left, right) => left.sourcePriority - right.sourcePriority)
    .slice(0, limit)
    .map((chunk) => ({
      chunk,
      score: 0,
      matchReasons: ['fallback:source_priority'],
    }))
}
