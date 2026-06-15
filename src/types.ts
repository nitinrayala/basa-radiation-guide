export type Language = 'en' | 'te' | 'hi'

export type TreatmentSite =
  | 'head-neck'
  | 'breast'
  | 'prostate'
  | 'cervix'
  | 'brain'
  | 'lung'
  | 'gastrointestinal'
  | 'gynecologic'
  | 'pediatric'
  | 'other'

export interface PatientProfile {
  selectedLanguage: Language
  selectedTreatmentSite: TreatmentSite
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  citations?: string[]
}
