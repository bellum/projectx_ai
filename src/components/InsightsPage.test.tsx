import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { InsightsPage } from './InsightsPage'

const data = vi.hoisted(() => ({ signOut: vi.fn(), analytics: { periodCount: 4, latest: { id: 'latest', start: '2024-10-10', end: '2024-10-14' }, intervals: [{ periodId: 'oldest', previousStart: '2022-01-05', start: '2022-01-10', end: '2022-01-14', intervalDays: 27, intensity: 'light' }, { periodId: 'first', previousStart: '2023-01-05', start: '2023-01-10', end: '2023-01-14', intervalDays: 28, intensity: 'medium' }, { periodId: 'latest', previousStart: '2023-01-10', start: '2024-10-10', end: '2024-10-14', intervalDays: 32, intensity: 'hard' }] } }))
vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ user: { email: 'person@example.test' }, signOut: data.signOut }) }))
vi.mock('../data/usePeriodAnalytics', () => ({ usePeriodAnalytics: () => ({ value: data.analytics, loading: false }) }))

describe('InsightsPage', () => {
  it('shows a 24-month chart and lets users navigate to older interval history', async () => {
    const onCalendar = vi.fn()
    render(<InsightsPage onCalendar={onCalendar}/>)
    expect(screen.getByText('24 months')).toBeInTheDocument()
    expect(screen.getByText('Typical interval')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show newer interval history' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Show older interval history' }))
    expect(screen.getAllByText('27 days')).not.toHaveLength(0)
    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }))
    expect(onCalendar).toHaveBeenCalledOnce()
  })
  it('shows a vertical cursor and concise month span on hover and touch', () => {
    const { container } = render(<InsightsPage onCalendar={vi.fn()}/>)
    expect(screen.getByLabelText('Period intensity colors')).toHaveTextContent('LightMediumHard')
    expect(container.querySelector('circle.intensity-marker[data-intensity="hard"]')).toBeInTheDocument()
    expect(container.querySelector('circle:not(.intensity-marker)[data-intensity]')).not.toBeInTheDocument()
    const chart = screen.getByRole('img', { name: /Interval line chart/ })
    Object.defineProperty(chart, 'getBoundingClientRect', { configurable: true, value: () => ({ left: 0, width: 720 }) })
    fireEvent.pointerMove(chart, { clientX: 44, pointerType: 'mouse' })
    expect(screen.getByRole('status')).toHaveTextContent('January 2023: 28 days · January 2023 period: Medium')
    expect(screen.getByTestId('interval-cursor')).toBeInTheDocument()
    fireEvent.pointerDown(chart, { clientX: 702, pointerType: 'touch' })
    expect(screen.getByRole('status')).toHaveTextContent('January 2023 – October 2024: 32 days · October 2024 period: Hard')
  })
})
