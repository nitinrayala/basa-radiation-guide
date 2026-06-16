import { useCallback, useState } from 'react'
import { initialSuggestions } from './initialSuggestions'
import { sendChatMessage } from './chatApi'
import type { ChatMessage, Language, Suggestion } from './chatTypes'
import { locales } from '../../locales'

let messageCounter = 0

const createId = () => {
  messageCounter += 1

  return `message-${messageCounter}`
}

export function useChat(language: Language) {
  const t = locales[language]
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial-greeting', role: 'assistant', content: t.initialGreeting },
  ])
  const [errorMessage, setErrorMessage] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions[language])
  const [isLoading, setIsLoading] = useState(false)

  const resetChat = useCallback(() => {
    setMessages([{ id: 'initial-greeting', role: 'assistant', content: locales[language].initialGreeting }])
    setErrorMessage('')
    setSuggestions(initialSuggestions[language])
    setIsLoading(false)
  }, [language])

  const submitQuestion = useCallback(
    async (question: string, action: 'normal' | 'explain_more' = 'normal') => {
      const trimmedQuestion = question.trim()

      if (trimmedQuestion.length === 0 || isLoading) {
        return
      }

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmedQuestion,
      }

      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setErrorMessage('')
      setIsLoading(true)

      try {
        const response = await sendChatMessage({
          language,
          question: trimmedQuestion,
          action,
          history: nextMessages.map(({ role, content }) => ({ role, content })),
        })

        setMessages((currentMessages) => [
          ...currentMessages,
          { id: createId(), role: 'assistant', content: response.answer },
        ])
        setSuggestions(response.suggestions)
      } catch {
        setErrorMessage(locales[language].errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, language, messages],
  )

  const submitSuggestion = useCallback(
    (suggestion: Suggestion) => {
      const question = suggestion.action === 'explain_more' ? suggestion.label : suggestion.question || suggestion.label
      void submitQuestion(question, suggestion.action === 'explain_more' ? 'explain_more' : 'normal')
    },
    [submitQuestion],
  )

  return {
    errorMessage,
    isLoading,
    messages,
    resetChat,
    submitQuestion,
    submitSuggestion,
    suggestions,
  }
}
