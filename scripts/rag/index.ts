import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { knowledgeChunksPath } from '../content/paths'
import type { KnowledgeChunk } from '../content/schema'

interface EmbeddingResponse {
  result?: {
    data?: number[][]
  }
  success?: boolean
  errors?: Array<{ message?: string }>
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const apiToken = process.env.CLOUDFLARE_API_TOKEN
const vectorizeIndex = process.env.VECTORIZE_INDEX_NAME || 'basa-radiation-guide'
const embeddingModel = process.env.EMBEDDING_MODEL || '@cf/baai/bge-base-en-v1.5'
const batchSize = Number.parseInt(process.env.RAG_INDEX_BATCH_SIZE || '25', 10)

function requireConfig(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required. Set it in the shell before running npm run rag:index.`)
  }

  return value
}

function chunkText(chunk: KnowledgeChunk): string {
  return [
    chunk.title,
    chunk.content,
    chunk.category,
    chunk.treatmentAreas.join(' '),
  ].join('\n')
}

function vectorIdForChunk(chunkId: string): string {
  return createHash('sha256').update(chunkId).digest('hex').slice(0, 48)
}

async function cloudflareFetch(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${requireConfig(apiToken, 'CLOUDFLARE_API_TOKEN')}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Cloudflare API request failed (${response.status}) for ${path}: ${await response.text()}`)
  }

  return response
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await cloudflareFetch(
    `/accounts/${requireConfig(accountId, 'CLOUDFLARE_ACCOUNT_ID')}/ai/run/${embeddingModel}`,
    {
      method: 'POST',
      body: JSON.stringify({ text: texts }),
    },
  )
  const json = (await response.json()) as EmbeddingResponse
  const vectors = json.result?.data

  if (!Array.isArray(vectors) || vectors.length !== texts.length) {
    throw new Error(`Embedding response did not include ${texts.length} vectors.`)
  }

  return vectors
}

async function upsertVectors(chunks: KnowledgeChunk[], vectors: number[][]): Promise<void> {
  const payload = chunks.map((chunk, index) => ({
    id: vectorIdForChunk(chunk.id),
    values: vectors[index],
    metadata: {
      chunkId: chunk.id,
      category: chunk.category,
      treatmentAreas: chunk.treatmentAreas,
      sourceFile: chunk.sourceFile,
      sourceLocation: chunk.sourceLocation ?? '',
      sourcePriority: chunk.sourcePriority,
      specificity: chunk.specificity,
      containsMedicationInstruction: chunk.containsMedicationInstruction,
      requiresDoctorConfirmation: chunk.requiresDoctorConfirmation,
      contentSource: chunk.contentSource,
    },
  }))

  await cloudflareFetch(
    `/accounts/${requireConfig(accountId, 'CLOUDFLARE_ACCOUNT_ID')}/vectorize/v2/indexes/${encodeURIComponent(vectorizeIndex)}/upsert`,
    {
      method: 'POST',
      body: JSON.stringify({ vectors: payload }),
    },
  )
}

async function indexKnowledgeChunks() {
  const chunks = JSON.parse(await readFile(knowledgeChunksPath, 'utf8')) as KnowledgeChunk[]

  for (let index = 0; index < chunks.length; index += batchSize) {
    const batch = chunks.slice(index, index + batchSize)
    const vectors = await embedTexts(batch.map(chunkText))
    await upsertVectors(batch, vectors)
    console.log(`Indexed ${Math.min(index + batch.length, chunks.length)} / ${chunks.length} chunks into ${vectorizeIndex}`)
  }
}

await indexKnowledgeChunks()
