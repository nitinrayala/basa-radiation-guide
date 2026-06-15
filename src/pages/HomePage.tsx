import { ChatInterface } from '../components/ChatInterface'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { usePatientProfile } from '../hooks/usePatientProfile'
import { TRANSLATIONS } from '../translations'

export function HomePage() {
  const { selectedLanguage } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t.welcome}</h1>
        <p className="mt-3 text-lg text-slate-700 dark:text-slate-300">{t.assistantIntro}</p>
      </header>
      <DisclaimerBanner />
      <ChatInterface />
    </div>
  )
}
