import type { ChatRequest, ChatResponse, Language, Suggestion } from './chatTypes'

const useMockChat = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK_CHAT === 'true'
const chatApiUrl = import.meta.env.VITE_CHAT_API_URL

const followUpSuggestions: Record<Language, Suggestion[]> = {
  en: [
    { id: 'planning-next', label: 'What happens after the planning scan?', action: 'question', question: 'What happens after the planning scan?' },
    { id: 'remain-still', label: 'Why do I need to remain still?', action: 'question', question: 'Why do I need to remain still during radiation?' },
    { id: 'side-effects', label: 'What side effects can occur?', action: 'question', question: 'What side effects can occur during radiation therapy?' },
    { id: 'explain-more', label: 'Explain more', action: 'explain_more' },
  ],
  te: [
    { id: 'planning-next-te', label: 'ప్లానింగ్ స్కాన్ తర్వాత ఏమి జరుగుతుంది?', action: 'question', question: 'ప్లానింగ్ స్కాన్ తర్వాత ఏమి జరుగుతుంది?' },
    { id: 'remain-still-te', label: 'నేను ఎందుకు కదలకుండా ఉండాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో నేను ఎందుకు కదలకుండా ఉండాలి?' },
    { id: 'side-effects-te', label: 'ఏ దుష్ప్రభావాలు రావచ్చు?', action: 'question', question: 'రేడియేషన్ థెరపీ సమయంలో ఏ దుష్ప్రభావాలు రావచ్చు?' },
    { id: 'explain-more-te', label: 'మరింత వివరించండి', action: 'explain_more' },
  ],
}

const normalAnswers: Record<Language, string> = {
  en:
    'This is a mock interface response. In live mode, this answer comes from the Cloudflare Worker using only the supplied radiation therapy documents.',
  te:
    'ఇది మాక్ ఇంటర్‌ఫేస్ సమాధానం. లైవ్ మోడ్‌లో, ఈ సమాధానం అందించిన రేడియేషన్ థెరపీ పత్రాల ఆధారంగా Cloudflare Worker నుండి వస్తుంది.',
}

const expandedAnswers: Record<Language, string> = {
  en:
    'Here is a little more detail in this mock preview:\n\n- The interface sends the selected language with each question.\n- Romanised Telugu and mixed-language questions are passed through to the Worker.\n- Explain more behaves like a normal follow-up message.',
  te:
    'ఈ మాక్ ప్రివ్యూలో కొంచెం ఎక్కువ వివరంగా:\n\n- ప్రతి ప్రశ్నతో ఎంచుకున్న భాష Workerకి పంపబడుతుంది.\n- Romanised Telugu మరియు mixed-language ప్రశ్నలు Workerకి పంపబడతాయి.\n- మరింత వివరించండి సాధారణ ఫాలో-అప్ ప్రశ్నలా పనిచేస్తుంది.',
}

function mockChatResponse(request: ChatRequest): ChatResponse {
  return {
    answer: request.action === 'explain_more' ? expandedAnswers[request.language] : normalAnswers[request.language],
    suggestions: followUpSuggestions[request.language],
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
