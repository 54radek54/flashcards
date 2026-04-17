// Helper functions for flashcard app

export function buildCardStates(decks, progress) {
  const now = Date.now()
  const result = {}
  for (const deck of decks) {
    for (const card of deck.cards) {
      const saved = progress[card.id]
      result[card.id] = saved ?? { id: card.id, intervalDays: 0, ease: 2.5, dueDate: now, repetitions: 0 }
    }
  }
  return result
}

export function freshState(cardId) {
  return { id: cardId, intervalDays: 0, ease: 2.5, dueDate: Date.now(), repetitions: 0 }
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildYearDeck(sourceDecks, year, config = {}) {
  const {
    id = `year-${year}`,
    name = `Rok ${year}`,
    emoji = '📚',
    color = '#6366f1',
  } = config

  const yearDecks = sourceDecks.filter((deck) => deck.year === year)
  const cards = yearDecks.flatMap((deck) =>
    deck.cards.map((card) => ({
      ...card,
      id: `${deck.id}-${card.id}`,
      sourceDeckId: deck.id,
      sourceDeckName: deck.name,
      year,
    }))
  )

  return {
    id,
    year,
    name,
    emoji,
    color,
    cards,
  }
}

