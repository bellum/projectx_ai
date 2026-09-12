import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { InsightsPage } from './InsightsPage'

const data = vi.hoisted(() => ({ signOut: vi.fn(), analytics: { periodCount: 4, latest: { id: 'latest', start: '2024-10-10', end: '2024-10-14' }, intervals: [{ periodId: 'oldest', start: '2022-01-10', end: '2022-01-14', intervalDays: 27 }, { periodId: 'first', start: '2023-01-10', end: '2023-01-14', intervalDays: 28 }, { periodId: 'latest', start: '2024-10-10', end: '2024-10-14', intervalDays: 32 }] } }))
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
})
