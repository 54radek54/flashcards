import React, { useState } from 'react'

export default function DeckOverview({ deck, cardStates, onBack, onResetDeck, onRescheduleCard }) {
  const now = Date.now()
  const enriched = deck.cards.map(c => ({ ...c, ...cardStates[c.id] }))
  const due = enriched.filter(c => c.dueDate <= now).length
  const learned = enriched.filter(c => c.repetitions >= 1).length
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="deck-overview">
      <button className="btn-back" onClick={onBack}>← Powrót</button>

      <div className="deck-hero" style={{ '--deck-color': deck.color }}>
        <span className="deck-hero-emoji">{deck.emoji}</span>
        <h1 className="deck-hero-title">{deck.name}</h1>
        <div className="deck-hero-stats">
          <div className="hero-stat"><span className="hero-stat-n">{deck.cards.length}</span><span className="hero-stat-l">Wszystkich</span></div>
          <div className="hero-stat"><span className="hero-stat-n">{due}</span><span className="hero-stat-l">Do powtórki</span></div>
          <div className="hero-stat"><span className="hero-stat-n">{learned}</span><span className="hero-stat-l">Poznane</span></div>
        </div>
        <button
          className={`btn-reset-hero ${confirmReset ? 'confirming' : ''}`}
          onClick={() => { if (confirmReset) { onResetDeck(deck.id); setConfirmReset(false) } else setConfirmReset(true) }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? '⚠️ Na pewno reset?' : '↺ Resetuj postęp'}
        </button>
      </div>

      <div className="card-list-section" style={{ marginTop: 20 }}>
        <h2 className="section-title">Wszystkie fiszki</h2>
        <p className="card-list-hint">Kliknij kartę aby dodać ją do powtórki</p>
        <div className="card-list">
          {deck.cards.map(card => {
            const state = cardStates[card.id]
            const isDue = state && state.dueDate <= Date.now()
            const isMastered = state && state.repetitions >= 3
            return (
              <div
                key={card.id}
                className={`card-list-row ${isMastered ? 'mastered' : isDue ? 'due' : 'upcoming'} clickable`}
                onClick={() => onRescheduleCard(card.id)}
                title="Kliknij aby ustawić do powtórki teraz"
              >
                <div className="card-row-content">
                  <p className="card-row-q">{card.question}</p>
                  {card.correct && card.options?.length > 0 && (
                    <p className="card-row-a">
                      Odp: <strong>{card.correct}</strong>
                      {') ' + card.options['ABCD'.indexOf(card.correct)]}
                    </p>
                  )}
                </div>
                <div className="card-row-actions">
                  <span className="card-row-badge">{isMastered ? '✓' : isDue ? '●' : '○'}</span>
                  <span className="card-reschedule-btn">↺</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

