export function wordCount(text) {
  const trimmed = (text || "").trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export function calculateReadability(text) {
  if (!text || !text.trim()) return null

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const words = text.trim().split(/\s+/)
  if (sentences.length === 0 || words.length === 0) return null

  const syllables = words.reduce((count, word) => {
    const wordLower = word.toLowerCase()
    let syllableCount = 0
    for (let i = 0; i < wordLower.length; i++) {
      if ("aeiou".includes(wordLower[i])) {
        if (i > 0 && "aeiou".includes(wordLower[i - 1])) continue
        syllableCount++
      }
    }
    if (wordLower.endsWith("e")) syllableCount--
    if (syllableCount <= 0) syllableCount = 1
    return count + syllableCount
  }, 0)

  const avgSentenceLength = words.length / sentences.length
  const avgSyllablesPerWord = syllables / words.length

  const readingEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord
  const gradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59

  let level = ""
  if (readingEase >= 90) level = "Very Easy (5th grade)"
  else if (readingEase >= 80) level = "Easy (6th grade)"
  else if (readingEase >= 70) level = "Fairly Easy (7th grade)"
  else if (readingEase >= 60) level = "Standard (8th-9th grade)"
  else if (readingEase >= 50) level = "Fairly Difficult (10th-12th grade)"
  else if (readingEase >= 30) level = "Difficult (College)"
  else level = "Very Difficult (College Graduate)"

  return {
    score: Math.round(readingEase),
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    level,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllables: Math.round(avgSyllablesPerWord * 10) / 10,
  }
}

// Is the draft close enough to the target word count, or does it need an adjust-length pass?
export function isWithinLengthTolerance(actual, target, tolerance = 0.15) {
  if (!target) return true
  return Math.abs(actual - target) / target <= tolerance
}

// Index-based replacement for regenerated selections -- fixes the bug where
// `.replace(selectedText, result)` silently replaces the *first* occurrence
// of a phrase, not necessarily the one the user actually selected.
export function replaceRange(fullText, start, end, replacement) {
  return fullText.slice(0, start) + replacement + fullText.slice(end)
}
