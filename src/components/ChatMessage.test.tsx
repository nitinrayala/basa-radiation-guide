import { render, screen } from '@testing-library/react'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '../features/chat/chatTypes'

describe('ChatMessage', () => {
  it('cleans markdown-like model output into readable lead-in paragraphs', () => {
    const message: ChatMessageType = {
      id: 'assistant-1',
      role: 'assistant',
      content:
        'What to expect:\n\n* **During treatment:** The radiation is delivered by a machine.\n* **Potential side effects:** Side effects can develop during or after treatment.',
      sequence: 1,
      language: 'en',
      kind: 'search',
    }

    render(<ChatMessage message={message} />)

    expect(screen.getByText('What to expect:')).toBeInTheDocument()
    expect(screen.getByText('During treatment:')).toBeInTheDocument()
    expect(screen.getByText(/The radiation is delivered by a machine/)).toBeInTheDocument()
    expect(screen.getByText('Potential side effects:')).toBeInTheDocument()
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
  })
})
