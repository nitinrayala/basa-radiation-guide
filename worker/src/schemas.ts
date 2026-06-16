export type Language = 'en' | 'te'
export type ChatAction = 'normal' | 'explain_more'

export interface Env {
  GROQ_API_KEY?: string
  GROQ_MODEL?: string
  ALLOWED_ORIGIN?: string
  ALLOWED_ORIGINS?: string
  MAX_OUTPUT_TOKENS_NORMAL?: string
  MAX_OUTPUT_TOKENS_EXPANDED?: string
  MAX_HISTORY_MESSAGES?: string
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  language: Language
  question: string
  action: ChatAction
  history: ChatHistoryMessage[]
}

export interface ChatSuggestion {
  id: string
  label: string
  action: 'question' | 'explain_more'
  question?: string
}

export interface ChatAnswer {
  answer: string
  suggestions: ChatSuggestion[]
  sourceIds: string[]
  needsDoctorDiscussion: boolean
}

export interface ChatResponse {
  answer: string
  suggestions: ChatSuggestion[]
  sources: Array<{
    id: string
    label: string
  }>
  needsDoctorDiscussion: boolean
}

export interface InterpretedQuestion {
  detectedLanguage: 'en' | 'te' | 'mixed'
  responseLanguage: Language
  englishSearchQuery: string
  category:
    | 'overview'
    | 'workflow'
    | 'planning'
    | 'technique'
    | 'side_effect'
    | 'precaution'
    | 'nutrition'
    | 'skin_care'
    | 'oral_care'
    | 'rehabilitation'
    | 'follow_up'
    | 'unknown'
  treatmentAreas: string[]
  keyTerms: string[]
  isOutsideScope: boolean
}

export interface ValidationResult<T> {
  ok: true
  value: T
}

export interface ValidationError {
  ok: false
  status: number
  message: string
}

const supportedLanguages = new Set<Language>(['en', 'te'])
const supportedRoles = new Set(['user', 'assistant'])

export function parseChatRequest(value: unknown, maxHistoryMessages: number): ValidationResult<ChatRequest> | ValidationError {
  if (!value || typeof value !== 'object') {
    return { ok: false, status: 400, message: 'Invalid JSON request body.' }
  }

  const record = value as Record<string, unknown>
  const language = record.language
  const question = record.question
  const action = record.action ?? 'normal'
  const history = Array.isArray(record.history) ? record.history : []

  if (language !== 'en' && language !== 'te') {
    return { ok: false, status: 400, message: 'Unsupported language.' }
  }

  if (typeof question !== 'string' || question.trim().length === 0) {
    return { ok: false, status: 400, message: 'Question is required.' }
  }

  if (question.length > 1000) {
    return { ok: false, status: 400, message: 'Question is too long.' }
  }

  if (action !== 'normal' && action !== 'explain_more') {
    return { ok: false, status: 400, message: 'Unsupported chat action.' }
  }

  const parsedHistory: ChatHistoryMessage[] = []
  for (const item of history.slice(-maxHistoryMessages)) {
    if (!item || typeof item !== 'object') continue
    const historyItem = item as Record<string, unknown>
    if (!supportedRoles.has(String(historyItem.role)) || typeof historyItem.content !== 'string') continue
    parsedHistory.push({
      role: historyItem.role as ChatHistoryMessage['role'],
      content: historyItem.content.slice(0, 2000),
    })
  }

  if (!supportedLanguages.has(language)) {
    return { ok: false, status: 400, message: 'Unsupported language.' }
  }

  return {
    ok: true,
    value: {
      language,
      question: question.trim(),
      action,
      history: parsedHistory,
    },
  }
}

export function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
