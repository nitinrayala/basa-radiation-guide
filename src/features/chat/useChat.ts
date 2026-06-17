import { useCallback, useEffect, useMemo, useState } from 'react'
import { firstJourneyStepId, getJourneyStep } from '../../content/radiationJourney'
import { sendChatMessage } from './chatApi'
import type { ChatMessage, Language } from './chatTypes'
import { locales } from '../../locales'

let messageCounter = 0

const journeyProgressStorageKey = 'basa-radiation-guide:journey-progress'

interface StoredJourneyProgress {
  currentStepId: string | null
  completedStepIds: string[]
}

const createId = () => {
  messageCounter += 1

  return `message-${messageCounter}`
}

function readStoredJourneyProgress(): StoredJourneyProgress {
  if (typeof window === 'undefined') {
    return { currentStepId: firstJourneyStepId, completedStepIds: [] }
  }

  try {
    const rawValue = window.localStorage.getItem(journeyProgressStorageKey)
    if (!rawValue) return { currentStepId: firstJourneyStepId, completedStepIds: [] }

    const parsed = JSON.parse(rawValue) as Partial<StoredJourneyProgress>
    const completedStepIds = Array.isArray(parsed.completedStepIds)
      ? parsed.completedStepIds.filter((value): value is string => typeof value === 'string' && Boolean(getJourneyStep(value)))
      : []
    const currentStepId = typeof parsed.currentStepId === 'string' && getJourneyStep(parsed.currentStepId) ? parsed.currentStepId : firstJourneyStepId

    return { currentStepId, completedStepIds }
  } catch {
    return { currentStepId: firstJourneyStepId, completedStepIds: [] }
  }
}

function storeJourneyProgress(progress: StoredJourneyProgress) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(journeyProgressStorageKey, JSON.stringify(progress))
}

function buildJourneyMessages(language: Language, completedStepIds: string[]): ChatMessage[] {
  const t = locales[language]
  const greeting: ChatMessage = {
    id: 'initial-greeting',
    role: 'assistant',
    content: t.initialGreeting,
    kind: 'greeting',
  }

  const journeyMessages = completedStepIds.flatMap((stepId): ChatMessage[] => {
    const step = getJourneyStep(stepId)
    if (!step) return []

    return [
      {
        id: `journey-${step.id}-question`,
        role: 'user',
        content: step.question[language],
        kind: 'journey',
        journeyStepId: step.id,
        journeyPart: 'question',
      },
      {
        id: `journey-${step.id}-answer`,
        role: 'assistant',
        content: step.answer[language],
        kind: 'journey',
        journeyStepId: step.id,
        journeyPart: 'answer',
      },
    ]
  })

  return [greeting, ...journeyMessages]
}

export function useChat(language: Language) {
  const [progress, setProgress] = useState<StoredJourneyProgress>(() => readStoredJourneyProgress())
  const [searchMessages, setSearchMessages] = useState<ChatMessage[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    storeJourneyProgress(progress)
  }, [progress])

  const journeyMessages = useMemo(() => buildJourneyMessages(language, progress.completedStepIds), [language, progress.completedStepIds])
  const messages = useMemo(() => [...journeyMessages, ...searchMessages], [journeyMessages, searchMessages])
  const currentJourneyStep = getJourneyStep(progress.currentStepId)
  const nextGuideLabel = currentJourneyStep ? currentJourneyStep.question[language] : locales[language].restartGuideLabel

  const resetGuide = useCallback(() => {
    setProgress({ currentStepId: firstJourneyStepId, completedStepIds: [] })
    setErrorMessage('')
  }, [])

  const resetChat = useCallback(() => {
    setProgress({ currentStepId: firstJourneyStepId, completedStepIds: [] })
    setSearchMessages([])
    setErrorMessage('')
    setIsLoading(false)
  }, [])

  const advanceJourney = useCallback(() => {
    if (!currentJourneyStep) {
      resetGuide()
      return
    }

    setProgress((currentProgress) => {
      if (!currentProgress.currentStepId) {
        return { currentStepId: firstJourneyStepId, completedStepIds: [] }
      }

      return {
        currentStepId: currentJourneyStep.nextStepId,
        completedStepIds: currentProgress.completedStepIds.includes(currentJourneyStep.id)
          ? currentProgress.completedStepIds
          : [...currentProgress.completedStepIds, currentJourneyStep.id],
      }
    })
    setErrorMessage('')
  }, [currentJourneyStep, resetGuide])

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
        kind: 'search',
      }

      const nextSearchMessages = [...searchMessages, userMessage]
      setSearchMessages(nextSearchMessages)
      setErrorMessage('')
      setIsLoading(true)

      try {
        const response = await sendChatMessage({
          language,
          question: trimmedQuestion,
          action,
          history: nextSearchMessages.map(({ role, content }) => ({ role, content })),
        })

        setSearchMessages((currentMessages) => [
          ...currentMessages,
          { id: createId(), role: 'assistant', content: response.answer, kind: 'search' },
        ])
      } catch {
        setErrorMessage(locales[language].errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, language, searchMessages],
  )

  return {
    advanceJourney,
    errorMessage,
    isGuideComplete: currentJourneyStep === null,
    isLoading,
    messages,
    nextGuideLabel,
    resetChat,
    resetGuide,
    submitQuestion,
  }
}
