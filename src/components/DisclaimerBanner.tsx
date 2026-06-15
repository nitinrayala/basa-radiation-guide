import { usePatientProfile } from '../hooks/usePatientProfile'
import { TRANSLATIONS } from '../translations'

export function DisclaimerBanner() {
  const { selectedLanguage } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]

  return (
    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
      <p className="font-semibold">{t.safetyNotice}</p>
      <p>{t.medicalDisclaimer}</p>
      <p className="font-medium text-red-700 dark:text-red-300">{t.emergencyGuidance}</p>
    </div>
  )
}
