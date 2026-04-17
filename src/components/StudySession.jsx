import React, { useState, useCallback, useEffect } from 'react'
import { getDueCards, updateCardAfterReview } from '../logic/srs'

export default function StudySession({ deck, cardStates, onBack, onUpdateCard, onMarkWrong, onResetDeck, initialCards }) {
  const [cards] = useState(() =>
    initialCards ?? getDueCards(deck.cards.map(c => ({ ...c, ...cardStates[c.id] })))
  )
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [animDir, setAnimDir] = useState(null)
  const [wrongCards, setWrongCards] = useState([])
  const [done, setDone] = useState(false)
  const [retrySession, setRetrySession] = useState(null)

  const current = cards[index] ?? null
  const total = cards.length

  const handleAnswer = useCallback((wasCorrect) => {
    if (!current) return
    setAnimDir(wasCorrect ? 'right' : 'left')
    setTimeout(() => {
      wasCorrect ? onUpdateCard(current.id, true) : (onMarkWrong(current.id), setWrongCards(p => [...p, current]))
      setFlipped(false); setAnimDir(null)
      index + 1 >= total ? setDone(true) : setIndex(i => i + 1)
    }, 300)
  }, [current, index, total, onUpdateCard, onMarkWrong])

  if (retrySession) return (
    <StudySession deck={deck} cardStates={cardStates} onBack={() => setRetrySession(null)}
      onUpdateCard={onUpdateCard} onMarkWrong={onMarkWrong} initialCards={retrySession} />
  )

  if (total === 0) {
    return (
      <div className="session-done">
        <button className="btn-back" onClick={onBack}>← Powrót</button>
        <div className="done-card">
          <div className="done-emoji">✅</div>
          <h2 className="done-title">Brak kart do powtórki</h2>
          <p className="done-sub">{deck.name}</p>
          <p className="done-detail">Masz teraz 100% opanowane. Mozesz wrocic do listy tematow albo zresetowac ten temat i powtorzyc od nowa.</p>
          <button className="btn-study done-restart" onClick={onBack}>Wroc do listy tematow</button>
          {typeof onResetDeck === 'function' && (
            <button
              className="btn-retry"
              onClick={() => {
                onResetDeck(deck.id)
                onBack()
              }}
            >
              Zresetuj temat i powtorz
            </button>
          )}
        </div>
      </div>
    )
  }

  if (done) {
    const correct = total - wrongCards.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 100
    return (
      <div className="session-done">
        <button className="btn-back" onClick={onBack}>← Powrót</button>
        <div className="done-card">
          <div className="done-emoji">{pct === 100 ? '🏆' : pct >= 70 ? '💪' : '📚'}</div>
          <h2 className="done-title">Sesja ukończona!</h2>
          <p className="done-sub">{deck.name}</p>
          <div className="done-results">
            <div className="done-result-row correct"><span className="done-result-icon">✓</span><span className="done-result-label">Poprawnie</span><span className="done-result-count">{correct}</span></div>
            <div className="done-result-row wrong"><span className="done-result-icon">✗</span><span className="done-result-label">Do poprawy</span><span className="done-result-count">{wrongCards.length}</span></div>
          </div>
          <div className="done-score"><span className="done-pct">{pct}%</span><span className="done-pct-label">poprawnych</span></div>
          {wrongCards.length > 0 && <button className="btn-retry" onClick={() => setRetrySession(wrongCards)}>↺ Powtórz błędne ({wrongCards.length})</button>}
          <button className="btn-study done-restart" onClick={onBack}>{wrongCards.length > 0 ? 'Wróć do listy' : 'Wszystko poprawnie! 🎉 Wróć'}</button>
        </div>
      </div>
    )
  }

  if (!current) return null
  const progress = (index / total) * 100
  const hasOptions = current.options?.length > 0

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
        <p className="study-deck-name">{deck.emoji} {deck.name} · Powtórki</p>
        <div className={`flashcard-container ${flipped ? 'flipped' : ''} ${animDir ? `swipe-${animDir}` : ''}`} onClick={() => setFlipped(f => !f)}>
          <div className="flashcard-inner">
            <div className="flashcard-front" style={{ '--deck-color': deck.color }}>
              <p className="card-side-label">PYTANIE</p>
              <p className="card-stem">{current.question}</p>
              {hasOptions && (
                <div className="card-options">
                  {current.options.map((text, i) => {
                    const letter = 'ABCD'[i]
                    return <div key={letter} className="card-option"><span className="option-letter">{letter}</span><span className="option-text">{text}</span></div>
                  })}
                </div>
              )}
              <p className="card-tap-hint">Dotknij, aby zobaczyć odpowiedź</p>
            </div>
            <div className="flashcard-back" style={{ '--deck-color': deck.color }}>
              <p className="card-side-label">ODPOWIEDŹ</p>
              {hasOptions ? (
                <div className="card-options card-options-answer">
                  {current.options.map((text, i) => {
                    const letter = 'ABCD'[i]
                    const isCorrect = letter === current.correct
                    return (
                      <div key={letter} className={`card-option ${isCorrect ? 'option-correct' : 'option-wrong'}`}>
                        <span className="option-letter">{letter}</span>
                        {isCorrect && <span className="option-text">{text}</span>}
                      </div>
                    )
                  })}
                </div>
              ) : <p className="card-text">{current.answer}</p>}
              <p className="card-tap-hint">Oceń swoją odpowiedź</p>
            </div>
          </div>
        </div>
        <div className={`answer-buttons ${flipped ? 'visible' : ''}`}>
          <button className="btn-answer btn-wrong" onClick={() => handleAnswer(false)}><span className="btn-icon">✗</span><span>Nie wiem</span></button>
          <button className="btn-answer btn-correct" onClick={() => handleAnswer(true)}><span className="btn-icon">✓</span><span>Wiem!</span></button>
        </div>
        {!flipped && <p className="hint-text">Kliknij kartę aby zobaczyć odpowiedź</p>}
      </div>
    </div>
  )
}



