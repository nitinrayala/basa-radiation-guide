import { useMemo, useState } from 'react'
import { usePatientProfile } from '../hooks/usePatientProfile'
import { TRANSLATIONS } from '../translations'

const FAQS = [
  { category: 'Before Treatment', question: 'How should I prepare for simulation?', answer: 'Wear comfortable clothes and carry your treatment records.' },
  { category: 'During Treatment', question: 'Can I continue daily routines?', answer: 'Most patients can, with adjustments based on fatigue.' },
  { category: 'Side Effects', question: 'What side effects are common?', answer: 'Skin irritation, tiredness, and local discomfort can occur.' },
  { category: 'After Treatment', question: 'When are follow-ups scheduled?', answer: 'Your team will schedule post-treatment reviews based on your plan.' },
  { category: 'Treatment Site Specific Questions', question: 'Are there site-specific care tips?', answer: 'Yes, your care team provides guidance for your treatment area.' },
]

export function FAQPage() {
  const { selectedLanguage } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => FAQS.filter((faq) => `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
    <section className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.searchFaq}
        className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base dark:border-slate-600 dark:bg-slate-800"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {t.faqCategories.map((category) => (
          <div key={category} className="rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-800 dark:bg-slate-800 dark:text-blue-300">
            {category}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((faq) => (
          <article key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{faq.category}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{faq.question}</h3>
            <p className="mt-2 text-slate-700 dark:text-slate-300">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
