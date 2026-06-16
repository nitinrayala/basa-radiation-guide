import type { ChatAnswer, ChatRequest } from './schemas'
import { ensureExplainMoreSuggestion } from './suggestions'

type SafetyCategory =
  | 'diagnosis_or_report'
  | 'treatment_recommendation'
  | 'medication_change'
  | 'stop_or_skip_treatment'
  | 'dose_or_sessions'
  | 'survival_prediction'
  | 'outside_scope'

interface SafetyMatch {
  category: SafetyCategory
}

const safetyPatterns: Array<{ category: SafetyCategory; patterns: RegExp[] }> = [
  {
    category: 'diagnosis_or_report',
    patterns: [
      /\b(diagnos(e|is)|stage|staging|pathology|biopsy|pet[\s-]?ct|mri|ct report|scan report|blood report|report)\b/i,
      /\b(interpret|read|explain).{0,30}\b(report|scan|pathology|biopsy)\b/i,
      /\bnaa report\b/i,
    ],
  },
  {
    category: 'treatment_recommendation',
    patterns: [
      /\b(which|what).{0,25}\b(treatment|technique|radiation technique)\b/i,
      /\b(choose|select|recommend|best).{0,25}\b(treatment|technique|imrt|vmat|surgery|chemo|chemotherapy)\b/i,
      /\b(imrt|vmat|sbrt|brachytherapy).{0,30}\b(better|best|choose|need)\b/i,
      /\b(better|best|choose|need).{0,30}\b(imrt|vmat|sbrt|brachytherapy)\b/i,
    ],
  },
  {
    category: 'medication_change',
    patterns: [
      /\b(start|stop|change|increase|reduce|take|skip).{0,30}\b(medicine|medication|tablet|drug|steroid|painkiller|antibiotic)\b/i,
      /\b(medicine|tablet|painkiller|steroid).{0,30}\b(start|stop|change|increase|reduce|take|skip)\b/i,
      /\b(mandu|tablet).{0,30}\b(apala|aapali|vesukovala|teesukovala|start|stop)\b/i,
    ],
  },
  {
    category: 'stop_or_skip_treatment',
    patterns: [
      /\b(stop|skip|delay|pause|miss).{0,30}\b(radiation|treatment|session|therapy)\b/i,
      /\b(radiation|treatment|session|therapy).{0,30}\b(stop|skip|delay|pause|miss)\b/i,
      /\b(radiation|treatment).{0,30}\b(aapali|apala|skip cheyacha|miss cheyacha)\b/i,
    ],
  },
  {
    category: 'dose_or_sessions',
    patterns: [
      /\b(dose|gray|gy|fraction|fractions|sessions|number of sessions|how many sessions)\b/i,
      /\b(berapa|kitni|enni).{0,20}\b(session|fraction)\b/i,
    ],
  },
  {
    category: 'survival_prediction',
    patterns: [
      /\b(survival|survive|cure|curable|life expectancy|how long.*live|will.*die|chance.*cure|prognosis)\b/i,
      /\b(brathukuthana|cure avuthunda|life entha)\b/i,
    ],
  },
  {
    category: 'outside_scope',
    patterns: [
      /\b(cricket|movie|stock|stocks|weather|restaurant|recipe|homework|football|politics|election|coding|programming)\b/i,
    ],
  },
]

