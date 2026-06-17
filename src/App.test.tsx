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

  it('clicking the guided question adds the cached answer and advances the button', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))

    expect(screen.getByText('What is radiation therapy?')).toBeInTheDocument()
    expect(screen.getByText(/uses high-energy radiation/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()
  })

  it('advances repeatedly through the cached journey', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    fireEvent.click(screen.getByRole('button', { name: 'Why is radiation therapy used?' }))
    fireEvent.click(screen.getByRole('button', { name: 'What happens before treatment begins?' }))

    expect(screen.getByRole('button', { name: 'What happens during the planning scan?' })).toBeInTheDocument()
    expect(screen.getByText(/planning visit, positioning, and a planning scan/i)).toBeInTheDocument()
  })

  it('shows the restart control at the end and restarts only the guided journey', () => {
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
      fireEvent.click(screen.getByRole('button', { name: question }))
    }

    expect(screen.getByRole('button', { name: 'Start the guide again' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start the guide again' }))

    expect(screen.getByRole('button', { name: 'What is radiation therapy?' })).toBeInTheDocument()
    expect(screen.queryByText(/After radiation treatment ends/i)).not.toBeInTheDocument()
  })

  it('submits typed mixed-language questions without changing the guided stage', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    expect(screen.getByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()

    const input = screen.getByLabelText('Type your question...')
    fireEvent.change(input, { target: { value: 'Radiation mask enduku vestaru?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByText('Radiation mask enduku vestaru?')).toBeInTheDocument()
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Why is radiation therapy used?' })).toBeInTheDocument()
    expect(input).toBeEnabled()
  })

  it('switches language while preserving guided progress and translating cached journey messages', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    fireEvent.click(screen.getByRole('button', { name: 'తెలుగు' }))

    expect(screen.getByText(/నమస్కారం/)).toBeInTheDocument()
    expect(screen.getByText('రేడియేషన్ థెరపీ అంటే ఏమిటి?')).toBeInTheDocument()
    expect(screen.getByText(/అధిక శక్తి రేడియేషన్/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'రేడియేషన్ థెరపీ ఎందుకు ఉపయోగిస్తారు?' })).toBeInTheDocument()
    expect(screen.getByLabelText('మీ ప్రశ్నను టైప్ చేయండి...')).toBeInTheDocument()
  })

  it('clear chat resets search messages and guided progress in the selected language', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
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
