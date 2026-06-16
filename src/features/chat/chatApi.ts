import type { ChatRequest, ChatResponse, Language, Suggestion } from './chatTypes'

const useMockChat = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK_CHAT === 'true'
const chatApiUrl = import.meta.env.VITE_CHAT_API_URL

const explainMoreSuggestion: Record<Language, Suggestion> = {
  en: { id: 'explain-more', label: 'Explain more', action: 'explain_more' },
  te: { id: 'explain-more-te', label: 'మరింత వివరించండి', action: 'explain_more' },
}

const planningSuggestions: Record<Language, Suggestion[]> = {
  en: [
    { id: 'remain-still', label: 'Why do I need to remain still?', action: 'question', question: 'Why do I need to remain still during radiation?' },
    { id: 'planning-next', label: 'What happens after the planning scan?', action: 'question', question: 'What happens after the planning scan?' },
    { id: 'planning-time', label: 'How long does planning take?', action: 'question', question: 'How long does radiation planning take?' },
  ],
  te: [
    { id: 'remain-still-te', label: 'కదలకుండా ఎందుకు ఉండాలి?', action: 'question', question: 'రేడియేషన్ సమయంలో నేను ఎందుకు కదలకుండా ఉండాలి?' },
    { id: 'planning-next-te', label: 'ప్లానింగ్ స్కాన్ తర్వాత ఏమి జరుగుతుంది?', action: 'question', question: 'ప్లానింగ్ స్కాన్ తర్వాత ఏమి జరుగుతుంది?' },
    { id: 'planning-time-te', label: 'ప్లానింగ్‌కు ఎంత సమయం పడుతుంది?', action: 'question', question: 'రేడియేషన్ ప్లానింగ్‌కు ఎంత సమయం పడుతుంది?' },
  ],
}

const maskSuggestions: Record<Language, Suggestion[]> = {
  en: [
    { id: 'mask-tight', label: 'Will the mask feel tight?', action: 'question', question: 'Will the radiation mask feel tight?' },
    { id: 'mask-duration', label: 'How long will I wear the mask?', action: 'question', question: 'How long will I wear the radiation mask?' },
    { id: 'move', label: 'What happens if I move?', action: 'question', question: 'What happens if I move during radiation treatment?' },
  ],
  te: [
    { id: 'mask-tight-te', label: 'మాస్క్ బిగిగా అనిపిస్తుందా?', action: 'question', question: 'రేడియేషన్ మాస్క్ బిగిగా అనిపిస్తుందా?' },
    { id: 'mask-duration-te', label: 'మాస్క్ ఎంతసేపు ధరిస్తాను?', action: 'question', question: 'రేడియేషన్ మాస్క్ ఎంతసేపు ధరిస్తాను?' },
    { id: 'move-te', label: 'నేను కదిలితే ఏమవుతుంది?', action: 'question', question: 'రేడియేషన్ సమయంలో నేను కదిలితే ఏమవుతుంది?' },
  ],
}

const sideEffectSuggestions: Record<Language, Suggestion[]> = {
  en: [
    { id: 'side-effects-begin', label: 'When can side effects begin?', action: 'question', question: 'When do radiation side effects usually begin?' },
    { id: 'side-effects-after', label: 'Can side effects continue after treatment?', action: 'question', question: 'Can radiation side effects continue after treatment?' },
    { id: 'precautions', label: 'What precautions are mentioned?', action: 'question', question: 'What precautions are mentioned in the radiation documents?' },
  ],
  te: [
    { id: 'side-effects-begin-te', label: 'దుష్ప్రభావాలు ఎప్పుడు మొదలవుతాయి?', action: 'question', question: 'రేడియేషన్ దుష్ప్రభావాలు సాధారణంగా ఎప్పుడు మొదలవుతాయి?' },
    {
      id: 'side-effects-after-te',
      label: 'చికిత్స తర్వాత కూడా దుష్ప్రభావాలు ఉంటాయా?',
      action: 'question',
      question: 'రేడియేషన్ చికిత్స తర్వాత కూడా దుష్ప్రభావాలు కొనసాగవచ్చా?',
    },
    { id: 'precautions-te', label: 'ఏ జాగ్రత్తలు చెప్పబడ్డాయి?', action: 'question', question: 'రేడియేషన్ పత్రాలలో ఏ జాగ్రత్తలు చెప్పబడ్డాయి?' },
  ],
}

const generalSuggestions: Record<Language, Suggestion[]> = {
  en: [
    { id: 'planning', label: 'What happens during planning?', action: 'question', question: 'What happens during radiation planning?' },
    { id: 'side-effects', label: 'What side effects can occur?', action: 'question', question: 'What side effects can occur during radiation therapy?' },
    { id: 'doctor-question', label: 'What should I ask my doctor?', action: 'question', question: 'What should I discuss with my treating doctor?' },
  ],
  te: [
    { id: 'planning-te', label: 'ప్లానింగ్ సమయంలో ఏమి జరుగుతుంది?', action: 'question', question: 'రేడియేషన్ ప్లానింగ్ సమయంలో ఏమి జరుగుతుంది?' },
    { id: 'side-effects-te', label: 'ఏ దుష్ప్రభావాలు రావచ్చు?', action: 'question', question: 'రేడియేషన్ థెరపీ సమయంలో ఏ దుష్ప్రభావాలు రావచ్చు?' },
    { id: 'doctor-question-te', label: 'డాక్టర్‌ను ఏమి అడగాలి?', action: 'question', question: 'నా చికిత్స చేసే డాక్టర్‌ను ఏమి అడగాలి?' },
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
    'Here is a little more detail in this mock preview:\n\n- The app sends recent conversation context with Explain more.\n- The Worker retrieves relevant document chunks again.\n- The response stays document-grounded and returns new follow-up suggestions.',
  te:
    'ఈ మాక్ ప్రివ్యూలో కొంచెం ఎక్కువ వివరంగా:\n\n- మరింత వివరించండి నొక్కినప్పుడు యాప్ ఇటీవలి సంభాషణను పంపుతుంది.\n- Worker మళ్లీ సంబంధిత పత్ర భాగాలను వెతుకుతుంది.\n- సమాధానం పత్రాలకే పరిమితం అవుతూ కొత్త ఫాలో-అప్ సూచనలు ఇస్తుంది.',
}

function mockSuggestions(request: ChatRequest): Suggestion[] {
  const question = request.question.toLowerCase()
  const suggestions =
    question.includes('mask') || question.includes('మాస్క్')
      ? maskSuggestions
      : question.includes('side effect') || question.includes('దుష్ప్రభావ')
        ? sideEffectSuggestions
        : question.includes('planning') || question.includes('scan') || question.includes('ప్లానింగ్')
          ? planningSuggestions
          : generalSuggestions

  return [...suggestions[request.language], explainMoreSuggestion[request.language]]
}

function mockChatResponse(request: ChatRequest): ChatResponse {
  return {
    answer: request.action === 'explain_more' ? expandedAnswers[request.language] : normalAnswers[request.language],
    suggestions: mockSuggestions(request),
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
