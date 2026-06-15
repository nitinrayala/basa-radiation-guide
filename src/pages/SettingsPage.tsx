import { usePatientProfile } from '../hooks/usePatientProfile'
import { LANGUAGE_OPTIONS, SITE_LABELS, TRANSLATIONS } from '../translations'
import type { Language, TreatmentSite } from '../types'
import { TREATMENT_SITES } from '../utils/treatmentSites'

export function SettingsPage() {
  const {
    selectedLanguage,
    selectedTreatmentSite,
    updateLanguage,
    updateTreatmentSite,
    resetOnboarding,
  } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.savedPreferences}</h2>
        <p className="mt-2 text-slate-700 dark:text-slate-300">{t.language}: {LANGUAGE_OPTIONS[selectedLanguage]}</p>
        <p className="text-slate-700 dark:text-slate-300">{t.treatmentSite}: {SITE_LABELS[selectedTreatmentSite]}</p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <label className="mb-2 block text-lg font-medium text-slate-900 dark:text-white">{t.language}</label>
        <select
          value={selectedLanguage}
          onChange={(event) => updateLanguage(event.target.value as Language)}
          className="w-full rounded-xl border border-slate-300 p-3 text-base dark:border-slate-600 dark:bg-slate-800"
        >
          {(Object.entries(LANGUAGE_OPTIONS) as [Language, string][]).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <label className="mb-2 block text-lg font-medium text-slate-900 dark:text-white">{t.treatmentSite}</label>
        <select
          value={selectedTreatmentSite}
          onChange={(event) => updateTreatmentSite(event.target.value as TreatmentSite)}
          className="w-full rounded-xl border border-slate-300 p-3 text-base dark:border-slate-600 dark:bg-slate-800"
        >
          {TREATMENT_SITES.map((site) => (
            <option key={site.value} value={site.value}>{site.title}</option>
          ))}
        </select>
      </article>

      <button type="button" onClick={resetOnboarding} className="rounded-xl bg-red-600 px-5 py-3 text-white">
        {t.reset}
      </button>
    </section>
  )
}
