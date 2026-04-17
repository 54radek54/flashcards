import React, { useState } from 'react'
import { shuffle } from './helpers'

const TEST_COUNT = 20

export default function TestSession({ deck, onBack }) {
  const [questions] = useState(() => shuffle(deck.cards).slice(0, Math.min(TEST_COUNT, deck.cards.length)))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)

  const current = questions[index]
  const total = questions.length
  const progress = (index / total) * 100

  const handleSelect = (letter) => {
    setSelected(letter)
  }

  const handleConfirm = () => {
    if (!selected) return
    const isCorrect = selected === current.correct
    setAnswers(prev => [...prev, {
      id: current.id,
      correct: isCorrect,
      chosen: selected,
      expected: current.correct,
      question: current.question,
      options: current.options,
    }])

    if (index + 1 >= total) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setSelected(null)
    }
  }

  if (done) {
    const correctCount = answers.filter(a => a.correct).length
    const pct = Math.round((correctCount / total) * 100)

    if (reviewMode) {
      const reviewItem = answers[reviewIndex]
      if (!reviewItem) return null

      return (
        <div className="study">
          <div className="study-topbar">
            <button className="btn-back" onClick={() => setReviewMode(false)}>← Wynik</button>
            <div className="study-progress-wrap">
              <div className="study-progress-bar">
                <div className="study-progress-fill" style={{ '--deck-color': deck.color, width: `${(reviewIndex / total) * 100}%` }} />
              </div>
              <span className="study-progress-label">{reviewIndex + 1} / {total}</span>
            </div>
          </div>

          <div className="study-main">
            <p className="study-deck-name">{deck.emoji} {deck.name} · Podgląd testu</p>
            <div className="test-card" style={{ '--deck-color': deck.color }}>
              <p className="card-side-label">PYTANIE {reviewIndex + 1}</p>
              <p className="test-question">{reviewItem.question}</p>
            </div>

            <div className="test-options">
              {reviewItem.options.map((text, i) => {
                const letter = 'ABCD'[i]
                let cls = 'test-option'
                if (letter === reviewItem.expected) cls += ' test-opt-correct'
                else if (letter === reviewItem.chosen) cls += ' test-opt-wrong'
                else cls += ' test-opt-dim'
                return (
                  <div key={letter} className={cls}>
                    <span className="option-letter">{letter}</span>
                    <span className="option-text">{text}</span>
                  </div>
                )
              })}
            </div>

            <p className={`test-feedback ${reviewItem.correct ? 'feedback-ok' : 'feedback-err'}`}>
              Twoja odpowiedź: {reviewItem.chosen} | Poprawna: {reviewItem.expected}
            </p>

            <div className="flash-nav">
              <button className="btn-nav" onClick={() => setReviewIndex(i => Math.max(0, i - 1))} disabled={reviewIndex === 0}>← Poprzednie</button>
              <span className="flash-nav-counter">{reviewIndex + 1} / {total}</span>
              <button className="btn-nav" onClick={() => setReviewIndex(i => Math.min(total - 1, i + 1))} disabled={reviewIndex === total - 1}>Następne →</button>
            </div>

            <button className="btn-study done-restart" onClick={onBack} style={{ marginTop: 12 }}>
              Wróć do menu
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="session-done">
        <button className="btn-back" onClick={onBack}>← Powrót</button>
        <div className="done-card">
          <div className="done-emoji">{pct >= 90 ? '🏆' : pct >= 70 ? '💪' : '📚'}</div>
          <h2 className="done-title">Wynik testu</h2>
          <p className="done-sub">{deck.name} · {total} pytań</p>
          <div className="done-results">
            <div className="done-result-row correct"><span className="done-result-icon">✓</span><span className="done-result-label">Poprawne</span><span className="done-result-count">{correctCount}</span></div>
            <div className="done-result-row wrong"><span className="done-result-icon">✗</span><span className="done-result-label">Błędne</span><span className="done-result-count">{total - correctCount}</span></div>
          </div>
          <div className="done-score"><span className="done-pct">{pct}%</span><span className="done-pct-label">poprawnych</span></div>

          <button className="btn-study" onClick={() => { setReviewIndex(0); setReviewMode(true) }}>
            Podejrzyj test
          </button>

          <button className="btn-study done-restart" onClick={onBack}>Wróć do menu</button>
        </div>
      </div>
    )
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
        <p className="study-deck-name">{deck.emoji} {deck.name} · Test</p>

        <div className="test-card" style={{ '--deck-color': deck.color }}>
          <p className="card-side-label">PYTANIE {index + 1}</p>
          <p className="test-question">{current.question}</p>
        </div>

        <div className="test-options">
          {current.options.map((text, i) => {
            const letter = 'ABCD'[i]
            let cls = 'test-option'
            if (selected === letter) {
              cls += ' test-opt-selected'
            }
            return (
              <button key={letter} className={cls} onClick={() => handleSelect(letter)}>
                <span className="option-letter">{letter}</span>
                <span className="option-text">{text}</span>
              </button>
            )
          })}
        </div>

        {selected && (
          <button className="btn-confirm" style={{ '--deck-color': deck.color }} onClick={handleConfirm}>
            Zatwierdź odpowiedź
          </button>
        )}
        <p className="test-feedback">Poprawne odpowiedzi zobaczysz po zakończeniu testu.</p>
      </div>
    </div>
  )
}

