import React, { useMemo, useState } from 'react'
import TestSession from './TestSession'
import { shuffle } from './helpers'

const SESSION_LABEL = { spring: 'Wiosna', autumn: 'Jesień' }
const SESSION_EMOJI = { spring: '🌸', autumn: '🍂' }

function normalizeQ(text) {
  return String(text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// Normalizacja treści odpowiedzi — usuwa interpunkcję na końcu, spacje, wielkie litery
function normalizeAnswer(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:!?]+$/, '') // usuń interpunkcję na końcu
    .trim()
}

/**
 * Buduje listę pytań powtarzających się w więcej niż jednej sesji/roku.
 * Zwraca tablicę grup: { question, occurrences: [{year, session, deckName, options, correct, correctText}] }
 */
function buildRepeats(decks) {
  const map = new Map()

  for (const deck of decks) {
    for (const card of deck.cards) {
      const key = normalizeQ(card.question)
      if (!key) continue
      if (!map.has(key)) map.set(key, { question: card.question, occurrences: [] })
      const correctIdx = 'ABCD'.indexOf(String(card.correct ?? ''))
      const correctText = correctIdx >= 0 && Array.isArray(card.options)
        ? card.options[correctIdx]
        : (card.correct ?? '—')
      map.get(key).occurrences.push({
        year: deck.year,
        session: deck.session,
        deckName: deck.name,
        options: card.options ?? [],
        correct: card.correct,
        correctText,
      })
    }
  }

  return [...map.values()]
    .filter(g => g.occurrences.length > 1)
    .sort((a, b) => b.occurrences.length - a.occurrences.length)
}

