import { useEffect, useRef, useState } from 'react'
import { ChatHeader } from './components/ChatHeader'
import { ChatInput } from './components/ChatInput'
import { ChatMessage } from './components/ChatMessage'
import { Disclaimer } from './components/Disclaimer'
import { ErrorMessage } from './components/ErrorMessage'
import { SuggestionButtons } from './components/SuggestionButtons'
import { TypingIndicator } from './components/TypingIndicator'
import { useChat } from './features/chat/useChat'
import type { Language } from './features/chat/chatTypes'
import { locales } from './locales'

interface ChatSurfaceProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

function ChatSurface({ language, onLanguageChange }: ChatSurfaceProps) {
  const t = locales[language]
  const latestMessageRef = useRef<HTMLDivElement>(null)
  const { errorMessage, isLoading, messages, resetChat, submitQuestion, submitSuggestion, suggestions } = useChat(language)

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [isLoading, messages.length])

  return (
    <main className="app-shell" aria-label={t.appLabel}>
      <ChatHeader language={language} onClearChat={resetChat} onLanguageChange={onLanguageChange} />
      <section className="conversation" aria-live="polite" aria-relevant="additions text">
        <div className="message-list">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading ? <TypingIndicator label={t.typingLabel} /> : null}
          <div ref={latestMessageRef} aria-hidden="true" />
        </div>
      </section>
      <section className="composer-panel">
        {errorMessage ? <ErrorMessage message={errorMessage} /> : null}
        <SuggestionButtons
          disabled={isLoading}
          label={t.suggestionsLabel}
          suggestions={suggestions}
          onSelect={submitSuggestion}
        />
        <ChatInput
          askLabel={t.askLabel}
          disabled={isLoading}
          placeholder={t.inputPlaceholder}
          sendLabel={t.sendLabel}
          sendingLabel={t.sendingLabel}
          onSubmit={(question) => void submitQuestion(question)}
        />
        <Disclaimer language={language} />
      </section>
    </main>
  )
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return <ChatSurface key={language} language={language} onLanguageChange={setLanguage} />
}
