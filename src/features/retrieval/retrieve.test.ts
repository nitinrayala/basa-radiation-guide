import { retrieveChunks } from './retrieve'
import type { KnowledgeChunk } from './retrievalTypes'

function ids(results: ReturnType<typeof retrieveChunks>): string[] {
  return results.map((result) => result.chunk.id)
}

describe('local document retrieval', () => {
  it('retrieves planning content for an English mask question', () => {
    const results = retrieveChunks({ query: 'Why is a mask used during radiation?' })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].chunk.category).toBe('planning')
    expect(results.some((result) => /mask|immobili/i.test(`${result.chunk.title} ${result.chunk.content}`))).toBe(true)
  })

  it('understands Telugu-script mask queries through local aliases', () => {
    const results = retrieveChunks({ query: 'రేడియేషన్ సమయంలో మాస్క్ ఎందుకు వేస్తారు?' })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].chunk.treatmentAreas).toContain('head_neck')
    expect(results.some((result) => /mask|thermoplastic|immobili/i.test(result.chunk.content))).toBe(true)
  })

  it('retrieves relevant chunks for Romanised Telugu questions', () => {
    const results = retrieveChunks({ query: 'Radiation mask enduku vestaru?' })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].matchReasons.some((reason) => reason.startsWith('area:head_neck'))).toBe(true)
    expect(ids(results).join(' ')).toMatch(/planning|technique/)
  })

  it('handles mixed Telugu-English workflow questions', () => {
    const results = retrieveChunks({ query: 'CT simulation ayyaka treatment eppudu start avuthundi?' })

    expect(results.length).toBeGreaterThan(0)
    expect(results.some((result) => /notification|start|planning scan|ct simulation/i.test(result.chunk.content))).toBe(true)
  })

  it('boosts explicit treatment-area matches', () => {
    const results = retrieveChunks({
      query: 'urine burning during radiation',
      category: 'side_effect',
      treatmentAreas: ['pelvis'],
    })

    expect(results[0].chunk.category).toBe('side_effect')
    expect(results[0].chunk.treatmentAreas).toContain('pelvis')
  })

  it('boosts explicit category matches', () => {
    const results = retrieveChunks({
      query: 'how long does IMRT planning take',
      category: 'technique',
    })

    expect(results[0].chunk.category).toBe('technique')
    expect(results.some((result) => /IMRT|VMAT|planning duration/i.test(result.chunk.content))).toBe(true)
  })

  it('uses source priority as a tie breaker after lexical matching', () => {
    const chunks: KnowledgeChunk[] = [
      {
        id: 'low-priority-mask',
        title: 'Mask',
        content: 'mask positioning',
        category: 'planning',
        treatmentAreas: ['head_neck'],
        sourceFile: 'PowerPoint.pptx',
        sourcePriority: 7,
        containsMedicationInstruction: false,
        requiresDoctorConfirmation: false,
      },
      {
        id: 'high-priority-mask',
        title: 'Mask',
        content: 'mask positioning',
        category: 'planning',
        treatmentAreas: ['head_neck'],
        sourceFile: 'HEAD AND NECK INSTRUCTIONS FOR PATIENTS.docx',
        sourcePriority: 1,
        containsMedicationInstruction: false,
        requiresDoctorConfirmation: false,
      },
    ]

    const results = retrieveChunks({ query: 'mask positioning' }, chunks)

    expect(results[0].chunk.id).toBe('high-priority-mask')
  })

  it('uses fuzzy token matching for minor spelling mistakes', () => {
    const results = retrieveChunks({ query: 'swallwoing throat pain radiation' })

    expect(results.length).toBeGreaterThan(0)
    expect(results.some((result) => /swallow|dysphagia|throat/i.test(`${result.chunk.title} ${result.chunk.content}`))).toBe(true)
  })

  it('returns a source-priority fallback when there are no lexical matches', () => {
    const results = retrieveChunks({ query: 'zzzz qqqq unrelated gibberish' }, undefined, 3)

    expect(results).toHaveLength(3)
    expect(results.every((result) => result.score === 0)).toBe(true)
    expect(results.every((result) => result.matchReasons.includes('fallback:source_priority'))).toBe(true)
  })
})
