import { retrieveForQuestion } from './retrieve'
import type { InterpretedQuestion } from './schemas'

function interpretedQuestion(overrides: Partial<InterpretedQuestion>): InterpretedQuestion {
  return {
    detectedLanguage: 'en',
    responseLanguage: 'en',
    englishSearchQuery: 'what should I say if I feel uncomfortable during radiation',
    category: 'overview',
    treatmentAreas: [],
    treatmentAreaConfidence: 0,
    keyTerms: [],
    isOutsideScope: false,
    ...overrides,
  }
}

describe('Worker retrieval filtering', () => {
  it('uses only general non-medication chunks when treatment area is unknown', () => {
    const results = retrieveForQuestion(
      interpretedQuestion({
        englishSearchQuery: 'what should I say if I feel uncomfortable during radiation',
        category: 'overview',
        treatmentAreas: [],
        treatmentAreaConfidence: 0,
      }),
      'అసౌకర్యంగా ఉంటే ఏమి చెప్పాలి?',
      6,
    )

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((result) => result.chunk.specificity === 'general')).toBe(true)
    expect(results.every((result) => !result.chunk.containsMedicationInstruction)).toBe(true)
  })

  it('allows matching treatment-specific chunks when treatment area is clear', () => {
    const results = retrieveForQuestion(
      interpretedQuestion({
        englishSearchQuery: 'urine burning during pelvic radiation',
        category: 'side_effect',
        treatmentAreas: ['pelvis'],
        treatmentAreaConfidence: 0.95,
        keyTerms: ['urine', 'burning', 'pelvis'],
      }),
      'Pelvic radiation valla urine burning untunda?',
      6,
    )

    expect(results.length).toBeGreaterThan(0)
    expect(results.some((result) => result.chunk.treatmentAreas.includes('pelvis'))).toBe(true)
    expect(results.every((result) => result.chunk.specificity === 'general' || result.chunk.treatmentAreas.includes('pelvis'))).toBe(true)
  })

  it('excludes medication chunks when treatment area confidence is low', () => {
    const results = retrieveForQuestion(
      interpretedQuestion({
        englishSearchQuery: 'mouthwash during radiation',
        category: 'oral_care',
        treatmentAreas: ['head_neck'],
        treatmentAreaConfidence: 0.4,
        keyTerms: ['mouthwash'],
      }),
      'mouthwash vadala?',
      6,
    )

    expect(results.every((result) => !result.chunk.containsMedicationInstruction)).toBe(true)
    expect(results.every((result) => result.chunk.specificity === 'general')).toBe(true)
  })
})
