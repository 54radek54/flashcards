function roundToTwo(num) {
  return Math.round(num * 100) / 100
}

export function createCard(question, answer) {
  return {
    id: `card-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    question: question.trim(),
    answer: answer.trim(),
    intervalDays: 0,
    ease: 2.5,
    dueDate: Date.now(),
    repetitions: 0,
  }
}

export function updateCardAfterReview(card, wasCorrect) {
  const minEase = 1.3
  const maxEase = 2.8
  const easeStep = wasCorrect ? 0.1 : -0.2
  const nextEase = Math.max(minEase, Math.min(maxEase, card.ease + easeStep))

  let nextInterval
  if (!wasCorrect) {
    nextInterval = 1
  } else if (card.repetitions === 0) {
    nextInterval = 1
  } else if (card.repetitions === 1) {
    nextInterval = 3
  } else {
    nextInterval = Math.max(1, Math.round(card.intervalDays * nextEase))
  }

  const nextRepetitions = wasCorrect ? card.repetitions + 1 : 0
  const nextDueDate = Date.now() + nextInterval * 24 * 60 * 60 * 1000

  return {
    ...card,
    ease: roundToTwo(nextEase),
    intervalDays: nextInterval,
    dueDate: nextDueDate,
    repetitions: nextRepetitions,
  }
}

export function getDueCards(cards) {
  const now = Date.now()
  return cards.filter((card) => card.dueDate <= now)
}

