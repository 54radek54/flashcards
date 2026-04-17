import rawDecks from '../data/tests.json'
import rawFlashDecks from '../data/flashcards.json'

const PROGRESS_KEY = 'flashcards.progress.v1'

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
      id: deck.id ?? `flash-deck-${deckIndex + 1}`,
      year: deck.year ?? 2018,
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

export function getDecks() {
  return rawDecks
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
