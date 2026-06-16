import { romanizedTeluguAliases, teluguScriptAliases, termAliases } from './aliases'

const stopWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'can',
  'do',
  'does',
  'during',
  'for',
  'from',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'the',
  'to',
  'what',
  'when',
  'why',
  'will',
  'with',
])

export function normalizeText(value: string): string {
  let normalized = value.normalize('NFKC').toLowerCase()

  for (const [pattern, replacement] of teluguScriptAliases) {
    normalized = normalized.replace(pattern, replacement)
  }

  return normalized
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularize(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2)
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1)

  return token
}

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .map(singularize)
    .filter((token) => token.length > 1 && !stopWords.has(token))
}

export function expandQueryTokens(tokens: string[]): string[] {
  const expanded = new Set<string>()

  for (const token of tokens) {
    expanded.add(token)

    for (const alias of romanizedTeluguAliases[token] ?? []) expanded.add(alias)
    for (const alias of termAliases[token] ?? []) expanded.add(alias)

    for (const [canonical, aliases] of Object.entries(termAliases)) {
      if (aliases.includes(token)) expanded.add(canonical)
    }
  }

  return Array.from(expanded).map(singularize)
}

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0
  if (left.length === 0) return right.length
  if (right.length === 0) return left.length

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = Array.from({ length: right.length + 1 }, () => 0)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      )
    }

    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
}
