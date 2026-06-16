import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname } from 'node:path'
import {
  classifyCategory,
  classifyTreatmentAreas,
  containsMedicationInstruction,
  requiresDoctorConfirmation,
} from './classify'
import { extractedCorpusPath, frontendKnowledgeChunksPath, knowledgeChunksPath } from './paths'
import type { ExtractedCorpus, ExtractedSection, KnowledgeChunk } from './schema'

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function wordCount(value: string): number {
  const normalized = normalizeWhitespace(value)

  return normalized.length === 0 ? 0 : normalized.split(' ').length
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)

  return slug.length > 0 ? slug : 'untitled'
}

function splitIntoParagraphChunks(text: string): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean)

  if (paragraphs.length === 0) return []

  const chunks: string[] = []
  let buffer: string[] = []

  function flush() {
    const chunk = normalizeWhitespace(buffer.join('\n'))
    if (chunk.length > 0) chunks.push(chunk)
    buffer = []
  }

  for (const paragraph of paragraphs) {
    const paragraphWords = wordCount(paragraph)
    const bufferWords = wordCount(buffer.join(' '))

    if (bufferWords > 0 && bufferWords + paragraphWords > 450) flush()

    if (paragraphWords > 520) {
      const words = paragraph.split(' ')
      for (let index = 0; index < words.length; index += 420) {
        chunks.push(words.slice(index, index + 420).join(' '))
      }
      continue
    }

    buffer.push(paragraph)
  }

  flush()

  return chunks
}

function buildChunkId(section: ExtractedSection, chunkIndex: number): string {
  const category = classifyCategory(section.sourceFile, `${section.title} ${section.text}`)
  const sourceName = section.sourceFile.replace(extname(section.sourceFile), '')

  return [
    slugify(category),
    slugify(section.title),
    slugify(sourceName),
    section.order.toString().padStart(3, '0'),
    (chunkIndex + 1).toString().padStart(2, '0'),
  ].join('-')
}

function chunkSection(section: ExtractedSection): KnowledgeChunk[] {
  const chunks = splitIntoParagraphChunks(section.text)

  return chunks.map((content, chunkIndex) => {
    const fullText = `${section.title}\n${content}`

    return {
      id: buildChunkId(section, chunkIndex),
      title: section.title,
      content,
      category: classifyCategory(section.sourceFile, fullText),
      treatmentAreas: classifyTreatmentAreas(section.sourceFile, fullText),
      sourceFile: section.sourceFile,
      sourceLocation: section.sourceLocation,
      sourcePriority: section.sourcePriority,
      containsMedicationInstruction: containsMedicationInstruction(fullText),
      requiresDoctorConfirmation: requiresDoctorConfirmation(fullText),
    }
  })
}

async function buildKnowledgeChunks() {
  const rawCorpus = await readFile(extractedCorpusPath, 'utf8')
  const corpus = JSON.parse(rawCorpus) as ExtractedCorpus
  const chunks = corpus.documents.flatMap((document) => document.sections.flatMap(chunkSection))

  await mkdir(dirname(knowledgeChunksPath), { recursive: true })
  await mkdir(dirname(frontendKnowledgeChunksPath), { recursive: true })
  await writeFile(knowledgeChunksPath, `${JSON.stringify(chunks, null, 2)}\n`, 'utf8')
  await writeFile(frontendKnowledgeChunksPath, `${JSON.stringify(chunks, null, 2)}\n`, 'utf8')

  console.log(`Built ${chunks.length} knowledge chunks from ${corpus.documents.length} source documents.`)
  console.log(`Wrote knowledge chunks to ${knowledgeChunksPath}`)
  console.log(`Wrote frontend copy to ${frontendKnowledgeChunksPath}`)
}

await buildKnowledgeChunks()
