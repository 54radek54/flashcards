// Helper functions for flashcard app

// Używamy card.uid (globalnie unikalne) jako klucza stanu jeśli istnieje,
// w p.p. fallback na card.id (starszy format, np. fiszki)
export function cardKey(card) {
  return card.uid ?? card.id
}

export function buildCardStates(decks, progress) {
  const now = Date.now()
  const result = {}
  for (const deck of decks) {
    for (const card of deck.cards) {
      const key = cardKey(card)
      const saved = progress[key]
      result[key] = saved ?? { id: key, intervalDays: 0, ease: 2.5, dueDate: now, repetitions: 0 }
    }
  }
  return result
}

export function freshState(key) {
  return { id: key, intervalDays: 0, ease: 2.5, dueDate: Date.now(), repetitions: 0 }
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
    session,
  } = config

  const yearDecks = sourceDecks.filter((deck) => {
    if (deck.year !== year) return false
    if (!session) return true
    return deck.session === session
  })
  const cards = yearDecks.flatMap((deck) =>
    deck.cards.map((card) => ({
      ...card,
      id: `${deck.id}-${card.id}`,
      sourceDeckId: deck.id,
      sourceDeckName: deck.name,
      year,
      session: deck.session,
    }))
  )

  return {
    id,
    year,
    session,
    name,
    emoji,
    color,
    cards,
  }
}

