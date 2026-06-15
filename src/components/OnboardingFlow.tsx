import { useState } from 'react'
import { usePatientProfile } from '../hooks/usePatientProfile'
import { LANGUAGE_OPTIONS, TRANSLATIONS } from '../translations'
import type { Language, TreatmentSite } from '../types'
import { TREATMENT_SITES } from '../utils/treatmentSites'

export function OnboardingFlow() {
  const { selectedLanguage, selectedTreatmentSite, updateLanguage, updateTreatmentSite, completeOnboarding } = usePatientProfile()
  const [step, setStep] = useState<1 | 2>(1)

  const t = TRANSLATIONS[selectedLanguage]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        {step === 1 ? (
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">{t.onboardingLanguage}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.entries(LANGUAGE_OPTIONS) as [Language, string][]).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => updateLanguage(code)}
                  className={`rounded-xl border p-4 text-left text-lg ${
                    selectedLanguage === code
                      ? 'border-blue-500 bg-blue-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-white"
            >
              {t.continue}
            </button>
          </section>
        ) : (
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">{t.onboardingSite}</h2>
            <div className="grid max-h-[50vh] gap-3 overflow-auto pr-2 sm:grid-cols-2">
              {TREATMENT_SITES.map((site) => (
                <button
                  key={site.value}
                  type="button"
                  onClick={() => updateTreatmentSite(site.value as TreatmentSite)}
                  className={`rounded-xl border p-4 text-left ${
                    selectedTreatmentSite === site.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-2xl" aria-hidden>
                    {site.icon}
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{site.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{site.description}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={completeOnboarding}
              className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-white"
            >
              {t.save}
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
