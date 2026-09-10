import React, { useMemo, useState } from 'react'
import { downloadTestPdf, listExportTests, mergeTestQuestions } from '../logic/testPdf'
import './TestPdfExport.css'

export default function TestPdfExport({ decks }) {
  const tests = useMemo(() => listExportTests(decks), [decks])
  const [selectedIds, setSelectedIds] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const report = useMemo(() => mergeTestQuestions(decks, selectedIds), [decks, selectedIds])

  function select(ids) {
    setSelectedIds(ids)
    setError('')
    setStatus('')
  }

  async function download() {
    setBusy(true)
    setError('')
    setStatus('')
    try {
      await downloadTestPdf(report)
      setStatus('PDF gotowy — przekazano plik do pobrania.')
    } catch (err) {
      console.error('PDF export failed', err)
      setError('Nie udało się wygenerować PDF. Spróbuj ponownie.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="pdf-export">
      <summary>PDF do druku — wybierz testy</summary>
      <div className="pdf-export-body">
        <p id="pdf-export-help">
          Zaznacz sesje i lata. PDF A4 obejmie wszystkie pytania z wybranych testów,
          niezależnie od liczby pytań ustawionej do nauki. Powtarzające się pytania
          pojawią się tylko raz, z wszystkimi różnymi poprawnymi odpowiedziami z kluczy.
        </p>
        <p className="pdf-export-note">
          Łączenie ignoruje wielkość liter i nadmiarowe odstępy. Pytania o różnej treści pozostają osobno.
          {' '}Odpowiedzi typu „wszystkie powyższe” lub „A i C” są rozwijane do ich pełnej treści.
        </p>
        <fieldset disabled={busy} aria-describedby="pdf-export-help">
          <legend>Testy do PDF</legend>
          <div className="pdf-export-actions">
            <button type="button" onClick={() => select(tests.map(test => test.id))} disabled={!tests.length}>
              Zaznacz wszystkie
            </button>
            <button type="button" onClick={() => select([])} disabled={!selectedIds.length}>
              Odznacz wszystkie
            </button>
          </div>
          <div className="pdf-export-tests">
            {tests.map(test => (
              <label key={test.id} className="pdf-export-test">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(test.id)}
                  onChange={event => select(event.target.checked
                    ? [...selectedIds, test.id]
                    : selectedIds.filter(id => id !== test.id))}
                />
                <span>{test.label} <small>({test.count} pytań)</small></span>
              </label>
            ))}
          </div>
        </fieldset>
        {!tests.length && <p>Brak testów do eksportu.</p>}
        <p className="pdf-export-count" aria-live="polite">
          Wybrane testy: <strong>{report.tests.length}</strong> ·
          Pytania przed połączeniem: <strong>{report.totalQuestions}</strong> ·
          W PDF: <strong>{report.questions.length}</strong> ·
          Usunięte powtórzenia: <strong>{report.duplicateCount}</strong>
        </p>
        {(report.missingAnswers > 0 || report.skippedQuestions > 0) && (
          <output className="pdf-export-warning">
            Wpisy bez poprawnej odpowiedzi: {report.missingAnswers}.
            Pominięte wpisy bez pytania: {report.skippedQuestions}.
            Braki odpowiedzi zostaną oznaczone w PDF.
          </output>
        )}
        <button
          type="button"
          className="btn-start-global"
          disabled={busy || !report.questions.length}
          onClick={download}
          aria-busy={busy}
        >
          {busy ? 'Generowanie PDF…' : 'Pobierz PDF do druku'}
        </button>
        {!selectedIds.length && <p className="pdf-export-note">Zaznacz co najmniej jeden test, aby pobrać PDF.</p>}
        {error && <p className="pdf-export-error" role="alert">{error}</p>}
        <output className="pdf-export-note">{status}</output>
      </div>
    </details>
  )
}

