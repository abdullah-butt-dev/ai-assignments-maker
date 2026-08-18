import { useState } from "react"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ShadingType, ImageRun, PageBreak } from "docx"
import { parseAssignmentMarkdown } from "../lib/document"

const formatDate = (value) => { if (!value) return ""; const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) }

const NAVY = "1B2A4A", TEAL = "0E7C7B", GREY = "595959", MINT = "EAF2F1"
const page = { width: 12240, height: 15840 }

async function imageToUint8Array(source) {
  if (!source) return null
  if (source.startsWith("data:")) {
    const base64 = source.split(",")[1]; const binary = atob(base64); const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes
  }
  const response = await fetch(source)
  if (!response.ok) throw new Error("Could not fetch image")
  return new Uint8Array(await response.arrayBuffer())
}
function inlineRuns(text, options = {}) { return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part) => { const bold = part.startsWith("**") && part.endsWith("**"); return new TextRun({ text: bold ? part.slice(2, -2) : part, bold: bold || options.bold, italic: options.italic, color: options.color || GREY, size: options.size || 22, font: "Aptos" }) }) }

function ExportDocxButton({ formattedNotes, images = [], cover = {} }) {
  const [busy, setBusy] = useState(false)
  const exportDocx = async () => {
    if (!formattedNotes) return
    setBusy(true)
    try {
      const blocks = parseAssignmentMarkdown(formattedNotes)
      const title = cover.assignmentTitle || blocks.find((b) => b.type === "h1")?.text || "Assignment"
      const children = []
      if (cover.universityLogo) {
        try { children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 220 }, children: [new ImageRun({ data: await imageToUint8Array(cover.universityLogo), transformation: { width: 100, height: 100 }, type: cover.universityLogo.startsWith("data:image/jpeg") ? "jpg" : cover.universityLogo.startsWith("data:image/webp") ? "webp" : "png" })] })) } catch { /* placeholder below */ }
      } else {
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 220 }, children: [new TextRun({ text: "U", bold: true, color: NAVY, size: 38, font: "Aptos Display" })] }))
      }
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, children: [new TextRun({ text: title, bold: true, color: NAVY, size: 42, font: "Aptos Display" })] }))
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { color: TEAL, style: BorderStyle.SINGLE, size: 12, space: 5 } }, spacing: { after: 420 }, children: [new TextRun({ text: "Academic assignment", color: TEAL, size: 22 })] }))
      const fields = [["Student",cover.studentName],["Subject",cover.subject],["Course",cover.course],["Instructor",cover.instructor],["University",cover.university],["Date",formatDate(cover.date)]].filter(([,value]) => value)
      fields.forEach(([label,value]) => children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 110 }, children: [new TextRun({ text: `${label}: `, bold: true, color: NAVY, size: 21 }), new TextRun({ text: value, color: GREY, size: 21 })] })))
      children.push(new Paragraph({ children: [new PageBreak()] }))

      const headings = blocks.filter((b) => b.type === "h2" || b.type === "h3")
      children.push(new Paragraph({ spacing: { before: 100, after: 180 }, border: { bottom: { color: TEAL, style: BorderStyle.SINGLE, size: 10, space: 5 } }, children: [new TextRun({ text: "Table of contents", bold: true, color: NAVY, size: 28 })] }))
      headings.forEach((h, index) => children.push(new Paragraph({ indent: { left: h.type === "h3" ? 420 : 0 }, spacing: { after: 80 }, children: [new TextRun({ text: `${index + 1}. ${h.text}`, color: GREY, size: 21 })] })))
      children.push(new Paragraph({ children: [new PageBreak()] }))

      const embeddedImageIds = new Set()
      for (const block of blocks) {
        if (block.type === "h1") children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 120 }, border: { bottom: { color: TEAL, style: BorderStyle.SINGLE, size: 10, space: 5 } }, children: [new TextRun({ text: block.text, bold: true, color: NAVY, size: 28, font: "Aptos Display" })] }))
        else if (block.type === "h2") children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: block.text, bold: true, color: TEAL, size: 24 })] }))
        else if (block.type === "h3") children.push(new Paragraph({ spacing: { before: 150, after: 70 }, children: [new TextRun({ text: block.text, bold: true, color: TEAL, size: 22 })] }))
        else if (block.type === "paragraph") children.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 150, line: 280 }, children: inlineRuns(block.text) }))
        else if (block.type === "quote") children.push(new Paragraph({ spacing: { before: 100, after: 160 }, shading: { type: ShadingType.SOLID, color: MINT }, border: { left: { color: TEAL, style: BorderStyle.SINGLE, size: 24, space: 10 } }, indent: { left: 180, right: 120 }, children: inlineRuns(block.text, { italic: true }) }))
        else if (block.type === "bullet" || block.type === "numbered") block.items.forEach((item, index) => children.push(new Paragraph({ bullet: block.type === "bullet" ? { level: 0 } : undefined, numbering: block.type === "numbered" ? { reference: "assignment-numbering", level: 0 } : undefined, spacing: { after: 80 }, children: inlineRuns(item) })))
        else if (block.type === "image") {
          const image = images.find((img) => Number(img.id) === block.id && img.url); if (!image) continue
          embeddedImageIds.add(Number(image.id))
          try { const width = image.size === "large" ? 500 : image.size === "small" ? 150 : 300; children.push(new Paragraph({ alignment: image.position === "left" ? AlignmentType.LEFT : image.position === "right" ? AlignmentType.RIGHT : AlignmentType.CENTER, spacing: { before: 140, after: 60 }, children: [new ImageRun({ data: await imageToUint8Array(image.url), transformation: { width, height: Math.round(width * .66) }, type: image.url.startsWith("data:image/jpeg") ? "jpg" : image.url.startsWith("data:image/webp") ? "webp" : "png" })] })); if (image.caption) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [new TextRun({ text: image.caption, italic: true, color: GREY, size: 18 })] })) } catch (error) { console.warn("Could not embed image", error) }
        }
      }
      for (const image of images.filter((item) => item.url && !embeddedImageIds.has(Number(item.id)))) {
        try { const width = image.size === "large" ? 500 : image.size === "small" ? 150 : 300; children.push(new Paragraph({ alignment: image.position === "left" ? AlignmentType.LEFT : image.position === "right" ? AlignmentType.RIGHT : AlignmentType.CENTER, spacing: { before: 180, after: 60 }, children: [new ImageRun({ data: await imageToUint8Array(image.url), transformation: { width, height: Math.round(width * .66) }, type: image.url.startsWith("data:image/jpeg") ? "jpg" : image.url.startsWith("data:image/webp") ? "webp" : "png" })] })); if (image.caption) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [new TextRun({ text: image.caption, italic: true, color: GREY, size: 18 })] })) } catch { /* skip unsupported image */ }
      }
      const doc = new Document({ title, styles: { default: { document: { run: { font: "Aptos", color: GREY, size: 22 } } } }, sections: [{ properties: { page: { size: page, margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }], numbering: { config: [{ reference: "assignment-numbering", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }]}] } })
      const blob = await Packer.toBlob(doc); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "my-assignment.docx"; link.click(); URL.revokeObjectURL(url)
    } catch (error) { console.error("DOCX export failed", error); alert("Could not create the Word document. Please try again.") } finally { setBusy(false) }
  }
  return <button onClick={exportDocx} disabled={!formattedNotes || busy} className="workspace-primary w-full py-3 disabled:opacity-40">{busy ? "Creating Word document..." : "Download Word (.docx)"}</button>
}
export default ExportDocxButton
