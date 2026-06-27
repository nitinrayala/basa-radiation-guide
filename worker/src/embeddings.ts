import type { Env } from './schemas'

export const defaultEmbeddingModel = '@cf/baai/bge-base-en-v1.5'

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'number' && Number.isFinite(item))
}

function parseEmbeddingOutput(output: unknown): number[] {
  if (isNumberArray(output)) return output

  if (!output || typeof output !== 'object') {
    throw new Error('Workers AI embedding output is not an object.')
  }

  const record = output as Record<string, unknown>
  if (isNumberArray(record.embedding)) return record.embedding
  if (isNumberArray(record.embeddings)) return record.embeddings

  if (Array.isArray(record.data)) {
    const first = record.data[0]
    if (isNumberArray(first)) return first
    if (first && typeof first === 'object') {
      const firstRecord = first as Record<string, unknown>
      if (isNumberArray(firstRecord.embedding)) return firstRecord.embedding
    }
  }

  throw new Error('Workers AI embedding output did not include a usable vector.')
}

export async function embedText(env: Env, text: string): Promise<number[]> {
  if (!env.AI) {
    throw new Error('Workers AI binding is not configured.')
  }

  const output = await env.AI.run(env.EMBEDDING_MODEL || defaultEmbeddingModel, {
    text: [text],
  })

  return parseEmbeddingOutput(output)
}
