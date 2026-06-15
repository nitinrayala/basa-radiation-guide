import type { Language, TreatmentSite } from '../types'

interface TranslationContent {
  appName: string
  welcome: string
  assistantIntro: string
  safetyNotice: string
  medicalDisclaimer: string
  emergencyGuidance: string
  home: string
  chatAssistant: string
  guide: string
  faq: string
  contactHospital: string
  settings: string
  searchFaq: string
  suggestedQuestions: string
  onboardingLanguage: string
  onboardingSite: string
  continue: string
  save: string
  reset: string
  language: string
  treatmentSite: string
  savedPreferences: string
  faqCategories: string[]
  guideSections: string[]
}

export const LANGUAGE_OPTIONS: Record<Language, string> = {
  en: 'English',
  te: 'తెలుగు',
  hi: 'हिंदी',
}

export const SITE_LABELS: Record<TreatmentSite, string> = {
  'head-neck': 'Head & Neck',
  breast: 'Breast',
  prostate: 'Prostate',
  cervix: 'Cervix',
  brain: 'Brain',
  lung: 'Lung',
  gastrointestinal: 'Gastrointestinal',
  gynecologic: 'Gynecologic',
  pediatric: 'Pediatric',
  other: 'Other',
}

export const TRANSLATIONS: Record<Language, TranslationContent> = {
  en: {
    appName: 'Radiation Oncology Patient Assistant',
    welcome: 'Welcome to your radiation care assistant',
    assistantIntro: 'Ask treatment questions, review education, and prepare for appointments.',
    safetyNotice: 'This assistant provides educational information and does not replace medical advice from your radiation oncology team.',
    medicalDisclaimer: 'This assistant is intended for patient education only. It does not diagnose medical conditions, recommend treatments, or replace consultation with your healthcare providers.',
    emergencyGuidance: 'If you are experiencing severe symptoms or a medical emergency, contact your treating doctor or emergency services immediately.',
    home: 'Home',
    chatAssistant: 'Chat Assistant',
    guide: 'Radiation Therapy Guide',
    faq: 'FAQ',
    contactHospital: 'Contact Hospital',
    settings: 'Settings',
    searchFaq: 'Search frequently asked questions',
    suggestedQuestions: 'Suggested starter questions',
    onboardingLanguage: 'Select your preferred language',
    onboardingSite: 'Select your treatment site',
    continue: 'Continue',
    save: 'Save preferences',
    reset: 'Reset onboarding preferences',
    language: 'Language',
    treatmentSite: 'Treatment Site',
    savedPreferences: 'Saved Preferences',
    faqCategories: ['Before Treatment', 'During Treatment', 'Side Effects', 'After Treatment', 'Treatment Site Specific Questions'],
    guideSections: ['What is Radiation Therapy', 'Simulation Process', 'Treatment Planning', 'Daily Treatment Sessions', 'Common Side Effects', 'Nutrition and Self-Care', 'Follow-Up Care'],
  },
  te: {
    appName: 'రేడియేషన్ ఆంకాలజీ పేషెంట్ అసిస్టెంట్',
    welcome: 'మీ రేడియేషన్ సంరక్షణ సహాయకుడికి స్వాగతం',
    assistantIntro: 'చికిత్సకు సంబంధించిన ప్రశ్నలు అడగండి, మార్గదర్శకాలను చదవండి, అపాయింట్మెంట్‌కు సిద్ధం అవ్వండి.',
    safetyNotice: 'ఈ సహాయకుడు విద్యాపరమైన సమాచారం మాత్రమే ఇస్తుంది. ఇది మీ రేడియేషన్ వైద్య బృందం సూచనలకు ప్రత్యామ్నాయం కాదు.',
    medicalDisclaimer: 'ఈ సహాయకుడు రోగి అవగాహన కోసం మాత్రమే. ఇది నిర్ధారణ చేయదు, చికిత్స సూచించదు, వైద్యుల సలహాను భర్తీ చేయదు.',
    emergencyGuidance: 'తీవ్రమైన లక్షణాలు లేదా అత్యవసర పరిస్థితిలో వెంటనే మీ వైద్యుడిని లేదా అత్యవసర సేవలను సంప్రదించండి.',
    home: 'హోమ్',
    chatAssistant: 'చాట్ అసిస్టెంట్',
    guide: 'రేడియేషన్ గైడ్',
    faq: 'తరచుగా అడిగే ప్రశ్నలు',
    contactHospital: 'ఆసుపత్రి సంప్రదింపు',
    settings: 'సెట్టింగ్స్',
    searchFaq: 'FAQ శోధించండి',
    suggestedQuestions: 'సూచించిన ప్రారంభ ప్రశ్నలు',
    onboardingLanguage: 'మీ భాషను ఎంచుకోండి',
    onboardingSite: 'మీ చికిత్స ప్రాంతాన్ని ఎంచుకోండి',
    continue: 'కొనసాగించండి',
    save: 'ప్రాధాన్యతలు సేవ్ చేయండి',
    reset: 'ఆన్‌బోర్డింగ్ రీసెట్ చేయండి',
    language: 'భాష',
    treatmentSite: 'చికిత్స ప్రాంతం',
    savedPreferences: 'సేవ్ చేసిన ప్రాధాన్యతలు',
    faqCategories: ['చికిత్స ముందు', 'చికిత్స సమయంలో', 'దుష్ప్రభావాలు', 'చికిత్స తర్వాత', 'చికిత్స ప్రాంత ప్రత్యేక ప్రశ్నలు'],
    guideSections: ['రేడియేషన్ థెరపీ అంటే ఏమిటి', 'సిమ్యులేషన్ ప్రక్రియ', 'చికిత్స ప్రణాళిక', 'రోజువారీ చికిత్స సెషన్లు', 'సాధారణ దుష్ప్రభావాలు', 'ఆహారం మరియు స్వీయ సంరక్షణ', 'ఫాలో-అప్ సంరక్షణ'],
  },
  hi: {
    appName: 'रेडिएशन ऑन्कोलॉजी पेशेंट असिस्टेंट',
    welcome: 'आपके रेडिएशन देखभाल सहायक में स्वागत है',
    assistantIntro: 'उपचार संबंधी प्रश्न पूछें, शिक्षा सामग्री पढ़ें और अपॉइंटमेंट की तैयारी करें।',
    safetyNotice: 'यह सहायक केवल शैक्षणिक जानकारी देता है और आपकी रेडिएशन ऑन्कोलॉजी टीम की सलाह का विकल्प नहीं है।',
    medicalDisclaimer: 'यह सहायक केवल रोगी शिक्षा हेतु है। यह रोग का निदान नहीं करता, उपचार की सिफारिश नहीं करता, और चिकित्सकीय परामर्श का विकल्प नहीं है।',
    emergencyGuidance: 'यदि आपको गंभीर लक्षण हैं या मेडिकल इमरजेंसी है, तो तुरंत अपने डॉक्टर या आपातकालीन सेवाओं से संपर्क करें।',
    home: 'होम',
    chatAssistant: 'चैट असिस्टेंट',
    guide: 'रेडिएशन थेरेपी गाइड',
    faq: 'FAQ',
    contactHospital: 'अस्पताल संपर्क',
    settings: 'सेटिंग्स',
    searchFaq: 'अक्सर पूछे जाने वाले प्रश्न खोजें',
    suggestedQuestions: 'सुझाए गए प्रारंभिक प्रश्न',
    onboardingLanguage: 'अपनी पसंदीदा भाषा चुनें',
    onboardingSite: 'उपचार स्थल चुनें',
    continue: 'जारी रखें',
    save: 'प्राथमिकताएं सहेजें',
    reset: 'ऑनबोर्डिंग रीसेट करें',
    language: 'भाषा',
    treatmentSite: 'उपचार स्थल',
    savedPreferences: 'सहेजी गई प्राथमिकताएं',
    faqCategories: ['उपचार से पहले', 'उपचार के दौरान', 'दुष्प्रभाव', 'उपचार के बाद', 'उपचार स्थल विशेष प्रश्न'],
    guideSections: ['रेडिएशन थेरेपी क्या है', 'सिमुलेशन प्रक्रिया', 'उपचार योजना', 'दैनिक उपचार सत्र', 'सामान्य दुष्प्रभाव', 'पोषण और स्व-देखभाल', 'फॉलो-अप देखभाल'],
  },
}
