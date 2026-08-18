import { describe, it, expect } from "vitest"
import { wordCount, calculateReadability, isWithinLengthTolerance, replaceRange } from "./text"

describe("wordCount", () => {
  it("counts words in normal text", () => {
    expect(wordCount("The quick brown fox")).toBe(4)
  })
  it("returns 0 for empty/whitespace input", () => {
    expect(wordCount("")).toBe(0)
    expect(wordCount("   ")).toBe(0)
  })
})

describe("calculateReadability", () => {
  it("returns null for empty text", () => {
    expect(calculateReadability("")).toBeNull()
  })
  it("returns a score and grade level for real text", () => {
    const result = calculateReadability(
      "The cat sat on the mat. It was a sunny day. Birds sang in the trees."
    )
    expect(result).not.toBeNull()
    expect(typeof result.score).toBe("number")
    expect(typeof result.gradeLevel).toBe("number")
    expect(result.wordCount).toBeGreaterThan(0)
  })
})

describe("isWithinLengthTolerance", () => {
  it("accepts drafts within 15% of target", () => {
    expect(isWithinLengthTolerance(950, 1000)).toBe(true)
    expect(isWithinLengthTolerance(1140, 1000)).toBe(true)
  })
  it("rejects drafts far from target", () => {
    expect(isWithinLengthTolerance(500, 1000)).toBe(false)
    expect(isWithinLengthTolerance(1500, 1000)).toBe(false)
  })
  it("treats a missing target as always acceptable", () => {
    expect(isWithinLengthTolerance(500, 0)).toBe(true)
  })
})

describe("replaceRange", () => {
  it("replaces only the selected range, not the first matching occurrence elsewhere", () => {
    const text = "cats are great. dogs are great too."
    // Select the second "are great" (starts at index 20, in "dogs are great too")
    const start = text.indexOf("are great", 16)
    const end = start + "are great".length
    const result = replaceRange(text, start, end, "are wonderful")
    expect(result).toBe("cats are great. dogs are wonderful too.")
  })
})
