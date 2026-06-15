import type { PatientProfile } from '../types'

export interface AIRequest {
  question: string
  profile: PatientProfile
}

export interface AIResponse {
  answer: string
  citations: string[]
}

export async function askAssistant({ question, profile }: AIRequest): Promise<AIResponse> {
  const context = `Preferred Language: ${profile.selectedLanguage}; Treatment Site: ${profile.selectedTreatmentSite}`

  await new Promise((resolve) => setTimeout(resolve, 800))

  return {
    answer: `You asked: "${question}". I will use your profile context (${context}) in future clinical-safe responses. Please verify care instructions with your radiation oncology team.`,
    citations: ['Patient education protocol (placeholder)', 'Hospital-approved guidance source (placeholder)'],
  }
}