export default function RepeatReport({ decks, onBack }) {
  const groups = useMemo(() => buildRepeats(decks), [decks])
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [onlyDiff, setOnlyDiff] = useState(false)
  const [minCount, setMinCount] = useState(2)
  const [testDeck, setTestDeck] = useState(null)
  const [testCount, setTestCount] = useState(20)

  const filtered = groups
    .filter(g => !search.trim() || normalizeQ(g.question).includes(normalizeQ(search)))
    .filter(g => g.occurrences.length >= minCount)
    .filter(g => {
      if (!onlyDiff) return true
      const uniqueTexts = new Set(g.occurrences.map(o => normalizeAnswer(o.correctText)))
      return uniqueTexts.size > 1
    })

  const maxCount = groups.length > 0 ? Math.max(...groups.map(g => g.occurrences.length)) : 10

  function buildTestDeck() {
    // Dla każdego pytania bierz opcje z najnowszego wystąpienia
    const allCards = filtered
      .filter(g => g.occurrences.some(o => o.options?.length > 0))
      .map((g, i) => {
        const withOptions = [...g.occurrences].filter(o => o.options?.length > 0)
        const latest = withOptions.sort((a, b) => b.year !== a.year ? b.year - a.year : b.session.localeCompare(a.session))[0]
        return {
          id: i + 1,
          question: g.question,
          options: latest.options,
          correct: latest.correct,
          uid: `repeat-${i}`,
        }
      })
    const cards = shuffle(allCards).slice(0, Math.min(testCount, allCards.length))
    return {
      id: 'repeat-test',
      name: 'Powtarzające się pytania',
      emoji: '🔁',
      color: '#8b5cf6',
      cards,
      testCount: cards.length,
    }
  }

  function toggle(idx) {
    setExpanded(prev => prev === idx ? null : idx)
  }

  // Tryb testu
  if (testDeck) {
    return (
      <TestSession
        deck={testDeck}
        onBack={() => setTestDeck(null)}
      />
    )
  }

  return (
    <div className="repeat-report">
      <div className="repeat-report-header">
        <div className="repeat-report-header-top">
          <button className="btn-back" onClick={onBack}>← Wróć</button>
          <div className="repeat-report-title-wrap">
            <h1 className="repeat-report-title">🔁 Powtarzające się pytania</h1>
            <p className="repeat-report-sub">
              Znaleziono <strong>{groups.length}</strong> pytań pojawiających się w więcej niż jednej sesji
            </p>
          </div>
        </div>
        <div className="repeat-test-controls">
          {(() => {
            const available = filtered.filter(g => g.occurrences.some(o => o.options?.length > 0)).length
            const willTest = Math.min(testCount, available)
            return (
              <>
                <div className="repeat-test-count-pills">
                  {[10, 20, 30, 40, 60, 70, 140, Infinity].map(n => (
                    <button
                      key={n}
                      className={`year-pill ${testCount === n ? 'active' : ''} ${n !== Infinity && n > available ? 'empty' : ''}`}
                      onClick={() => setTestCount(n)}
                      disabled={n !== Infinity && n > available}
                      title={n !== Infinity && n > available ? `Tylko ${available} dostępnych pytań` : n === Infinity ? `Wszystkie (${available})` : `${n} pytań`}
                    >
                      {n === Infinity ? 'Wszystkie' : n}
                    </button>
                  ))}
                </div>
                <button
                  className="repeat-test-start-btn"
                  onClick={() => setTestDeck(buildTestDeck())}
                  disabled={available === 0}
                >
                  🧪 Testuj {willTest} {willTest === 1 ? 'pytanie' : willTest < 5 ? 'pytania' : 'pytań'}
                </button>
              </>
            )
          })()}
        </div>
      </div>

      <div className="repeat-search-wrap">
        <input
          className="repeat-search"
          type="text"
          placeholder="🔍 Szukaj pytania..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className={`repeat-filter-btn ${onlyDiff ? 'active' : ''}`}
          onClick={() => setOnlyDiff(v => !v)}
        >
          ⚠️ Tylko różne odpowiedzi
        </button>
      </div>

      <div className="repeat-count-filter">
        <label className="repeat-count-label">
          Min. powtórzeń: <strong>{minCount}</strong>
        </label>
        <div className="repeat-count-pills">
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(n => n <= maxCount).map(n => (
            <button
              key={n}
              className={`year-pill ${minCount === n ? 'active' : ''}`}
              onClick={() => setMinCount(n)}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="repeat-empty">Brak wyników dla „{search}"</div>
      )}

      <div className="repeat-list">
        {filtered.map((group, idx) => {
          const isOpen = expanded === idx
          // zbieramy zbiór unikalnych treści odpowiedzi (po normalizacji)
          const uniqueTexts = new Set(group.occurrences.map(o => normalizeAnswer(o.correctText)))
          const allSame = uniqueTexts.size === 1
          // posortowana kopia — nie mutujemy oryginału
          const sorted = [...group.occurrences].sort((a, b) =>
            a.year !== b.year ? a.year - b.year : a.session.localeCompare(b.session)
          )
          // dominująca odpowiedź (najczęściej występująca treść)
          const dominantText = [...uniqueTexts].reduce((best, t) => {
            const count = group.occurrences.filter(o => normalizeAnswer(o.correctText) === t).length
            const bestCount = group.occurrences.filter(o => normalizeAnswer(o.correctText) === best).length
            return count > bestCount ? t : best
          }, [...uniqueTexts][0])

          return (
            <div key={idx} className={`repeat-card ${isOpen ? 'open' : ''}`}>
              <button className="repeat-card-header" onClick={() => toggle(idx)}>
                <div className="repeat-card-left">
                  <span className="repeat-count-badge">{group.occurrences.length}×</span>
                  <span className="repeat-question">{group.question}</span>
                </div>
                <div className="repeat-card-right">
                  {!allSame && <span className="repeat-warn" title="Różne odpowiedzi w różnych latach!">⚠️</span>}
                  <span className="repeat-chevron">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="repeat-card-body">
                  <table className="repeat-table">
                    <thead>
                      <tr>
                        <th>Rok</th>
                        <th>Sesja</th>
                        <th>Temat</th>
                        <th>Odp.</th>
                        <th>Treść odpowiedzi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((occ, i) => (
                          <tr key={i} className={!allSame && normalizeAnswer(occ.correctText) !== dominantText ? 'diff-answer' : ''}>
                            <td><strong>{occ.year}</strong></td>
                            <td>
                              <span className={`session-badge session-${occ.session}`}>
                                {SESSION_EMOJI[occ.session]} {SESSION_LABEL[occ.session]}
                              </span>
                            </td>
                            <td className="deck-name-cell">{occ.deckName}</td>
                            <td>
                              <span className="correct-letter">{occ.correct}</span>
                            </td>
                            <td className="correct-text-cell">{occ.correctText}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {!allSame && (
                    <div className="repeat-warn-box">
                      ⚠️ Uwaga: to pytanie ma <strong>różne poprawne odpowiedzi</strong> w różnych sesjach!
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

