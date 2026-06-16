import { access, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { categories, treatmentAreas, type ExtractedCorpus, type KnowledgeChunk } from './schema'
import { expectedSourceDocuments } from './sourceDocuments'
import { extractedCorpusPath, knowledgeChunksPath, sourceDir } from './paths'
import { getSourcePriority } from './classify'

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const categorySet = new Set<string>(categories)
const treatmentAreaSet = new Set<string>(treatmentAreas)
const expectedSourceSet = new Set<string>(expectedSourceDocuments)
const badEncodingPattern = /[\u00c3\u00c2\ufffd]|\u00e0\u00b0|\u00e0\u00b1/u
const decorativeArtifactPattern = /[\u{1f3ac}\u2705]|\bText overlay:|\bText on screen:|\bOptional Voiceover:|\bImage:|\bScene \d+/iu
const contactArtifactPattern = /\bAny queries call\b|\bDr\.\s|Sr\. Consultant|Dept\. of Radiation Oncology|Patient Name:|MR Number:/i
const teluguPattern = /[\u0c00-\u0c7f]/u

async function validateSourceDocuments() {
  await access(sourceDir)

  const missing: string[] = []
  const empty: string[] = []

  for (const filename of expectedSourceDocuments) {
    const filePath = join(sourceDir, filename)

    try {
      const fileStat = await stat(filePath)
      if (!fileStat.isFile() || fileStat.size === 0) {
        empty.push(filename)
      }
    } catch {
      missing.push(filename)
    }
  }

  if (missing.length > 0 || empty.length > 0) {
    throw new Error(`Source document validation failed. Missing: ${missing.join(', ') || 'none'}. Empty: ${empty.join(', ') || 'none'}.`)
  }
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

function validateExtractedCorpus(corpus: ExtractedCorpus) {
  const extractedSources = new Set(corpus.documents.map((document) => document.sourceFile))
  const missingExtractedSources = expectedSourceDocuments.filter((sourceFile) => !extractedSources.has(sourceFile))
  const unexpectedSources = corpus.documents.map((document) => document.sourceFile).filter((sourceFile) => !expectedSourceSet.has(sourceFile))

  if (missingExtractedSources.length > 0) {
    throw new Error(`Extracted corpus is missing sources: ${missingExtractedSources.join(', ')}`)
  }

  if (unexpectedSources.length > 0) {
    throw new Error(`Extracted corpus contains unexpected sources: ${unexpectedSources.join(', ')}`)
  }

  for (const document of corpus.documents) {
    if (document.sourcePriority !== getSourcePriority(document.sourceFile)) {
      throw new Error(`Unexpected source priority for ${document.sourceFile}`)
    }

    if (document.sectionCount !== document.sections.length) {
      throw new Error(`Section count mismatch for ${document.sourceFile}`)
    }

    if (document.inspectedUnitCount <= 0) {
      throw new Error(`No document units were inspected in ${document.sourceFile}`)
    }

    if (document.sections.length === 0 && document.sourceType !== 'pptx') {
      throw new Error(`No extractable text was found in ${document.sourceFile}`)
    }

    for (const section of document.sections) {
      if (!section.id || !section.title || !section.text || !section.sourceLocation) {
        throw new Error(`Invalid extracted section metadata in ${document.sourceFile}`)
      }
    }
  }
}

function validateKnowledgeChunks(chunks: KnowledgeChunk[], corpus: ExtractedCorpus) {
  if (chunks.length === 0) {
    throw new Error('Knowledge chunks are empty.')
  }

  const ids = new Set<string>()
  const chunkSources = new Set<string>()

  for (const chunk of chunks) {
    if (!idPattern.test(chunk.id)) {
      throw new Error(`Invalid chunk id: ${chunk.id}`)
    }

    if (ids.has(chunk.id)) {
      throw new Error(`Duplicate chunk id: ${chunk.id}`)
    }
    ids.add(chunk.id)

    if (!chunk.title.trim() || !chunk.content.trim()) {
      throw new Error(`Chunk ${chunk.id} is missing title or content.`)
    }

    const searchableText = `${chunk.title}\n${chunk.content}`
    if (badEncodingPattern.test(searchableText)) {
      throw new Error(`Chunk ${chunk.id} contains corrupted text encoding artifacts.`)
    }

    if (decorativeArtifactPattern.test(searchableText)) {
      throw new Error(`Chunk ${chunk.id} contains decorative storyboard artifacts.`)
    }

    if (contactArtifactPattern.test(searchableText)) {
      throw new Error(`Chunk ${chunk.id} contains contact or patient-identifying template text.`)
    }

    if (teluguPattern.test(searchableText)) {
      throw new Error(`Chunk ${chunk.id} contains mixed Telugu text. Telugu answers should be generated from clean source context.`)
    }

    if (!expectedSourceSet.has(chunk.sourceFile)) {
      throw new Error(`Chunk ${chunk.id} has unexpected source file: ${chunk.sourceFile}`)
    }
    chunkSources.add(chunk.sourceFile)

    if (chunk.sourcePriority !== getSourcePriority(chunk.sourceFile)) {
      throw new Error(`Chunk ${chunk.id} has invalid source priority.`)
    }

    if (!categorySet.has(chunk.category)) {
      throw new Error(`Chunk ${chunk.id} has invalid category: ${chunk.category}`)
    }

    if (chunk.treatmentAreas.length === 0) {
      throw new Error(`Chunk ${chunk.id} has no treatment areas.`)
    }

    for (const area of chunk.treatmentAreas) {
      if (!treatmentAreaSet.has(area)) {
        throw new Error(`Chunk ${chunk.id} has invalid treatment area: ${area}`)
      }
    }

    if (typeof chunk.containsMedicationInstruction !== 'boolean' || typeof chunk.requiresDoctorConfirmation !== 'boolean') {
      throw new Error(`Chunk ${chunk.id} has invalid safety flags.`)
    }
  }

  const extractableSourceFiles = corpus.documents
    .filter((document) => document.sections.length > 0)
    .map((document) => document.sourceFile)
  const missingChunkSources = extractableSourceFiles.filter((sourceFile) => !chunkSources.has(sourceFile))
  if (missingChunkSources.length > 0) {
    throw new Error(`No chunks were generated for extractable sources: ${missingChunkSources.join(', ')}`)
  }

  const imageOnlySources = corpus.documents
    .filter((document) => document.sections.length === 0)
    .map((document) => document.sourceFile)
  if (imageOnlySources.length > 0) {
    console.warn(`No extractable slide text found in: ${imageOnlySources.join(', ')}`)
  }
}

async function validateContent() {
  await validateSourceDocuments()
  const corpus = await readJson<ExtractedCorpus>(extractedCorpusPath)
  validateExtractedCorpus(corpus)
  const chunks = await readJson<KnowledgeChunk[]>(knowledgeChunksPath)
  validateKnowledgeChunks(chunks, corpus)

  console.log(`Validated ${expectedSourceDocuments.length} source documents.`)
  console.log(`Validated ${corpus.documents.length} extracted documents and ${chunks.length} knowledge chunks.`)
}

await validateContent()
