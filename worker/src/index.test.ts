import worker from './index'
import type { Env } from './schemas'

const baseEnv: Env = {
  ALLOWED_ORIGINS: 'https://nitinrayala.github.io,http://localhost:5173',
  GROQ_MODEL: 'llama-3.1-8b-instant',
  MAX_HISTORY_MESSAGES: '6',
  MAX_OUTPUT_TOKENS_NORMAL: '500',
  MAX_OUTPUT_TOKENS_EXPANDED: '900',
}

function chatRequest(body: unknown): Request {
  return new Request('https://example.test/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:5173',
    },
    body: JSON.stringify(body),
  })
}

describe('Cloudflare Worker chat API', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects invalid chat requests', async () => {
    const response = await worker.fetch(chatRequest({ language: 'en', question: '' }), baseEnv)
    const json = (await response.json()) as { error: string }

    expect(response.status).toBe(400)
    expect(json.error).toBe('Question is required.')
  })

  it('handles CORS preflight', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/api/chat', {
        method: 'OPTIONS',
        headers: { origin: 'https://nitinrayala.github.io' },
      }),
      baseEnv,
    )

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('https://nitinrayala.github.io')
  })

  it('returns local fallback when Groq is not configured', async () => {
    const response = await worker.fetch(chatRequest({ language: 'en', question: 'Why is a mask used during radiation?' }), baseEnv)
    const json = (await response.json()) as { answer: string; suggestions: Array<{ label: string; action: string }>; sources: Array<{ id: string }> }

    expect(response.status).toBe(200)
    expect(json.answer).toMatch(/temporarily unavailable/i)
    expect(json.answer).toMatch(/Thermoplastic mask|Immobilization/i)
    expect(json.suggestions.some((suggestion) => suggestion.label === 'Will the mask feel tight?')).toBe(true)
    expect(json.suggestions.some((suggestion) => suggestion.action === 'explain_more')).toBe(true)
    expect(json.sources.length).toBeGreaterThan(0)
  })

  it('calls Groq interpretation and answer generation when configured', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  detectedLanguage: 'en',
                  responseLanguage: 'en',
                  englishSearchQuery: 'why is an immobilisation mask used during radiation therapy',
                  category: 'planning',
                  treatmentAreas: ['head_neck'],
                  keyTerms: ['mask', 'immobilisation'],
                  isOutsideScope: false,
                }),
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  answer: 'A mask helps keep the treatment position consistent.',
                  suggestions: [{ id: 'explain-more', label: 'Explain more', action: 'explain_more' }],
                  sourceIds: ['planning-radiation-planning-chatbot-radiation-planning-chatbot-001-01'],
                  needsDoctorDiscussion: false,
                }),
              },
            },
          ],
        }),
      )

    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(
      chatRequest({ language: 'en', question: 'Why is a mask used during radiation?' }),
      { ...baseEnv, GROQ_API_KEY: 'test-key' },
    )
    const json = (await response.json()) as { answer: string; suggestions: Array<{ action: string }>; sources: Array<{ id: string }> }

    expect(response.status).toBe(200)
    expect(json.answer).toBe('A mask helps keep the treatment position consistent.')
    expect(json.suggestions.some((suggestion) => suggestion.action === 'explain_more')).toBe(true)
    expect(json.suggestions.length).toBeGreaterThanOrEqual(3)
    expect(json.sources[0]?.id).toBe('planning-radiation-planning-chatbot-radiation-planning-chatbot-001-01')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns Telugu follow-up suggestions with Explain More in fallback mode', async () => {
    const response = await worker.fetch(
      chatRequest({ language: 'te', question: 'Radiation mask enduku vestaru?', action: 'normal', history: [] }),
      baseEnv,
    )
    const json = (await response.json()) as { suggestions: Array<{ label: string; action: string }> }

    expect(response.status).toBe(200)
    expect(json.suggestions.some((suggestion) => suggestion.label === 'మాస్క్ బిగిగా అనిపిస్తుందా?')).toBe(true)
    expect(json.suggestions.some((suggestion) => suggestion.label === 'మరింత వివరించండి' && suggestion.action === 'explain_more')).toBe(true)
  })
})
