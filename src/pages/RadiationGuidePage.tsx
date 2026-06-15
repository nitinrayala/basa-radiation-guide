import { useState } from 'react'
import { usePatientProfile } from '../hooks/usePatientProfile'
import { TRANSLATIONS } from '../translations'

export function RadiationGuidePage() {
  const { selectedLanguage } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]
  const [openSection, setOpenSection] = useState<number | null>(0)

  return (
    <section className="space-y-4">
      {t.guideSections.map((section, index) => (
        <article key={section} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setOpenSection((prev) => (prev === index ? null : index))}
            className="flex w-full items-center justify-between text-left text-xl font-semibold text-slate-900 dark:text-white"
          >
            <span>{section}</span>
            <span aria-hidden>{openSection === index ? '−' : '+'}</span>
          </button>
          {openSection === index && (
            <p className="mt-3 text-slate-700 dark:text-slate-300">
              This section explains {section.toLowerCase()} with patient-friendly guidance, expected steps, and practical self-care tips.
            </p>
          )}
        </article>
      ))}
    </section>
  )
}
