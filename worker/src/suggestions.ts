import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatRequest, ChatSuggestion, InterpretedQuestion, Language } from './schemas'

type SuggestionSeed = Omit<ChatSuggestion, 'id'>

const explainMore: Record<Language, ChatSuggestion> = {
  en: { id: 'explain-more', label: 'Explain more', action: 'explain_more' },
  te: { id: 'explain-more-te', label: 'మరింత వివరించండి', action: 'explain_more' },
}

const generalSuggestions: Record<Language, SuggestionSeed[]> = {
  en: [
    { label: 'What happens during planning?', action: 'question', question: 'What happens during radiation planning?' },
    { label: 'What side effects can occur?', action: 'question', question: 'What side effects can occur during radiation therapy?' },
    { label: 'What should I ask my doctor?', action: 'question', question: 'What should I discuss with my treating doctor?' },
  ],
  te: [
    { label: 'ప్లానింగ్ సమయంలో ఏమి జరుగుతుంది?', action: 'question', question: 'రేడియేషన్ ప్లానింగ్ సమయంలో ఏమి జరుగుతుంది?' },
    { label: 'ఏ దుష్ప్రభావాలు రావచ్చు?', action: 'question', question: 'రేడియేషన్ థెరపీ సమయంలో ఏ దుష్ప్రభావాలు రావచ్చు?' },
    { label: 'డాక్టర్‌ను ఏమి అడగాలి?', action: 'question', question: 'నా చికిత్స చేసే డాక్టర్‌ను ఏమి అడగాలి?' },
  ],
}

