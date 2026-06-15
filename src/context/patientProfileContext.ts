import { createContext } from 'react'
import type { Language, TreatmentSite } from '../types'

export interface PatientProfileContextValue {
  selectedLanguage: Language
  selectedTreatmentSite: TreatmentSite
  updateLanguage: (language: Language) => void
  updateTreatmentSite: (site: TreatmentSite) => void
  hasCompletedOnboarding: boolean
  completeOnboarding: () => void
  resetOnboarding: () => void
}

export const PatientProfileContext = createContext<PatientProfileContextValue | null>(null)
