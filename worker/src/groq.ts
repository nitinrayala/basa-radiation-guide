export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqChatRequest {
  model: string
  systemInstruction?: string
  messages: GroqMessage[]
  temperature?: number
  maxOutputTokens?: number
  topP?: number
  responseFormat?: 'json_object'
}

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export class GroqError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'GroqError'
  }
}

function buildGroqBody(body: GroqChatRequest): Record<string, unknown> {
  const messages: GroqMessage[] = body.systemInstruction
    ? [{ role: 'system', content: body.systemInstruction }, ...body.messages]
    : body.messages

  return {
    model: body.model,
    messages,
    temperature: body.temperature,
    max_completion_tokens: body.maxOutputTokens,
    top_p: body.topP,
    response_format: body.responseFormat ? { type: body.responseFormat } : undefined,
  }
}

export async function createGroqChatCompletion(
  apiKey: string,
  body: GroqChatRequest,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const response = await fetcher('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(buildGroqBody(body)),
  })

  if (!response.ok) {
    throw new GroqError(`Groq request failed with status ${response.status}.`, response.status)
  }

  const json = (await response.json()) as GroqChatResponse
  const text = json.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new GroqError('Groq response did not include text.')
  }

  return text
}