const categorySuggestions: Partial<Record<InterpretedQuestion['category'], Record<Language, SuggestionSeed[]>>> = {
  planning: {
    en: [
      { label: 'Why do I need to remain still?', action: 'question', question: 'Why do I need to remain still during radiation?' },
      { label: 'What happens after the planning scan?', action: 'question', question: 'What happens after the planning scan?' },
      { label: 'How long does planning take?', action: 'question', question: 'How long does radiation planning take?' },
    ],
    te: [
      { label: 'కదలకుండా ఎందుకు ఉండాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో నేను ఎందుకు కదలకుండా ఉండాలి?' },
      { label: 'ప్లానింగ్ స్కాన్ తర్వాత ఏమి జరుగుతుంది?', action: 'question', question: 'ప్లానింగ్ స్కాన్ తర్వాత ఏమి జరుగుతుంది?' },
      { label: 'ప్లానింగ్‌కు ఎంత సమయం పడుతుంది?', action: 'question', question: 'రేడియేషన్ ప్లానింగ్‌కు ఎంత సమయం పడుతుంది?' },
    ],
  },
  workflow: {
    en: [
      { label: 'What happens before treatment starts?', action: 'question', question: 'What happens before radiation treatment starts?' },
      { label: 'What happens during each session?', action: 'question', question: 'What happens during each radiation treatment session?' },
      { label: 'What happens after planning?', action: 'question', question: 'What happens after radiation planning is complete?' },
    ],
    te: [
      { label: 'చికిత్స మొదలయ్యే ముందు ఏమి జరుగుతుంది?', action: 'question', question: 'రేడియేషన్ చికిత్స మొదలయ్యే ముందు ఏమి జరుగుతుంది?' },
      { label: 'ప్రతి సెషన్‌లో ఏమి జరుగుతుంది?', action: 'question', question: 'ప్రతి రేడియేషన్ సెషన్‌లో ఏమి జరుగుతుంది?' },
      { label: 'ప్లానింగ్ తర్వాత ఏమి జరుగుతుంది?', action: 'question', question: 'రేడియేషన్ ప్లానింగ్ పూర్తైన తర్వాత ఏమి జరుగుతుంది?' },
    ],
  },
  side_effect: {
    en: [
      { label: 'When can side effects begin?', action: 'question', question: 'When do radiation side effects usually begin?' },
      { label: 'Can side effects continue after treatment?', action: 'question', question: 'Can radiation side effects continue after treatment?' },
      { label: 'What precautions are mentioned?', action: 'question', question: 'What precautions are mentioned in the radiation documents?' },
    ],
    te: [
      { label: 'దుష్ప్రభావాలు ఎప్పుడు మొదలవుతాయి?', action: 'question', question: 'రేడియేషన్ దుష్ప్రభావాలు సాధారణంగా ఎప్పుడు మొదలవుతాయి?' },
      { label: 'చికిత్స తర్వాత కూడా దుష్ప్రభావాలు ఉంటాయా?', action: 'question', question: 'రేడియేషన్ చికిత్స తర్వాత కూడా దుష్ప్రభావాలు కొనసాగవచ్చా?' },
      { label: 'ఏ జాగ్రత్తలు చెప్పబడ్డాయి?', action: 'question', question: 'రేడియేషన్ పత్రాలలో ఏ జాగ్రత్తలు చెప్పబడ్డాయి?' },
    ],
  },
  skin_care: {
    en: [
      { label: 'How should I care for my skin?', action: 'question', question: 'How should I care for my skin during radiation therapy?' },
      { label: 'What skin changes can happen?', action: 'question', question: 'What skin changes can happen during radiation therapy?' },
      { label: 'What should I ask my doctor about skin care?', action: 'question', question: 'What should I ask my doctor about skin care during radiation?' },
    ],
    te: [
      { label: 'చర్మాన్ని ఎలా చూసుకోవాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో చర్మాన్ని ఎలా చూసుకోవాలి?' },
      { label: 'చర్మంలో ఏ మార్పులు రావచ్చు?', action: 'question', question: 'రేడియేషన్ సమయంలో చర్మంలో ఏ మార్పులు రావచ్చు?' },
      { label: 'చర్మ సంరక్షణ గురించి డాక్టర్‌ను ఏమి అడగాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో చర్మ సంరక్షణ గురించి డాక్టర్‌ను ఏమి అడగాలి?' },
    ],
  },
  oral_care: {
    en: [
      { label: 'How should I care for my mouth?', action: 'question', question: 'How should I care for my mouth during radiation therapy?' },
      { label: 'What can happen with swallowing?', action: 'question', question: 'What swallowing problems can happen during radiation therapy?' },
      { label: 'What food precautions are mentioned?', action: 'question', question: 'What food precautions are mentioned for radiation therapy?' },
    ],
    te: [
      { label: 'నోటి సంరక్షణ ఎలా చేయాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో నోటి సంరక్షణ ఎలా చేయాలి?' },
      { label: 'మింగడంలో ఏ సమస్యలు రావచ్చు?', action: 'question', question: 'రేడియేషన్ సమయంలో మింగడంలో ఏ సమస్యలు రావచ్చు?' },
      { label: 'ఆహారం గురించి ఏ జాగ్రత్తలు ఉన్నాయి?', action: 'question', question: 'రేడియేషన్ సమయంలో ఆహారం గురించి ఏ జాగ్రత్తలు ఉన్నాయి?' },
    ],
  },
  nutrition: {
    en: [
      { label: 'What food advice is mentioned?', action: 'question', question: 'What food advice is mentioned in the radiation documents?' },
      { label: 'What if eating becomes difficult?', action: 'question', question: 'What do the documents say if eating becomes difficult during radiation?' },
      { label: 'What should I ask my doctor about diet?', action: 'question', question: 'What should I ask my doctor about diet during radiation?' },
    ],
    te: [
      { label: 'ఆహారం గురించి ఏమి చెప్పారు?', action: 'question', question: 'రేడియేషన్ పత్రాలలో ఆహారం గురించి ఏమి చెప్పారు?' },
      { label: 'తినడం కష్టమైతే ఏమి చేయాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో తినడం కష్టమైతే పత్రాలలో ఏమి చెప్పారు?' },
      { label: 'డైట్ గురించి డాక్టర్‌ను ఏమి అడగాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో ఆహారం గురించి డాక్టర్‌ను ఏమి అడగాలి?' },
    ],
  },
  rehabilitation: {
    en: [
      { label: 'Which exercises are mentioned?', action: 'question', question: 'Which rehabilitation exercises are mentioned in the documents?' },
      { label: 'Why are exercises important?', action: 'question', question: 'Why are rehabilitation exercises important during radiation care?' },
      { label: 'What should I confirm before exercises?', action: 'question', question: 'What should I confirm with my doctor before doing exercises?' },
    ],
    te: [
      { label: 'ఏ వ్యాయామాలు చెప్పబడ్డాయి?', action: 'question', question: 'పత్రాలలో ఏ రీహాబిలిటేషన్ వ్యాయామాలు చెప్పబడ్డాయి?' },
      { label: 'వ్యాయామాలు ఎందుకు ముఖ్యమైనవి?', action: 'question', question: 'రేడియేషన్ సంరక్షణలో వ్యాయామాలు ఎందుకు ముఖ్యమైనవి?' },
      { label: 'వ్యాయామాల ముందు ఏమి నిర్ధారించాలి?', action: 'question', question: 'వ్యాయామాలు చేసే ముందు డాక్టర్‌తో ఏమి నిర్ధారించాలి?' },
    ],
  },
}

const headNeckSuggestions: Record<Language, SuggestionSeed[]> = {
  en: [
    { label: 'Will the mask feel tight?', action: 'question', question: 'Will the radiation mask feel tight?' },
    { label: 'How long will I wear the mask?', action: 'question', question: 'How long will I wear the radiation mask?' },
    { label: 'What happens if I move?', action: 'question', question: 'What happens if I move during radiation treatment?' },
  ],
  te: [
    { label: 'మాస్క్ బిగిగా అనిపిస్తుందా?', action: 'question', question: 'రేడియేషన్ మాస్క్ బిగిగా అనిపిస్తుందా?' },
    { label: 'మాస్క్ ఎంతసేపు ధరిస్తాను?', action: 'question', question: 'రేడియేషన్ మాస్క్ ఎంతసేపు ధరిస్తాను?' },
    { label: 'నేను కదిలితే ఏమవుతుంది?', action: 'question', question: 'రేడియేషన్ సమయంలో నేను కదిలితే ఏమవుతుంది?' },
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
