import React, { useState, useEffect } from 'react'
import { shuffle } from './helpers'

const TEST_COUNT = 20

export default function TestSession({ deck, onBack }) {
  const count = deck.testCount ?? TEST_COUNT
  const [questions] = useState(() => shuffle(deck.cards).slice(0, Math.min(count, deck.cards.length)))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewMode, setReviewMode] = useState(false)
  const [animating, setAnimating] = useState(false)

  const current = questions[index]
  const total = questions.length
  const progress = ((index + (confirmed ? 1 : 0)) / total) * 100
  const color = deck.color ?? '#8b5cf6'

  // Keyboard shortcuts
  useEffect(() => {
    if (done) return
    const handler = (e) => {
      if (confirmed) {
        if (e.key === 'Enter' || e.key === 'ArrowRight') handleNext()
        return
      }
      if (e.key === '1' || e.key === 'a') handleSelect('A')
      if (e.key === '2' || e.key === 'b') handleSelect('B')
      if (e.key === '3' || e.key === 'c') handleSelect('C')
      if (e.key === '4' || e.key === 'd') handleSelect('D')
      if (e.key === 'Enter' && selected) handleConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, confirmed, done, index])

  function handleSelect(letter) {
    if (confirmed || animating) return
    setSelected(letter)
  }

  function handleConfirm() {
    if (!selected || confirmed || animating) return
    const isCorrect = selected === current.correct
    setConfirmed(true)
    setAnswers(prev => [...prev, {
      id: current.id,
      correct: isCorrect,
      chosen: selected,
      expected: current.correct,
      question: current.question,
      options: current.options,
    }])
  }

  function handleNext() {
    if (!confirmed || animating) return
    setAnimating(true)
    setTimeout(() => {
      if (index + 1 >= total) {
        setDone(true)
      } else {
        setIndex(i => i + 1)
        setSelected(null)
        setConfirmed(false)
      }
      setAnimating(false)
    }, 200)
  }

  // ── REVIEW MODE ─────────────────────────────────────────────────────
  if (done && reviewMode) {
    const item = answers[reviewIndex]
    if (!item) return null
    return (
      <div className="ts-wrap">
        <div className="ts-topbar">
          <button className="ts-back-btn" onClick={() => setReviewMode(false)}>← Wyniki</button>
          <div className="ts-progress-wrap">
            <div className="ts-progress-track">
              <div className="ts-progress-fill" style={{ '--c': color, width: `${((reviewIndex + 1) / total) * 100}%` }} />
            </div>
            <span className="ts-progress-label">{reviewIndex + 1} / {total}</span>
          </div>
          <span className={`ts-answer-badge ${item.correct ? 'ok' : 'err'}`}>
            {item.correct ? '✓' : '✗'}
          </span>
        </div>

        <div className="ts-body ts-body-review">
          <p className="ts-deck-label">{deck.emoji} {deck.name} · Przegląd</p>
          <div className={`ts-question-card ${item.correct ? 'ts-card-ok' : 'ts-card-err'}`} style={{ '--c': color }}>
            <span className="ts-q-num">Pyt. {reviewIndex + 1}</span>
            <p className="ts-question-text">{item.question}</p>
          </div>

          <div className="ts-options">
            {item.options.map((text, i) => {
              const letter = 'ABCD'[i]
              const isCorrect = letter === item.expected
              const isChosen = letter === item.chosen
              const isWrong = isChosen && !isCorrect
              return (
                <div key={letter}
                  className={`ts-option ts-option-review ${isCorrect ? 'ts-opt-correct' : isWrong ? 'ts-opt-wrong' : 'ts-opt-dim'}`}
                  style={{ '--c': color }}>
                  <span className={`ts-opt-letter ${isCorrect ? 'letter-ok' : isWrong ? 'letter-err' : ''}`}>{letter}</span>
                  <span className="ts-opt-text">{text}</span>
                  {isCorrect && <span className="ts-opt-tag ts-opt-tag-ok">✓ poprawna</span>}
                  {isWrong && <span className="ts-opt-tag ts-opt-tag-err">✗ twoja</span>}
                </div>
              )
            })}
          </div>

          <div className="ts-review-nav">
            <button className="ts-nav-btn" onClick={() => setReviewIndex(i => Math.max(0, i - 1))} disabled={reviewIndex === 0}>← Poprzednie</button>
            <div className="ts-review-dots">
              {answers.map((a, i) => (
                <button key={i} onClick={() => setReviewIndex(i)}
                  className={`ts-dot ${i === reviewIndex ? 'active' : ''} ${a.correct ? 'dot-ok' : 'dot-err'}`} />
              ))}
            </div>
            <button className="ts-nav-btn" onClick={() => setReviewIndex(i => Math.min(total - 1, i + 1))} disabled={reviewIndex === total - 1}>Następne →</button>
          </div>
        </div>
      </div>
    )
  }

  // ── DONE SCREEN ──────────────────────────────────────────────────────
  if (done) {
    const correctCount = answers.filter(a => a.correct).length
    const pct = Math.round((correctCount / total) * 100)
    const wrongAnswers = answers.filter(a => !a.correct)
    return (
      <div className="ts-done-wrap">
        <div className="ts-done-card">
          <div className="ts-done-emoji">{pct >= 90 ? '🏆' : pct >= 70 ? '💪' : pct >= 50 ? '📖' : '🎯'}</div>
          <h2 className="ts-done-title">Wynik testu</h2>
          <p className="ts-done-sub">{deck.emoji} {deck.name} · {total} pytań</p>

          <div className="ts-done-score-ring" style={{ '--c': color, '--pct': pct }}>
            <svg viewBox="0 0 100 100" className="ts-ring-svg">
              <circle cx="50" cy="50" r="42" className="ts-ring-bg" />
              <circle cx="50" cy="50" r="42" className="ts-ring-fill"
                style={{ strokeDasharray: `${pct * 2.638} 263.8`, stroke: color }} />
            </svg>
            <div className="ts-ring-label">
              <span className="ts-ring-pct">{pct}%</span>
              <span className="ts-ring-sub">poprawnych</span>
            </div>
          </div>

          <div className="ts-done-stats">
            <div className="ts-done-stat ts-stat-ok">
              <span className="ts-stat-icon">✓</span>
              <span className="ts-stat-val">{correctCount}</span>
              <span className="ts-stat-lbl">poprawne</span>
            </div>
            <div className="ts-done-stat ts-stat-err">
              <span className="ts-stat-icon">✗</span>
              <span className="ts-stat-val">{total - correctCount}</span>
              <span className="ts-stat-lbl">błędne</span>
            </div>
          </div>

          <div className="ts-done-actions">
            <button className="ts-done-btn ts-done-btn-primary" style={{ '--c': color }}
              onClick={() => { setReviewIndex(0); setReviewMode(true) }}>
              🔍 Przejrzyj odpowiedzi
            </button>
            <button className="ts-done-btn ts-done-btn-secondary" onClick={onBack}>
              ← Wróć
            </button>
          </div>

          {wrongAnswers.length > 0 && (
            <div className="ts-done-wrong-list">
              <p className="ts-done-wrong-title">Błędne odpowiedzi ({wrongAnswers.length})</p>
              {wrongAnswers.map((a, i) => (
                <div key={i} className="ts-done-wrong-item">
                  <p className="ts-done-wrong-q">{a.question}</p>
                  <p className="ts-done-wrong-a">Twoja: <strong>{a.chosen}</strong> · Poprawna: <strong className="ts-ok-letter">{a.expected}</strong></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── QUIZ VIEW ────────────────────────────────────────────────────────
  if (!current) return null

  return (
    <div className="ts-wrap">
      <div className="ts-topbar">
        <button className="ts-back-btn" onClick={onBack}>← Wyjdź</button>
        <div className="ts-progress-wrap">
          <div className="ts-progress-track">
            <div className="ts-progress-fill" style={{ '--c': color, width: `${progress}%` }} />
          </div>
          <span className="ts-progress-label">{index + 1} / {total}</span>
        </div>
        <div className="ts-score-live">
          <span className="ts-score-ok">{answers.filter(a => a.correct).length}✓</span>
          <span className="ts-score-err">{answers.filter(a => !a.correct).length}✗</span>
        </div>
      </div>

      <div className={`ts-body ${animating ? 'ts-body-exit' : 'ts-body-enter'}`}>
        <p className="ts-deck-label">{deck.emoji} {deck.name}</p>

        <div className={`ts-question-card ${confirmed ? (selected === current.correct ? 'ts-card-ok' : 'ts-card-err') : ''}`} style={{ '--c': color }}>
          <span className="ts-q-num">Pytanie {index + 1} z {total}</span>
          <p className="ts-question-text">{current.question}</p>
        </div>

        <div className="ts-options">
          {current.options.map((text, i) => {
            const letter = 'ABCD'[i]
            const isSelected = selected === letter
            const isCorrect = confirmed && letter === current.correct
            const isWrong = confirmed && isSelected && letter !== current.correct
            const isDim = confirmed && !isSelected && letter !== current.correct
            return (
              <button
                key={letter}
                className={`ts-option ${isSelected && !confirmed ? 'ts-opt-selected' : ''} ${isCorrect ? 'ts-opt-correct' : ''} ${isWrong ? 'ts-opt-wrong' : ''} ${isDim ? 'ts-opt-dim' : ''}`}
                style={{ '--c': color }}
                onClick={() => handleSelect(letter)}
                disabled={confirmed}
              >
                <span className={`ts-opt-letter ${isCorrect ? 'letter-ok' : isWrong ? 'letter-err' : isSelected ? 'letter-sel' : ''}`}>{letter}</span>
                <span className="ts-opt-text">{text}</span>
                {isCorrect && <span className="ts-opt-icon">✓</span>}
                {isWrong && <span className="ts-opt-icon ts-opt-icon-err">✗</span>}
              </button>
            )
          })}
        </div>

        {!confirmed && (
          <button
            className="ts-confirm-btn"
            style={{ '--c': color }}
            onClick={handleConfirm}
            disabled={!selected}
          >
            Zatwierdź
          </button>
        )}

        {confirmed && (
          <div className={`ts-feedback-bar ${selected === current.correct ? 'fb-ok' : 'fb-err'}`}>
            <span className="fb-icon">{selected === current.correct ? '🎉' : '❌'}</span>
            <span className="fb-text">
              {selected === current.correct ? 'Świetnie! Poprawna odpowiedź.' : `Błąd. Poprawna: ${current.correct}`}
            </span>
            <button className="fb-next-btn" onClick={handleNext}>
              {index + 1 < total ? 'Dalej →' : 'Pokaż wynik'}
            </button>
          </div>
        )}

        {!confirmed && (
          <p className="ts-hint">Klawisze: 1–4 wybór · Enter zatwierdź</p>
        )}
      </div>
    </div>
  )
}

