interface TypingIndicatorProps {
  label: string
}

export function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div className="message message-assistant typing-indicator" role="status" aria-label={label}>
      <span />
      <span />
      <span />
    </div>
  )
}
