export function shouldAvoidCache(question: string): boolean {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(question) || /\b\d{8,}\b/.test(question) || /\b(?:mr|uhid|hospital)\s*no/i.test(question)
}
