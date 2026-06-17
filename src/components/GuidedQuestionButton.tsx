interface GuidedQuestionButtonProps {
  disabled?: boolean
  label: string
  onClick: () => void
}

export function GuidedQuestionButton({ disabled = false, label, onClick }: GuidedQuestionButtonProps) {
  return (
    <section className="guided-action" aria-label="Next guide step">
      <button type="button" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </section>
  )
}
