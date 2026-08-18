import { useState, useEffect, useRef } from "react"
import { api } from "../lib/apiClient"
import { idbGet, idbSet, idbDelete } from "../lib/db"
import { calculateReadability, wordCount as countWords, isWithinLengthTolerance, replaceRange } from "../lib/text"
import { autoFormatAssignment, toPlainText } from "../lib/document"

function Step2Edit({ topic, wordCount, difficulty, additionalInstructions, editableNotes, setEditableNotes, setFormattedNotes, images, setImages, onNext, onPrev }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState("")
  const [genPercent, setGenPercent] = useState(0)
  const [imageAction, setImageAction] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [selectionRange, setSelectionRange] = useState(null)
  const [selfCheck, setSelfCheck] = useState(null)
  const [isPlacingImages, setIsPlacingImages] = useState(false)
  const autoSaveTimer = useRef(null)
  const textareaRef = useRef(null)
  const abortRef = useRef(null)
  const wordCountTotal = countWords(editableNotes)
  const charCount = editableNotes.length
  const readabilityScore = editableNotes.trim().length > 100 ? calculateReadability(editableNotes) : null

  useEffect(() => () => abortRef.current?.abort(), [])

  const addImage = () => setImages([...images, { id: Date.now(), url: "", file: null, caption: "", size: "medium", position: "center" }])
  const handleImageUpload = (imageId, event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setImages(images.map((img) => img.id === imageId ? { ...img, url: reader.result, file, fileName: file.name } : img))
    reader.readAsDataURL(file)
  }
  const handleImageUrl = (imageId, url) => setImages(images.map((img) => img.id === imageId ? { ...img, url, file: null } : img))
  const updateImageCaption = (imageId, caption) => setImages(images.map((img) => img.id === imageId ? { ...img, caption } : img))
  const removeImage = (imageId) => setImages(images.filter((img) => img.id !== imageId))

  const generateAssignment = async () => {
    if (!topic.trim()) return setSaveStatus("Please enter a topic in Step 1 first")
    const controller = new AbortController()
    abortRef.current = controller
    setIsGenerating(true); setSelfCheck(null); setGenPercent(8); setGenProgress("Outline: planning the assignment structure...")
    try {
      const outline = await api.outline({ topic, wordCount, difficulty, additionalInstructions }, { signal: controller.signal })
      const sectionTexts = []
      setGenPercent(15)
      for (let i = 0; i < outline.sections.length; i += 1) {
        const section = outline.sections[i]
        const sectionPercent = 15 + Math.round(((i + 1) / outline.sections.length) * 60)
        setGenPercent(sectionPercent)
        setGenProgress(`Section ${i + 1} of ${outline.sections.length}: ${section.heading}`)
        const { content } = await api.expandSection({ topic, title: outline.title, section, sections: outline.sections, difficulty, additionalInstructions }, { signal: controller.signal })
        sectionTexts.push({ heading: section.heading, content })
      }
      let draft = `${outline.title}\n\n${sectionTexts.map((section) => `${section.heading}\n\n${section.content}`).join("\n\n")}`
      const target = parseInt(wordCount, 10) || 1000
      const actual = countWords(draft)
      if (!isWithinLengthTolerance(actual, target)) {
        setGenPercent(82)
        setGenProgress(`Adjusting length: ${actual} → ~${target} words...`)
        const { text } = await api.adjustLength({ text: draft, currentWords: actual, targetWords: target }, { signal: controller.signal })
        draft = text
      }
      draft = toPlainText(draft)
      setEditableNotes(draft)
      setFormattedNotes(autoFormatAssignment(draft))
      setGenPercent(92)
      setGenProgress("Final check: reviewing the draft against your brief...")
      try { setSelfCheck(await api.selfCheck({ draft, topic, wordCount, difficulty }, { signal: controller.signal })) } catch { /* advisory */ }
      setGenPercent(100)
      setGenProgress("Draft complete")
      setSaveStatus("Assignment generated")
      setTimeout(() => setSaveStatus(""), 3000)
    } catch (error) {
      if (error.name !== "AbortError") { console.error("Generation error:", error); setSaveStatus(error.message || "Error generating assignment. Please try again."); setTimeout(() => setSaveStatus(""), 4000) }
    } finally { setTimeout(() => { setIsGenerating(false); setGenProgress(""); setGenPercent(0) }, 450); abortRef.current = null }
  }

  const cancelGeneration = () => abortRef.current?.abort()

  const regenerateSelectedText = async () => {
    if (!selectedText.trim() || !selectionRange) return
    setIsRegenerating(true)
    try {
      const { text } = await api.regenerateSelection({ selectedText })
      const next = replaceRange(editableNotes, selectionRange.start, selectionRange.end, toPlainText(text))
      setEditableNotes(next)
      setSelectedText(""); setSelectionRange(null); setSaveStatus("Selected text regenerated")
      setTimeout(() => setSaveStatus(""), 2000)
    } catch (error) { setSaveStatus(error.message || "Error regenerating text") } finally { setIsRegenerating(false) }
  }

  const saveDraft = async () => {
    if (!editableNotes.trim()) return
    await idbSet("assignment_draft", { topic, editableNotes, formattedNotes: autoFormatAssignment(editableNotes), images, savedAt: new Date().toISOString() })
    setSaveStatus("Draft saved"); setTimeout(() => setSaveStatus(""), 2000)
  }
  const clearDraft = async () => { await idbDelete("assignment_draft"); setSaveStatus("Draft cleared"); setTimeout(() => setSaveStatus(""), 2000) }
  const handleTextSelection = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart, end = textarea.selectionEnd
    if (start !== end) { setSelectedText(editableNotes.substring(start, end)); setSelectionRange({ start, end }) }
    else { setSelectedText(""); setSelectionRange(null) }
  }

  useEffect(() => {
    (async () => {
      const draft = await idbGet("assignment_draft")
      if (draft && !editableNotes && draft.topic === topic && window.confirm("You have a saved draft for this topic. Load it?")) {
        const plain = toPlainText(draft.editableNotes)
        setEditableNotes(plain); setFormattedNotes(autoFormatAssignment(plain)); if (draft.images) setImages(draft.images)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!editableNotes.trim()) return undefined
    autoSaveTimer.current = setInterval(async () => {
      await idbSet("assignment_draft", { topic, editableNotes, formattedNotes: autoFormatAssignment(editableNotes), images, savedAt: new Date().toISOString() })
      setSaveStatus("Auto-saved"); setTimeout(() => setSaveStatus(""), 2000)
    }, 30000)
    return () => clearInterval(autoSaveTimer.current)
  }, [editableNotes, topic, images])

  const continueToExport = async () => {
    if (!editableNotes.trim()) return
    setIsPlacingImages(true)
    try {
      let formatted = autoFormatAssignment(editableNotes)
      let nextImages = images.filter((img) => img.url)
      const headings = formatted.split("\n").filter((line) => /^##\s+/.test(line)).map((line) => line.replace(/^##\s+/, ""))
      setImageAction("Finding useful images and placing them...")
      try {
        const suggested = await api.suggestImages({ topic, headings, draft: formatted })
        const existingUrls = new Set(nextImages.map((img) => img.url))
        const newImages = (suggested.images || []).filter((img) => img.url && !existingUrls.has(img.url))
        nextImages = [...nextImages, ...newImages]
      } catch (error) { console.warn("Image search failed", error) }
      if (nextImages.length) {
        const placed = await api.placeImages({ draft: formatted, images: nextImages })
        formatted = placed.text || formatted
      }
      setImages(nextImages)
      setFormattedNotes(formatted)
      setImageAction("")
      onNext()
    } catch (error) {
      console.warn("Image placement failed", error)
      setFormattedNotes(autoFormatAssignment(editableNotes))
      setImageAction("")
      onNext()
    } finally { setIsPlacingImages(false) }
  }

  return <div className="space-y-8">
    <div><div className="workspace-kicker">Step 2 of 3</div><h1 className="workspace-title">Draft & edit</h1><p className="workspace-subtitle">Generate the assignment, edit it freely, and let the workspace handle document formatting automatically.</p></div>
    {saveStatus && <div className="workspace-alert">{saveStatus}</div>}
    {selfCheck && <div className={`workspace-alert ${selfCheck.issues?.length ? "border-amber-200 bg-amber-50 text-amber-800" : ""}`}><b>AI self-check:</b> {selfCheck.issues?.length ? <ul className="list-disc ml-5 mt-1">{selfCheck.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul> : " Looks on-topic and covers the brief."}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"><div className="workspace-meta"><b>Topic</b><div className="mt-1 text-ink-soft truncate">{topic}</div></div><div className="workspace-meta"><b>Target</b><div className="mt-1 text-ink-soft">{wordCount} words</div></div><div className="workspace-meta"><b>Level</b><div className="mt-1 text-ink-soft">{difficulty}</div></div></div>
    {!isGenerating ? <button onClick={generateAssignment} className="workspace-primary w-full">{editableNotes ? "Regenerate assignment" : "Generate assignment"}</button> : <div className="generation-progress" role="status" aria-live="polite"><div className="generation-progress-head"><span>Building your assignment</span><strong>{genPercent}%</strong></div><div className="generation-track"><div className="generation-fill" style={{ width: `${genPercent}%` }} /></div><div className="generation-status"><span className="generation-pulse" />{genProgress || "Working..."}</div><div className="generation-stages"><span className={genPercent >= 15 ? "done" : "active"}>Outline</span><span className={genPercent >= 75 ? "done" : genPercent >= 15 ? "active" : ""}>Sections</span><span className={genPercent >= 82 ? "done" : ""}>Polish</span><span className={genPercent >= 92 ? "done" : ""}>Check</span></div><button onClick={cancelGeneration} className="workspace-secondary w-full mt-3">Cancel</button></div>}
    <div className="workspace-card p-4 sm:p-5"><div className="flex justify-between mb-3"><label className="font-semibold text-sm">Draft</label><span className="text-xs text-ink-soft">{wordCountTotal} words · {charCount} chars</span></div><textarea ref={textareaRef} value={editableNotes} onChange={(e) => setEditableNotes(toPlainText(e.target.value))} onSelect={handleTextSelection} rows={18} placeholder="Your plain-text assignment will appear here..." className="workspace-editor" />{readabilityScore && <div className="mt-3 text-xs text-ink-soft">Readability: {readabilityScore.score} · {readabilityScore.level} · Grade {readabilityScore.gradeLevel}</div>}</div>
    <div className="workspace-card p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Add images to your assignment</h3><p className="text-xs text-ink-soft mt-1">Upload a picture, then tap <b>Add to assignment</b>. AI will choose the best section for it. You can change its position later.</p></div><button onClick={addImage} className="workspace-secondary shrink-0">+ Add image</button></div>{images.length > 0 && <div className="mt-4 space-y-3">{images.map((img, index) => <div key={img.id} className="image-upload-card">{img.url ? <img src={img.url} alt={img.caption || `Uploaded image ${index + 1}`} className="image-upload-thumb" /> : <label className="image-upload-empty"><span>Choose image</span><input type="file" accept="image/*" onChange={(e) => handleImageUpload(img.id, e)} /></label>}<div className="min-w-0 flex-1"><div className="font-medium text-sm truncate">{img.fileName || img.caption || `Image ${index + 1}`}</div>{img.aiSuggested && <span className="text-[11px] text-forest">Suggested by AI from Wikimedia Commons</span>}<div className="flex flex-wrap gap-2 mt-2">{img.url && <button type="button" onClick={async () => { setImageAction(`Placing image ${index + 1}...`); try { const placed = await api.placeImages({ draft: autoFormatAssignment(editableNotes), images: [img] }); setFormattedNotes(placed.text || autoFormatAssignment(editableNotes)); setImageAction("Image added to the assignment"); } catch { setImageAction("Could not place this image automatically") } }} className="text-xs font-semibold text-forest">{img.aiSuggested ? "Add to assignment" : "Place in assignment"}</button>}<button type="button" onClick={() => removeImage(img.id)} className="text-xs font-semibold text-clay">Remove</button></div></div></div>)}</div>}{imageAction && <div className="mt-3 workspace-alert">{imageAction}</div>}</div>

    {selectedText && <div className="workspace-card p-4"><div className="text-xs text-ink-soft mb-2">Selected passage</div><div className="rounded-lg bg-paper-dim p-3 text-sm leading-6 text-ink-soft max-h-32 overflow-auto">{selectedText}</div><button onClick={regenerateSelectedText} disabled={isRegenerating} className="mt-3 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isRegenerating ? "Regenerating..." : "Regenerate selected passage"}</button></div>}
    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3"><button onClick={onPrev} className="workspace-secondary px-5 py-3">← Back to brief</button><div className="flex gap-3"><button onClick={saveDraft} className="workspace-secondary px-5 py-3">Save draft</button><button onClick={continueToExport} disabled={!editableNotes.trim() || isPlacingImages} className="workspace-primary px-6 py-3 disabled:opacity-40">{isPlacingImages ? "Preparing document..." : "Review & export →"}</button></div></div>
  </div>
}
export default Step2Edit
