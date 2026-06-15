import { useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Language, TreatmentSite } from '../types'
import { PatientProfileContext } from './patientProfileContext'

const LANGUAGE_KEY = 'basa.selectedLanguage'
const TREATMENT_SITE_KEY = 'basa.selectedTreatmentSite'
const ONBOARDING_KEY = 'basa.onboardingComplete'

export function PatientProfileProvider({ children }: { children: React.ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useLocalStorage<Language>(LANGUAGE_KEY, 'en')
  const [selectedTreatmentSite, setSelectedTreatmentSite] = useLocalStorage<TreatmentSite>(
    TREATMENT_SITE_KEY,
    'other',
  )
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>(ONBOARDING_KEY, false)

  const value = useMemo(
    () => ({
      selectedLanguage,
      selectedTreatmentSite,
      updateLanguage: setSelectedLanguage,
      updateTreatmentSite: setSelectedTreatmentSite,
      hasCompletedOnboarding,
      completeOnboarding: () => setHasCompletedOnboarding(true),
      resetOnboarding: () => setHasCompletedOnboarding(false),
    }),
    [selectedLanguage, selectedTreatmentSite, hasCompletedOnboarding, setSelectedLanguage, setSelectedTreatmentSite, setHasCompletedOnboarding],
  )

  return <PatientProfileContext.Provider value={value}>{children}</PatientProfileContext.Provider>
}
