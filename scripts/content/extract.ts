import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import mammoth from 'mammoth'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import { getSourcePriority } from './classify'
import { contentDir, extractedCorpusPath, sourceDir } from './paths'
import { expectedSourceDocuments } from './sourceDocuments'
import type { ExtractedCorpus, ExtractedDocument, ExtractedSection } from './schema'

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
})

function normalizeLine(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()
}

function normalizeBlock(lines: string[]): string {
  return lines.map((line) => normalizeLine(line)).filter(Boolean).join('\n')
}

function wordCount(value: string): number {
  const normalized = normalizeLine(value)

  return normalized.length === 0 ? 0 : normalized.split(' ').length
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function collectTextByKey(node: unknown, key: string, values: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const child of node) collectTextByKey(child, key, values)
    return values
  }

  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    for (const [nodeKey, child] of Object.entries(record)) {
      if (nodeKey === key) {
        if (Array.isArray(child)) {
          for (const childValue of child) {
            if (typeof childValue === 'string') values.push(childValue)
          }
        } else if (typeof child === 'string') {
          values.push(child)
        }
      } else {
        collectTextByKey(child, key, values)
      }
    }
  }

  return values
}

function makeSectionId(sourceFile: string, location: string, order: number): string {
  return `${slugify(sourceFile.replace(extname(sourceFile), ''))}-${slugify(location)}-${order.toString().padStart(3, '0')}`
}

const knownDocxHeadings = [
  /^abdomen\b/i,
  /^advantages\b/i,
  /^bone tumors\b/i,
  /^brain\b/i,
  /^breast radiation\b/i,
  /^cervix\b/i,
  /^common side effects\b/i,
  /^conclusion\b/i,
  /^contouring\b/i,
  /^during radiation\b/i,
  /^general care\b/i,
  /^head and neck\b/i,
  /^how .* works\b/i,
  /^in summary\b/i,
  /^liver cancer\b/i,
  /^no soap\b/i,
  /^patient notification\b/i,
  /^pelvis radiation\b/i,
  /^planning duration\b/i,
  /^prostate\b/i,
  /^radiation planning\b/i,
  /^radiation technique\b/i,
  /^radiation therapy workflow\b/i,
  /^radiation therapy techniques\b/i,
  /^rare complications\b/i,
  /^rectal & anal irritation/i,
  /^side effects\b/i,
  /^summary\b/i,
  /^thorax\b/i,
  /^treatment planning\b/i,
  /^types of radiation therapy\b/i,
  /^uses\b/i,
  /^\d+\.\s/,
]

function isLikelyDocxHeading(line: string): boolean {
  if (line.length > 120 || /[.!?]$/.test(line)) return false
  if (knownDocxHeadings.some((pattern) => pattern.test(line))) return true
  if (/^[A-Z][A-Za-z /&()+-]+(?:Radiation|Therapy|Tumors|Cancer|Effects|Instructions|Workflow|Course)\b/.test(line)) return true

  return false
}

function groupDocxParagraphs(paragraphs: string[], sourceFile: string): ExtractedSection[] {
  const sections: ExtractedSection[] = []
  let currentTitle = sourceFile.replace(extname(sourceFile), '')
  let buffer: string[] = []
  let order = 0
  const priority = getSourcePriority(sourceFile)

  function flush() {
    const text = normalizeBlock(buffer)
    if (text.length === 0) return

    order += 1
    const sourceLocation = `Section ${order}`
    sections.push({
      id: makeSectionId(sourceFile, sourceLocation, order),
      sourceFile,
      sourceType: 'docx',
      sourceLocation,
      sourcePriority: priority,
      title: currentTitle,
      text,
      order,
    })
    buffer = []
  }

  for (const paragraph of paragraphs) {
    const line = normalizeLine(paragraph)
    if (line.length === 0) continue

    const likelyHeading = isLikelyDocxHeading(line)
    const bufferWords = wordCount(buffer.join(' '))
    if (likelyHeading && buffer.length > 0) {
      flush()
      currentTitle = line
      continue
    }

    if (likelyHeading && buffer.length === 0) {
      currentTitle = line
      continue
    }

    buffer.push(line)
    if (bufferWords >= 300 || wordCount(buffer.join(' ')) >= 380) flush()
  }

  flush()

  return sections
}

async function extractDocx(sourceFile: string): Promise<ExtractedDocument> {
  const filePath = join(sourceDir, sourceFile)
  const result = await mammoth.extractRawText({ path: filePath })
  const paragraphs = result.value
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean)
  const sections = groupDocxParagraphs(paragraphs, sourceFile)

  return {
    sourceFile,
    sourceType: 'docx',
    sourcePriority: getSourcePriority(sourceFile),
    inspectedUnitCount: paragraphs.length,
    sectionCount: sections.length,
    wordCount: sections.reduce((sum, section) => sum + wordCount(section.text), 0),
    sections,
  }
}

function getSlideNumber(path: string): number {
  const match = /slide(\d+)\.xml$/.exec(path)
  return match ? Number(match[1]) : 0
}

async function extractPptx(sourceFile: string): Promise<ExtractedDocument> {
  const filePath = join(sourceDir, sourceFile)
  const zip = await JSZip.loadAsync(await readFile(filePath))
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => getSlideNumber(a) - getSlideNumber(b))

  const sections: ExtractedSection[] = []
  const priority = getSourcePriority(sourceFile)

  for (const slidePath of slidePaths) {
    const slideNumber = getSlideNumber(slidePath)
    const xml = await zip.files[slidePath].async('text')
    const parsed = parser.parse(xml) as unknown
    const textParts = collectTextByKey(parsed, 'a:t')
      .map((value) => normalizeLine(value))
      .filter(Boolean)
    const text = normalizeBlock(textParts)

    if (text.length === 0) continue

    const title = textParts[0] ?? `${basename(sourceFile)} slide ${slideNumber}`
    const sourceLocation = `Slide ${slideNumber}`
    sections.push({
      id: makeSectionId(sourceFile, sourceLocation, slideNumber),
      sourceFile,
      sourceType: 'pptx',
      sourceLocation,
      sourcePriority: priority,
      title,
      text,
      order: slideNumber,
    })
  }

  return {
    sourceFile,
    sourceType: 'pptx',
    sourcePriority: priority,
    inspectedUnitCount: slidePaths.length,
    sectionCount: sections.length,
    wordCount: sections.reduce((sum, section) => sum + wordCount(section.text), 0),
    sections,
  }
}

async function extractSourceDocument(sourceFile: string): Promise<ExtractedDocument> {
  const extension = extname(sourceFile).toLowerCase()

  if (extension === '.docx') return extractDocx(sourceFile)
  if (extension === '.pptx') return extractPptx(sourceFile)

  throw new Error(`Unsupported source document type: ${sourceFile}`)
}

async function extractCorpus() {
  await mkdir(contentDir, { recursive: true })

  const documents: ExtractedDocument[] = []
  for (const sourceFile of expectedSourceDocuments) {
    const document = await extractSourceDocument(sourceFile)
    documents.push(document)
    console.log(`Extracted ${document.sectionCount} sections / ${document.wordCount} words from ${sourceFile}`)
  }

  const corpus: ExtractedCorpus = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: sourceDir,
    documents,
  }

  await writeFile(extractedCorpusPath, `${JSON.stringify(corpus, null, 2)}\n`, 'utf8')
  console.log(`Wrote extracted corpus to ${extractedCorpusPath}`)
}

await extractCorpus()
