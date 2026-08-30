import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { todayIsoDay } from '../domain/dateUtils'
import { CalendarPage } from './CalendarPage'

const data = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), signOut: vi.fn() }))
vi.mock('../data/usePeriods', () => ({ usePeriods: () => ({ periods: [], loading: false }) }))
vi.mock('../data/periodRepository', () => ({ savePeriod: data.save, removePeriod: data.remove }))
vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ user: { email: 'person@example.test' }, signOut: data.signOut }) }))
describe('CalendarPage', () => {
  it('opens a one-day draft from one date selection and saves only after confirmation', async () => {
    data.save.mockReset().mockResolvedValue(undefined)
    const today = todayIsoDay()
    render(<CalendarPage/>)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${today}`) }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Add period')
    expect(data.save).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(data.save).toHaveBeenCalledWith(expect.objectContaining({ start: today, end: today }))
  })
})
