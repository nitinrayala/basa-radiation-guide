import { createGroqChatCompletion } from './groq'
import { answerSystemPrompt, buildAnswerPrompt } from './prompts'
import { buildFollowUpSuggestions, ensureExplainMoreSuggestion } from './suggestions'
import type { KnowledgeChunk } from '../../src/features/retrieval/retrievalTypes'
import type { ChatAnswer, ChatRequest, Env, InterpretedQuestion } from './schemas'

function extractJsonObject(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found.')
  }

  return text.slice(start, end + 1)
}

function sanitizeSuggestions(value: unknown): ChatAnswer['suggestions'] {
  if (!Array.isArray(value)) return []

  return value
    .slice(0, 5)
    .flatMap((item): ChatAnswer['suggestions'] => {
      if (!item || typeof item !== 'object') return []
      const record = item as Record<string, unknown>
      const action = record.action === 'explain_more' ? 'explain_more' : 'question'
      const label = typeof record.label === 'string' ? record.label.trim() : ''
      if (!label) return []

      return [
        {
          id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          label,
          action,
          question: typeof record.question === 'string' && record.question.trim() ? record.question.trim() : undefined,
        },
      ]
    })
}

function parseChatAnswer(text: string, request: ChatRequest, interpreted: InterpretedQuestion, chunks: KnowledgeChunk[]): ChatAnswer {
  const parsed = JSON.parse(extractJsonObject(text)) as Record<string, unknown>
  const answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : ''
  if (!answer) throw new Error('Answer is empty.')

  const knownIds = new Set(chunks.map((chunk) => chunk.id))
  const sourceIds = Array.isArray(parsed.sourceIds)
    ? parsed.sourceIds.filter((id): id is string => typeof id === 'string' && knownIds.has(id))
    : []
  const suggestions = ensureExplainMoreSuggestion(
    [...sanitizeSuggestions(parsed.suggestions), ...buildFollowUpSuggestions(request, interpreted, chunks)],
    request.language,
  )

  return {
    answer,
    suggestions,
    sourceIds: sourceIds.length > 0 ? sourceIds : chunks.slice(0, 2).map((chunk) => chunk.id),
    needsDoctorDiscussion: parsed.needsDoctorDiscussion === true,
  }
}

export async function generateAnswer(
  request: ChatRequest,
  interpreted: InterpretedQuestion,
  chunks: KnowledgeChunk[],
  env: Env,
): Promise<ChatAnswer> {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.')
  }

  const maxOutputTokens = request.action === 'explain_more' ? env.MAX_OUTPUT_TOKENS_EXPANDED : env.MAX_OUTPUT_TOKENS_NORMAL
  const text = await createGroqChatCompletion(env.GROQ_API_KEY, {
    model: env.GROQ_MODEL || 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: answerSystemPrompt },
      { role: 'user', content: buildAnswerPrompt(request, interpreted, chunks) },
    ],
    temperature: 0.2,
    max_completion_tokens: Number.parseInt(maxOutputTokens || '', 10) || (request.action === 'explain_more' ? 900 : 500),
    response_format: { type: 'json_object' },
  })

  return parseChatAnswer(text, request, interpreted, chunks)
}
