import type { Language } from '../features/chat/chatTypes'

interface LanguageToggleProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="language-toggle" aria-label="Language">
      <button type="button" aria-pressed={language === 'en'} onClick={() => onLanguageChange('en')}>
        English
      </button>
      <button type="button" aria-pressed={language === 'te'} onClick={() => onLanguageChange('te')}>
        తెలుగు
      </button>
    </div>
  )
}
