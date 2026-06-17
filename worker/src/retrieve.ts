import { defaultKnowledgeChunks, retrieveChunks } from '../../src/features/retrieval/retrieve'
import type { KnowledgeChunk, RetrievalResult, TreatmentArea } from '../../src/features/retrieval/retrievalTypes'
import type { InterpretedQuestion } from './schemas'

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

function allowedChunksForQuestion(treatmentAreas: TreatmentArea[], confidence: number, chunks: KnowledgeChunk[] = defaultKnowledgeChunks): KnowledgeChunk[] {
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

export function toSourceLabels(chunks: KnowledgeChunk[]): Array<{ id: string; label: string }> {
  return chunks.map((chunk) => ({
    id: chunk.id,
    label: `${chunk.sourceFile}${chunk.sourceLocation ? `, ${chunk.sourceLocation}` : ''}`,
  }))
}
