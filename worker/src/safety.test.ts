import { buildSafetyAnswer, classifySafety } from './safety'
import type { ChatRequest } from './schemas'

function request(question: string, language: ChatRequest['language'] = 'en'): ChatRequest {
  return {
    language,
    question,
    action: 'normal',
    history: [],
  }
}

describe('safety validation', () => {
  it.each([
    ['Can you interpret my scan report?', 'diagnosis_or_report'],
    ['Which is better for me, IMRT or VMAT?', 'treatment_recommendation'],
    ['Should I stop my painkiller tablet?', 'medication_change'],
    ['Can I skip radiation tomorrow?', 'stop_or_skip_treatment'],
    ['How many fractions do I need?', 'dose_or_sessions'],
    ['What is my chance of cure?', 'survival_prediction'],
    ['Who will win the cricket match?', 'outside_scope'],
  ])('classifies %s', (question, category) => {
    expect(classifySafety(request(question))).toEqual({ category })
  })

  it('allows ordinary radiation information questions', () => {
    expect(classifySafety(request('Why is a mask used during radiation?'))).toBeNull()
  })

  it('builds a controlled doctor-discussion answer without sources', () => {
    const match = classifySafety(request('Can I skip radiation tomorrow?'))
    expect(match).not.toBeNull()

    const answer = buildSafetyAnswer(request('Can I skip radiation tomorrow?'), match!)

    expect(answer.needsDoctorDiscussion).toBe(true)
    expect(answer.sourceIds).toEqual([])
    expect(answer.answer).toMatch(/cannot advise.*stop, skip or delay|contact your treating team/i)
    expect(answer.suggestions.some((suggestion) => suggestion.action === 'explain_more')).toBe(true)
  })

  it('returns Telugu safety suggestions in Telugu mode', () => {
    const match = classifySafety(request('Should I stop my tablet?', 'te'))
    expect(match).not.toBeNull()

    const answer = buildSafetyAnswer(request('Should I stop my tablet?', 'te'), match!)

    expect(answer.needsDoctorDiscussion).toBe(true)
    expect(answer.suggestions.some((suggestion) => suggestion.label === 'మరింత వివరించండి')).toBe(true)
  })
})
