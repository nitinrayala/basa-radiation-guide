import { en } from './en'
import { te } from './te'
import type { Language } from '../features/chat/chatTypes'

export const locales: Record<Language, typeof en> = {
  en,
  te,
}

