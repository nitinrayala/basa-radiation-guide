import { generateAnswer } from './answer'
import { buildFallbackAnswer } from './fallback'
import { interpretQuestion } from './interpretQuestion'
import { retrieveForQuestion, toSourceLabels } from './retrieve'
import { parseChatRequest, parsePositiveInteger, type ChatAnswer, type ChatResponse, type Env } from './schemas'

const jsonHeaders = {
  'content-type': 'application/json; charset=UTF-8',
}

function jsonResponse(body: unknown, status: number, corsHeaders: HeadersInit): Response {
  return Response.json(body, { status, headers: { ...jsonHeaders, ...corsHeaders } })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin')
    const corsHeaders = buildCorsHeaders(origin, env.ALLOWED_ORIGINS ?? env.ALLOWED_ORIGIN)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const url = new URL(request.url)

    if (url.pathname !== '/api/chat') {
      return jsonResponse({ error: 'Not found' }, 404, corsHeaders)
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON request body.' }, 400, corsHeaders)
    }

    const parsedRequest = parseChatRequest(body, parsePositiveInteger(env.MAX_HISTORY_MESSAGES, 6))
    if (!parsedRequest.ok) {
      return jsonResponse({ error: parsedRequest.message }, parsedRequest.status, corsHeaders)
    }

    const chatRequest = parsedRequest.value
    const interpreted = await interpretQuestion(chatRequest, env)
    const retrievalResults = retrieveForQuestion(interpreted, chatRequest.question, 6)
    const retrievedChunks = retrievalResults.map((result) => result.chunk)

    let answer: ChatAnswer
    try {
      answer = await generateAnswer(chatRequest, interpreted, retrievedChunks, env)
    } catch {
      answer = buildFallbackAnswer(chatRequest, retrievedChunks, true)
    }

    const sourceLabels = toSourceLabels(retrievedChunks)
    const response: ChatResponse = {
      answer: answer.answer,
      suggestions: answer.suggestions.slice(0, 5),
      sources: answer.sourceIds.flatMap((sourceId) => sourceLabels.find((source) => source.id === sourceId) ?? []),
      needsDoctorDiscussion: answer.needsDoctorDiscussion,
    }

    return jsonResponse(response, 200, corsHeaders)
  },
}

export function buildCorsHeaders(origin: string | null, allowedOrigins = ''): HeadersInit {
  const headers: Record<string, string> = {
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin',
  }

  const localDevelopmentOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
  const configuredOrigins = new Set(
    allowedOrigins
      .split(',')
      .map((configuredOrigin) => configuredOrigin.trim())
      .filter(Boolean),
  )

  if (origin && (configuredOrigins.has(origin) || localDevelopmentOrigins.has(origin))) {
    headers['access-control-allow-origin'] = origin
  }

  return headers
}
