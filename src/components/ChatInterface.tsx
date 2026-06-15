import { useEffect, useMemo, useRef, useState } from 'react'
import { usePatientProfile } from '../hooks/usePatientProfile'
import { askAssistant } from '../services/aiService'
import { TRANSLATIONS } from '../translations'
import type { ChatMessage } from '../types'
import { TREATMENT_SITE_QUESTIONS } from '../utils/treatmentSites'

const GENERAL_QUESTIONS = [
  'What is radiation therapy?',
  'What should I expect during treatment?',
  'What are common side effects?',
  'How should I prepare for my first session?',
]

function newMessage(sender: ChatMessage['sender'], text: string, citations?: string[]): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    citations,
  }
}

export function ChatInterface() {
  const { selectedLanguage, selectedTreatmentSite } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const suggestions = useMemo(
    () => [...GENERAL_QUESTIONS, ...TREATMENT_SITE_QUESTIONS[selectedTreatmentSite]],
    [selectedTreatmentSite],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  async function sendQuestion(question: string) {
    if (!question.trim()) return

    const userMessage = newMessage('user', question)
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setTyping(true)

    const response = await askAssistant({
      question,
      profile: {
        selectedLanguage,
        selectedTreatmentSite,
      },
    })

    setTyping(false)
    setMessages((prev) => [...prev, newMessage('assistant', response.answer, response.citations)])
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t.suggestedQuestions}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {suggestions.map((question) => (
            <button
              key={question}
              type="button"
              className="rounded-xl border border-slate-200 p-4 text-left text-base transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void sendQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div ref={scrollRef} className="max-h-[50vh] space-y-3 overflow-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-base shadow-sm animate-in fade-in ${
                message.sender === 'user'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'mr-auto bg-white text-slate-900 dark:bg-slate-700 dark:text-white'
              }`}
            >
              <p>{message.text}</p>
              <div className="mt-2 flex items-center gap-3 text-xs opacity-80">
                <span>{message.timestamp}</span>
                {message.sender === 'assistant' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(message.text)}
                      className="underline"
                    >
                      Copy
                    </button>
                    <button type="button" className="underline" aria-label="Regenerate response placeholder">
                      Regenerate
                    </button>
                  </>
                )}
              </div>
              {message.citations && (
                <div className="mt-2 border-t border-slate-200 pt-2 text-xs dark:border-slate-600">
                  <p className="font-medium">Sources</p>
                  <ul className="list-disc pl-5">
                    {message.citations.map((citation) => (
                      <li key={citation}>{citation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
          {typing && <p className="text-sm text-slate-600 dark:text-slate-300">Assistant is typing…</p>}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void sendQuestion(input)
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your question"
            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base dark:border-slate-600 dark:bg-slate-800"
          />
          <button type="submit" className="rounded-xl bg-blue-600 px-5 text-white">
            Send
          </button>
        </form>
      </div>
    </section>
  )
}
