import type { Language } from '../features/chat/chatTypes'

export interface JourneyStep {
  id: string
  order: number
  question: Record<Language, string>
  answer: Record<Language, string>
  nextStepId: string | null
  sourceIds: string[]
}

export const firstJourneyStepId = 'what-is-radiation'

export const radiationJourney: JourneyStep[] = [
  {
    id: 'what-is-radiation',
    order: 1,
    question: {
      en: 'What is radiation therapy?',
      te: 'రేడియేషన్ థెరపీ అంటే ఏమిటి?',
    },
    answer: {
      en:
        'Radiation therapy is a treatment that uses high-energy radiation to destroy cancer cells or shrink tumors. The radiation is aimed carefully at the treatment area so that the dose reaches the target as accurately as possible.\n\nIt is a local treatment, which means it works mainly on the part of the body being treated. Your treatment team plans the treatment before it starts so each session can be delivered in the same position.',
      te:
        'రేడియేషన్ థెరపీ అనేది అధిక శక్తి రేడియేషన్‌ను ఉపయోగించి క్యాన్సర్ కణాలను నాశనం చేయడానికి లేదా ట్యూమర్‌ను చిన్నదిగా చేయడానికి చేసే చికిత్స.\n\nఇది సాధారణంగా శరీరంలోని చికిత్స చేయాల్సిన భాగంపైనే పనిచేసే స్థానిక చికిత్స. ప్రతి సారి చికిత్స ఒకే విధంగా, సరైన స్థానంలో ఇవ్వడానికి ముందుగా ప్లానింగ్ చేస్తారు.',
    },
    nextStepId: 'why-used',
    sourceIds: ['planning-understanding-radiation-therapy-a-patient-s-guide-radiation-planning-chatbot-017-01'],
  },
  {
    id: 'why-used',
    order: 2,
    question: {
      en: 'Why is radiation therapy used?',
      te: 'రేడియేషన్ థెరపీ ఎందుకు ఉపయోగిస్తారు?',
    },
    answer: {
      en:
        'Radiation therapy may be used to treat cancer cells in a specific area. Sometimes it is used to shrink a tumor, control disease in that area, or support other treatments as part of the overall treatment plan.\n\nThe exact reason for radiation is different for each patient. Your doctor decides this based on your diagnosis, scans, reports and treatment plan.',
      te:
        'రేడియేషన్ థెరపీని ఒక నిర్దిష్ట ప్రాంతంలోని క్యాన్సర్ కణాలను చికిత్స చేయడానికి ఉపయోగిస్తారు. కొన్ని సందర్భాల్లో ట్యూమర్‌ను చిన్నదిగా చేయడానికి లేదా ఆ ప్రాంతంలోని వ్యాధిని నియంత్రించడానికి ఉపయోగించవచ్చు.\n\nమీకు రేడియేషన్ ఎందుకు అవసరమో ప్రతి రోగికి వేరుగా ఉంటుంది. అది మీ డాక్టర్ మీ రిపోర్టులు, స్కాన్లు మరియు చికిత్స ప్రణాళిక ఆధారంగా నిర్ణయిస్తారు.',
    },
    nextStepId: 'before-treatment',
    sourceIds: ['planning-understanding-radiation-therapy-a-patient-s-guide-radiation-planning-chatbot-017-01'],
  },
  {
    id: 'before-treatment',
    order: 3,
    question: {
      en: 'What happens before treatment begins?',
      te: 'చికిత్స మొదలయ్యే ముందు ఏమి జరుగుతుంది?',
    },
    answer: {
      en:
        'Before treatment begins, the team prepares your radiation plan. This usually includes a planning visit, positioning, and a planning scan. The aim is to understand the exact area that needs treatment and how you should be positioned each day.\n\nThis preparation helps the team deliver treatment accurately and consistently.',
      te:
        'చికిత్స మొదలయ్యే ముందు మీ రేడియేషన్ ప్లాన్ సిద్ధం చేస్తారు. సాధారణంగా ఇందులో ప్లానింగ్ విజిట్, మీ శరీరాన్ని సరైన స్థానంలో ఉంచడం, మరియు ప్లానింగ్ స్కాన్ ఉంటాయి.\n\nప్రతి రోజు చికిత్స ఒకే విధంగా, ఖచ్చితంగా ఇవ్వడానికి ఈ సిద్ధత సహాయపడుతుంది.',
    },
    nextStepId: 'planning-scan',
    sourceIds: ['planning-radiation-therapy-workflow-patient-journey-radiation-therapy-workflow-001-01'],
  },
  {
    id: 'planning-scan',
    order: 4,
    question: {
      en: 'What happens during the planning scan?',
      te: 'ప్లానింగ్ స్కాన్ సమయంలో ఏమి జరుగుతుంది?',
    },
    answer: {
      en:
        'During the planning scan, you are positioned in the same way you will be positioned for treatment. The team may use supports such as a mask, mould or other positioning devices depending on the treatment area.\n\nThe scan gives the planning team the images they need to prepare the treatment plan. It is part of planning and is not the same as receiving radiation treatment.',
      te:
        'ప్లానింగ్ స్కాన్ సమయంలో, చికిత్స సమయంలో మీరు ఉండాల్సిన విధంగానే మిమ్మల్ని పడుకోబెడతారు. చికిత్స ప్రాంతాన్ని బట్టి మాస్క్, మౌల్డ్ లేదా ఇతర సపోర్ట్‌లు ఉపయోగించవచ్చు.\n\nఈ స్కాన్ ద్వారా ప్లానింగ్ టీమ్‌కు చికిత్స ప్రణాళిక సిద్ధం చేయడానికి అవసరమైన చిత్రాలు లభిస్తాయి. ఇది ప్లానింగ్ భాగం మాత్రమే; ఇది రేడియేషన్ చికిత్స కాదు.',
    },
    nextStepId: 'mask-or-mould',
    sourceIds: ['planning-3-planning-scan-radiation-planning-chatbot-006-01'],
  },
  {
    id: 'mask-or-mould',
    order: 5,
    question: {
      en: 'Why is a mask or body mould used?',
      te: 'మాస్క్ లేదా బాడీ మౌల్డ్ ఎందుకు ఉపయోగిస్తారు?',
    },
    answer: {
      en:
        'A mask or body mould helps keep you in the same position during planning and each treatment session. This is important because radiation needs to be aimed accurately at the planned area.\n\nThe device is made for your body shape. It may feel firm, but its purpose is positioning and safety. If you feel uncomfortable, tell the radiation team.',
      te:
        'మాస్క్ లేదా బాడీ మౌల్డ్ ప్లానింగ్ సమయంలో మరియు ప్రతి చికిత్స సెషన్‌లో మీను ఒకే స్థానంలో ఉంచడానికి సహాయపడుతుంది. రేడియేషన్ ప్లాన్ చేసిన ప్రాంతానికి ఖచ్చితంగా చేరడానికి ఇది ముఖ్యమైనది.\n\nఇది మీ శరీర ఆకారానికి సరిపోయేలా తయారు చేస్తారు. కొంచెం బిగువుగా అనిపించవచ్చు, కానీ దాని పని స్థానం నిలబెట్టడం. అసౌకర్యంగా ఉంటే రేడియేషన్ టీమ్‌కు చెప్పండి.',
    },
    nextStepId: 'after-planning-scan',
    sourceIds: ['planning-2-immobilization-radiation-planning-chatbot-005-01'],
  },
  {
    id: 'after-planning-scan',
    order: 6,
    question: {
      en: 'What happens after the planning scan?',
      te: 'ప్లానింగ్ స్కాన్ తర్వాత ఏమి జరుగుతుంది?',
    },
    answer: {
      en:
        'After the planning scan, the radiation team and medical physicist prepare the treatment plan. They use the scan images to decide how the radiation should be delivered to the planned area.\n\nYou may not start treatment immediately after the scan because the plan has to be checked carefully before the first session.',
      te:
        'ప్లానింగ్ స్కాన్ తర్వాత రేడియేషన్ టీమ్ మరియు మెడికల్ ఫిజిసిస్ట్ చికిత్స ప్రణాళికను సిద్ధం చేస్తారు. స్కాన్ చిత్రాల ఆధారంగా రేడియేషన్ ఎలా ఇవ్వాలో ప్లాన్ చేస్తారు.\n\nస్కాన్ అయ్యాక వెంటనే చికిత్స మొదలుకాకపోవచ్చు, ఎందుకంటే మొదటి సెషన్‌కు ముందు ప్లాన్‌ను జాగ్రత్తగా చెక్ చేయాలి.',
    },
    nextStepId: 'planning-time',
    sourceIds: ['technique-treatment-planning-by-medical-physicist-radiation-planning-chatbot-002-01'],
  },
  {
    id: 'planning-time',
    order: 7,
    question: {
      en: 'Why does treatment planning take time?',
      te: 'చికిత్స ప్లానింగ్‌కు ఎందుకు సమయం పడుతుంది?',
    },
    answer: {
      en:
        'Treatment planning takes time because the team must prepare, calculate and check the plan before treatment starts. The plan should aim radiation accurately and protect nearby normal tissues as much as possible.\n\nThe exact time can vary. Your treating team will tell you when your treatment is ready to begin.',
      te:
        'చికిత్స ప్లానింగ్‌కు సమయం పడుతుంది, ఎందుకంటే ప్లాన్‌ను సిద్ధం చేయడం, లెక్కించడం మరియు చెక్ చేయడం అవసరం. రేడియేషన్‌ను సరైన ప్రాంతానికి ఖచ్చితంగా ఇవ్వడం, పక్కన ఉన్న సాధారణ కణజాలాన్ని వీలైనంత రక్షించడం లక్ష్యం.\n\nసమయం ప్రతి రోగికి వేరుగా ఉండవచ్చు. చికిత్స ఎప్పుడు మొదలవుతుందో మీ టీమ్ చెబుతుంది.',
    },
    nextStepId: 'treatment-session',
    sourceIds: ['technique-planning-duration-excluding-saturday-and-sunday-radiation-planning-chatbot-003-01'],
  },
  {
    id: 'treatment-session',
    order: 8,
    question: {
      en: 'What happens during a radiation session?',
      te: 'రేడియేషన్ సెషన్ సమయంలో ఏమి జరుగుతుంది?',
    },
    answer: {
      en:
        'During a treatment session, you are positioned carefully, often using the same supports used during planning. The team checks your position, then the machine delivers radiation according to the prepared plan.\n\nYou need to remain still during the session. The staff monitor you and you can tell them if you feel uncomfortable.',
      te:
        'రేడియేషన్ సెషన్ సమయంలో మిమ్మల్ని జాగ్రత్తగా సరైన స్థానంలో ఉంచుతారు. ప్లానింగ్ సమయంలో వాడిన సపోర్ట్‌లను మళ్లీ ఉపయోగించవచ్చు. మీ స్థానం చెక్ చేసిన తర్వాత యంత్రం సిద్ధం చేసిన ప్లాన్ ప్రకారం రేడియేషన్ ఇస్తుంది.\n\nసెషన్ సమయంలో కదలకుండా ఉండాలి. సిబ్బంది మిమ్మల్ని గమనిస్తారు; అసౌకర్యంగా ఉంటే వారికి చెప్పండి.',
    },
    nextStepId: 'feel-radiation',
    sourceIds: ['technique-what-to-expect-during-radiation-therapy-radiation-planning-chatbot-019-01'],
  },
  {
    id: 'feel-radiation',
    order: 9,
    question: {
      en: 'Will I feel the radiation?',
      te: 'రేడియేషన్ ఇస్తున్నప్పుడు నాకు అనిపిస్తుందా?',
    },
    answer: {
      en:
        'Radiation treatment itself is usually not felt while it is being delivered. You may hear the machine or notice it moving, but the radiation beam does not usually cause pain during the session.\n\nIf you feel pain, tightness, anxiety or any discomfort from your position or support device, tell the treatment team.',
      te:
        'రేడియేషన్ ఇస్తున్నప్పుడు రేడియేషన్ కిరణం సాధారణంగా నొప్పిగా అనిపించదు. యంత్రం శబ్దం వినిపించవచ్చు లేదా కదలడం కనిపించవచ్చు, కానీ చికిత్స సమయంలో రేడియేషన్ తాకినట్టు సాధారణంగా అనిపించదు.\n\nస్థానం, మాస్క్ లేదా ఇతర సపోర్ట్ వల్ల నొప్పి, బిగుతు, భయం లేదా అసౌకర్యం ఉంటే టీమ్‌కు చెప్పండి.',
    },
    nextStepId: 'side-effects',
    sourceIds: ['technique-what-to-expect-during-radiation-therapy-radiation-planning-chatbot-019-01'],
  },
  {
    id: 'side-effects',
    order: 10,
    question: {
      en: 'What side effects can occur?',
      te: 'ఏ దుష్ప్రభావాలు రావచ్చు?',
    },
    answer: {
      en:
        'Side effects depend on the area being treated. Some general effects mentioned in the documents include tiredness and skin changes in the treated area. Other side effects can be different for head and neck, breast, chest, abdomen or pelvis treatment.\n\nDo not assume every side effect will happen to you. Tell your treating team about new or worrying symptoms.',
      te:
        'దుష్ప్రభావాలు చికిత్స చేసే ప్రాంతంపై ఆధారపడి ఉంటాయి. పత్రాల్లో సాధారణంగా అలసట మరియు చికిత్స చేసిన ప్రాంతంలో చర్మ మార్పులు వంటి విషయాలు ఉన్నాయి. తల-మెడ, బ్రెస్ట్, ఛెస్ట్, అబ్డమెన్ లేదా పెల్విస్ చికిత్సలో వేరే దుష్ప్రభావాలు ఉండవచ్చు.\n\nప్రతి దుష్ప్రభావం మీకు తప్పనిసరిగా వస్తుందని అనుకోవద్దు. కొత్తగా లేదా ఆందోళన కలిగించే లక్షణాలు ఉంటే మీ టీమ్‌కు చెప్పండి.',
    },
    nextStepId: 'care-during-treatment',
    sourceIds: ['side-effect-side-effects-during-radiation-rt-side-effects-006-01'],
  },
  {
    id: 'care-during-treatment',
    order: 11,
    question: {
      en: 'What care should I take during treatment?',
      te: 'చికిత్స సమయంలో నేను ఏ జాగ్రత్తలు తీసుకోవాలి?',
    },
    answer: {
      en:
        'Follow the instructions given by your treating team. General care may include reporting discomfort, avoiding unapproved products on the treatment area, and asking before using medicines, lotions or mouthwashes mentioned in any document.\n\nCare instructions can differ by treatment area, so use this guide as general information and follow your own team’s advice.',
      te:
        'మీ చికిత్స టీమ్ ఇచ్చిన సూచనలను పాటించండి. సాధారణంగా అసౌకర్యం ఉంటే చెప్పడం, చికిత్స ప్రాంతంపై అనుమతి లేని ఉత్పత్తులు వాడకపోవడం, మందులు, లోషన్లు లేదా మౌత్‌వాష్ వాడే ముందు అడగడం ముఖ్యమైనవి.\n\nజాగ్రత్తలు చికిత్స ప్రాంతాన్ని బట్టి మారవచ్చు. అందుకే ఈ గైడ్‌ను సాధారణ సమాచారంగా తీసుకుని మీ టీమ్ చెప్పినదే పాటించండి.',
    },
    nextStepId: 'rehab-exercises',
    sourceIds: ['side-effect-general-care-during-radiation-ebrt-rt-side-effects-029-01'],
  },
  {
    id: 'rehab-exercises',
    order: 12,
    question: {
      en: 'Why are rehabilitation exercises important?',
      te: 'రెహాబిలిటేషన్ వ్యాయామాలు ఎందుకు ముఖ్యమైనవి?',
    },
    answer: {
      en:
        'Rehabilitation exercises may help maintain movement, strength and daily function during or after treatment. The documents include rehabilitation material, but the exact exercises should match your treatment area and your team’s advice.\n\nDo exercises only as taught or approved by your treating team, especially if you have pain, weakness or movement limits.',
      te:
        'రెహాబిలిటేషన్ వ్యాయామాలు చికిత్స సమయంలో లేదా తర్వాత కదలిక, బలం మరియు రోజువారీ పనులను కొనసాగించడానికి సహాయపడవచ్చు. కానీ ఏ వ్యాయామాలు చేయాలో మీ చికిత్స ప్రాంతం మరియు టీమ్ సూచనలపై ఆధారపడి ఉంటుంది.\n\nనొప్పి, బలహీనత లేదా కదలికలో ఇబ్బంది ఉంటే, మీ టీమ్ నేర్పిన లేదా అనుమతించిన వ్యాయామాలనే చేయండి.',
    },
    nextStepId: 'after-treatment',
    sourceIds: ['planning-radiation-therapy-workflow-patient-journey-radiation-therapy-workflow-001-01'],
  },
  {
    id: 'after-treatment',
    order: 13,
    question: {
      en: 'What happens after radiation treatment ends?',
      te: 'రేడియేషన్ చికిత్స పూర్తయ్యాక ఏమి జరుగుతుంది?',
    },
    answer: {
      en:
        'After radiation treatment ends, your team will guide you about follow-up and ongoing care. Some side effects may improve gradually, while some symptoms should be reported if they are severe, new or worrying.\n\nKeep your follow-up appointments and ask your treating doctor which symptoms need urgent attention for your specific treatment plan.',
      te:
        'రేడియేషన్ చికిత్స పూర్తయ్యాక ఫాలో-అప్ మరియు తర్వాతి జాగ్రత్తల గురించి మీ టీమ్ మార్గదర్శనం చేస్తుంది. కొన్ని దుష్ప్రభావాలు నెమ్మదిగా తగ్గవచ్చు; తీవ్రమైనవి, కొత్తవి లేదా ఆందోళన కలిగించేవి ఉంటే చెప్పాలి.\n\nమీ ఫాలో-అప్ అపాయింట్‌మెంట్‌లకు వెళ్లండి. మీ చికిత్స ప్రణాళికకు ఏ లక్షణాలు వెంటనే చెప్పాలో మీ డాక్టర్‌ను అడగండి.',
    },
    nextStepId: null,
    sourceIds: ['side-effect-side-effects-after-radiation-rt-side-effects-007-01'],
  },
]

export const journeyById = new Map(radiationJourney.map((step) => [step.id, step]))

export function getJourneyStep(stepId: string | null): JourneyStep | null {
  if (!stepId) return null

  return journeyById.get(stepId) ?? null
}
