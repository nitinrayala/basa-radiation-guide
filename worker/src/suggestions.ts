import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatRequest, ChatSuggestion, InterpretedQuestion, Language } from './schemas'

type SuggestionSeed = Omit<ChatSuggestion, 'id'>

const te = {
  explainMore: '\u0c2e\u0c30\u0c3f\u0c02\u0c24 \u0c35\u0c3f\u0c35\u0c30\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f',
  planning: '\u0c2a\u0c4d\u0c32\u0c3e\u0c28\u0c3f\u0c02\u0c17\u0c4d \u0c38\u0c2e\u0c2f\u0c02\u0c32\u0c4b \u0c0f\u0c2e\u0c3f \u0c1c\u0c30\u0c41\u0c17\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f?',
  sideEffects: '\u0c0f \u0c26\u0c41\u0c37\u0c4d\u0c2a\u0c4d\u0c30\u0c2d\u0c3e\u0c35\u0c3e\u0c32\u0c41 \u0c30\u0c3e\u0c35\u0c1a\u0c4d\u0c1a\u0c41?',
  doctor: '\u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d\u200c\u0c28\u0c41 \u0c0f\u0c2e\u0c3f \u0c05\u0c21\u0c17\u0c3e\u0c32\u0c3f?',
  remainStill: '\u0c15\u0c26\u0c32\u0c15\u0c41\u0c02\u0c21\u0c3e \u0c0e\u0c02\u0c26\u0c41\u0c15\u0c41 \u0c09\u0c02\u0c21\u0c3e\u0c32\u0c3f?',
  afterScan: '\u0c2a\u0c4d\u0c32\u0c3e\u0c28\u0c3f\u0c02\u0c17\u0c4d \u0c38\u0c4d\u0c15\u0c3e\u0c28\u0c4d \u0c24\u0c30\u0c4d\u0c35\u0c3e\u0c24 \u0c0f\u0c2e\u0c3f \u0c1c\u0c30\u0c41\u0c17\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f?',
  scanHurt: '\u0c2a\u0c4d\u0c32\u0c3e\u0c28\u0c3f\u0c02\u0c17\u0c4d \u0c38\u0c4d\u0c15\u0c3e\u0c28\u0c4d \u0c28\u0c4a\u0c2a\u0c4d\u0c2a\u0c3f\u0c17\u0c3e \u0c09\u0c02\u0c1f\u0c41\u0c02\u0c26\u0c3e?',
  beforeTreatment: '\u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2e\u0c4a\u0c26\u0c32\u0c2f\u0c4d\u0c2f\u0c47 \u0c2e\u0c41\u0c02\u0c26\u0c41 \u0c0f\u0c2e\u0c3f \u0c1c\u0c30\u0c41\u0c17\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f?',
  duringSession: '\u0c2a\u0c4d\u0c30\u0c24\u0c3f \u0c38\u0c46\u0c37\u0c28\u0c4d\u200c\u0c32\u0c4b \u0c0f\u0c2e\u0c3f \u0c1c\u0c30\u0c41\u0c17\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f?',
  sideEffectsBegin: '\u0c26\u0c41\u0c37\u0c4d\u0c2a\u0c4d\u0c30\u0c2d\u0c3e\u0c35\u0c3e\u0c32\u0c41 \u0c0e\u0c2a\u0c4d\u0c2a\u0c41\u0c21\u0c41 \u0c2e\u0c4a\u0c26\u0c32\u0c35\u0c41\u0c24\u0c3e\u0c2f\u0c3f?',
  sideEffectsReport: '\u0c0f \u0c32\u0c15\u0c4d\u0c37\u0c23\u0c3e\u0c32\u0c28\u0c41 \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d\u200c\u0c15\u0c3f \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c3e\u0c32\u0c3f?',
  afterTreatment: '\u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c24\u0c30\u0c4d\u0c35\u0c3e\u0c24 \u0c15\u0c42\u0c21\u0c3e \u0c07\u0c35\u0c3f \u0c15\u0c4a\u0c28\u0c38\u0c3e\u0c17\u0c35\u0c1a\u0c4d\u0c1a\u0c3e?',
  skinCare: '\u0c1a\u0c30\u0c4d\u0c2e\u0c3e\u0c28\u0c4d\u0c28\u0c3f \u0c0e\u0c32\u0c3e \u0c1a\u0c42\u0c38\u0c41\u0c15\u0c4b\u0c35\u0c3e\u0c32\u0c3f?',
  skinChanges: '\u0c1a\u0c30\u0c4d\u0c2e\u0c02\u0c32\u0c4b \u0c0f \u0c2e\u0c3e\u0c30\u0c4d\u0c2a\u0c41\u0c32\u0c41 \u0c30\u0c3e\u0c35\u0c1a\u0c4d\u0c1a\u0c41?',
  mouthCare: '\u0c28\u0c4b\u0c1f\u0c3f \u0c38\u0c02\u0c30\u0c15\u0c4d\u0c37\u0c23 \u0c0e\u0c32\u0c3e \u0c1a\u0c47\u0c2f\u0c3e\u0c32\u0c3f?',
  swallowing: '\u0c2e\u0c3f\u0c02\u0c17\u0c21\u0c02\u0c32\u0c4b \u0c0f \u0c38\u0c2e\u0c38\u0c4d\u0c2f\u0c32\u0c41 \u0c30\u0c3e\u0c35\u0c1a\u0c4d\u0c1a\u0c41?',
  food: '\u0c06\u0c39\u0c3e\u0c30\u0c02 \u0c17\u0c41\u0c30\u0c3f\u0c02\u0c1a\u0c3f \u0c0f\u0c2e\u0c3f \u0c1c\u0c3e\u0c17\u0c4d\u0c30\u0c24\u0c4d\u0c24\u0c32\u0c41?',
  eatingHard: '\u0c24\u0c3f\u0c28\u0c21\u0c02 \u0c15\u0c37\u0c4d\u0c1f\u0c2e\u0c48\u0c24\u0c47 \u0c0f\u0c2e\u0c3f \u0c1a\u0c47\u0c2f\u0c3e\u0c32\u0c3f?',
  exercises: '\u0c0f \u0c35\u0c4d\u0c2f\u0c3e\u0c2f\u0c3e\u0c2e\u0c3e\u0c32\u0c41 \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c2c\u0c21\u0c4d\u0c21\u0c3e\u0c2f\u0c3f?',
  exercisesWhy: '\u0c35\u0c4d\u0c2f\u0c3e\u0c2f\u0c3e\u0c2e\u0c3e\u0c32\u0c41 \u0c0e\u0c02\u0c26\u0c41\u0c15\u0c41 \u0c2e\u0c41\u0c16\u0c4d\u0c2f\u0c2e\u0c48\u0c28\u0c35\u0c3f?',
  maskTight: '\u0c2e\u0c3e\u0c38\u0c4d\u0c15\u0c4d \u0c2c\u0c3f\u0c17\u0c3f\u0c17\u0c3e \u0c05\u0c28\u0c3f\u0c2a\u0c3f\u0c38\u0c4d\u0c24\u0c41\u0c02\u0c26\u0c3e?',
  maskTime: '\u0c2e\u0c3e\u0c38\u0c4d\u0c15\u0c4d \u0c0e\u0c02\u0c24\u0c38\u0c47\u0c2a\u0c41 \u0c27\u0c30\u0c3f\u0c38\u0c4d\u0c24\u0c3e\u0c28\u0c41?',
  ifMove: '\u0c28\u0c47\u0c28\u0c41 \u0c15\u0c26\u0c3f\u0c32\u0c3f\u0c24\u0c47 \u0c0f\u0c2e\u0c35\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f?',
  askBreak: '\u0c05\u0c38\u0c4c\u0c15\u0c30\u0c4d\u0c2f\u0c02\u0c17\u0c3e \u0c09\u0c02\u0c1f\u0c47 \u0c0f\u0c2e\u0c3f \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c3e\u0c32\u0c3f?',
}

