import React, { useState } from 'react'
import { shuffle } from './helpers'

export default function FlashcardSession({ deck, onBack }) {
  const [cards] = useState(() => shuffle(deck.cards))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const current = cards[index]
  const total = cards.length
  const progress = (index / total) * 100

  const go = (dir) => {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.max(0, Math.min(total - 1, i + dir))), 150)
  }

  if (!current) return null

  return (
    <div className="study">
      <div className="study-topbar">
        <button className="btn-back" onClick={onBack}>← Wyjdź</button>
        <div className="study-progress-wrap">
          <div className="study-progress-bar"><div className="study-progress-fill" style={{ '--deck-color': deck.color, width: `${progress}%` }} /></div>
          <span className="study-progress-label">{index + 1} / {total}</span>
        </div>
      </div>
      <div className="study-main">
        <p className="study-deck-name">{deck.emoji} {deck.name} · Fiszki</p>

        <div className={`flashcard-container ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
          <div className="flashcard-inner">
            <div className="flashcard-front" style={{ '--deck-color': deck.color }}>
              <p className="card-side-label">ZAGADNIENIE</p>
              <p className="card-stem">{current.topic}</p>
              <p className="card-tap-hint">Dotknij, aby zobaczyć wyjaśnienie</p>
            </div>
            <div className="flashcard-back" style={{ '--deck-color': deck.color }}>
              <p className="card-side-label">WYJAŚNIENIE</p>
              <p className="card-text">{current.answer}</p>
              <p className="card-tap-hint">Kliknij aby odwrócić</p>
            </div>
          </div>
        </div>

        <div className="flash-nav">
          <button className="btn-nav" onClick={() => go(-1)} disabled={index === 0}>← Poprzednia</button>
          <span className="flash-nav-counter">{index + 1} / {total}</span>
          <button className="btn-nav" onClick={() => go(1)} disabled={index === total - 1}>Następna →</button>
        </div>
      </div>
    </div>
  )
}

