import type { ChatMessage as ChatMessageType } from '../features/chat/chatTypes'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const paragraphs = message.content.split('\n').filter((line) => line.trim().length > 0)

  return (
    <article className={`message message-${message.role}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </article>
  )
}