const safeSuggestions = {
  en: [
    {
      id: 'planning-safe',
      label: 'What happens during planning?',
      action: 'question' as const,
      question: 'What happens during radiation planning?',
    },
    {
      id: 'side-effects-safe',
      label: 'What side effects can occur?',
      action: 'question' as const,
      question: 'What side effects can occur during radiation therapy?',
    },
    {
      id: 'doctor-safe',
      label: 'What should I ask my doctor?',
      action: 'question' as const,
      question: 'What should I discuss with my treating doctor?',
    },
  ],
  te: [
    {
      id: 'planning-safe-te',
      label: '\u0c2a\u0c4d\u0c32\u0c3e\u0c28\u0c3f\u0c02\u0c17\u0c4d \u0c38\u0c2e\u0c2f\u0c02\u0c32\u0c4b \u0c0f\u0c2e\u0c3f \u0c1c\u0c30\u0c41\u0c17\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f?',
      action: 'question' as const,
      question: '\u0c30\u0c47\u0c21\u0c3f\u0c2f\u0c47\u0c37\u0c28\u0c4d \u0c2a\u0c4d\u0c32\u0c3e\u0c28\u0c3f\u0c02\u0c17\u0c4d \u0c38\u0c2e\u0c2f\u0c02\u0c32\u0c4b \u0c0f\u0c2e\u0c3f \u0c1c\u0c30\u0c41\u0c17\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f?',
    },
    {
      id: 'side-effects-safe-te',
      label: '\u0c0f \u0c26\u0c41\u0c37\u0c4d\u0c2a\u0c4d\u0c30\u0c2d\u0c3e\u0c35\u0c3e\u0c32\u0c41 \u0c30\u0c3e\u0c35\u0c1a\u0c4d\u0c1a\u0c41?',
      action: 'question' as const,
      question: '\u0c30\u0c47\u0c21\u0c3f\u0c2f\u0c47\u0c37\u0c28\u0c4d \u0c25\u0c46\u0c30\u0c2a\u0c40 \u0c38\u0c2e\u0c2f\u0c02\u0c32\u0c4b \u0c0f \u0c26\u0c41\u0c37\u0c4d\u0c2a\u0c4d\u0c30\u0c2d\u0c3e\u0c35\u0c3e\u0c32\u0c41 \u0c30\u0c3e\u0c35\u0c1a\u0c4d\u0c1a\u0c41?',
    },
    {
      id: 'doctor-safe-te',
      label: '\u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d\u200c\u0c28\u0c41 \u0c0f\u0c2e\u0c3f \u0c05\u0c21\u0c17\u0c3e\u0c32\u0c3f?',
      action: 'question' as const,
      question: '\u0c28\u0c3e \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c1a\u0c47\u0c38\u0c47 \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d\u200c\u0c28\u0c41 \u0c0f\u0c2e\u0c3f \u0c05\u0c21\u0c17\u0c3e\u0c32\u0c3f?',
    },
  ],
}

