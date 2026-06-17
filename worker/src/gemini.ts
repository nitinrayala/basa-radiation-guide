export interface GeminiMessage {
  role: 'user' | 'model'
  text: string
}

export interface GeminiGenerateRequest {
  model: string
  systemInstruction?: string
  messages: GeminiMessage[]
  temperature?: number
  maxOutputTokens?: number
  responseMimeType?: 'application/json' | 'text/plain'
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

function buildGeminiBody(body: GeminiGenerateRequest): Record<string, unknown> {
  return {
    systemInstruction: body.systemInstruction
      ? {
          parts: [{ text: body.systemInstruction }],
        }
      : undefined,
    contents: body.messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    })),
    generationConfig: {
      temperature: body.temperature,
      maxOutputTokens: body.maxOutputTokens,
      responseMimeType: body.responseMimeType,
    },
  }
}

export async function createGeminiContent(
  apiKey: string,
  body: GeminiGenerateRequest,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(body.model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(buildGeminiBody(body)),
  })

  if (!response.ok) {
    throw new GeminiError(`Gemini request failed with status ${response.status}.`, response.status)
  }

  const json = (await response.json()) as GeminiGenerateResponse
  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new GeminiError('Gemini response did not include text.')
  }

  return text
}
