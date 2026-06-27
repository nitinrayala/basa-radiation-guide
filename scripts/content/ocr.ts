import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join, normalize } from 'node:path'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import { contentDir, ocrReviewPath, sourceDir } from './paths'
import { expectedSourceDocuments } from './sourceDocuments'
import type { OcrReviewEntry } from './schema'

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
})

interface EmbeddedImage {
  sourceFile: string
  sourceLocation: string
  imageId: string
  imagePath: string
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function collectRelationshipIds(node: unknown, values: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const child of node) collectRelationshipIds(child, values)
    return values
  }

  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    const embed = record['@_r:embed']
    if (typeof embed === 'string') values.push(embed)

    for (const child of Object.values(record)) {
      if (child && typeof child === 'object') collectRelationshipIds(child, values)
    }
  }

  return values
}

function parseRelationships(xml: string): Map<string, string> {
  const parsed = parser.parse(xml) as { Relationships?: { Relationship?: unknown } }
  const relationships = asArray(parsed.Relationships?.Relationship)
  const images = new Map<string, string>()

  for (const relationship of relationships) {
    if (!relationship || typeof relationship !== 'object') continue
    const record = relationship as Record<string, unknown>
    const id = record['@_Id']
    const target = record['@_Target']
    const type = record['@_Type']
    if (typeof id !== 'string' || typeof target !== 'string') continue
    if (typeof type === 'string' && !type.includes('/image')) continue
    images.set(id, target)
  }

  return images
}

function resolvePackagePath(baseDirectory: string, target: string): string {
  return normalize(join(baseDirectory, target)).replace(/\\/g, '/')
}

function getSlideNumber(path: string): number {
  const match = /slide(\d+)\.xml$/.exec(path)
  return match ? Number(match[1]) : 0
}

async function extractPptxImages(sourceFile: string, zip: JSZip): Promise<EmbeddedImage[]> {
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => getSlideNumber(a) - getSlideNumber(b))
  const images: EmbeddedImage[] = []

  for (const slidePath of slidePaths) {
    const slideNumber = getSlideNumber(slidePath)
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels'
    const relsFile = zip.files[relsPath]
    if (!relsFile) continue

    const relationships = parseRelationships(await relsFile.async('text'))
    const slideXml = await zip.files[slidePath].async('text')
    const relationshipIds = Array.from(new Set(collectRelationshipIds(parser.parse(slideXml))))

    let imageNumber = 0
    for (const relationshipId of relationshipIds) {
      const target = relationships.get(relationshipId)
      if (!target) continue
      imageNumber += 1
      images.push({
        sourceFile,
        sourceLocation: `Slide ${slideNumber}`,
        imageId: `slide-${slideNumber}-image-${imageNumber}`,
        imagePath: resolvePackagePath('ppt/slides', target),
      })
    }
  }

  return images
}

async function extractDocxImages(sourceFile: string, zip: JSZip): Promise<EmbeddedImage[]> {
  const documentPath = 'word/document.xml'
  const relsPath = 'word/_rels/document.xml.rels'
  if (!zip.files[documentPath] || !zip.files[relsPath]) return []

  const relationships = parseRelationships(await zip.files[relsPath].async('text'))
  const documentXml = await zip.files[documentPath].async('text')
  const relationshipIds = Array.from(new Set(collectRelationshipIds(parser.parse(documentXml))))
  const images: EmbeddedImage[] = []

  let imageNumber = 0
  for (const relationshipId of relationshipIds) {
    const target = relationships.get(relationshipId)
    if (!target) continue
    imageNumber += 1
    images.push({
      sourceFile,
      sourceLocation: `Document image ${imageNumber}`,
      imageId: `document-image-${imageNumber}`,
      imagePath: resolvePackagePath('word', target),
    })
  }

  return images
}

function reviewKey(entry: Pick<OcrReviewEntry, 'sourceFile' | 'sourceLocation' | 'imageId'>): string {
  return `${entry.sourceFile}|${entry.sourceLocation}|${entry.imageId}`
}

async function readExistingReview(): Promise<Map<string, OcrReviewEntry>> {
  try {
    const entries = JSON.parse(await readFile(ocrReviewPath, 'utf8')) as OcrReviewEntry[]
    return new Map(entries.map((entry) => [reviewKey(entry), entry]))
  } catch {
    return new Map()
  }
}

async function extractImages(sourceFile: string): Promise<EmbeddedImage[]> {
  const zip = await JSZip.loadAsync(await readFile(join(sourceDir, sourceFile)))
  const extension = extname(sourceFile).toLowerCase()

  if (extension === '.pptx') return extractPptxImages(sourceFile, zip)
  if (extension === '.docx') return extractDocxImages(sourceFile, zip)

  return []
}

async function buildOcrReview() {
  await mkdir(contentDir, { recursive: true })
  const existingReview = await readExistingReview()
  const reviewEntries: OcrReviewEntry[] = []

  for (const sourceFile of expectedSourceDocuments) {
    const images = await extractImages(sourceFile)
    for (const image of images) {
      const existing = existingReview.get(reviewKey(image))
      reviewEntries.push({
        sourceFile: image.sourceFile,
        sourceLocation: image.sourceLocation,
        imageId: image.imageId,
        imagePath: image.imagePath,
        rawOcrText: existing?.rawOcrText ?? '',
        proposedText: existing?.proposedText ?? '',
        status: existing?.status ?? 'pending',
        ...(existing?.notes ? { notes: existing.notes } : {}),
      })
    }

    console.log(`Found ${images.length} embedded images in ${basename(sourceFile)}`)
  }

  await writeFile(ocrReviewPath, `${JSON.stringify(reviewEntries, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${reviewEntries.length} OCR review candidates to ${ocrReviewPath}`)
}

await buildOcrReview()
