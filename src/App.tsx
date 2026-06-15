import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { OnboardingFlow } from './components/OnboardingFlow'
import { PatientProfileProvider } from './context/PatientProfileContext'
import { usePatientProfile } from './hooks/usePatientProfile'
import { ChatAssistantPage } from './pages/ChatAssistantPage'
import { ContactPage } from './pages/ContactPage'
import { FAQPage } from './pages/FAQPage'
import { HomePage } from './pages/HomePage'
import { RadiationGuidePage } from './pages/RadiationGuidePage'
import { SettingsPage } from './pages/SettingsPage'
import { TRANSLATIONS } from './translations'

function AppContent() {
  const { selectedLanguage, hasCompletedOnboarding } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]

  return (
    <div className="min-h-screen bg-slate-100 pb-20 text-slate-900 transition-colors md:pb-6 dark:bg-slate-950 dark:text-slate-100">
      <Navigation />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-3xl font-bold">{t.appName}</h1>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatAssistantPage />} />
          <Route path="/guide" element={<RadiationGuidePage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      {!hasCompletedOnboarding && <OnboardingFlow />}
    </div>
  )
}

function App() {
  return (
    <PatientProfileProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </PatientProfileProvider>
  )
}

export default App
