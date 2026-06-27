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

export type Specificity = 'general' | 'treatment_specific'

export type ContentSource = 'document_text' | 'ocr_reviewed'

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

export interface RetrievalQuery {
  query: string
  category?: Category | 'unknown'
  treatmentAreas?: TreatmentArea[]
  keyTerms?: string[]
}

export interface RetrievalResult {
  chunk: KnowledgeChunk
  score: number
  matchReasons: string[]
}
