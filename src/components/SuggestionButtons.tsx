import type { Suggestion } from '../features/chat/chatTypes'

interface SuggestionButtonsProps {
  disabled?: boolean
  label: string
  suggestions: Suggestion[]
  onSelect: (suggestion: Suggestion) => void
}

export function SuggestionButtons({ disabled = false, label, suggestions, onSelect }: SuggestionButtonsProps) {
  return (
    <section className="suggestions" aria-label={label}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          className={suggestion.action === 'explain_more' ? 'suggestion-explain' : undefined}
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
        >
          {suggestion.label}
        </button>
      ))}
    </section>
  )
}
