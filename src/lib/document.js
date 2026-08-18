const cleanText = (value = "") => value
    .replace(/\*\*/g, "")
  .replace(/^#{1,3}\s+/gm, "")
  .replace(/^[-*]\s+/gm, "• ")
  .trim()

export function toPlainText(text = "") {
  return cleanText(text).replace(/\[IMAGE:\d+\]/g, "").replace(/\n{3,}/g, "\n\n").trim()
}

export function autoFormatAssignment(text = "") {
  const normalized = toPlainText(text)
  if (!normalized) return ""

  const lines = normalized.split("\n")
  const first = lines.findIndex((line) => line.trim())
  if (first === -1) return ""

  const output = []
  let seenTitle = false

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) {
      output.push("")
      continue
    }

    const image = line.match(/^\[IMAGE:(\d+)\]$/)
    if (image) {
      output.push(line)
      continue
    }

    if (/^•\s+/.test(line)) {
      output.push(`- ${line.replace(/^•\s+/, "")}`)
      continue
    }

    const previousBlank = i === 0 || !lines[i - 1].trim()
    if (!seenTitle && i === first) {
      output.push(`# ${line}`)
      seenTitle = true
      continue
    }

    const looksLikeHeading = previousBlank && line.length <= 90 && !/[.!?:;,]$/.test(line) && !/^\d+[.)]\s/.test(line) && !/^[-*•]\s+/.test(line)
    if (looksLikeHeading && seenTitle) {
      output.push(`## ${line}`)
    } else {
      output.push(line)
    }
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

export function parseAssignmentMarkdown(markdown = "") {
  const blocks = []
  const lines = markdown.split(/\r?\n/)
  let paragraph = []
  let list = []
  let listType = null

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: cleanText(paragraph.join(" ")) })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length) blocks.push({ type: listType, items: list.map(cleanText) })
    list = []
    listType = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushParagraph(); flushList()
      continue
    }

    const image = line.match(/^\[IMAGE:(\d+)\]$/)
    if (image) {
      flushParagraph(); flushList()
      blocks.push({ type: "image", id: Number(image[1]) })
      continue
    }

    const quote = line.match(/^>\s*(.+)/)
    if (quote) {
      flushParagraph(); flushList()
      blocks.push({ type: "quote", text: cleanText(quote[1]) })
      continue
    }

    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    if (h1 || h2 || h3) {
      flushParagraph(); flushList()
      blocks.push({ type: h1 ? "h1" : h2 ? "h2" : "h3", text: cleanText((h1 || h2 || h3)[1]) })
      continue
    }

    const bullet = line.match(/^[-*•]\s+(.+)/)
    const numbered = line.match(/^\d+[.)]\s+(.+)/)
    if (bullet || numbered) {
      if (listType && listType !== (bullet ? "bullet" : "numbered")) flushList()
      listType = bullet ? "bullet" : "numbered"
      list.push((bullet || numbered)[1])
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph(); flushList()
  return blocks
}

export function extractTitle(markdown = "") {
  return parseAssignmentMarkdown(markdown).find((block) => block.type === "h1")?.text || "Assignment"
}
