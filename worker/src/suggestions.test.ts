import { buildFollowUpSuggestions, ensureExplainMoreSuggestion } from './suggestions'
import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatRequest, InterpretedQuestion } from './schemas'

const baseRequest: ChatRequest = {
  language: 'en',
  question: 'Why is a mask used during radiation?',
  action: 'normal',
  history: [],
}

const maskChunk: KnowledgeChunk = {
  id: 'mask-chunk',
  title: 'Thermoplastic mask',
  content: 'A thermoplastic mask helps with immobilization and positioning.',
  category: 'planning',
  treatmentAreas: ['head_neck'],
  sourceFile: 'Radiation Planning-ChatBot.docx',
  sourcePriority: 4,
  containsMedicationInstruction: false,
  requiresDoctorConfirmation: false,
}

const interpreted: InterpretedQuestion = {
  detectedLanguage: 'en',
  responseLanguage: 'en',
  englishSearchQuery: 'why is an immobilisation mask used during radiation therapy',
  category: 'planning',
  treatmentAreas: ['head_neck'],
  keyTerms: ['mask', 'immobilisation'],
  isOutsideScope: false,
}

const explainMoreTe = '\u0c2e\u0c30\u0c3f\u0c02\u0c24 \u0c35\u0c3f\u0c35\u0c30\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f'

describe('follow-up suggestions', () => {
  it('creates topic-specific mask suggestions and Explain More', () => {
    const suggestions = buildFollowUpSuggestions(baseRequest, interpreted, [maskChunk])

    expect(suggestions).toHaveLength(5)
    expect(suggestions.map((suggestion) => suggestion.label)).toContain('Will the mask feel tight?')
    expect(suggestions.map((suggestion) => suggestion.label)).toContain('What if I cough or move?')
    expect(suggestions.at(-1)).toMatchObject({ label: 'Explain more', action: 'explain_more' })
  })

  it('deduplicates labels and keeps Explain More in the selected language', () => {
    const suggestions = ensureExplainMoreSuggestion(
      [
        { id: 'a', label: 'What happens during planning?', action: 'question' },
        { id: 'b', label: 'What happens during planning?', action: 'question' },
        { id: 'old-explain', label: 'Old explain', action: 'explain_more' },
      ],
      'te',
    )

    expect(suggestions).toEqual([
      { id: 'a', label: 'What happens during planning?', action: 'question', question: undefined },
      { id: 'explain-more-te', label: explainMoreTe, action: 'explain_more' },
    ])
  })
})
