import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { MonthGrid } from './MonthGrid'

describe('MonthGrid range selection', () => {
  afterEach(() => vi.restoreAllMocks())
  it('creates an inclusive range from a drag without also treating it as a tap', () => {
    const onSelect = vi.fn(), onRange = vi.fn()
    render(<MonthGrid month="2024-05-01" periods={[]} today="2024-05-20" predicted={[]} onSelect={onSelect} onRange={onRange}/>)
    const start = screen.getByRole('button', { name: /^2024-05-10$/ }), end = screen.getByRole('button', { name: /^2024-05-12$/ })
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => end) })
    fireEvent.pointerDown(start, { button: 0, pointerId: 1 })
    fireEvent.pointerMove(start, { clientX: 12, clientY: 12, pointerId: 1 })
    fireEvent.pointerUp(start, { pointerId: 1 })
    fireEvent.click(start)
    expect(onRange).toHaveBeenCalledWith('2024-05-10', '2024-05-12')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