const explainMore: Record<Language, ChatSuggestion> = {
  en: { id: 'explain-more', label: 'Explain more', action: 'explain_more' },
  te: { id: 'explain-more-te', label: te.explainMore, action: 'explain_more' },
}

const generalSuggestions: Record<Language, SuggestionSeed[]> = {
  en: [
    { label: 'What happens during planning?', action: 'question', question: 'What happens during radiation planning?' },
    { label: 'What side effects should I watch for?', action: 'question', question: 'What side effects should I watch for during radiation therapy?' },
    { label: 'What should I ask my doctor?', action: 'question', question: 'What should I discuss with my treating doctor?' },
  ],
  te: [
    { label: te.planning, action: 'question', question: te.planning },
    { label: te.sideEffects, action: 'question', question: te.sideEffects },
    { label: te.doctor, action: 'question', question: te.doctor },
  ],
}

const categorySuggestions: Partial<Record<InterpretedQuestion['category'], Record<Language, SuggestionSeed[]>>> = {
  planning: {
    en: [
      { label: 'Will the planning scan hurt?', action: 'question', question: 'Will the radiation planning scan hurt?' },
      { label: 'Why do I need to stay still?', action: 'question', question: 'Why do I need to stay still during radiation planning and treatment?' },
      { label: 'What happens after the scan?', action: 'question', question: 'What happens after the planning scan?' },
      { label: 'When might treatment start?', action: 'question', question: 'When might treatment start after radiation planning?' },
    ],
    te: [
      { label: te.scanHurt, action: 'question', question: te.scanHurt },
      { label: te.remainStill, action: 'question', question: te.remainStill },
      { label: te.afterScan, action: 'question', question: te.afterScan },
    ],
  },
  workflow: {
    en: [
      { label: 'What happens before treatment starts?', action: 'question', question: 'What happens before radiation treatment starts?' },
      { label: 'What happens during each session?', action: 'question', question: 'What happens during each radiation treatment session?' },
      { label: 'How will I know what to do next?', action: 'question', question: 'What happens after radiation planning is complete?' },
    ],
    te: [
      { label: te.beforeTreatment, action: 'question', question: te.beforeTreatment },
      { label: te.duringSession, action: 'question', question: te.duringSession },
      { label: te.afterScan, action: 'question', question: te.afterScan },
    ],
  },
  side_effect: {
    en: [
      { label: 'When do side effects usually start?', action: 'question', question: 'When do radiation side effects usually begin?' },
      { label: 'What symptoms should I report?', action: 'question', question: 'What radiation side effects or symptoms should I report to my treating team?' },
      { label: 'Can side effects continue later?', action: 'question', question: 'Can radiation side effects continue after treatment?' },
      { label: 'What precautions are mentioned?', action: 'question', question: 'What precautions are mentioned in the radiation documents?' },
    ],
    te: [
      { label: te.sideEffectsBegin, action: 'question', question: te.sideEffectsBegin },
      { label: te.sideEffectsReport, action: 'question', question: te.sideEffectsReport },
      { label: te.afterTreatment, action: 'question', question: te.afterTreatment },
    ],
  },
  skin_care: {
    en: [
      { label: 'How should I care for my skin?', action: 'question', question: 'How should I care for my skin during radiation therapy?' },
      { label: 'What skin changes can happen?', action: 'question', question: 'What skin changes can happen during radiation therapy?' },
      { label: 'What should I avoid on my skin?', action: 'question', question: 'What skin care precautions are mentioned during radiation therapy?' },
    ],
    te: [
      { label: te.skinCare, action: 'question', question: te.skinCare },
      { label: te.skinChanges, action: 'question', question: te.skinChanges },
      { label: te.doctor, action: 'question', question: te.doctor },
    ],
  },
  oral_care: {
    en: [
      { label: 'How should I care for my mouth?', action: 'question', question: 'How should I care for my mouth during radiation therapy?' },
      { label: 'What if swallowing becomes hard?', action: 'question', question: 'What swallowing problems can happen during radiation therapy?' },
      { label: 'What food precautions are mentioned?', action: 'question', question: 'What food precautions are mentioned for radiation therapy?' },
    ],
    te: [
      { label: te.mouthCare, action: 'question', question: te.mouthCare },
      { label: te.swallowing, action: 'question', question: te.swallowing },
      { label: te.food, action: 'question', question: te.food },
    ],
  },
  nutrition: {
    en: [
      { label: 'What food advice is mentioned?', action: 'question', question: 'What food advice is mentioned in the radiation documents?' },
      { label: 'What if eating becomes difficult?', action: 'question', question: 'What do the documents say if eating becomes difficult during radiation?' },
      { label: 'What should I ask about diet?', action: 'question', question: 'What should I ask my doctor about diet during radiation?' },
    ],
    te: [
      { label: te.food, action: 'question', question: te.food },
      { label: te.eatingHard, action: 'question', question: te.eatingHard },
      { label: te.doctor, action: 'question', question: te.doctor },
    ],
  },
  rehabilitation: {
    en: [
      { label: 'Which exercises are mentioned?', action: 'question', question: 'Which rehabilitation exercises are mentioned in the documents?' },
      { label: 'Why are exercises important?', action: 'question', question: 'Why are rehabilitation exercises important during radiation care?' },
      { label: 'What should I confirm first?', action: 'question', question: 'What should I confirm with my doctor before doing exercises?' },
    ],
    te: [
      { label: te.exercises, action: 'question', question: te.exercises },
      { label: te.exercisesWhy, action: 'question', question: te.exercisesWhy },
      { label: te.doctor, action: 'question', question: te.doctor },
    ],
  },
}

