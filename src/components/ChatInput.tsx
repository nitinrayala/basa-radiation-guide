import { useState } from 'react'

interface ChatInputProps {
  askLabel: string
  disabled?: boolean
  placeholder: string
  sendLabel: string
  sendingLabel: string
  onSubmit: (question: string) => void
}

export function ChatInput({ askLabel, disabled = false, placeholder, sendLabel, sendingLabel, onSubmit }: ChatInputProps) {
  const [value, setValue] = useState('')
  const trimmedValue = value.trim()

  return (
    <form
      className="chat-input"
      aria-label={askLabel}
      onSubmit={(event) => {
        event.preventDefault()

        if (trimmedValue.length === 0 || disabled) {
          return
        }

        onSubmit(trimmedValue)
        setValue('')
      }}
    >
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        maxLength={1000}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit" disabled={disabled || trimmedValue.length === 0}>
        {disabled ? sendingLabel : sendLabel}
      </button>
    </form>
  )
}
