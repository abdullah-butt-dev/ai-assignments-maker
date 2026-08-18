import { generateText, stripJsonFences } from "./_lib/aiClients.js"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" })
    }
  }

  const { action } = body || {}

  try {
    switch (action) {
      case "outline":
        return res.status(200).json(await handleOutline(body))
      case "expand-section":
        return res.status(200).json(await handleExpandSection(body))
      case "regenerate-selection":
        return res.status(200).json(await handleRegenerate(body))
      case "self-check":
        return res.status(200).json(await handleSelfCheck(body))
      case "adjust-length":
        return res.status(200).json(await handleAdjustLength(body))
      case "place-images":
        return res.status(200).json(await handlePlaceImages(body))
      case "suggest-images":
        return res.status(200).json(await handleSuggestImages(body))
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` })
    }
  } catch (err) {
    console.error(`[/api/generate] action=${action}`, err)
    return res.status(err.status && err.status < 500 ? err.status : 502).json({
      error: "AI generation failed. Please try again in a moment.",
      detail: process.env.NODE_ENV === "development" ? String(err.message || err) : undefined,
    })
  }
}


const HUMANIZER_GUIDE = `Write naturally and plainly. Preserve every factual claim from the source and never invent facts, names, dates, numbers, quotes, or citations. Prefer direct constructions with is/are/has, varied sentence lengths, and specific wording already supported by the source. Avoid inflated significance, promotional language, vague attributions, repetitive synonym cycling, excessive rule-of-three lists, formulaic headings, fake transitions such as "Let's dive in", filler phrases, excessive hedging, generic conclusions, unnecessary bold emphasis, and robotic meta-commentary. Avoid em dashes and en dashes. Do not force a personality or opinion into academic/reference writing. Keep the intended academic register, but make the prose sound like a student or researcher wrote it rather than a chatbot. Compress repetition instead of padding. Never mention this instruction or the writing process in the output.`

// Step 1: outline. Cheap, structured JSON, forces the model to plan before writing
// (fixes drift/truncation from single-shot generation on long word counts).
async function handleOutline({ topic, wordCount, difficulty, additionalInstructions }) {
  const targetWords = parseInt(wordCount, 10) || 1000

  const prompt = `You are planning an academic assignment.
Topic: ${topic}
Target total length: ${targetWords} words
Difficulty level: ${difficulty || "Medium"}
Additional instructions: ${additionalInstructions || "None"}

Return ONLY valid JSON (no markdown fences, no commentary) matching this shape:
{
  "title": "string",
  "sections": [ { "heading": "string", "targetWords": number } ]
}
Rules:
- 3 to 7 sections depending on the length.
- The targetWords across all sections should sum to approximately ${targetWords}.
- Section headings should reflect the actual content of an essay on this topic, not generic placeholders like "Section 1".`

  const raw = await generateText(prompt, { tier: "quality", json: true })
  const parsed = JSON.parse(stripJsonFences(raw))

  const sections = (parsed.sections || []).map((s, i) => ({
    id: `sec_${i}`,
    heading: s.heading,
    targetWords: s.targetWords || Math.round(targetWords / (parsed.sections.length || 1)),
  }))

  return { title: parsed.title || topic, sections, targetWords }
}

// Step 2: expand one section at a time. Called once per section from the client,
// so progress can be shown and no single request risks the function timeout.
async function handleExpandSection({ topic, title, section, sections, difficulty, additionalInstructions }) {
  const outlineContext = (sections || [])
    .map((s, i) => `${i + 1}. ${s.heading} (~${s.targetWords} words)`)
    .join("\n")

  const prompt = `Write the "${section.heading}" section of an academic assignment titled "${title}" about "${topic}".

Full outline for context (write ONLY this section, do not repeat other sections):
${outlineContext}

Target length for this section: approximately ${section.targetWords} words.
Difficulty level: ${difficulty || "Medium"}
Additional instructions: ${additionalInstructions || "None"}

Human-style writing guidance:
${HUMANIZER_GUIDE}

Write complete, substantive content. No placeholders, no "[insert here]", no meta-commentary about what you're doing. Do not repeat the section heading itself in the output -- just the body content.`

  const content = await generateText(prompt, { tier: "quality" })
  return { id: section.id, content: content.trim() }
}

// Regeneration of a selected passage. Fast tier.
async function handleRegenerate({ selectedText }) {
  const prompt = `Rewrite this text to improve it. Make it clearer, more professional, and better structured.
Keep the same meaning but enhance the quality.
${HUMANIZER_GUIDE}
Return ONLY the rewritten text, no explanations, no quotation marks around it.

Original text:
${selectedText}`

  const result = await generateText(prompt, { tier: "fast" })
  return { text: result.trim() }
}

// Cheap self-check pass: does the draft actually satisfy the brief? Advisory only,
// shown to the user rather than silently blocking.
async function handleSelfCheck({ draft, topic, wordCount, difficulty }) {
  const targetWords = parseInt(wordCount, 10) || 1000
  const actualWords = draft.trim().split(/\s+/).length

  const prompt = `You are reviewing a student assignment draft against its brief. Be terse.
Topic: ${topic}
Target length: ${targetWords} words (actual: ${actualWords})
Difficulty: ${difficulty || "Medium"}

Draft:
${draft.slice(0, 6000)}

Return ONLY valid JSON: { "onTopic": boolean, "coversRequirements": boolean, "issues": ["short issue strings, max 3"] }`

  const raw = await generateText(prompt, { tier: "fast", json: true })
  const parsed = JSON.parse(stripJsonFences(raw))
  return { ...parsed, actualWords, targetWords }
}

// Expand or trim to hit the target word count. Only called when off by >15%.
async function handleAdjustLength({ text, currentWords, targetWords }) {
  const direction = currentWords < targetWords ? "expand" : "trim"
  const prompt = `${direction === "expand" ? "Expand" : "Trim"} this text from approximately ${currentWords} words to approximately ${targetWords} words.
${direction === "expand" ? "Add substantive detail, examples, or analysis, but do not pad with filler." : "Cut redundancy and less essential detail, keeping the core argument and structure intact."}
${HUMANIZER_GUIDE}
Return ONLY the revised text, no commentary.

Text:
${text}`

  const result = await generateText(prompt, { tier: "quality" })
  return { text: result.trim() }
}


async function searchWikimediaImages(query, limit = 8) {
  const url = new URL("https://commons.wikimedia.org/w/api.php")
  url.searchParams.set("action", "query")
  url.searchParams.set("format", "json")
  url.searchParams.set("origin", "*")
  url.searchParams.set("generator", "search")
  url.searchParams.set("gsrsearch", `${query} filetype:bitmap`)
  url.searchParams.set("gsrnamespace", "6")
  url.searchParams.set("gsrlimit", String(limit))
  url.searchParams.set("prop", "imageinfo")
  url.searchParams.set("iiprop", "url|mime|extmetadata")
  url.searchParams.set("iiurlwidth", "1200")
  const response = await fetch(url, { headers: { "User-Agent": "AI-Assignment-Maker/1.0" } })
  if (!response.ok) throw new Error(`Wikimedia search failed (${response.status})`)
  const data = await response.json()
  return Object.values(data.query?.pages || {}).map((page) => ({
    title: page.title?.replace(/^File:/, "") || "Untitled image",
    url: page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url,
    sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || "")}`,
    mime: page.imageinfo?.[0]?.mime || "",
    description: page.imageinfo?.[0]?.extmetadata?.ImageDescription?.value?.replace(/<[^>]*>/g, " ").slice(0, 400) || "",
    license: page.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value || "",
  })).filter((item) => item.url && /^image\//.test(item.mime))
}

async function handleSuggestImages({ topic, headings = [], draft = "" }) {
  if (!topic?.trim()) return { images: [], text: draft }
  const searchTerms = [topic, ...(headings || []).slice(0, 3)].filter(Boolean)
  const candidateMap = new Map()
  for (const term of searchTerms) {
    try {
      const results = await searchWikimediaImages(term, 5)
      results.forEach((item) => candidateMap.set(item.url, item))
    } catch (error) {
      console.warn("Wikimedia image search failed", error)
    }
  }
  const candidates = Array.from(candidateMap.values()).slice(0, 16)
  if (!candidates.length) return { images: [], text: draft }

  const prompt = `Select up to 2 images that are genuinely useful for an academic assignment about "${topic}". Do not choose decorative or weakly related images. Prefer diagrams, charts, maps, historical photographs, scientific figures, or other images that help explain the topic.\n\nSections:\n${headings.join("\n")}\n\nCandidates:\n${candidates.map((c, i) => `${i}: ${c.title} | ${c.description}`).join("\n")}\n\nReturn ONLY JSON: {"indexes":[0,1]}. Use only candidate indexes.`
  let selected = []
  try {
    const raw = await generateText(prompt, { tier: "fast", json: true })
    const parsed = JSON.parse(stripJsonFences(raw))
    selected = (parsed.indexes || []).filter((i) => Number.isInteger(i) && candidates[i]).slice(0, 2)
  } catch {
    selected = [0]
  }
  return {
    images: selected.map((i) => ({ ...candidates[i], id: `web_${Date.now()}_${i}`, caption: candidates[i].title, origin: "Wikimedia Commons", aiSuggested: true, size: "medium", position: "center" })),
    text: draft,
  }
}

async function handlePlaceImages({ draft, images = [] }) {
  const usable = images.filter((img) => img?.url).map((img) => ({ id: String(img.id), caption: img.caption || "", fileName: img.fileName || "" }))
  if (!usable.length || !draft?.trim()) return { text: draft }
  const prompt = `You are placing user-provided academic figures into an assignment.
Draft:
${draft}

Available images:
${usable.map((img) => `ID ${img.id}: ${img.caption || img.fileName || "untitled image"}`).join("\n")}

Return ONLY valid JSON in this exact shape: {"placements":[{"imageId":"string","afterHeading":"string"}]}
Rules: place each relevant image once, after the most relevant section heading. If no section is relevant, use the closest sensible heading. Never invent headings. Do not change the draft text.`
  const raw = await generateText(prompt, { tier: "fast", json: true })
  const parsed = JSON.parse(stripJsonFences(raw))
  let result = draft
  for (const placement of parsed.placements || []) {
    const img = usable.find((item) => item.id === String(placement.imageId))
    if (!img) continue
    const heading = String(placement.afterHeading || "").trim()
    if (!heading) continue
    const marker = `[IMAGE:${img.id}]`
    const re = new RegExp(`(^${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$)(\\n+)`, "mi")
    if (re.test(result) && !result.includes(marker)) result = result.replace(re, `$1$2${marker}$2`)
  }
  return { text: result }
}
