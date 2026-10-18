import { combinedComment, createDraft, hardestIntensity, normalizeRange, touchedPeriods } from './periodRules'
import type { Period } from '../types/period'
const periods: Period[] = [{ id: 'b', start: '2024-02-03', end: '2024-02-04', comment: 'later', intensity: 'light' }, { id: 'a', start: '2024-02-01', end: '2024-02-02', comment: 'first', intensity: 'medium' }, { id: 'c', start: '2024-02-06', end: '2024-02-07', comment: '', intensity: 'hard' }]
describe('period rules', () => {
  it('normalizes reversed ranges and includes touching records', () => { expect(normalizeRange('2024-02-03', '2024-02-01')).toEqual({ start: '2024-02-01', end: '2024-02-03' }); expect(touchedPeriods(periods, '2024-02-05', '2024-02-05').map(item => item.id)).toEqual(['b', 'c']) })
  it('merges bounds, comments, and the hardest intensity', () => { const draft = createDraft(periods, '2024-02-05', '2024-02-05'); expect(draft).toMatchObject({ start: '2024-02-03', end: '2024-02-07', touchedIds: ['b', 'c'], comment: 'later', intensity: 'hard' }); expect(combinedComment(periods)).toBe('first\n\nlater'); expect(hardestIntensity(periods)).toBe('hard') })
})
