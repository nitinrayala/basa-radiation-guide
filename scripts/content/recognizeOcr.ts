import { readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import JSZip from 'jszip'
import { createWorker } from 'tesseract.js'
import { ocrReviewPath, sourceDir } from './paths'
import type { OcrReviewEntry } from './schema'

const contactPattern = /\b(any queries call|dr\.|consultant|dept\.|department of radiation oncology|patient name|mr number|phone|mobile|whatsapp)\b/i
const decorativePattern = /\b(scene|voiceover|text overlay|image:|storyboard|camera|animation)\b/i
const templateLinePattern = /\b(developed in accordance with|notebooklm)\b/i

function normalizeText(value: string): string {
  return value
    .replace(/\r/g, '\n')
    .replace(/[|•●]/g, '-')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function proposedTextFromRaw(rawText: string): string {
  return normalizeText(rawText)
    .split('\n')
    .filter((line) => {
      if (line.length < 3) return false
      if (/^[^a-z0-9]+$/i.test(line)) return false
      if (contactPattern.test(line)) return false
      if (decorativePattern.test(line)) return false
      if (templateLinePattern.test(line)) return false
      return true
    })
    .join('\n')
    .trim()
}

function reviewStatusForText(text: string): OcrReviewEntry['status'] {
  if (text.length < 30) return 'rejected'
  if (contactPattern.test(text) || decorativePattern.test(text)) return 'rejected'
  if (!/[a-z]/i.test(text)) return 'rejected'

  return 'approved'
}

async function readImageBuffer(entry: OcrReviewEntry): Promise<Buffer> {
  const zip = await JSZip.loadAsync(await readFile(join(sourceDir, entry.sourceFile)))
  const image = zip.files[entry.imagePath]
  if (!image) {
    throw new Error(`Image ${entry.imagePath} was not found in ${entry.sourceFile}`)
  }

  return image.async('nodebuffer')
}

async function recognizeReviewEntries() {
  const entries = JSON.parse(await readFile(ocrReviewPath, 'utf8')) as OcrReviewEntry[]
  const worker = await createWorker('eng')
  let approved = 0
  let rejected = 0

  try {
    for (const entry of entries) {
      const shouldRecognize = entry.status === 'pending' || (!entry.rawOcrText && !entry.proposedText)
      if (!shouldRecognize && entry.rawOcrText) {
        const proposedText = proposedTextFromRaw(entry.rawOcrText)
        const status = reviewStatusForText(proposedText)

        entry.proposedText = proposedText
        entry.status = status
        entry.notes = status === 'approved'
          ? `Auto-approved OCR from ${extname(entry.imagePath).slice(1).toUpperCase()} image; review before clinical use.`
          : 'Auto-rejected because OCR text was empty, too short, decorative, or not medically useful.'

        if (status === 'approved') approved += 1
        else rejected += 1

        console.log(`${entry.status.toUpperCase()} ${entry.sourceFile} ${entry.sourceLocation} ${entry.imageId}`)
        continue
      }
      if (!shouldRecognize) continue

      const imageBuffer = await readImageBuffer(entry)
      const result = await worker.recognize(imageBuffer)
      const rawOcrText = normalizeText(result.data.text)
      const proposedText = proposedTextFromRaw(rawOcrText)
      const status = reviewStatusForText(proposedText)

      entry.rawOcrText = rawOcrText
      entry.proposedText = proposedText
      entry.status = status
      entry.notes = status === 'approved'
        ? `Auto-approved OCR from ${extname(entry.imagePath).slice(1).toUpperCase()} image; review before clinical use.`
        : 'Auto-rejected because OCR text was empty, too short, decorative, or not medically useful.'

      if (status === 'approved') approved += 1
      else rejected += 1

      console.log(`${entry.status.toUpperCase()} ${entry.sourceFile} ${entry.sourceLocation} ${entry.imageId}`)
    }
  } finally {
    await worker.terminate()
  }

  await writeFile(ocrReviewPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8')
  console.log(`OCR recognition complete. Approved ${approved}, rejected ${rejected}.`)
}

await recognizeReviewEntries()
