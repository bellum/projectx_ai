import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { PeriodEditor } from './PeriodEditor'

describe('PeriodEditor', () => {
  it('saves a kitten-labelled period intensity', async () => {
    const onSave = vi.fn()
    render(<PeriodEditor draft={{ id: 'period', start: '2026-10-12', end: '2026-10-16', comment: '', touchedIds: ['period'], merged: false }} today="2026-10-18" pending={false} onSave={onSave} onCancel={vi.fn()}/>)

    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('✨🐈')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Hard' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'period', intensity: 'hard' }))
  })

  it('allows an existing intensity to be cleared', async () => {
    const onSave = vi.fn()
    render(<PeriodEditor draft={{ id: 'period', start: '2026-10-12', end: '2026-10-16', comment: '', intensity: 'medium', touchedIds: ['period'], merged: false }} today="2026-10-18" pending={false} onSave={onSave} onCancel={vi.fn()}/>)

    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Medium' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave.mock.calls[0][0]).not.toHaveProperty('intensity')
  })
})
