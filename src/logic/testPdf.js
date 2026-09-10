const SESSION_LABELS = { spring: 'Wiosna', autumn: 'Jesień' }
const SESSION_ORDER = { spring: 0, autumn: 1 }
const ALL_OPTIONS_ANSWERS = new Set([
  'wszystkie powyższe',
  'wszystkie wymienione',
  'wszystkie odpowiedzi są prawidłowe',
  'wszystkie odpowiedzi są poprawne',
  'wszystkie wymienione powyżej odpowiedzi są prawidłowe',
])

export function testId(deck) {
  return `${deck.year}-${deck.session}`
}

export function listExportTests(decks) {
  const tests = new Map()
  for (const deck of decks) {
    if (!deck.year || !SESSION_LABELS[deck.session] || !deck.cards?.length) continue
    const id = testId(deck)
    if (!tests.has(id)) {
      tests.set(id, { id, year: deck.year, session: deck.session,
        label: `${deck.year} — ${SESSION_LABELS[deck.session]}`, count: 0 })
    }
    tests.get(id).count += deck.cards.length
  }
  return [...tests.values()].sort((a, b) =>
    a.year - b.year || SESSION_ORDER[a.session] - SESSION_ORDER[b.session]
  )
}

function normalizeText(text) {
  return String(text ?? '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase()
}

function answerKey(text) {
  let key = normalizeText(text)
  while (key && '.,;:!?'.includes(key.at(-1))) key = key.slice(0, -1)
  return key.trim()
}

function expandAnswer(options, index, visited = new Set()) {
  const text = options[index]
  if (typeof text !== 'string' || !text.trim() || visited.has(index)) return []
  const nextVisited = new Set([...visited, index])
  const key = answerKey(text)
  if (ALL_OPTIONS_ANSWERS.has(key)) {
    return options.flatMap((_, other) => other === index ? [] : expandAnswer(options, other, nextVisited))
  }
  // Match only explicit answer references, never letters in clinical text (e.g. vitamin A).
  const references = key.match(/^(?:prawidłowe odpowiedzi|odpowiedzi|właściwe postępowanie określają punkty) ([a-d](?:(?:,\s*| i )[a-d])+)(?: są prawidłowe)?$/)
  if (references) {
    return references[1].match(/[a-d]/g).flatMap(letter => expandAnswer(options, letter.codePointAt(0) - 97, nextVisited))
  }
  if (key.startsWith('wszystkich powyższych,')) {
    const related = options.flatMap((_, other) => other === index ? [] : expandAnswer(options, other, nextVisited))
    return [`${text.trim()}:\n${related.join('; ')}`]
  }
  return [text]
}

function correctAnswers(card) {
  // Resolve letters separately for each occurrence: option order can vary between tests.
  if (card.correct != null && Array.isArray(card.options)) {
    const letters = Array.isArray(card.correct) ? card.correct : [card.correct]
    return letters.flatMap(letter => {
      const value = String(letter).trim().toUpperCase()
      return /^[A-Z]$/.test(value) ? expandAnswer(card.options, value.codePointAt(0) - 65) : []
    })
  }
  const answers = Array.isArray(card.answer) ? card.answer : [card.answer]
  return answers.filter(answer => typeof answer === 'string' && answer.trim())
}

export function mergeTestQuestions(decks, selectedIds) {
  const selected = new Set(selectedIds)
  const groups = new Map()
  let totalQuestions = 0
  let skippedQuestions = 0
  let missingAnswers = 0

  const cards = decks.filter(deck => selected.has(testId(deck))).flatMap(deck => deck.cards ?? [])
  for (const card of cards) {
    const key = normalizeText(card.question)
    if (!key) {
      skippedQuestions++
      continue
    }
    totalQuestions++
    if (!groups.has(key)) {
      groups.set(key, { question: card.question.trim(), answers: new Map(), missingAnswerCount: 0 })
    }
    const group = groups.get(key)
    const answers = correctAnswers(card)
    if (!answers.length) {
      group.missingAnswerCount++
      missingAnswers++
    }
    for (const answer of answers) {
      const key = answerKey(answer)
      group.answers.set(key, group.answers.get(key) ?? answer.trim())
    }
  }

  return {
    tests: listExportTests(decks).filter(test => selected.has(test.id)),
    totalQuestions,
    duplicateCount: totalQuestions - groups.size,
    skippedQuestions,
    missingAnswers,
    questions: [...groups.values()].map(group => ({ ...group, answers: [...group.answers.values()] })),
  }
}

export function buildTestPdfDefinition(report) {
  if (!report.questions.length) throw new Error('Brak pytań do eksportu.')
  return {
    info: { title: 'MedCards — pytania i poprawne odpowiedzi', author: 'MedCards' },
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 42],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.2, color: '#000000' },
    footer: (page, pages) => ({ text: `${page} / ${pages}`, alignment: 'center', fontSize: 8, margin: [0, 12, 0, 0] }),
    content: [
      { text: 'Pytania i poprawne odpowiedzi', fontSize: 17, bold: true, margin: [0, 0, 0, 8] },
      { text: `Testy: ${report.tests.map(test => test.label).join(', ')}`, margin: [0, 0, 0, 6] },
      { text: `Unikalne pytania: ${report.questions.length}. Pominięte powtórzenia: ${report.duplicateCount}.`, margin: [0, 0, 0, 6] },
      { text: 'Odpowiedzi według kluczy zaznaczonych testów. Jeśli klucze się różnią, podano wszystkie różne poprawne odpowiedzi.', fontSize: 9, margin: [0, 0, 0, 16] },
      ...(report.skippedQuestions ? [{ text: `Pominięto wpisy bez treści pytania: ${report.skippedQuestions}.`, margin: [0, 0, 0, 10] }] : []),
      ...report.questions.map((group, index) => ({
        // pdfmake cannot split an unbreakable block taller than a page. Only keep
        // compact blocks together, using conservative limits for this A4/10pt layout.
        unbreakable: [group.question, ...group.answers].join('\n').length <= 1000
          && [group.question, ...group.answers].join('\n').split(/\r\n|\r|\n/).length <= 12
          && group.answers.length <= 8,
        stack: [
        { text: `${index + 1}. ${group.question}`, bold: true, margin: [0, 8, 0, 4] },
        ...(group.answers.length ? [{
          stack: [
            { text: group.answers.length === 1 ? 'Poprawna odpowiedź:' : 'Poprawne odpowiedzi:', fontSize: 9, margin: [0, 0, 0, 3] },
            { ul: group.answers.map(answer => ({ text: answer, margin: [0, 0, 0, 3] })) },
          ],
          margin: [8, 0, 0, 6],
        }] : []),
        ...(group.missingAnswerCount ? [{ text: 'Uwaga: brak poprawnej odpowiedzi w części danych źródłowych tego pytania.', italics: true, margin: [8, 0, 0, 6] }] : []),
        ],
      })),
    ],
  }
}

export async function createTestPdf(report) {
  const definition = buildTestPdfDefinition(report)
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake.js'),
    import('pdfmake/build/vfs_fonts.js'),
  ])
  pdfMake.addVirtualFileSystem(fonts)
  return pdfMake.createPdf(definition)
}

export async function downloadTestPdf(report) {
  const pdf = await createTestPdf(report)
  await pdf.download('medcards-pytania-i-odpowiedzi.pdf')
}


