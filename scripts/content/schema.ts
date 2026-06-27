export const categories = [
  'overview',
  'workflow',
  'planning',
  'technique',
  'side_effect',
  'precaution',
  'nutrition',
  'skin_care',
  'oral_care',
  'rehabilitation',
  'follow_up',
] as const

export type Category = (typeof categories)[number]

export const treatmentAreas = [
  'general',
  'head_neck',
  'brain',
  'breast',
  'thorax_lung',
  'abdomen',
  'pelvis',
  'prostate',
  'cervix',
  'bone_spine',
] as const

export type TreatmentArea = (typeof treatmentAreas)[number]

export const specificityValues = ['general', 'treatment_specific'] as const

export type Specificity = (typeof specificityValues)[number]

export const contentSourceValues = ['document_text', 'ocr_reviewed'] as const

export type ContentSource = (typeof contentSourceValues)[number]

export const ocrReviewStatuses = ['pending', 'approved', 'rejected'] as const

export type OcrReviewStatus = (typeof ocrReviewStatuses)[number]

export interface ExtractedSection {
  id: string
  sourceFile: string
  sourceType: 'docx' | 'pptx'
  sourceLocation: string
  sourcePriority: number
  title: string
  text: string
  order: number
  contentSource?: ContentSource
  reviewStatus?: 'approved'
}

export interface ExtractedDocument {
  sourceFile: string
  sourceType: 'docx' | 'pptx'
  sourcePriority: number
  inspectedUnitCount: number
  sectionCount: number
  wordCount: number
  sections: ExtractedSection[]
}

export interface ExtractedCorpus {
  generatedAt: string
  sourceDirectory: string
  documents: ExtractedDocument[]
}

export interface KnowledgeChunk {
  id: string
  title: string
  content: string
  category: Category
  treatmentAreas: TreatmentArea[]
  specificity: Specificity
  sourceFile: string
  sourceLocation?: string
  sourcePriority: number
  containsMedicationInstruction: boolean
  requiresDoctorConfirmation: boolean
  contentSource: ContentSource
  reviewStatus?: 'approved'
}

export interface OcrReviewEntry {
  sourceFile: string
  sourceLocation: string
  imageId: string
  imagePath: string
  rawOcrText: string
  proposedText: string
  status: OcrReviewStatus
  notes?: string
}
