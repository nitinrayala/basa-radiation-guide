import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname } from 'node:path'
import {
  classifyCategory,
  classifyTreatmentAreas,
  containsMedicationInstruction,
  getSourcePriority,
  requiresDoctorConfirmation,
} from './classify'
import { extractedCorpusPath, frontendKnowledgeChunksPath, knowledgeChunksPath, ocrReviewPath } from './paths'
import type { ExtractedCorpus, ExtractedSection, KnowledgeChunk, OcrReviewEntry } from './schema'

function normalizeLine(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

function normalizeBlock(lines: string[]): string {
  return lines.map((line) => normalizeLine(line)).filter(Boolean).join('\n')
}

function wordCount(value: string): number {
  const normalized = normalizeLine(value)

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

function containsTelugu(value: string): boolean {
  return /[\u0c00-\u0c7f]/u.test(value)
}

function containsLatin(value: string): boolean {
  return /[a-z]/i.test(value)
}

function stripTeluguFromMixedLine(line: string): string {
  if (!containsTelugu(line)) return line
  if (!containsLatin(line)) return ''

  return line
    .replace(/[\u0c00-\u0c7f\u200c\u200d\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isNoiseLine(line: string): boolean {
  return (
    /^patient name:?$/i.test(line) ||
    /^mr number:?$/i.test(line) ||
    /^any queries call\b/i.test(line) ||
    /^dr\./i.test(line) ||
    /^sr\.?\s*consultant\b/i.test(line) ||
    /^dept\.?\s+of\b/i.test(line) ||
    /^image:/i.test(line) ||
    /^narration/i.test(line) ||
    /^optional voiceover/i.test(line) ||
    /^text (?:on screen|overlay):/i.test(line) ||
    /^scene\s+\d+/i.test(line) ||
    /^it seems you(?:'|’)re outlining\b/i.test(line) ||
    /^here(?:'|’)s a more detailed breakdown\b/i.test(line)
  )
}

function cleanLine(line: string): string {
  const withoutEmoji = line
    .replace(/[🎬✅]/gu, '')
    .replace(/[0-9]\ufe0f?\u20e3/gu, '')
    .replace(/\ufe0f/gu, '')
  const withoutTeluguDuplicates = stripTeluguFromMixedLine(withoutEmoji)
  const normalized = normalizeLine(withoutTeluguDuplicates)
    .replace(/\bCounselled and discussed regarding outcomes, precautions and side effects with EBRT\.?\s*/gi, '')
    .replace(/\bPlanned for (?:local|Radical\/Adjuvant) radiotherapy\.?\s*/gi, '')
    .replace(/\bExplained about side effects in detail including\s+(.+?)\s+with Local radiotherapy\.?/i, 'Possible side effects mentioned: $1.')
    .replace(/\bAgreed to proceed with treatment\.?/gi, '')
    .replace(/\bDiscussed role of SRS vs WBRT.+$/i, '')
    .replace(/\bDecided to go ahead with SRS.+$/i, '')
    .replace(/^NOTE-$/i, '')
    .replace(/^Kindly co-operative and thank you very much for understanding\.?$/i, '')
    .replace(/^COUNSELLED REGARDING NECK\/MOUTH\/SHOULDER EXERCISES AND REHABILIATION\.?/i, 'Neck, mouth and shoulder exercises/rehabilitation were discussed.')
    .replace(/^\.\s*/, '')
    .replace(/\.([A-Z])/g, '. $1')
    .trim()

  return isNoiseLine(normalized) ? '' : normalized
}

function cleanSectionText(text: string): string {
  const lines = text
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean)

  return normalizeBlock(lines)
}

function splitIntoParagraphChunks(text: string): string[] {
  const paragraphs = cleanSectionText(text)
    .split(/\n+/)
    .map((paragraph) => normalizeLine(paragraph))
    .filter(Boolean)

  if (paragraphs.length === 0) return []

  const chunks: string[] = []
  let buffer: string[] = []

  function flush() {
    const chunk = normalizeBlock(buffer)
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
    const title = cleanLine(section.title) || section.title
    const fullText = `${title}\n${content}`
    const treatmentAreas = classifyTreatmentAreas(section.sourceFile, fullText)

    return {
      id: buildChunkId(section, chunkIndex),
      title,
      content,
      category: classifyCategory(section.sourceFile, fullText),
      treatmentAreas,
      specificity: treatmentAreas.length === 1 && treatmentAreas[0] === 'general' ? 'general' : 'treatment_specific',
      sourceFile: section.sourceFile,
      sourceLocation: section.sourceLocation,
      sourcePriority: section.sourcePriority,
      containsMedicationInstruction: containsMedicationInstruction(fullText),
      requiresDoctorConfirmation: requiresDoctorConfirmation(fullText),
      contentSource: section.contentSource ?? 'document_text',
      ...(section.reviewStatus ? { reviewStatus: section.reviewStatus } : {}),
    }
  })
}

async function readApprovedOcrSections(): Promise<ExtractedSection[]> {
  let entries: OcrReviewEntry[]
  try {
    entries = JSON.parse(await readFile(ocrReviewPath, 'utf8')) as OcrReviewEntry[]
  } catch {
    return []
  }

  return entries.flatMap((entry, index): ExtractedSection[] => {
    if (entry.status !== 'approved') return []
    const text = normalizeBlock([entry.proposedText || entry.rawOcrText])
    if (!text) return []

    return [
      {
        id: `ocr-${slugify(entry.sourceFile.replace(extname(entry.sourceFile), ''))}-${slugify(entry.sourceLocation)}-${slugify(entry.imageId)}`,
        sourceFile: entry.sourceFile,
        sourceType: extname(entry.sourceFile).toLowerCase() === '.pptx' ? 'pptx' : 'docx',
        sourceLocation: `${entry.sourceLocation} ${entry.imageId}`,
        sourcePriority: getSourcePriority(entry.sourceFile),
        title: `Reviewed image text from ${entry.sourceLocation}`,
        text,
        order: 10_000 + index,
        contentSource: 'ocr_reviewed',
        reviewStatus: 'approved',
      },
    ]
  })
}

async function buildKnowledgeChunks() {
  const rawCorpus = await readFile(extractedCorpusPath, 'utf8')
  const corpus = JSON.parse(rawCorpus) as ExtractedCorpus
  const approvedOcrSections = await readApprovedOcrSections()
  const chunks = [
    ...corpus.documents.flatMap((document) => document.sections.flatMap(chunkSection)),
    ...approvedOcrSections.flatMap(chunkSection),
  ]

  await mkdir(dirname(knowledgeChunksPath), { recursive: true })
  await mkdir(dirname(frontendKnowledgeChunksPath), { recursive: true })
  await writeFile(knowledgeChunksPath, `${JSON.stringify(chunks, null, 2)}\n`, 'utf8')
  await writeFile(frontendKnowledgeChunksPath, `${JSON.stringify(chunks, null, 2)}\n`, 'utf8')

  console.log(`Built ${chunks.length} knowledge chunks from ${corpus.documents.length} source documents and ${approvedOcrSections.length} approved OCR sections.`)
  console.log(`Wrote knowledge chunks to ${knowledgeChunksPath}`)
  console.log(`Wrote frontend copy to ${frontendKnowledgeChunksPath}`)
}

await buildKnowledgeChunks()
