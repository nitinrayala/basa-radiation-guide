export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqChatCompletionRequest {
  model: string
  messages: GroqMessage[]
  temperature?: number
  max_completion_tokens?: number
  response_format?: {
    type: 'json_object'
  }
}

interface GroqChatCompletionResponse {
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

export async function createGroqChatCompletion(
  apiKey: string,
  body: GroqChatCompletionRequest,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const response = await fetcher('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new GroqError(`Groq request failed with status ${response.status}.`, response.status)
  }

  const json = (await response.json()) as GroqChatCompletionResponse
  const text = json.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new GroqError('Groq response did not include text.')
  }

  return text
}
