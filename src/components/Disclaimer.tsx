import type { Language } from '../features/chat/chatTypes'
import { locales } from '../locales'

interface DisclaimerProps {
  language: Language
}

export function Disclaimer({ language }: DisclaimerProps) {
  const t = locales[language]

  return (
    <footer className="disclaimer">
      <p>{t.disclaimer}</p>
      <p>{t.privacyNotice}</p>
    </footer>
  )
}

