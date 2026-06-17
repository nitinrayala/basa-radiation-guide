import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('App guided radiation journey UI', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the initial greeting and exactly one guided question', () => {
    render(<App />)

    expect(screen.getByText(/guide you through the radiation therapy process step by step/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'What is radiation therapy?' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'What happens during a planning scan?' })).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('Next guide step')).toHaveLength(1)
  })

  it('clicking the guided question waits briefly, adds the cached answer and advances the button', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))

    expect(screen.getAllByText('What is radiation therapy?').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Preparing a response')).toBeInTheDocument()
    expect(await screen.findByText(/uses high-energy radiation/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()
  })

  it('advances repeatedly through the cached journey', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Why is radiation therapy used?' }))
    fireEvent.click(await screen.findByRole('button', { name: 'What happens before treatment begins?' }))

    expect(await screen.findByRole('button', { name: 'What happens during the planning scan?' })).toBeInTheDocument()
    expect(screen.getByText(/planning visit, positioning, and a planning scan/i)).toBeInTheDocument()
  })

  it('shows the restart control at the end and restarts only the guided journey', async () => {
    render(<App />)

    const guideQuestions = [
      'What is radiation therapy?',
      'Why is radiation therapy used?',
      'What happens before treatment begins?',
      'What happens during the planning scan?',
      'Why is a mask or body mould used?',
      'What happens after the planning scan?',
      'Why does treatment planning take time?',
      'What happens during a radiation session?',
      'Will I feel the radiation?',
      'What side effects can occur?',
      'What care should I take during treatment?',
      'Why are rehabilitation exercises important?',
      'What happens after radiation treatment ends?',
    ]

    for (const question of guideQuestions) {
      fireEvent.click(await screen.findByRole('button', { name: question }))
    }

    expect(await screen.findByRole('button', { name: 'Start the guide again' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start the guide again' }))

    expect(screen.getByRole('button', { name: 'What is radiation therapy?' })).toBeInTheDocument()
    expect(screen.queryByText(/After radiation treatment ends/i)).not.toBeInTheDocument()
  })

  it('submits typed mixed-language questions without changing the guided stage', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    expect(await screen.findByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()

    const input = screen.getByLabelText('Type your question...')
    fireEvent.change(input, { target: { value: 'Radiation mask enduku vestaru?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByText('Radiation mask enduku vestaru?')).toBeInTheDocument()
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()
    expect(input).toBeEnabled()
  })

  it('keeps guided messages below typed search messages that came before them', async () => {
    render(<App />)

    const input = screen.getByLabelText('Type your question...')
    fireEvent.change(input, { target: { value: 'Radiation mask enduku vestaru?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    expect(await screen.findByText(/uses high-energy radiation/i)).toBeInTheDocument()

    const visibleMessages = screen.getAllByRole('article').map((message) => message.textContent ?? '')
    const typedQuestionIndex = visibleMessages.findIndex((message) => message.includes('Radiation mask enduku vestaru?'))
    const guidedQuestionIndex = visibleMessages.findIndex((message) => message.includes('What is radiation therapy?'))

    expect(typedQuestionIndex).toBeGreaterThan(-1)
    expect(guidedQuestionIndex).toBeGreaterThan(typedQuestionIndex)
  })

  it('appends the next guided step after an existing typed question and typed answer', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    expect(await screen.findByText(/uses high-energy radiation/i)).toBeInTheDocument()

    const input = screen.getByLabelText('Type your question...')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Why is radiation therapy used?' }))
    expect(await screen.findByText(/may be used to treat cancer cells/i)).toBeInTheDocument()

    const visibleMessages = screen.getAllByRole('article').map((message) => message.textContent ?? '')
    const typedAnswerIndex = visibleMessages.findIndex((message) => message.includes('mock interface response'))
    const nextGuidedQuestionIndex = visibleMessages.findIndex((message) => message.includes('Why is radiation therapy used?'))
    const nextGuidedAnswerIndex = visibleMessages.findIndex((message) => message.includes('may be used to treat cancer cells'))

    expect(nextGuidedQuestionIndex).toBeGreaterThan(typedAnswerIndex)
    expect(nextGuidedAnswerIndex).toBeGreaterThan(nextGuidedQuestionIndex)
  })

  it('keeps English and Telugu guided chat progress separate', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    expect(await screen.findByText(/uses high-energy radiation/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'తెలుగు' }))

    expect(screen.getByText(/నమస్కారం/)).toBeInTheDocument()
    expect(screen.queryByText(/uses high-energy radiation/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'రేడియేషన్ థెరపీ అంటే ఏమిటి?' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByText(/uses high-energy radiation/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()
  })

  it('keeps English and Telugu typed chat messages separate', async () => {
    render(<App />)

    const input = screen.getByLabelText('Type your question...')
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('hello')).toBeInTheDocument()
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'తెలుగు' }))

    expect(screen.queryByText('hello')).not.toBeInTheDocument()
    expect(screen.queryByText(/mock interface response/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('మీ ప్రశ్నను టైప్ చేయండి...')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText(/mock interface response/i)).toBeInTheDocument()
  })

  it('clear chat resets search messages and guided progress in the selected language', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    expect(await screen.findByText(/uses high-energy radiation/i)).toBeInTheDocument()
    const input = screen.getByLabelText('Type your question...')
    fireEvent.change(input, { target: { value: 'Radiation mask enduku vestaru?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear chat' }))

    await waitFor(() => {
      expect(screen.queryByText('Radiation mask enduku vestaru?')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'What is radiation therapy?' })).toBeInTheDocument()
    expect(screen.queryByText(/uses high-energy radiation/i)).not.toBeInTheDocument()
  })

  it.each([320, 375, 430])('renders the chat controls at %ipx width', (width) => {
    setViewportWidth(width)
    render(<App />)

    expect(screen.getByRole('main', { name: 'Radiation therapy chatbot' })).toBeInTheDocument()
    expect(screen.getByLabelText('Next guide step')).toBeInTheDocument()
    expect(screen.getByLabelText('Type your question...')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })
})
