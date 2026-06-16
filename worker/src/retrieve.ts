import { retrieveChunks } from '../../src/features/retrieval/retrieve'
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

export function retrieveForQuestion(interpreted: InterpretedQuestion, originalQuestion: string, limit = 6): RetrievalResult[] {
  const treatmentAreas = interpreted.treatmentAreas.filter((area): area is TreatmentArea => validTreatmentAreas.has(area as TreatmentArea))

  return retrieveChunks(
    {
      query: interpreted.englishSearchQuery || originalQuestion,
      category: interpreted.category,
      treatmentAreas,
      keyTerms: interpreted.keyTerms,
    },
    undefined,
    limit,
  )
}

export function toSourceLabels(chunks: KnowledgeChunk[]): Array<{ id: string; label: string }> {
  return chunks.map((chunk) => ({
    id: chunk.id,
    label: `${chunk.sourceFile}${chunk.sourceLocation ? `, ${chunk.sourceLocation}` : ''}`,
  }))
}
