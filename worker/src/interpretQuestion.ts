import { createGroqChatCompletion } from './groq'
import { buildInterpretPrompt } from './prompts'
import type { ChatRequest, Env, InterpretedQuestion } from './schemas'

const defaultInterpretation = (request: ChatRequest): InterpretedQuestion => ({
  detectedLanguage: request.language,
  responseLanguage: request.language,
  englishSearchQuery: request.question,
  category: 'unknown',
  treatmentAreas: [],
  treatmentAreaConfidence: 0,
  keyTerms: [],
  isOutsideScope: false,
})

function extractJsonObject(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found.')
  }

  return text.slice(start, end + 1)
}

function parseInterpretation(text: string, request: ChatRequest): InterpretedQuestion {
  const parsed = JSON.parse(extractJsonObject(text)) as Partial<InterpretedQuestion>
  const fallback = defaultInterpretation(request)

  return {
    detectedLanguage: parsed.detectedLanguage === 'en' || parsed.detectedLanguage === 'te' || parsed.detectedLanguage === 'mixed' ? parsed.detectedLanguage : fallback.detectedLanguage,
    responseLanguage: parsed.responseLanguage === 'en' || parsed.responseLanguage === 'te' ? parsed.responseLanguage : fallback.responseLanguage,
    englishSearchQuery: typeof parsed.englishSearchQuery === 'string' && parsed.englishSearchQuery.trim() ? parsed.englishSearchQuery.trim() : fallback.englishSearchQuery,
    category: parsed.category ?? 'unknown',
    treatmentAreas: Array.isArray(parsed.treatmentAreas) ? parsed.treatmentAreas.filter((area): area is string => typeof area === 'string') : [],
    treatmentAreaConfidence:
      typeof parsed.treatmentAreaConfidence === 'number' && Number.isFinite(parsed.treatmentAreaConfidence)
        ? Math.max(0, Math.min(1, parsed.treatmentAreaConfidence))
        : fallback.treatmentAreaConfidence,
    keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms.filter((term): term is string => typeof term === 'string') : [],
    isOutsideScope: parsed.isOutsideScope === true,
  }
}

export async function interpretQuestion(request: ChatRequest, env: Env): Promise<InterpretedQuestion> {
  if (!env.GROQ_API_KEY) {
    return defaultInterpretation(request)
  }

  try {
    const text = await createGroqChatCompletion(env.GROQ_API_KEY, {
      model: env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: buildInterpretPrompt(request) }],
      temperature: 0,
      maxOutputTokens: 180,
      topP: 1,
      responseFormat: 'json_object',
    })

    return parseInterpretation(text, request)
  } catch {
    return defaultInterpretation(request)
  }
}
