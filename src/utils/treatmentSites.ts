import type { TreatmentSite } from '../types'

export interface TreatmentSiteOption {
  value: TreatmentSite
  icon: string
  title: string
  description: string
}

export const TREATMENT_SITES: TreatmentSiteOption[] = [
  { value: 'head-neck', icon: '🧠', title: 'Head & Neck', description: 'Care for cancers in the head and neck region.' },
  { value: 'breast', icon: '🎗️', title: 'Breast', description: 'Support for breast radiation treatment questions.' },
  { value: 'prostate', icon: '🩺', title: 'Prostate', description: 'Guidance for prostate-focused radiation care.' },
  { value: 'cervix', icon: '🌸', title: 'Cervix', description: 'Information on pelvic and cervical radiation therapy.' },
  { value: 'brain', icon: '🧬', title: 'Brain', description: 'Support for brain radiation planning and care.' },
  { value: 'lung', icon: '🫁', title: 'Lung', description: 'Learn about lung radiation and symptom management.' },
  { value: 'gastrointestinal', icon: '🍽️', title: 'Gastrointestinal', description: 'Education for digestive-system treatment care.' },
  { value: 'gynecologic', icon: '🩷', title: 'Gynecologic', description: 'Support for gynecologic radiation therapy.' },
  { value: 'pediatric', icon: '🧸', title: 'Pediatric', description: 'Family-friendly guidance for childhood treatment.' },
  { value: 'other', icon: '📋', title: 'Other', description: 'General support for other treatment sites.' },
]

export const TREATMENT_SITE_QUESTIONS: Record<TreatmentSite, string[]> = {
  'head-neck': [
    'Why do I need a treatment mask?',
    'What causes dry mouth during treatment?',
  ],
  breast: [
    'What skin changes can happen during treatment?',
    'How should I care for my skin?',
  ],
  prostate: [
    'Are urinary changes common during treatment?',
    'What lifestyle changes may help during treatment?',
  ],
  cervix: [
    'What should I expect during pelvic radiation?',
    'What side effects are common during treatment?',
  ],
  brain: [
    'Will treatment affect memory or concentration?',
    'How can I manage fatigue during brain radiation?',
  ],
  lung: [
    'Is cough or shortness of breath common with treatment?',
    'How do I protect my lungs during recovery?',
  ],
  gastrointestinal: [
    'Can radiation affect my appetite and digestion?',
    'What foods are easier during treatment?',
  ],
  gynecologic: [
    'How does gynecologic radiation affect daily activities?',
    'What symptoms should I report immediately?',
  ],
  pediatric: [
    'How can I support my child through treatment?',
    'What side effects are common in children?',
  ],
  other: [
    'How can I prepare for my first radiation session?',
    'Which side effects should I monitor at home?',
  ],
}
