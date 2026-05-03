import rawFlashDecks from '../data/flashcards.json'

// Wczytaj wszystkie JSONy z katalogu test-data eagerly
const testDataModules = import.meta.glob('../data/test-data/*.json', { eager: true })
const rawDecks = Object.values(testDataModules).flatMap(m => m.default ?? m)

const PROGRESS_KEY = 'flashcards.progress.v1'

function normalizeSession(value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (['spring', 'wiosna', 's'].includes(v)) return 'spring'
  if (['autumn', 'fall', 'jesien', 'jesień', 'a', 'j'].includes(v)) return 'autumn'
  return 'spring'
}

function resolveAnswer(card) {
  if (card.answer) return card.answer
  if (!card.options || !card.correct) return ''
  const idx = 'ABCD'.indexOf(String(card.correct))
  return idx >= 0 ? (card.options[idx] ?? '') : ''
}

function normalizeFlashDecks(inputDecks) {
  const decks = Array.isArray(inputDecks) ? inputDecks : [inputDecks]
  return decks
    .filter(Boolean)
    .map((deck, deckIndex) => ({
      id: deck.id ?? `flash-deck-${deck.year ?? 2018}-${normalizeSession(deck.session)}-${deckIndex + 1}`,
      year: deck.year ?? 2018,
      session: normalizeSession(deck.session),
      name: deck.name ?? `Fiszki ${deck.year ?? ''}`.trim(),
      emoji: deck.emoji ?? '🃏',
      color: deck.color ?? '#0891b2',
      cards: Array.isArray(deck.cards)
        ? deck.cards.map((card, cardIndex) => ({
            id: card.id ?? cardIndex + 1,
            topic: card.topic ?? card.question ?? '',
            answer: resolveAnswer(card),
          }))
        : [],
    }))
}

function normalizeTestDecks(inputDecks) {
  const decks = Array.isArray(inputDecks) ? inputDecks : [inputDecks]
  return decks
    .filter(Boolean)
    .map((deck, deckIndex) => {
      const year = deck.year ?? 2018
      const session = normalizeSession(deck.session)
      const baseDeckId = deck.id ?? `test-deck-${deckIndex + 1}`
      // Zawieramy rok i sesję w deckId, aby uid kart był globalnie unikalny
      // nawet jeśli różne lata mają talię o tym samym id (np. "deck-chirurgia-ogolna")
      const deckId = `${baseDeckId}--${year}-${session}`
      return {
        ...deck,
        id: deckId,
        year,
        session,
        // Każda karta dostaje globalnie unikalne uid = "deckId__cardId"
        // dzięki temu stany kart z różnych lat/sesji nie kolidują ze sobą
        cards: Array.isArray(deck.cards)
          ? deck.cards.map(card => ({ ...card, uid: `${deckId}__${card.id}` }))
          : [],
      }
    })
}

export function getDecks() {
  return normalizeTestDecks(rawDecks)
}

export function getFlashDecks() {
  return normalizeFlashDecks(rawFlashDecks)
}

export function loadProgress() {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error('Failed to save progress', e)
  }
}
