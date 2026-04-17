import React, { useState, useEffect, useMemo } from 'react'
import { buildYearDeck } from './helpers'

const ALL_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
const TEST_COUNT = 20

export default function HomeScreen({ decks, flashDecks, cardStates, onSelectDeck }) {
  const now = Date.now()
  const [selectedMode, setSelectedMode] = useState('srs')
  const sourceDecks = selectedMode === 'flash' ? flashDecks : decks
  const availableYears = [...new Set(sourceDecks.map(d => d.year).filter(Boolean))].sort()
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? ALL_YEARS[0])

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] ?? ALL_YEARS[0])
    }
  }, [availableYears, selectedYear])

  const visibleDecks = decks.filter(d => d.year === selectedYear)
  const testDeck = useMemo(
    () => buildYearDeck(decks, selectedYear, {
      id: `test-${selectedYear}`,
      name: `Test roczny ${selectedYear}`,
      emoji: '📝',
      color: '#dc2626',
    }),
    [decks, selectedYear]
  )
  const flashDeck = useMemo(
    () => buildYearDeck(flashDecks, selectedYear, {
      id: `flash-${selectedYear}`,
      name: `Fiszki ${selectedYear}`,
      emoji: '🃏',
      color: '#0891b2',
    }),
    [flashDecks, selectedYear]
  )

  const dueNowTotal = visibleDecks.reduce((s, d) => {
    return s + d.cards.filter(c => {
      const st = cardStates[c.id]
      return st && st.dueDate <= now
    }).length
  }, 0)

  const selectedModeLabel = selectedMode === 'srs' ? 'Powtórki' : selectedMode === 'test' ? 'Test' : 'Fiszki'
  const selectedModeDeck = selectedMode === 'test' ? testDeck : flashDeck
  const totalCards = selectedMode === 'srs'
    ? visibleDecks.reduce((s, d) => s + d.cards.length, 0)
    : selectedModeDeck.cards.length
  const secondaryValue = selectedMode === 'srs'
    ? dueNowTotal
    : selectedMode === 'test'
      ? Math.min(TEST_COUNT, testDeck.cards.length)
      : flashDeck.cards.length
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

      {/* Year selector */}
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

      {/* Mode selector */}
      <div className="mode-selector-wrap">
        <label className="year-selector-label">🎓 Tryb nauki</label>
        <div className="mode-grid">
          <button
            className={`mode-card mode-srs ${selectedMode === 'srs' ? 'mode-active' : ''}`}
            onClick={() => setSelectedMode('srs')}
          >
            <span className="mode-icon">🔄</span>
            <span className="mode-name">Powtórki</span>
            <span className="mode-desc">SRS — ucz się i oceniaj</span>
          </button>
          <button
            className={`mode-card mode-test ${selectedMode === 'test' ? 'mode-active' : ''}`}
            onClick={() => setSelectedMode('test')}
          >
            <span className="mode-icon">📝</span>
            <span className="mode-name">Test</span>
            <span className="mode-desc">{TEST_COUNT} losowych pytań A/B/C/D</span>
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

      <div className={`active-mode-banner active-mode-${selectedMode}`}>
        <span className="active-mode-icon">{selectedMode === 'srs' ? '🔄' : selectedMode === 'test' ? '📝' : '🃏'}</span>
        <div>
          <p className="active-mode-title">{selectedModeLabel}</p>
          <p className="active-mode-desc">
            {selectedMode === 'srs'
              ? `Wybierz temat z roku ${selectedYear}, aby rozpocząć powtórki.`
              : selectedMode === 'test'
                ? `Test uruchomi ${Math.min(TEST_COUNT, testDeck.cards.length)} losowych pytań ze wszystkich tematów roku ${selectedYear}.`
                : `Fiszki uruchomią losowe zagadnienia z oddzielnego zestawu dla roku ${selectedYear}.`}
          </p>
        </div>
      </div>

      {/* Deck list */}
      <section className="decks-section">
        {selectedMode === 'srs' ? (
          <>
            <h2 className="section-title">Wybierz temat — {selectedYear}</h2>
            {visibleDecks.length === 0 ? (
          <div className="empty-year">
            <p className="empty-year-icon">📭</p>
            <p className="empty-year-text">Brak fiszek dla roku {selectedYear}</p>
          </div>
        ) : (
          <div className="deck-grid">
            {visibleDecks.map(deck => {
              const due = deck.cards.filter(c => { const s = cardStates[c.id]; return s && s.dueDate <= now }).length
              const seen = deck.cards.filter(c => { const s = cardStates[c.id]; return s && s.repetitions >= 1 }).length
              const progress = Math.round((seen / deck.cards.length) * 100)
              return (
                <button key={deck.id} className="deck-card" style={{ '--deck-color': deck.color }} onClick={() => onSelectDeck(deck, selectedMode)}>
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
          <div className="global-mode-panel">
            <p className="global-mode-kicker">{selectedYear}</p>
            <h2 className="global-mode-title">{selectedMode === 'test' ? 'Test roczny' : 'Losowe fiszki'}</h2>
            <p className="global-mode-text">
              {selectedMode === 'test'
                ? `Pula obejmuje ${testDeck.cards.length} pytań ze wszystkich tematów tego roku. Po kliknięciu wystartuje test z ${Math.min(TEST_COUNT, testDeck.cards.length)} losowych pytań.`
                : `Pula obejmuje ${flashDeck.cards.length} fiszek z osobnego pliku JSON dla tego roku. Karty będą dobierane losowo.`}
            </p>
            <button
              className="btn-start-global"
              onClick={() => onSelectDeck(selectedMode === 'test' ? testDeck : flashDeck, selectedMode)}
              disabled={selectedModeDeck.cards.length === 0}
            >
              {selectedMode === 'test' ? 'Rozpocznij test' : 'Uruchom fiszki'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}



