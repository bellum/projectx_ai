import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { readFile } from 'node:fs/promises'

let testEnv: RulesTestEnvironment
const valid = { startedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')), endedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00Z')), isEnded: true }
beforeAll(async () => { testEnv = await initializeTestEnvironment({ projectId: 'periods-rules-test', firestore: { rules: await readFile('firestore.rules', 'utf8') } }) })
afterAll(async () => { await testEnv.cleanup() })
afterEach(async () => { await testEnv.clearFirestore() })
describe('Firestore rules', () => {
  it('denies signed-out and unapproved users but permits an approved legacy record', async () => { await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'periods/a'))); await assertFails(setDoc(doc(testEnv.authenticatedContext('unapproved').firestore(), 'periods/a'), valid)); await assertSucceeds(setDoc(doc(testEnv.authenticatedContext('approved', { calendarAccess: true }).firestore(), 'periods/a'), valid)) })
  it('accepts optional valid comments and blocks malformed/other data', async () => { const db = testEnv.authenticatedContext('approved', { calendarAccess: true }).firestore(); await assertSucceeds(setDoc(doc(db, 'periods/a'), { ...valid, comment: 'note' })); await assertFails(setDoc(doc(db, 'periods/b'), { ...valid, extra: 1 })); await assertFails(setDoc(doc(db, 'periods/c'), { ...valid, comment: 'a'.repeat(2001) })); await assertFails(setDoc(doc(db, 'private/a'), valid)) })
})