const categoryMessages: Record<SafetyCategory, Record<ChatRequest['language'], string>> = {
  diagnosis_or_report: {
    en:
      'I cannot interpret scans, pathology, blood tests or medical reports. Those details need your treating doctor, who knows your diagnosis and treatment plan.\n\nI can still explain general radiation therapy information from the supplied documents.',
    te:
      '\u0c38\u0c4d\u0c15\u0c3e\u0c28\u0c4d\u0c32\u0c41, \u0c2a\u0c3e\u0c25\u0c3e\u0c32\u0c1c\u0c40, \u0c30\u0c15\u0c4d\u0c24 \u0c2a\u0c30\u0c40\u0c15\u0c4d\u0c37\u0c32\u0c41 \u0c32\u0c47\u0c26\u0c3e \u0c35\u0c48\u0c26\u0c4d\u0c2f \u0c30\u0c3f\u0c2a\u0c4b\u0c30\u0c4d\u0c1f\u0c4d\u0c32\u0c28\u0c41 \u0c28\u0c47\u0c28\u0c41 \u0c05\u0c30\u0c4d\u0c25\u0c02 \u0c1a\u0c47\u0c38\u0c3f \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c32\u0c47\u0c28\u0c41. \u0c2e\u0c40 \u0c30\u0c3f\u0c2a\u0c4b\u0c30\u0c4d\u0c1f\u0c4d\u0c32\u0c28\u0c41 \u0c2e\u0c40 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c1a\u0c47\u0c38\u0c47 \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d \u0c2e\u0c3e\u0c24\u0c4d\u0c30\u0c2e\u0c47 \u0c35\u0c3f\u0c35\u0c30\u0c3f\u0c02\u0c1a\u0c17\u0c32\u0c30\u0c41.\n\n\u0c05\u0c02\u0c26\u0c3f\u0c28 \u0c2a\u0c24\u0c4d\u0c30\u0c3e\u0c32 \u0c06\u0c27\u0c3e\u0c30\u0c02\u0c17\u0c3e \u0c38\u0c3e\u0c27\u0c3e\u0c30\u0c23 \u0c30\u0c47\u0c21\u0c3f\u0c2f\u0c47\u0c37\u0c28\u0c4d \u0c38\u0c2e\u0c3e\u0c1a\u0c3e\u0c30\u0c3e\u0c28\u0c4d\u0c28\u0c3f \u0c2e\u0c3e\u0c24\u0c4d\u0c30\u0c02 \u0c35\u0c3f\u0c35\u0c30\u0c3f\u0c02\u0c1a\u0c17\u0c32\u0c28\u0c41.',
  },
  treatment_recommendation: {
    en:
      'I cannot choose or recommend a treatment technique for you. Radiation technique decisions depend on your diagnosis, scans and treatment plan, so they must come from your treating team.\n\nI can explain what planning or common radiation techniques mean in general.',
    te:
      '\u0c2e\u0c40\u0c15\u0c4b\u0c38\u0c02 \u0c0f \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2a\u0c26\u0c4d\u0c27\u0c24\u0c3f \u0c2c\u0c3e\u0c17\u0c41\u0c02\u0c1f\u0c41\u0c02\u0c26\u0c4b \u0c28\u0c47\u0c28\u0c41 \u0c0e\u0c02\u0c2a\u0c3f\u0c15 \u0c1a\u0c47\u0c2f\u0c32\u0c47\u0c28\u0c41 \u0c32\u0c47\u0c26\u0c3e \u0c38\u0c3f\u0c2b\u0c3e\u0c30\u0c38\u0c41 \u0c1a\u0c47\u0c2f\u0c32\u0c47\u0c28\u0c41. \u0c05\u0c26\u0c3f \u0c2e\u0c40 \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d \u0c2c\u0c43\u0c02\u0c26\u0c02 \u0c24\u0c40\u0c30\u0c4d\u0c2e\u0c3e\u0c28\u0c3f\u0c02\u0c1a\u0c3e\u0c32\u0c3f.\n\n\u0c2a\u0c4d\u0c32\u0c3e\u0c28\u0c3f\u0c02\u0c17\u0c4d \u0c32\u0c47\u0c26\u0c3e \u0c38\u0c3e\u0c27\u0c3e\u0c30\u0c23 \u0c30\u0c47\u0c21\u0c3f\u0c2f\u0c47\u0c37\u0c28\u0c4d \u0c2a\u0c26\u0c4d\u0c27\u0c24\u0c41\u0c32 \u0c05\u0c30\u0c4d\u0c25\u0c3e\u0c28\u0c4d\u0c28\u0c3f \u0c28\u0c47\u0c28\u0c41 \u0c38\u0c3e\u0c27\u0c3e\u0c30\u0c23\u0c02\u0c17\u0c3e \u0c35\u0c3f\u0c35\u0c30\u0c3f\u0c02\u0c1a\u0c17\u0c32\u0c28\u0c41.',
  },
  medication_change: {
    en:
      'I cannot tell you to start, stop or change any medicine. Please use medicines, mouthwashes, lotions or pain medicines only as advised by your treating team.\n\nI can explain general care instructions that are present in the supplied documents.',
    te:
      '\u0c0f \u0c2e\u0c02\u0c26\u0c41 \u0c2e\u0c4a\u0c26\u0c32\u0c41\u0c2a\u0c46\u0c1f\u0c4d\u0c1f\u0c3e\u0c32\u0c4b, \u0c06\u0c2a\u0c3e\u0c32\u0c4b \u0c32\u0c47\u0c26\u0c3e \u0c2e\u0c3e\u0c30\u0c4d\u0c1a\u0c3e\u0c32\u0c4b \u0c28\u0c47\u0c28\u0c41 \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c32\u0c47\u0c28\u0c41. \u0c2e\u0c02\u0c26\u0c41\u0c32\u0c41, \u0c2e\u0c4c\u0c24\u0c4d\u200c\u0c35\u0c3e\u0c37\u0c4d, \u0c32\u0c4b\u0c37\u0c28\u0c4d \u0c32\u0c47\u0c26\u0c3e \u0c28\u0c4a\u0c2a\u0c4d\u0c2a\u0c3f \u0c2e\u0c02\u0c26\u0c41\u0c32\u0c28\u0c41 \u0c2e\u0c40 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2c\u0c43\u0c02\u0c26\u0c02 \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c3f\u0c28\u0c1f\u0c4d\u0c32\u0c47 \u0c35\u0c3e\u0c21\u0c02\u0c21\u0c3f.',
  },
  stop_or_skip_treatment: {
    en:
      'I cannot advise you to stop, skip or delay radiation treatment. If you feel unwell or are thinking about missing a session, please contact your treating team as soon as possible.\n\nI can explain what usually happens during treatment sessions from the supplied documents.',
    te:
      '\u0c30\u0c47\u0c21\u0c3f\u0c2f\u0c47\u0c37\u0c28\u0c4d \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38\u0c28\u0c41 \u0c06\u0c2a\u0c2e\u0c28\u0c3f, \u0c38\u0c46\u0c37\u0c28\u0c4d \u0c2e\u0c3f\u0c38\u0c4d \u0c1a\u0c47\u0c2f\u0c2e\u0c28\u0c3f \u0c32\u0c47\u0c26\u0c3e \u0c35\u0c3e\u0c2f\u0c3f\u0c26\u0c3e \u0c35\u0c47\u0c2f\u0c2e\u0c28\u0c3f \u0c28\u0c47\u0c28\u0c41 \u0c38\u0c32\u0c39\u0c3e \u0c07\u0c35\u0c4d\u0c35\u0c32\u0c47\u0c28\u0c41. \u0c2e\u0c40\u0c15\u0c41 \u0c05\u0c38\u0c4c\u0c15\u0c30\u0c4d\u0c2f\u0c02 \u0c09\u0c02\u0c1f\u0c47 \u0c32\u0c47\u0c26\u0c3e \u0c38\u0c46\u0c37\u0c28\u0c4d \u0c2e\u0c3f\u0c38\u0c4d \u0c05\u0c35\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f \u0c05\u0c28\u0c3f \u0c05\u0c28\u0c41\u0c15\u0c41\u0c02\u0c1f\u0c47, \u0c35\u0c46\u0c02\u0c1f\u0c28\u0c47 \u0c2e\u0c40 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2c\u0c43\u0c02\u0c26\u0c3e\u0c28\u0c4d\u0c28\u0c3f \u0c38\u0c02\u0c2a\u0c4d\u0c30\u0c26\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f.',
  },
  dose_or_sessions: {
    en:
      'I cannot tell you the radiation dose or number of sessions you need. That depends on your diagnosis, treatment area and plan made by your radiation oncology team.\n\nI can explain general planning and treatment workflow from the supplied documents.',
    te:
      '\u0c2e\u0c40\u0c15\u0c41 \u0c0e\u0c02\u0c24 \u0c21\u0c4b\u0c38\u0c4d \u0c32\u0c47\u0c26\u0c3e \u0c0e\u0c28\u0c4d\u0c28\u0c3f \u0c38\u0c46\u0c37\u0c28\u0c4d\u0c32\u0c41 \u0c05\u0c35\u0c38\u0c30\u0c2e\u0c4b \u0c28\u0c47\u0c28\u0c41 \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c32\u0c47\u0c28\u0c41. \u0c05\u0c26\u0c3f \u0c2e\u0c40 \u0c21\u0c3e\u0c15\u0c4d\u0c1f\u0c30\u0c4d \u0c24\u0c2f\u0c3e\u0c30\u0c41 \u0c1a\u0c47\u0c38\u0c3f\u0c28 \u0c1a\u0c3f\u0c15\u0c3f\u0c24\u0c4d\u0c38 \u0c2a\u0c4d\u0c30\u0c23\u0c3e\u0c33\u0c3f\u0c15\u0c2a\u0c48 \u0c06\u0c27\u0c3e\u0c30\u0c2a\u0c21\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f.',
  },
  survival_prediction: {
    en:
      'I cannot predict cure, survival or life expectancy. Those questions depend on many personal medical details and should be discussed with your treating doctor.\n\nI can help explain radiation therapy steps, planning, side effects and care from the supplied documents.',
    te:
      '\u0c28\u0c3f\u0c35\u0c3e\u0c30\u0c23, \u0c2c\u0c24\u0c3f\u0c15\u0c47 \u0c05\u0c35\u0c15\u0c3e\u0c36\u0c02 \u0c32\u0c47\u0c26\u0c3e \u0c1c\u0c40\u0c35\u0c3f\u0c24 \u0c15\u0c3e\u0c32\u0c02 \u0c17\u0c41\u0c30\u0c3f\u0c02\u0c1a\u0c3f \u0c28\u0c47\u0c28\u0c41 \u0c05\u0c02\u0c1a\u0c28\u0c3e \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c32\u0c47\u0c28\u0c41. \u0c07\u0c35\u0c3f \u0c2e\u0c40 \u0c35\u0c4d\u0c2f\u0c15\u0c4d\u0c24\u0c3f\u0c17\u0c24 \u0c35\u0c48\u0c26\u0c4d\u0c2f \u0c35\u0c3f\u0c35\u0c30\u0c3e\u0c32\u0c2a\u0c48 \u0c06\u0c27\u0c3e\u0c30\u0c2a\u0c21\u0c24\u0c3e\u0c2f\u0c3f.',
  },
  outside_scope: {
    en:
      'I can only answer questions about radiation therapy information from the supplied documents. Please ask about radiation planning, treatment sessions, side effects, precautions or care.',
    te:
      '\u0c28\u0c47\u0c28\u0c41 \u0c05\u0c02\u0c26\u0c3f\u0c28 \u0c2a\u0c24\u0c4d\u0c30\u0c3e\u0c32\u0c32\u0c4b \u0c09\u0c28\u0c4d\u0c28 \u0c30\u0c47\u0c21\u0c3f\u0c2f\u0c47\u0c37\u0c28\u0c4d \u0c25\u0c46\u0c30\u0c2a\u0c40 \u0c38\u0c2e\u0c3e\u0c1a\u0c3e\u0c30\u0c02 \u0c17\u0c41\u0c30\u0c3f\u0c02\u0c1a\u0c3f \u0c2e\u0c3e\u0c24\u0c4d\u0c30\u0c2e\u0c47 \u0c38\u0c2e\u0c3e\u0c27\u0c3e\u0c28\u0c02 \u0c07\u0c35\u0c4d\u0c35\u0c17\u0c32\u0c28\u0c41. \u0c2a\u0c4d\u0c32\u0c3e\u0c28\u0c3f\u0c02\u0c17\u0c4d, \u0c38\u0c46\u0c37\u0c28\u0c4d\u0c32\u0c41, \u0c26\u0c41\u0c37\u0c4d\u0c2a\u0c4d\u0c30\u0c2d\u0c3e\u0c35\u0c3e\u0c32\u0c41, \u0c1c\u0c3e\u0c17\u0c4d\u0c30\u0c24\u0c4d\u0c24\u0c32\u0c41 \u0c32\u0c47\u0c26\u0c3e \u0c38\u0c02\u0c30\u0c15\u0c4d\u0c37\u0c23 \u0c17\u0c41\u0c30\u0c3f\u0c02\u0c1a\u0c3f \u0c05\u0c21\u0c17\u0c02\u0c21\u0c3f.',
  },
}

export function classifySafety(request: ChatRequest): SafetyMatch | null {
  const question = request.question.trim()
  for (const rule of safetyPatterns) {
    if (rule.patterns.some((pattern) => pattern.test(question))) {
      return { category: rule.category }
    }
  }

  return null
}

export function buildSafetyAnswer(request: ChatRequest, match: SafetyMatch): ChatAnswer {
  return {
    answer: categoryMessages[match.category][request.language],
    suggestions: ensureExplainMoreSuggestion(safeSuggestions[request.language], request.language),
    sourceIds: [],
    needsDoctorDiscussion: true,
  }
}
