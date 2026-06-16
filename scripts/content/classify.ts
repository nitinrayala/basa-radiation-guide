import type { Category, TreatmentArea } from './schema'

export function getSourcePriority(sourceFile: string): number {
  if (sourceFile === 'HEAD AND NECK INSTRUCTIONS FOR PATIENTS.docx') return 1
  if (sourceFile === 'RT - Side effects.docx') return 2
  if (sourceFile === 'Counselling.docx') return 3
  if (sourceFile === 'Radiation Planning-ChatBot.docx') return 4
  if (sourceFile === 'Radiation therapy Techniques.docx') return 5
  if (sourceFile === 'Radiation Therapy Workflow.docx') return 6
  if (sourceFile.endsWith('.pptx')) return 7

  return 99
}

export function classifyCategory(sourceFile: string, text: string): Category {
  const normalized = `${sourceFile} ${text}`.toLowerCase()

  if (/\b(imrt|vmat|3dcrt|sbrt|srs|brachytherapy|technique|linear accelerator|linac)\b/.test(normalized)) return 'technique'
  if (/\b(side effect|mucositis|fatigue|dry mouth|skin reaction|sore throat|nausea|vomiting|diarrhea|burning)\b/.test(normalized)) return 'side_effect'
  if (/\b(mask|ct simulation|simulation|planning|immobili[sz]ation|scan|contrast|marking|tattoo|treatment plan)\b/.test(normalized)) return 'planning'
  if (/\b(workflow|registration|appointment|quality assurance|qa|treatment start|schedule|fraction)\b/.test(normalized)) return 'workflow'
  if (/\b(exercise|rehabilitation|physiotherapy|movement|shoulder|neck exercise|swallowing exercise)\b/.test(normalized)) return 'rehabilitation'
  if (/\b(food|diet|nutrition|eat|protein|water|hydration|swallow)\b/.test(normalized)) return 'nutrition'
  if (/\b(skin|lotion|cream|soap|moisturi[sz]er|wash)\b/.test(normalized)) return 'skin_care'
  if (/\b(mouth|oral|teeth|tooth|mouthwash|gargle|dental)\b/.test(normalized)) return 'oral_care'
  if (/\b(precaution|care|avoid|do not|should not|instruction|advice)\b/.test(normalized)) return 'precaution'
  if (/\b(follow up|review|after treatment|after completion)\b/.test(normalized)) return 'follow_up'

  return 'overview'
}

export function classifyTreatmentAreas(sourceFile: string, text: string): TreatmentArea[] {
  const normalized = `${sourceFile} ${text}`.toLowerCase()
  const areas = new Set<TreatmentArea>()

  if (/\b(head|neck|mouth|oral|throat|larynx|tongue|tonsil|salivary|mask)\b/.test(normalized)) areas.add('head_neck')
  if (/\b(brain|cranial|skull)\b/.test(normalized)) areas.add('brain')
  if (/\b(breast|chest wall)\b/.test(normalized)) areas.add('breast')
  if (/\b(lung|thorax|chest|oesophagus|esophagus)\b/.test(normalized)) areas.add('thorax_lung')
  if (/\b(abdomen|stomach|liver|pancreas|bowel)\b/.test(normalized)) areas.add('abdomen')
  if (/\b(pelvis|pelvic|rectum|bladder|urine|urinary)\b/.test(normalized)) areas.add('pelvis')
  if (/\b(prostate)\b/.test(normalized)) areas.add('prostate')
  if (/\b(cervix|cervical)\b/.test(normalized)) areas.add('cervix')
  if (/\b(bone|spine|vertebra|spinal)\b/.test(normalized)) areas.add('bone_spine')

  if (areas.size === 0) areas.add('general')

  return Array.from(areas)
}

export function containsMedicationInstruction(text: string): boolean {
  return /\b(tablet|capsule|medicine|medication|drug|dose|mg|mouthwash|gargle|cream|ointment|lotion|gel)\b/i.test(text)
}

export function requiresDoctorConfirmation(text: string): boolean {
  return /\b(doctor|physician|radiation oncologist|consult|prescribed|advised|as instructed|treating team|if needed)\b/i.test(text)
}
