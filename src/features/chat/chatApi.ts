import type { ChatRequest, ChatResponse, Language, Suggestion } from './chatTypes'

const useMockChat = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK_CHAT === 'true'
const chatApiUrl = import.meta.env.VITE_CHAT_API_URL

const mockAnswers: Record<Language, string> = {
  en:
    'This is a mock interface response. In live mode, typed questions are answered by the Cloudflare Worker using only the supplied radiation therapy documents.',
  te:
    'ఇది మాక్ ఇంటర్‌ఫేస్ సమాధానం. లైవ్ మోడ్‌లో, మీరు టైప్ చేసిన ప్రశ్నలకు Cloudflare Worker అందించిన రేడియేషన్ థెరపీ పత్రాల ఆధారంగా మాత్రమే సమాధానం ఇస్తుంది.',
}

const mockExpandedAnswers: Record<Language, string> = {
  en:
    'Here is a little more detail in this mock preview:\n\n- Guided journey questions use cached local answers.\n- Typed questions go to the Worker.\n- The Worker retrieves approved document chunks before asking Groq for an answer.',
  te:
    'ఈ మాక్ ప్రివ్యూలో కొంచెం ఎక్కువ వివరంగా:\n\n- గైడ్ ప్రశ్నలకు స్థానికంగా నిల్వ చేసిన సమాధానాలు ఉపయోగిస్తాయి.\n- టైప్ చేసిన ప్రశ్నలు Worker‌కు వెళ్తాయి.\n- Groq సమాధానం ఇవ్వడానికి ముందు Worker ఆమోదించిన పత్ర భాగాలను వెతుకుతుంది.',
}

const explainMoreSuggestion: Record<Language, Suggestion> = {
  en: { id: 'explain-more', label: 'Explain more', action: 'explain_more' },
  te: { id: 'explain-more-te', label: 'మరింత వివరించండి', action: 'explain_more' },
}

function mockChatResponse(request: ChatRequest): ChatResponse {
  return {
    answer: request.action === 'explain_more' ? mockExpandedAnswers[request.language] : mockAnswers[request.language],
    suggestions: [explainMoreSuggestion[request.language]],
    sources: [],
    needsDoctorDiscussion: false,
  }
}

function isSuggestion(value: unknown): value is Suggestion {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>

  return typeof record.id === 'string' && typeof record.label === 'string' && (record.action === 'question' || record.action === 'explain_more')
}

function parseChatResponse(value: unknown): ChatResponse {
  if (!value || typeof value !== 'object') {
    throw new Error('The chat API returned an invalid response.')
  }

  const record = value as Record<string, unknown>
  if (typeof record.answer !== 'string' || !Array.isArray(record.suggestions)) {
    throw new Error('The chat API returned an incomplete response.')
  }

  return {
    answer: record.answer,
    suggestions: record.suggestions.filter(isSuggestion).slice(0, 5),
    sources: Array.isArray(record.sources)
      ? record.sources.flatMap((source) => {
          if (!source || typeof source !== 'object') return []
          const sourceRecord = source as Record<string, unknown>
          if (typeof sourceRecord.id !== 'string' || typeof sourceRecord.label !== 'string') return []

          return [{ id: sourceRecord.id, label: sourceRecord.label }]
        })
      : [],
    needsDoctorDiscussion: record.needsDoctorDiscussion === true,
  }
}

export async function sendChatMessageToApi(request: ChatRequest, apiUrl: string, fetcher: typeof fetch = fetch): Promise<ChatResponse> {
  const response = await fetcher(apiUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Chat API request failed with status ${response.status}.`)
  }

  return parseChatResponse(await response.json())
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  if (useMockChat || !chatApiUrl) {
    return mockChatResponse(request)
  }

  return sendChatMessageToApi(request, chatApiUrl)
}
