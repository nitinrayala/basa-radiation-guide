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

describe('App mobile chatbot UI', () => {
  it('shows the initial greeting and four suggested questions', () => {
    render(<App />)

    expect(screen.getByText(/Hello\. You can ask me questions/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'What is radiation therapy?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'What happens during a planning scan?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Will I feel pain during radiation?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Why is a mask used?' })).toBeInTheDocument()
  })

  it('submits a suggestion and shows Explain more as a follow-up suggestion', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Why is a mask used?' }))

    expect(screen.getAllByText('Why is a mask used?').length).toBeGreaterThan(0)
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explain more' })).toBeInTheDocument()
  })

  it('treats Explain more as a suggested follow-up message', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    const explainMoreButton = await screen.findByRole('button', { name: 'Explain more' })

    fireEvent.click(explainMoreButton)

    expect((await screen.findAllByText('Explain more')).length).toBeGreaterThan(0)
    expect(screen.getByText(/Here is a little more detail in this mock preview/i)).toBeInTheDocument()
  })

  it('submits typed mixed-language questions from the fixed input area', async () => {
    render(<App />)

    const input = screen.getByLabelText('Type your question...')
    fireEvent.change(input, { target: { value: 'Radiation mask enduku vestaru?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByText('Radiation mask enduku vestaru?')).toBeInTheDocument()
    expect(await screen.findByText(/mock interface response/i)).toBeInTheDocument()
    expect(input).toBeEnabled()
  })

  it('switches the interface and initial suggestions to Telugu', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'తెలుగు' }))

    expect(screen.getByText(/నమస్కారం/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'రేడియేషన్ థెరపీ అంటే ఏమిటి?' })).toBeInTheDocument()
    expect(screen.getByLabelText('మీ ప్రశ్నను టైప్ చేయండి...')).toBeInTheDocument()
  })

  it('clears chat back to the selected language greeting and initial suggestions', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'What is radiation therapy?' }))
    expect(await screen.findByRole('button', { name: 'Explain more' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear chat' }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Explain more' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'What is radiation therapy?' })).toBeInTheDocument()
  })

  it.each([320, 375, 430])('renders the chat controls at %ipx width', (width) => {
    setViewportWidth(width)
    render(<App />)

    expect(screen.getByRole('main', { name: 'Radiation therapy chatbot' })).toBeInTheDocument()
    expect(screen.getByLabelText('Suggested questions')).toBeInTheDocument()
    expect(screen.getByLabelText('Type your question...')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })
})
