import { NavLink } from 'react-router-dom'
import { usePatientProfile } from '../hooks/usePatientProfile'
import { TRANSLATIONS } from '../translations'

const links = [
  { to: '/', key: 'home' as const },
  { to: '/chat', key: 'chatAssistant' as const },
  { to: '/guide', key: 'guide' as const },
  { to: '/faq', key: 'faq' as const },
  { to: '/contact', key: 'contactHospital' as const },
  { to: '/settings', key: 'settings' as const },
]

function navClass(isActive: boolean) {
  return `rounded-full px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-700'
  }`
}

export function Navigation() {
  const { selectedLanguage } = usePatientProfile()
  const t = TRANSLATIONS[selectedLanguage]

  return (
    <>
      <nav className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:block dark:border-slate-700 dark:bg-slate-900/90">
        <ul className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink className={({ isActive }) => navClass(isActive)} to={link.to}>
                {t[link.key]}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <nav className="fixed bottom-0 z-30 w-full border-t border-slate-200 bg-white p-2 md:hidden dark:border-slate-700 dark:bg-slate-900">
        <ul className="grid grid-cols-3 gap-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink className={({ isActive }) => `block rounded-lg px-2 py-2 text-center text-xs ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-200'}`} to={link.to}>
                {t[link.key]}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
