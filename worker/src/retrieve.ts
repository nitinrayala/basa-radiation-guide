import { defaultKnowledgeChunks, retrieveChunks } from '../../src/features/retrieval/retrieve'
import type { KnowledgeChunk, RetrievalResult, TreatmentArea } from '../../src/features/retrieval/retrievalTypes'
import { embedText } from './embeddings'
import type { Env, InterpretedQuestion } from './schemas'

const validTreatmentAreas = new Set<TreatmentArea>([
  'general',
  'head_neck',
  'brain',
  'breast',
  'thorax_lung',
  'abdomen',
  'pelvis',
  'prostate',
  'cervix',
  'bone_spine',
])

const clearTreatmentAreaThreshold = 0.7

function isGeneralChunk(chunk: KnowledgeChunk): boolean {
  return chunk.specificity === 'general' || (chunk.treatmentAreas.length === 1 && chunk.treatmentAreas[0] === 'general')
}

export function allowedChunksForQuestion(treatmentAreas: TreatmentArea[], confidence: number, chunks: KnowledgeChunk[] = defaultKnowledgeChunks): KnowledgeChunk[] {
  const specificAreas = treatmentAreas.filter((area) => area !== 'general')
  const hasClearTreatmentArea = specificAreas.length > 0 && confidence >= clearTreatmentAreaThreshold

  if (!hasClearTreatmentArea) {
    return chunks.filter((chunk) => isGeneralChunk(chunk) && !chunk.containsMedicationInstruction)
  }

  return chunks.filter((chunk) => {
    if (isGeneralChunk(chunk)) return true
    const matchesTreatmentArea = specificAreas.some((area) => chunk.treatmentAreas.includes(area))
    if (!matchesTreatmentArea) return false

    return !chunk.containsMedicationInstruction || matchesTreatmentArea
  })
}

export function retrieveForQuestion(interpreted: InterpretedQuestion, originalQuestion: string, limit = 6): RetrievalResult[] {
  const treatmentAreas = interpreted.treatmentAreas.filter((area): area is TreatmentArea => validTreatmentAreas.has(area as TreatmentArea))
  const allowedChunks = allowedChunksForQuestion(treatmentAreas, interpreted.treatmentAreaConfidence)

  return retrieveChunks(
    {
      query: interpreted.englishSearchQuery || originalQuestion,
      category: interpreted.category,
      treatmentAreas,
      keyTerms: interpreted.keyTerms,
    },
    allowedChunks,
    limit,
  )
}

function vectorSearchText(interpreted: InterpretedQuestion, originalQuestion: string): string {
  return [
    interpreted.englishSearchQuery || originalQuestion,
    interpreted.category === 'unknown' ? '' : interpreted.category,
    ...interpreted.keyTerms,
  ]
    .filter(Boolean)
    .join(' ')
}

function mergeRetrievalResults(
  lexicalResults: RetrievalResult[],
  vectorMatches: Array<{ chunk: KnowledgeChunk; score: number }>,
  limit: number,
): RetrievalResult[] {
  const merged = new Map<string, RetrievalResult>()

  for (const result of lexicalResults) {
    merged.set(result.chunk.id, {
      chunk: result.chunk,
      score: result.score,
      matchReasons: [...result.matchReasons],
    })
  }

  for (const match of vectorMatches) {
    const existing = merged.get(match.chunk.id)
    const vectorScore = match.score * 40
    if (existing) {
      existing.score += vectorScore
      existing.matchReasons.push(`vector:${match.score.toFixed(3)}`)
    } else {
      merged.set(match.chunk.id, {
        chunk: match.chunk,
        score: vectorScore + Math.max(0, 8 - match.chunk.sourcePriority) * 0.8,
        matchReasons: [`vector:${match.score.toFixed(3)}`, `priority:${match.chunk.sourcePriority}`],
      })
    }
  }

  return Array.from(merged.values())
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.chunk.sourcePriority - right.chunk.sourcePriority
    })
    .slice(0, limit)
}

export async function retrieveHybridForQuestion(
  interpreted: InterpretedQuestion,
  originalQuestion: string,
  env: Env,
  limit = 6,
): Promise<RetrievalResult[]> {
  const treatmentAreas = interpreted.treatmentAreas.filter((area): area is TreatmentArea => validTreatmentAreas.has(area as TreatmentArea))
  const allowedChunks = allowedChunksForQuestion(treatmentAreas, interpreted.treatmentAreaConfidence)
  const allowedChunkIds = new Set(allowedChunks.map((chunk) => chunk.id))
  const chunksById = new Map(allowedChunks.map((chunk) => [chunk.id, chunk]))
  const lexicalResults = retrieveChunks(
    {
      query: interpreted.englishSearchQuery || originalQuestion,
      category: interpreted.category,
      treatmentAreas,
      keyTerms: interpreted.keyTerms,
    },
    allowedChunks,
    limit * 2,
  )

  if (!env.AI || !env.VECTORIZE_INDEX) {
    return lexicalResults.slice(0, limit)
  }

  try {
    const embedding = await embedText(env, vectorSearchText(interpreted, originalQuestion))
    const vectorResults = await env.VECTORIZE_INDEX.query(embedding, {
      topK: Math.max(limit * 2, 12),
      returnMetadata: 'all',
      returnValues: false,
    })
    const vectorMatches = vectorResults.matches.flatMap((match): Array<{ chunk: KnowledgeChunk; score: number }> => {
      const chunkId = typeof match.metadata?.chunkId === 'string' ? match.metadata.chunkId : match.id
      if (!allowedChunkIds.has(chunkId)) return []
      const chunk = chunksById.get(chunkId)
      if (!chunk) return []

      return [{ chunk, score: match.score }]
    })

    if (vectorMatches.length === 0) {
      return lexicalResults.slice(0, limit)
    }

    return mergeRetrievalResults(lexicalResults, vectorMatches, limit)
  } catch {
    return lexicalResults.slice(0, limit)
  }
}

export function toSourceLabels(chunks: KnowledgeChunk[]): Array<{ id: string; label: string }> {
  return chunks.map((chunk) => ({
    id: chunk.id,
    label: `${chunk.sourceFile}${chunk.sourceLocation ? `, ${chunk.sourceLocation}` : ''}`,
  }))
}
