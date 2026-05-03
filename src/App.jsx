import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { getDecks, getFlashDecks, loadProgress, saveProgress } from './storage/deckStorage'
import { updateCardAfterReview } from './logic/srs'
import HomeScreen from './components/HomeScreen'
import DeckOverview from './components/DeckOverview'
import StudySession from './components/StudySession'
import TestSession from './components/TestSession'
import FlashcardSession from './components/FlashcardSession'
import RepeatReport from './components/RepeatReport'
import { buildCardStates, freshState, cardKey } from './components/helpers'
import './styles.css'


export default function App() {
  const decks = useMemo(() => getDecks(), [])
  const flashDecks = useMemo(() => getFlashDecks(), [])
  const [cardStates, setCardStates] = useState(() => buildCardStates(decks, loadProgress()))
  const [view, setView] = useState({ mode: 'home', deck: null, studyMode: null })

  // Zachowujemy wybór roku/sesji/trybu między sesjami nauki
  const availableYears = useMemo(() => [...new Set(decks.map(d => d.year).filter(Boolean))].sort(), [decks])
  const [selectedYear, setSelectedYear] = useState(() => availableYears[0] ?? 2018)
  const [selectedSession, setSelectedSession] = useState('spring')
  const [selectedMode, setSelectedMode] = useState('srs')

  useEffect(() => { saveProgress(cardStates) }, [cardStates])

  const handleUpdateCard = useCallback((cardId, wasCorrect) => {
    setCardStates(prev => ({ ...prev, [cardId]: updateCardAfterReview(prev[cardId], wasCorrect) }))
  }, [])

  const handleResetDeck = useCallback((deckId) => {
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return
    setCardStates(prev => {
      const next = { ...prev }
      deck.cards.forEach(card => { next[cardKey(card)] = freshState(cardKey(card)) })
      return next
    })
  }, [decks])

  const handleRescheduleCard = useCallback((cardId) => {
    setCardStates(prev => ({ ...prev, [cardId]: freshState(cardId) }))
  }, [])

  return (
    <div className="app">
      <div className="bg-gradient" />
      <div className="content">
        {view.mode === 'home' && (
          <HomeScreen decks={decks} flashDecks={flashDecks} cardStates={cardStates}
            selectedYear={selectedYear} setSelectedYear={setSelectedYear}
            selectedSession={selectedSession} setSelectedSession={setSelectedSession}
            selectedMode={selectedMode} setSelectedMode={setSelectedMode}
            onSelectDeck={(deck, studyMode) => setView({ mode: 'study', deck, studyMode })}
            onShowRepeats={() => setView({ mode: 'repeats', deck: null, studyMode: null })}
          />
        )}
        {view.mode === 'deck' && view.deck && (
          <DeckOverview
            deck={view.deck} cardStates={cardStates}
            onBack={() => setView({ mode: 'home', deck: null, studyMode: null })}
            onResetDeck={handleResetDeck}
            onRescheduleCard={handleRescheduleCard}
          />
        )}
        {view.mode === 'study' && view.deck && view.studyMode === 'srs' && (
          <StudySession deck={view.deck} cardStates={cardStates}
            onBack={() => setView({ mode: 'home', deck: null, studyMode: null })}
            onUpdateCard={handleUpdateCard} onMarkWrong={handleRescheduleCard}
            onResetDeck={handleResetDeck} />
        )}
        {view.mode === 'study' && view.deck && view.studyMode === 'test' && (
          <TestSession deck={view.deck}
            onBack={() => setView({ mode: 'home', deck: null, studyMode: null })} />
        )}
        {view.mode === 'study' && view.deck && view.studyMode === 'flash' && (
          <FlashcardSession deck={view.deck}
            onBack={() => setView({ mode: 'home', deck: null, studyMode: null })} />
        )}
        {view.mode === 'repeats' && (
          <RepeatReport decks={decks}
            onBack={() => setView({ mode: 'home', deck: null, studyMode: null })} />
        )}
      </div>
    </div>
  )
}
