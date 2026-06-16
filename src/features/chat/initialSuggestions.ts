import type { Language, Suggestion } from './chatTypes'

export const initialSuggestions: Record<Language, Suggestion[]> = {
  en: [
    { id: 'what-is-rt', label: 'What is radiation therapy?', action: 'question', question: 'What is radiation therapy?' },
    { id: 'planning-scan', label: 'What happens during a planning scan?', action: 'question', question: 'What happens during a planning scan?' },
    { id: 'pain', label: 'Will I feel pain during radiation?', action: 'question', question: 'Will I feel pain during radiation?' },
    { id: 'mask', label: 'Why is a mask used?', action: 'question', question: 'Why is a mask used during radiation?' },
  ],
  te: [
    { id: 'what-is-rt-te', label: 'రేడియేషన్ థెరపీ అంటే ఏమిటి?', action: 'question', question: 'రేడియేషన్ థెరపీ అంటే ఏమిటి?' },
    {
      id: 'planning-scan-te',
      label: 'ప్లానింగ్ స్కాన్ సమయంలో ఏమి జరుగుతుంది?',
      action: 'question',
      question: 'ప్లానింగ్ స్కాన్ సమయంలో ఏమి జరుగుతుంది?',
    },
    { id: 'pain-te', label: 'రేడియేషన్ సమయంలో నొప్పి ఉంటుందా?', action: 'question', question: 'రేడియేషన్ సమయంలో నొప్పి ఉంటుందా?' },
    { id: 'mask-te', label: 'రేడియేషన్ మాస్క్ ఎందుకు ఉపయోగిస్తారు?', action: 'question', question: 'రేడియేషన్ మాస్క్ ఎందుకు ఉపయోగిస్తారు?' },
  ],
}
