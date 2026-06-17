import { useCallback, useEffect, useMemo, useState } from 'react'
import { firstJourneyStepId, getJourneyStep } from '../../content/radiationJourney'
import { sendChatMessage } from './chatApi'
import type { ChatMessage, Language } from './chatTypes'
import { locales } from '../../locales'

let messageCounter = 0

const journeyProgressStorageKey = 'basa-radiation-guide:journey-progress'
const guideAnswerDelayMs = import.meta.env.MODE === 'test' ? 1 : 750

interface StoredJourneyProgress {
  currentStepId: string | null
  completedStepIds: string[]
}

const createId = () => {
  messageCounter += 1

  return `message-${messageCounter}`
}

const delay = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })

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

function createGreetingMessage(): ChatMessage {
  return {
    id: 'initial-greeting',
    role: 'assistant',
    content: '',
    kind: 'greeting',
  }
}

function createJourneyMessages(completedStepIds: string[]): ChatMessage[] {
  return completedStepIds.flatMap((stepId): ChatMessage[] => {
    const step = getJourneyStep(stepId)
    if (!step) return []

    return [
      {
        id: `journey-${step.id}-question`,
        role: 'user',
        content: '',
        kind: 'journey',
        journeyStepId: step.id,
        journeyPart: 'question',
      },
      {
        id: `journey-${step.id}-answer`,
        role: 'assistant',
        content: '',
        kind: 'journey',
        journeyStepId: step.id,
        journeyPart: 'answer',
      },
    ]
  })
}

function translateMessage(message: ChatMessage, language: Language): ChatMessage {
  if (message.kind === 'greeting') {
    return { ...message, content: locales[language].initialGreeting }
  }

  if (message.kind === 'journey' && message.journeyStepId && message.journeyPart) {
    const step = getJourneyStep(message.journeyStepId)
    if (!step) return message

    return {
      ...message,
      content: message.journeyPart === 'question' ? step.question[language] : step.answer[language],
    }
  }

  return message
}

function createInitialTimeline(progress: StoredJourneyProgress): ChatMessage[] {
  return [createGreetingMessage(), ...createJourneyMessages(progress.completedStepIds)]
}

export function useChat(language: Language) {
  const [progress, setProgress] = useState<StoredJourneyProgress>(() => readStoredJourneyProgress())
  const [timelineMessages, setTimelineMessages] = useState<ChatMessage[]>(() => createInitialTimeline(readStoredJourneyProgress()))
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    storeJourneyProgress(progress)
  }, [progress])

  const messages = useMemo(() => timelineMessages.map((message) => translateMessage(message, language)), [language, timelineMessages])
  const currentJourneyStep = getJourneyStep(progress.currentStepId)
  const nextGuideLabel = currentJourneyStep ? currentJourneyStep.question[language] : locales[language].restartGuideLabel

  const resetGuide = useCallback(() => {
    setProgress({ currentStepId: firstJourneyStepId, completedStepIds: [] })
    setTimelineMessages((currentMessages) => currentMessages.filter((message) => message.kind !== 'journey'))
    setErrorMessage('')
  }, [])

  const resetChat = useCallback(() => {
    setProgress({ currentStepId: firstJourneyStepId, completedStepIds: [] })
    setTimelineMessages([createGreetingMessage()])
    setErrorMessage('')
    setIsLoading(false)
  }, [])

  const advanceJourney = useCallback(async () => {
    if (isLoading) return

    if (!currentJourneyStep) {
      resetGuide()
      return
    }

    const questionMessage: ChatMessage = {
      id: `journey-${currentJourneyStep.id}-question`,
      role: 'user',
      content: '',
      kind: 'journey',
      journeyStepId: currentJourneyStep.id,
      journeyPart: 'question',
    }

    setTimelineMessages((currentMessages) => [...currentMessages, questionMessage])
    setErrorMessage('')
    setIsLoading(true)

    await delay(guideAnswerDelayMs)

    const answerMessage: ChatMessage = {
      id: `journey-${currentJourneyStep.id}-answer`,
      role: 'assistant',
      content: '',
      kind: 'journey',
      journeyStepId: currentJourneyStep.id,
      journeyPart: 'answer',
    }

    setTimelineMessages((currentMessages) => [...currentMessages, answerMessage])
    setProgress((currentProgress) => ({
      currentStepId: currentJourneyStep.nextStepId,
      completedStepIds: currentProgress.completedStepIds.includes(currentJourneyStep.id)
        ? currentProgress.completedStepIds
        : [...currentProgress.completedStepIds, currentJourneyStep.id],
    }))
    setIsLoading(false)
  }, [currentJourneyStep, isLoading, resetGuide])

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

      const nextTimelineMessages = [...timelineMessages, userMessage]
      setTimelineMessages(nextTimelineMessages)
      setErrorMessage('')
      setIsLoading(true)

      try {
        const searchHistory = nextTimelineMessages
          .filter((message) => message.kind === 'search')
          .map(({ role, content }) => ({ role, content }))

        const response = await sendChatMessage({
          language,
          question: trimmedQuestion,
          action,
          history: searchHistory,
        })

        setTimelineMessages((currentMessages) => [
          ...currentMessages,
          { id: createId(), role: 'assistant', content: response.answer, kind: 'search' },
        ])
      } catch {
        setErrorMessage(locales[language].errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, language, timelineMessages],
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
