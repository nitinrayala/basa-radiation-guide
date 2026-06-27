import { join } from 'node:path'

export const sourceDir = join(process.cwd(), 'source-docs')
export const contentDir = join(process.cwd(), 'data', 'content')
export const extractedCorpusPath = join(contentDir, 'extracted-corpus.json')
export const knowledgeChunksPath = join(contentDir, 'knowledge-chunks.json')
export const ocrReviewPath = join(contentDir, 'ocr-review.json')
export const frontendKnowledgeChunksPath = join(process.cwd(), 'src', 'data', 'knowledgeChunks.json')
