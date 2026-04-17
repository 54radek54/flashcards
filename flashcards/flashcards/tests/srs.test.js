import test from 'node:test'
import assert from 'node:assert/strict'

import { createCard, getDueCards, updateCardAfterReview } from '../src/logic/srs.js'

test('createCard trims question and answer', () => {
  const card = createCard('  hello  ', '  czesc  ')

  assert.equal(card.question, 'hello')
  assert.equal(card.answer, 'czesc')
  assert.equal(card.intervalDays, 0)
  assert.equal(card.repetitions, 0)
})

test('updateCardAfterReview resets repetition when answer is wrong', () => {
  const card = {
    id: 'x',
    question: 'q',
    answer: 'a',
    intervalDays: 4,
    ease: 2.3,
    dueDate: Date.now() - 1000,
    repetitions: 3,
  }

  const reviewed = updateCardAfterReview(card, false)

  assert.equal(reviewed.intervalDays, 1)
  assert.equal(reviewed.repetitions, 0)
  assert.ok(reviewed.ease < card.ease)
})

test('getDueCards returns only cards due now or earlier', () => {
  const now = Date.now()
  const cards = [
    { id: '1', dueDate: now - 1 },
    { id: '2', dueDate: now + 999999 },
    { id: '3', dueDate: now },
  ]

  const due = getDueCards(cards)
  assert.deepEqual(
    due.map((card) => card.id),
    ['1', '3']
  )
})

