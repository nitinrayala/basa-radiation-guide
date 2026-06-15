const sections = [
  'Hospital Information',
  'Radiation Oncology Department',
  'Appointment Scheduling',
  'Emergency Contact Information',
]

export function ContactPage() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <article key={section} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{section}</h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">Placeholder details for {section.toLowerCase()} can be managed by hospital administrators.</p>
        </article>
      ))}
    </section>
  )
}
