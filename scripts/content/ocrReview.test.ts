import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { KnowledgeChunk, OcrReviewEntry } from './schema'

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), path), 'utf8')) as T
}

describe('OCR review artifact', () => {
  it('generates pending image candidates without adding unreviewed text to chunks', () => {
    const review = readJson<OcrReviewEntry[]>('data/content/ocr-review.json')
    const chunks = readJson<KnowledgeChunk[]>('data/content/knowledge-chunks.json')

    expect(review.length).toBeGreaterThan(0)
    expect(review.some((entry) => entry.sourceFile.endsWith('.pptx'))).toBe(true)
    expect(review.every((entry) => entry.status === 'pending' || entry.status === 'approved' || entry.status === 'rejected')).toBe(true)
    expect(chunks.every((chunk) => chunk.contentSource === 'document_text' || chunk.reviewStatus === 'approved')).toBe(true)
    expect(chunks.filter((chunk) => chunk.contentSource === 'ocr_reviewed').every((chunk) => chunk.reviewStatus === 'approved')).toBe(true)
  })

  it('adds content source metadata to every knowledge chunk', () => {
    const chunks = readJson<KnowledgeChunk[]>('data/content/knowledge-chunks.json')

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks.every((chunk) => chunk.contentSource === 'document_text' || chunk.contentSource === 'ocr_reviewed')).toBe(true)
  })
})
