import { LanguageToggle } from './LanguageToggle'
import type { Language } from '../features/chat/chatTypes'
import { locales } from '../locales'

interface ChatHeaderProps {
  language: Language
  onClearChat: () => void
  onLanguageChange: (language: Language) => void
}

export function ChatHeader({ language, onClearChat, onLanguageChange }: ChatHeaderProps) {
  const t = locales[language]

  return (
    <header className="chat-header">
      <div className="chat-title">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
      </div>
      <div className="header-actions">
        <LanguageToggle language={language} onLanguageChange={onLanguageChange} />
        <button className="clear-chat" type="button" onClick={onClearChat}>
          {t.clearChatLabel}
        </button>
      </div>
    </header>
  )
}
