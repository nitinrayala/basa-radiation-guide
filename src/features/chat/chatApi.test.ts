import { sendChatMessageToApi } from './chatApi'

describe('sendChatMessageToApi', () => {
  it('posts Telugu and mixed-language questions to the configured chat API', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          answer: 'A document-grounded answer.',
          suggestions: [{ id: 'explain-more', label: 'మరింత వివరించండి', action: 'explain_more' }],
          sources: [{ chunkId: 'doc-1__0001', sourceId: 'doc-1', title: 'Test source', priority: 'high' }],
          needsDoctorDiscussion: false,
        }),
    })

    const response = await sendChatMessageToApi(
      {
        language: 'te',
        question: 'CT simulation ayyaka treatment eppudu start avuthundi?',
        action: 'normal',
        history: [{ role: 'user', content: 'Radiation mask enduku vestaru?' }],
      },
      'https://example.test/api/chat',
      fetcher,
    )

    expect(fetcher).toHaveBeenCalledWith('https://example.test/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        language: 'te',
        question: 'CT simulation ayyaka treatment eppudu start avuthundi?',
        action: 'normal',
        history: [{ role: 'user', content: 'Radiation mask enduku vestaru?' }],
      }),
    })
    expect(response.answer).toBe('A document-grounded answer.')
    expect(response.suggestions).toEqual([{ id: 'explain-more', label: 'మరింత వివరించండి', action: 'explain_more' }])
  })

  it('throws when the chat API returns an error response', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Groq unavailable' }),
    })

    await expect(
      sendChatMessageToApi(
        {
          language: 'en',
          question: 'Why is a mask used?',
          action: 'normal',
          history: [],
        },
        'https://example.test/api/chat',
        fetcher,
      ),
    ).rejects.toThrow('Chat API request failed with status 500.')
  })

  it('filters malformed response suggestions and sources', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          answer: 'A filtered answer.',
          suggestions: [
            { id: 'valid', label: 'Explain more', action: 'explain_more' },
            { id: 'bad-action', label: 'Bad action', action: 'open_modal' },
            { label: 'Missing id', action: 'question' },
          ],
          sources: [
            { id: 'source-1', label: 'Source 1' },
            { sourceId: 'source-2', title: 'Wrong shape' },
          ],
          needsDoctorDiscussion: true,
        }),
    })

    const response = await sendChatMessageToApi(
      {
        language: 'en',
        question: 'What happens during planning?',
        action: 'normal',
        history: [],
      },
      'https://example.test/api/chat',
      fetcher,
    )

    expect(response).toEqual({
      answer: 'A filtered answer.',
      suggestions: [{ id: 'valid', label: 'Explain more', action: 'explain_more' }],
      sources: [{ id: 'source-1', label: 'Source 1' }],
      needsDoctorDiscussion: true,
    })
  })

  it('throws when the chat API response is incomplete', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: [] }),
    })

    await expect(
      sendChatMessageToApi(
        {
          language: 'en',
          question: 'What is radiation therapy?',
          action: 'normal',
          history: [],
        },
        'https://example.test/api/chat',
        fetcher,
      ),
    ).rejects.toThrow('The chat API returned an incomplete response.')
  })
})
