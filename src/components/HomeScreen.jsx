import React, { useState, useEffect, useMemo } from 'react'
import { buildYearDeck } from './helpers'

const ALL_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
const ALL_SESSIONS = [
  { id: 'spring', label: 'Wiosna' },
  { id: 'autumn', label: 'Jesien' },
]
const TEST_COUNT = 20
const TEST_COUNT_OPTIONS = [10, 20, 30, 50, 70, 140]

export default function HomeScreen({ decks, flashDecks, cardStates, onSelectDeck }) {
  const now = Date.now()
  const [selectedMode, setSelectedMode] = useState('srs')
  const [testCount, setTestCount] = useState(TEST_COUNT)

  // For year/session we only use test decks (not flash)
  const availableYears = [...new Set(decks.map(d => d.year).filter(Boolean))].sort()
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? ALL_YEARS[0])
  const [selectedSession, setSelectedSession] = useState('spring')

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] ?? ALL_YEARS[0])
    }
  }, [availableYears, selectedYear])

  const availableSessions = useMemo(() => {
    return [...new Set(decks
      .filter(d => d.year === selectedYear)
      .map(d => d.session)
      .filter(Boolean))]
  }, [decks, selectedYear])

  useEffect(() => {
    if (!availableSessions.includes(selectedSession)) {
      setSelectedSession(availableSessions[0] ?? 'spring')
    }
  }, [availableSessions, selectedSession])

  const selectedSessionLabel = ALL_SESSIONS.find(s => s.id === selectedSession)?.label ?? 'Wiosna'

  const visibleDecks = decks.filter(d => d.year === selectedYear && d.session === selectedSession)
  const testDeck = useMemo(
    () => buildYearDeck(decks, selectedYear, {
      id: `test-${selectedYear}-${selectedSession}`,
      session: selectedSession,
      name: `Test ${selectedYear} - ${selectedSessionLabel}`,
      emoji: '📝',
      color: '#dc2626',
    }),
    [decks, selectedYear, selectedSession, selectedSessionLabel]
  )

  // All flashcards across all years — independent of year/session
  const allFlashDeck = useMemo(() => ({
    id: 'flash-all',
    name: 'Fiszki',
    emoji: '🃏',
    color: '#0891b2',
    cards: flashDecks.flatMap(d => d.cards),
  }), [flashDecks])

  const dueNowTotal = visibleDecks.reduce((s, d) => {
    return s + d.cards.filter(c => {
      const st = cardStates[c.id]
      return st && st.dueDate <= now
    }).length
  }, 0)

  const selectedModeLabel = selectedMode === 'srs' ? 'Powtórki' : selectedMode === 'test' ? 'Test' : 'Fiszki'
  const totalCards = selectedMode === 'srs'
    ? visibleDecks.reduce((s, d) => s + d.cards.length, 0)
    : selectedMode === 'test'
      ? testDeck.cards.length
      : allFlashDeck.cards.length
  const secondaryValue = selectedMode === 'srs'
    ? dueNowTotal
    : selectedMode === 'test'
      ? Math.min(testCount, testDeck.cards.length)
      : allFlashDeck.cards.length
  const secondaryLabel = selectedMode === 'srs'
    ? 'Do powtórki'
    : selectedMode === 'test'
      ? 'W teście'
      : 'W puli'

  return (
    <div className="home">
      <header className="home-header">
        <div className="logo">
          <span className="logo-icon">🩺</span>
          <div>
            <h1 className="logo-title">MedCards</h1>
            <p className="logo-sub">Twoje fiszki medyczne</p>
          </div>
        </div>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-number">{totalCards}</span>
            <span className="stat-label">Kart</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number highlight">{secondaryValue}</span>
            <span className="stat-label">{secondaryLabel}</span>
          </div>
        </div>
      </header>

      {/* Mode selector — always on top */}
      <div className="mode-selector-wrap">
        <label className="year-selector-label">🎓 Tryb nauki</label>
        <div className="mode-grid">
          <button
            className={`mode-card mode-srs ${selectedMode === 'srs' ? 'mode-active' : ''}`}
            onClick={() => setSelectedMode('srs')}
          >
            <span className="mode-icon">🔄</span>
            <span className="mode-name">Powtórki</span>
            <span className="mode-desc">Ucz się i oceniaj</span>
          </button>
          <button
            className={`mode-card mode-test ${selectedMode === 'test' ? 'mode-active' : ''}`}
            onClick={() => setSelectedMode('test')}
          >
            <span className="mode-icon">📝</span>
            <span className="mode-name">Test</span>
            <span className="mode-desc">Losowe pytania A/B/C/D</span>
          </button>
          <button
            className={`mode-card mode-flash ${selectedMode === 'flash' ? 'mode-active' : ''}`}
            onClick={() => setSelectedMode('flash')}
          >
            <span className="mode-icon">🃏</span>
            <span className="mode-name">Fiszki</span>
            <span className="mode-desc">Zagadnienie + wyjaśnienie</span>
          </button>
        </div>
        <p className="selected-mode-note">
          Wybrany tryb: <strong>{selectedModeLabel}</strong>
        </p>
      </div>

      {/* Year + Session selectors — only for Powtórki and Test */}
      {selectedMode !== 'flash' && (
        <>
          <div className="year-selector-wrap">
            <label className="year-selector-label">📅 Rok egzaminu</label>
            <div className="year-pills">
              {ALL_YEARS.map(year => {
                const hasData = availableYears.includes(year)
                return (
                  <button
                    key={year}
                    className={`year-pill ${selectedYear === year ? 'active' : ''} ${!hasData ? 'empty' : ''}`}
                    onClick={() => hasData && setSelectedYear(year)}
                    disabled={!hasData}
                    title={!hasData ? 'Brak danych' : ''}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="year-selector-wrap">
            <label className="year-selector-label">🗓️ Sesja egzaminu</label>
            <div className="year-pills">
              {ALL_SESSIONS.map(session => {
                const hasData = availableSessions.includes(session.id)
                return (
                  <button
                    key={session.id}
                    className={`year-pill ${selectedSession === session.id ? 'active' : ''} ${!hasData ? 'empty' : ''}`}
                    onClick={() => hasData && setSelectedSession(session.id)}
                    disabled={!hasData}
                    title={!hasData ? 'Brak danych' : ''}
                  >
                    {session.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      <div className={`active-mode-banner active-mode-${selectedMode}`}>
        <span className="active-mode-icon">{selectedMode === 'srs' ? '🔄' : selectedMode === 'test' ? '📝' : '🃏'}</span>
        <div>
          <p className="active-mode-title">{selectedModeLabel}</p>
          <p className="active-mode-desc">
            {selectedMode === 'srs'
              ? `Wybierz temat z roku ${selectedYear} (${selectedSessionLabel}), aby rozpocząć powtórki.`
              : selectedMode === 'test'
                ? `Test uruchomi ${Math.min(testCount, testDeck.cards.length)} losowych pytan ze wszystkich tematow roku ${selectedYear} (${selectedSessionLabel}).`
                : `Fiszki uruchamiają losowe zagadnienia z bazy niezależnej od roku i sesji. Pula: ${allFlashDeck.cards.length} fiszek.`}
          </p>
        </div>
      </div>

      {/* Deck list */}
      <section className="decks-section">
        {selectedMode === 'flash' ? (
          <div className="global-mode-panel">
            <p className="global-mode-kicker">Wszystkie fiszki</p>
            <h2 className="global-mode-title">Losowe fiszki</h2>
            <p className="global-mode-text">
              Pula obejmuje {allFlashDeck.cards.length} fiszek z bazy wiedzy. Karty będą dobierane losowo.
            </p>
            <button
              className="btn-start-global"
              onClick={() => onSelectDeck(allFlashDeck, 'flash')}
              disabled={allFlashDeck.cards.length === 0}
            >
              Uruchom fiszki
            </button>
          </div>
        ) : selectedMode === 'srs' ? (
          <>
            <h2 className="section-title">Wybierz temat — {selectedYear} ({selectedSessionLabel})</h2>
            {visibleDecks.length === 0 ? (
              <div className="empty-year">
                <p className="empty-year-icon">📭</p>
                <p className="empty-year-text">Brak fiszek dla roku {selectedYear} ({selectedSessionLabel})</p>
              </div>
            ) : (
              <div className="deck-grid">
                {visibleDecks.map(deck => {
                  const due = deck.cards.filter(c => { const s = cardStates[c.id]; return s && s.dueDate <= now }).length
                  const seen = deck.cards.filter(c => { const s = cardStates[c.id]; return s && s.repetitions >= 1 }).length
                  const progress = deck.cards.length > 0 ? Math.round((seen / deck.cards.length) * 100) : 0
                  return (
                    <button key={deck.id} className="deck-card" style={{ '--deck-color': deck.color }} onClick={() => onSelectDeck(deck, 'srs')}>
                      <div className="deck-card-top">
                        <span className="deck-emoji">{deck.emoji}</span>
                        {due > 0 && <span className="due-badge">{due}</span>}
                      </div>
                      <h3 className="deck-card-name">{deck.name}</h3>
                      <p className="deck-card-count">{deck.cards.length} fiszek</p>
                      <div className="deck-progress-bar">
                        <div className="deck-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="deck-progress-label">{progress}% poznane</p>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          // test mode
          <div className="global-mode-panel">
            <p className="global-mode-kicker">{selectedYear} — {selectedSessionLabel}</p>
            <h2 className="global-mode-title">Test roczny</h2>
            <p className="global-mode-text">
              Pula obejmuje {testDeck.cards.length} pytań ze wszystkich tematów tej sesji.
            </p>

            <div className="year-selector-wrap" style={{ margin: '0 0 16px' }}>
              <label className="year-selector-label">🔢 Liczba pytań w teście</label>
              <div className="year-pills">
                {TEST_COUNT_OPTIONS.map(n => {
                  const available = n <= testDeck.cards.length
                  return (
                    <button
                      key={n}
                      className={`year-pill ${testCount === n ? 'active' : ''} ${!available ? 'empty' : ''}`}
                      onClick={() => available && setTestCount(n)}
                      disabled={!available}
                      title={!available ? `Brak wystarczającej liczby pytań (${testDeck.cards.length})` : ''}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              className="btn-start-global"
              onClick={() => onSelectDeck({ ...testDeck, testCount }, 'test')}
              disabled={testDeck.cards.length === 0}
            >
              Rozpocznij test ({Math.min(testCount, testDeck.cards.length)} pytań)
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
