import { useCallback, useEffect, useMemo, useState } from 'react'
import { firstJourneyStepId, getJourneyStep } from '../../content/radiationJourney'
import { sendChatMessage } from './chatApi'
import type { ChatMessage, Language } from './chatTypes'
import { locales } from '../../locales'

let messageCounter = 0
let messageSequence = 0

const journeyProgressStorageKeyPrefix = 'basa-radiation-guide:journey-progress'
const guideAnswerDelayMs = import.meta.env.MODE === 'test' ? 1 : 750
const languages: Language[] = ['en', 'te']

interface StoredJourneyProgress {
  currentStepId: string | null
  completedStepIds: string[]
}

interface ChatSession {
  progress: StoredJourneyProgress
  timelineMessages: ChatMessage[]
}

type ChatSessions = Record<Language, ChatSession>

const createId = () => {
  messageCounter += 1

  return `message-${messageCounter}`
}

const createSequence = () => {
  messageSequence += 1

  return messageSequence
}

const delay = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })

function defaultProgress(): StoredJourneyProgress {
  return { currentStepId: firstJourneyStepId, completedStepIds: [] }
}

function progressStorageKey(language: Language): string {
  return `${journeyProgressStorageKeyPrefix}:${language}`
}

function readLegacyStoredJourneyProgress(): StoredJourneyProgress | null {
  if (typeof window === 'undefined') return null

  try {
    const rawValue = window.localStorage.getItem(journeyProgressStorageKeyPrefix)
    if (!rawValue) return null

    return parseStoredJourneyProgress(rawValue)
  } catch {
    return null
  }
}

function parseStoredJourneyProgress(rawValue: string): StoredJourneyProgress {
  const parsed = JSON.parse(rawValue) as Partial<StoredJourneyProgress>
  const completedStepIds = Array.isArray(parsed.completedStepIds)
    ? parsed.completedStepIds.filter((value): value is string => typeof value === 'string' && Boolean(getJourneyStep(value)))
    : []
  const currentStepId = typeof parsed.currentStepId === 'string' && getJourneyStep(parsed.currentStepId) ? parsed.currentStepId : firstJourneyStepId

  return { currentStepId, completedStepIds }
}

function readStoredJourneyProgress(language: Language): StoredJourneyProgress {
  if (typeof window === 'undefined') return defaultProgress()

  try {
    const rawValue = window.localStorage.getItem(progressStorageKey(language))
    if (rawValue) return parseStoredJourneyProgress(rawValue)

    if (language === 'en') {
      return readLegacyStoredJourneyProgress() ?? defaultProgress()
    }

    return defaultProgress()
  } catch {
    return defaultProgress()
  }
}

function storeJourneyProgress(language: Language, progress: StoredJourneyProgress) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(progressStorageKey(language), JSON.stringify(progress))
}

function createGreetingMessage(language: Language): ChatMessage {
  return {
    id: 'initial-greeting',
    role: 'assistant',
    content: '',
    sequence: createSequence(),
    language,
    kind: 'greeting',
  }
}

function createJourneyMessages(language: Language, completedStepIds: string[]): ChatMessage[] {
  return completedStepIds.flatMap((stepId): ChatMessage[] => {
    const step = getJourneyStep(stepId)
    if (!step) return []

    return [
      {
        id: `journey-${step.id}-question`,
        role: 'user',
        content: '',
        sequence: createSequence(),
        language,
        kind: 'journey',
        journeyStepId: step.id,
        journeyPart: 'question',
      },
      {
        id: `journey-${step.id}-answer`,
        role: 'assistant',
        content: '',
        sequence: createSequence(),
        language,
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

function createInitialTimeline(language: Language, progress: StoredJourneyProgress): ChatMessage[] {
  return [createGreetingMessage(language), ...createJourneyMessages(language, progress.completedStepIds)]
}

function createInitialSession(language: Language): ChatSession {
  const progress = readStoredJourneyProgress(language)

  return {
    progress,
    timelineMessages: createInitialTimeline(language, progress),
  }
}

function createInitialSessions(): ChatSessions {
  return {
    en: createInitialSession('en'),
    te: createInitialSession('te'),
  }
}

export function useChat(language: Language) {
  const [sessions, setSessions] = useState<ChatSessions>(() => createInitialSessions())
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const currentSession = sessions[language]
  const { progress, timelineMessages } = currentSession

  useEffect(() => {
    for (const currentLanguage of languages) {
      storeJourneyProgress(currentLanguage, sessions[currentLanguage].progress)
    }
  }, [sessions])

  const setCurrentSession = useCallback(
    (updater: (currentSession: ChatSession) => ChatSession) => {
      setSessions((currentSessions) => ({
        ...currentSessions,
        [language]: updater(currentSessions[language]),
      }))
    },
    [language],
  )

  const messages = useMemo(
    () =>
      [...timelineMessages]
        .filter((message) => message.language === language)
        .sort((first, second) => first.sequence - second.sequence)
        .map((message) => translateMessage(message, language)),
    [language, timelineMessages],
  )
  const currentJourneyStep = getJourneyStep(progress.currentStepId)
  const nextGuideLabel = currentJourneyStep ? currentJourneyStep.question[language] : locales[language].restartGuideLabel

  const resetGuide = useCallback(() => {
    setCurrentSession((session) => ({
      progress: defaultProgress(),
      timelineMessages: session.timelineMessages.filter((message) => message.kind !== 'journey'),
    }))
    setErrorMessage('')
  }, [setCurrentSession])

  const resetChat = useCallback(() => {
    setCurrentSession(() => ({
      progress: defaultProgress(),
      timelineMessages: [createGreetingMessage(language)],
    }))
    setErrorMessage('')
    setIsLoading(false)
  }, [language, setCurrentSession])

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
      sequence: createSequence(),
      language,
      kind: 'journey',
      journeyStepId: currentJourneyStep.id,
      journeyPart: 'question',
    }

    setCurrentSession((session) => ({
      ...session,
      timelineMessages: [...session.timelineMessages, questionMessage],
    }))
    setErrorMessage('')
    setIsLoading(true)

    await delay(guideAnswerDelayMs)

    const answerMessage: ChatMessage = {
      id: `journey-${currentJourneyStep.id}-answer`,
      role: 'assistant',
      content: '',
      sequence: createSequence(),
      language,
      kind: 'journey',
      journeyStepId: currentJourneyStep.id,
      journeyPart: 'answer',
    }

    setCurrentSession((session) => ({
      progress: {
        currentStepId: currentJourneyStep.nextStepId,
        completedStepIds: session.progress.completedStepIds.includes(currentJourneyStep.id)
          ? session.progress.completedStepIds
          : [...session.progress.completedStepIds, currentJourneyStep.id],
      },
      timelineMessages: [...session.timelineMessages, answerMessage],
    }))
    setIsLoading(false)
  }, [currentJourneyStep, isLoading, language, resetGuide, setCurrentSession])

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
        sequence: createSequence(),
        language,
        kind: 'search',
      }

      const nextTimelineMessages = [...timelineMessages, userMessage]
      setCurrentSession((session) => ({
        ...session,
        timelineMessages: nextTimelineMessages,
      }))
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

        setCurrentSession((session) => ({
          ...session,
          timelineMessages: [
            ...session.timelineMessages,
            { id: createId(), role: 'assistant', content: response.answer, sequence: createSequence(), language, kind: 'search' },
          ],
        }))
      } catch {
        setErrorMessage(locales[language].errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, language, setCurrentSession, timelineMessages],
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
