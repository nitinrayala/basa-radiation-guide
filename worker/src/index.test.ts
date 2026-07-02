import worker from './index'
import type { Env } from './schemas'

const baseEnv: Env = {
  ALLOWED_ORIGINS: 'https://nitinrayala.github.io,http://localhost:5173',
  GROQ_MODEL: 'llama-3.1-8b-instant',
  MAX_HISTORY_MESSAGES: '6',
  MAX_OUTPUT_TOKENS_NORMAL: '850',
  MAX_OUTPUT_TOKENS_EXPANDED: '1400',
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
    expect(json.answer).toMatch(/temporarily unavailable|available material/i)
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
                  treatmentAreaConfidence: 0.95,
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
                  sourceIds: ['planning-2-immobilization-radiation-planning-chatbot-005-01'],
                  needsDoctorDiscussion: false,
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
                  answer:
                    'A radiation mask helps keep your head and neck in the same position each day so the treatment can be planned and delivered accurately. It is part of immobilization, which means helping the body stay still during planning and treatment.\n\nWhat to expect:\n- The team may make a thermoplastic mask that fits your face and head-and-neck area.\n- The mask helps reduce movement during the planning scan and treatment sessions.\n- Marks and setup information help the radiation team reproduce the same position.\n\nKey notes:\n- Tell the team if the mask feels too tight or uncomfortable.\n- Follow the setup instructions from your radiation team because the exact process can vary with your treatment plan.',
                  suggestions: [{ id: 'explain-more', label: 'Explain more', action: 'explain_more' }],
                  sourceIds: ['planning-2-immobilization-radiation-planning-chatbot-005-01'],
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
    expect(json.answer).toMatch(/What to expect/)
    expect(json.answer).toMatch(/thermoplastic mask|same position/i)
    expect(json.suggestions.some((suggestion) => suggestion.action === 'explain_more')).toBe(true)
    expect(json.suggestions.length).toBeGreaterThanOrEqual(3)
    expect(json.sources[0]?.id).toBe('planning-2-immobilization-radiation-planning-chatbot-005-01')
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      model: 'llama-3.1-8b-instant',
      max_completion_tokens: 180,
      top_p: 1,
    })
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      model: 'llama-3.1-8b-instant',
      max_completion_tokens: 850,
      temperature: 0.7,
      top_p: 1,
    })
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toMatchObject({
      model: 'llama-3.1-8b-instant',
      max_completion_tokens: 850,
      temperature: 0.7,
      top_p: 1,
    })
    expect(String(fetchMock.mock.calls[2]?.[1]?.body)).toContain('Quality correction')
  })

  it('uses a non-JSON Groq answer instead of showing the fallback message', async () => {
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
                  englishSearchQuery: 'planning scan radiation therapy',
                  category: 'planning',
                  treatmentAreas: ['general'],
                  treatmentAreaConfidence: 0,
                  keyTerms: ['planning', 'scan'],
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
                content: 'A planning scan helps the team prepare your treatment position and plan.',
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
                  answer:
                    'A planning scan helps your radiation team prepare your treatment position and plan before treatment starts. It gives the team the information they need to decide how you should lie, how your body should be supported, and how treatment should be delivered safely.\n\nWhat to expect:\n- The team may position you carefully on the scan table.\n- Immobilization devices may be used to help you stay in the same position.\n- The scan information is used for treatment planning before treatment begins.\n\nKey notes:\n- Try to stay still during the scan when asked.\n- Ask the team if you feel uncomfortable or need help with the position.',
                  suggestions: [{ id: 'explain-more', label: 'Explain more', action: 'explain_more' }],
                  sourceIds: ['planning-ct-scan'],
                  needsDoctorDiscussion: false,
                }),
              },
            },
          ],
        }),
      )

    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(
      chatRequest({ language: 'en', question: 'What happens during a planning scan?' }),
      { ...baseEnv, GROQ_API_KEY: 'test-key' },
    )
    const json = (await response.json()) as { answer: string; suggestions: Array<{ action: string }> }

    expect(response.status).toBe(200)
    expect(json.answer).toMatch(/What to expect/)
    expect(json.answer).toMatch(/position|planning/i)
    expect(json.answer).not.toMatch(/could not prepare/i)
    expect(json.suggestions.some((suggestion) => suggestion.action === 'explain_more')).toBe(true)
  })

  it('repairs thin answers with clean source-backed bullets instead of OCR fragments', async () => {
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
                  englishSearchQuery: 'head and back exercises after surgery rehabilitation',
                  category: 'rehabilitation',
                  treatmentAreas: ['head_neck'],
                  treatmentAreaConfidence: 0.95,
                  keyTerms: ['rehabilitation', 'exercise', 'head', 'back'],
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
                  answer: 'Rehabilitation exercises after surgery are important to maintain mobility.',
                  suggestions: [{ id: 'explain-more', label: 'Explain more', action: 'explain_more' }],
                  sourceIds: ['rehabilitation-reviewed-image-text-from-slide-8-oncology-movement-blueprint-10007-01'],
                  needsDoctorDiscussion: true,
                }),
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: '{bad json' } }] }))

    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(
      chatRequest({ language: 'en', question: 'show head and back exercises for after surgery rehabilitation' }),
      { ...baseEnv, GROQ_API_KEY: 'test-key' },
    )
    const json = (await response.json()) as { answer: string }

    expect(response.status).toBe(200)
    expect(json.answer).toMatch(/arm and chest stretching|chest and shoulder extension|shoulder stiffness/i)
    expect(json.answer).not.toMatch(/Shoulder Rolls Elbow Stretch|Make a fist and squeeze slowly,\.|LS N|then bend z|\{bad json/i)
    expect(json.answer).not.toMatch(/XEROM|mouth gargles|teaspoon|SWISH|SPIT|medications/i)
  })

  it('uses Workers AI and Vectorize before Groq when RAG bindings are configured', async () => {
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
                  treatmentAreaConfidence: 0.95,
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
                  sourceIds: ['planning-2-immobilization-radiation-planning-chatbot-005-01'],
                  needsDoctorDiscussion: false,
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
                  answer:
                    'A radiation mask helps keep your head and neck in the same position for planning and treatment. This is important because even small movements can affect how accurately the treatment area is lined up.\n\nWhat to expect:\n- The mask is used as an immobilization support.\n- It helps the team reproduce the same treatment position each day.\n- The planning information and setup marks guide the radiation team.\n\nKey notes:\n- Tell the team if the mask feels too tight or uncomfortable.\n- Follow your radiation team’s setup instructions because the exact process can vary.',
                  suggestions: [{ id: 'explain-more', label: 'Explain more', action: 'explain_more' }],
                  sourceIds: ['planning-2-immobilization-radiation-planning-chatbot-005-01'],
                  needsDoctorDiscussion: false,
                }),
              },
            },
          ],
        }),
      )
    const aiRunMock = vi.fn().mockResolvedValue({ data: [[0.1, 0.2, 0.3]] })
    const vectorQueryMock = vi.fn().mockResolvedValue({
      matches: [
        {
          id: 'short-vector-id',
          score: 0.96,
          metadata: {
            chunkId: 'planning-2-immobilization-radiation-planning-chatbot-005-01',
          },
        },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(
      chatRequest({ language: 'en', question: 'Why is a mask used during radiation?' }),
      {
        ...baseEnv,
        GROQ_API_KEY: 'test-key',
        AI: { run: aiRunMock },
        VECTORIZE_INDEX: { query: vectorQueryMock },
      },
    )
    const json = (await response.json()) as { sources: Array<{ id: string }> }

    expect(response.status).toBe(200)
    expect(aiRunMock).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', expect.objectContaining({ text: expect.any(Array) }))
    expect(vectorQueryMock).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(json.sources[0]?.id).toBe('planning-2-immobilization-radiation-planning-chatbot-005-01')
  })

  it('returns Telugu follow-up suggestions with Explain More in fallback mode', async () => {
    const response = await worker.fetch(
      chatRequest({ language: 'te', question: 'Radiation mask enduku vestaru?', action: 'normal', history: [] }),
      baseEnv,
    )
    const json = (await response.json()) as { suggestions: Array<{ action: string }> }

    expect(response.status).toBe(200)
    expect(json.suggestions.some((suggestion) => suggestion.action === 'explain_more')).toBe(true)
  })

  it.each([
    ['report interpretation', 'Can you interpret my PET CT report?'],
    ['dose advice', 'How many radiation sessions do I need?'],
    ['medication change', 'Should I stop my painkiller tablet during radiation?'],
    ['stopping treatment', 'Can I skip radiation treatment tomorrow?'],
    ['survival prediction', 'What is my chance of cure?'],
    ['outside scope', 'Who will win the cricket match?'],
  ])('blocks unsafe or out-of-scope questions before Groq: %s', async (_label, question) => {
    const fetchMock = vi.fn<typeof fetch>()
    const aiRunMock = vi.fn()
    const vectorQueryMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(chatRequest({ language: 'en', question }), {
      ...baseEnv,
      GROQ_API_KEY: 'test-key',
      AI: { run: aiRunMock },
      VECTORIZE_INDEX: { query: vectorQueryMock },
    })
    const json = (await response.json()) as {
      answer: string
      needsDoctorDiscussion: boolean
      sources: Array<{ id: string }>
      suggestions: Array<{ action: string }>
    }

    expect(response.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(aiRunMock).not.toHaveBeenCalled()
    expect(vectorQueryMock).not.toHaveBeenCalled()
    expect(json.needsDoctorDiscussion).toBe(true)
    expect(json.sources).toEqual([])
    expect(json.suggestions.some((suggestion) => suggestion.action === 'explain_more')).toBe(true)
    expect(json.answer).toMatch(/cannot|only answer|doctor|treating team/i)
  })
})