const headNeckSuggestions: Record<Language, SuggestionSeed[]> = {
  en: [
    { label: 'Will the mask feel tight?', action: 'question', question: 'Will the radiation mask feel tight or uncomfortable?' },
    { label: 'What if I cough or move?', action: 'question', question: 'What happens if I cough or move during radiation treatment?' },
    { label: 'How long will I wear it?', action: 'question', question: 'How long will I wear the radiation mask?' },
    { label: 'Can I ask for a break?', action: 'question', question: 'What should I do if the radiation mask feels uncomfortable?' },
  ],
  te: [
    { label: te.maskTight, action: 'question', question: te.maskTight },
    { label: te.ifMove, action: 'question', question: te.ifMove },
    { label: te.maskTime, action: 'question', question: te.maskTime },
    { label: te.askBreak, action: 'question', question: te.askBreak },
  ],
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }

  return hash
}

function slugify(value: string): string {
  const asciiSlug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return asciiSlug || `suggestion-${Math.abs(hashString(value))}`
}

function withIds(suggestions: SuggestionSeed[], prefix: string): ChatSuggestion[] {
  return suggestions.map((suggestion, index) => ({
    id: `${prefix}-${slugify(suggestion.label)}-${index + 1}`,
    ...suggestion,
  }))
}

export function ensureExplainMoreSuggestion(suggestions: ChatSuggestion[], language: Language): ChatSuggestion[] {
  const seenLabels = new Set<string>()
  const normalized = suggestions.flatMap((suggestion): ChatSuggestion[] => {
    const label = suggestion.label.trim()
    if (!label) return []
    const key = `${suggestion.action}:${label.toLocaleLowerCase()}`
    if (seenLabels.has(key)) return []
    seenLabels.add(key)

    return [
      {
        id: suggestion.id.trim() || slugify(label),
        label,
        action: suggestion.action,
        question: suggestion.question?.trim() || undefined,
      },
    ]
  })

  const withoutExplainMore = normalized.filter((suggestion) => suggestion.action !== 'explain_more').slice(0, 4)

  return [...withoutExplainMore, explainMore[language]]
}

export function buildFollowUpSuggestions(
  request: ChatRequest,
  interpreted: InterpretedQuestion,
  chunks: KnowledgeChunk[],
): ChatSuggestion[] {
  const language = request.language
  const text = `${request.question} ${interpreted.englishSearchQuery} ${interpreted.keyTerms.join(' ')} ${chunks
    .map((chunk) => `${chunk.title} ${chunk.category} ${chunk.treatmentAreas.join(' ')}`)
    .join(' ')}`.toLowerCase()
  const suggestions: ChatSuggestion[] = []

  if (interpreted.treatmentAreas.includes('head_neck') || text.includes('mask') || text.includes('immobil')) {
    suggestions.push(...withIds(headNeckSuggestions[language], 'head-neck'))
  }

  const categorySet = new Set<InterpretedQuestion['category']>([
    interpreted.category,
    ...chunks.map((chunk) => chunk.category as InterpretedQuestion['category']),
  ])

  for (const category of categorySet) {
    const seeds = categorySuggestions[category]?.[language]
    if (seeds) suggestions.push(...withIds(seeds, category))
  }

  suggestions.push(...withIds(generalSuggestions[language], 'general'))

  return ensureExplainMoreSuggestion(suggestions, language)
}
