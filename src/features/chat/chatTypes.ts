export type Language = 'en' | 'te'

export type SuggestionAction = 'question' | 'explain_more'

export interface Suggestion {
  id: string
  label: string
  action: SuggestionAction
  question?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sequence: number
  kind?: 'greeting' | 'journey' | 'search'
  journeyStepId?: string
  journeyPart?: 'question' | 'answer'
}

export interface ChatRequest {
  language: Language
  question: string
  action?: 'normal' | 'explain_more'
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export interface ChatResponse {
  answer: string
  suggestions: Suggestion[]
  sources: Array<{
    id: string
    label: string
  }>
  needsDoctorDiscussion: boolean
}
