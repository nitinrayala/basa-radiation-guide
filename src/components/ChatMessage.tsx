import type { ReactNode } from 'react'
import type { ChatMessage as ChatMessageType } from '../features/chat/chatTypes'

interface ChatMessageProps {
  message: ChatMessageType
}

type MessageBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bulletList'; items: string[] }
  | { type: 'numberedList'; items: string[] }

function normalizeLine(line: string): string {
  return line
    .trim()
    .replace(/^\*\s+\*\*(.+?):\*\*\s*/, '**$1:** ')
    .replace(/^\*\s+/, '- ')
    .replace(/^\*\*(.+?):\*\*\s*/, '**$1:** ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseMessageBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = []
  let activeList: { type: 'bulletList' | 'numberedList'; items: string[] } | null = null

  const flushList = () => {
    if (!activeList) return
    blocks.push(activeList)
    activeList = null
  }

  for (const rawLine of content.split('\n')) {
    const line = normalizeLine(rawLine)
    if (!line) {
      flushList()
      continue
    }

    const bulletMatch = /^[-•]\s+(.+)$/.exec(line)
    if (bulletMatch) {
      if (activeList?.type !== 'bulletList') {
        flushList()
        activeList = { type: 'bulletList', items: [] }
      }
      activeList.items.push(bulletMatch[1])
      continue
    }

    const numberedMatch = /^\d+[.)]\s+(.+)$/.exec(line)
    if (numberedMatch) {
      if (activeList?.type !== 'numberedList') {
        flushList()
        activeList = { type: 'numberedList', items: [] }
      }
      activeList.items.push(numberedMatch[1])
      continue
    }

    flushList()
    blocks.push({ type: 'paragraph', text: line })
  }

  flushList()

  return blocks
}

function renderTextWithLeadIn(text: string): ReactNode {
  const leadInMatch = /^([^:]{2,64}):\s+(.+)$/.exec(text)
  if (!leadInMatch) return text

  return (
    <>
      <strong>{leadInMatch[1]}:</strong> {leadInMatch[2]}
    </>
  )
}

export function ChatMessage({ message }: ChatMessageProps) {
  const blocks = parseMessageBlocks(message.content)

  return (
    <article className={`message message-${message.role}`}>
      {blocks.map((block, index) => {
        if (block.type === 'bulletList') {
          return (
            <ul key={`bullet-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{renderTextWithLeadIn(item)}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'numberedList') {
          return (
            <ol key={`numbered-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{renderTextWithLeadIn(item)}</li>
              ))}
            </ol>
          )
        }

        return <p key={`${block.text}-${index}`}>{renderTextWithLeadIn(block.text)}</p>
      })}
    </article>
  )
}
