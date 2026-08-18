import { useState, useEffect } from "react"
import Step1Topic from "./Step1Topic"
import Step2Edit from "./Step2Edit"
import Step3Style from "./Step3Style"
import ErrorBoundary from "./ErrorBoundary"
import { idbGet, idbSet, idbDelete } from "../lib/db"
import Logo from "./Logo"

const STEPS = [
  { n: 1, label: "Brief", note: "define the assignment" },
  { n: 2, label: "Draft", note: "generate & edit" },
  { n: 3, label: "Export", note: "review & download" },
]

function AssignmentWizard({ onBack }) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [topic, setTopic] = useState("")
  const [wordCount, setWordCount] = useState("1000")
  const [difficulty, setDifficulty] = useState("Medium")
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [editableNotes, setEditableNotes] = useState("")
  const [formattedNotes, setFormattedNotes] = useState("")
  const [images, setImages] = useState([])
  const [cover, setCover] = useState({ studentName: "", assignmentTitle: "", subject: "", course: "", instructor: "", university: "", date: "" })

  useEffect(() => {
    idbGet("assignment_wizard_state").then((state) => {
      if (state) {
        if (state.topic) setTopic(state.topic)
        if (state.wordCount) setWordCount(state.wordCount)
        if (state.difficulty) setDifficulty(state.difficulty)
        if (state.additionalInstructions) setAdditionalInstructions(state.additionalInstructions)
        if (state.editableNotes) setEditableNotes(state.editableNotes)
        if (state.formattedNotes) setFormattedNotes(state.formattedNotes)
        if (state.images) setImages(state.images)
        if (state.cover) setCover(state.cover)
        if (state.step) setStep(state.step)
      }
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (isLoading) return
    idbSet("assignment_wizard_state", { step, topic, wordCount, difficulty, additionalInstructions, editableNotes, formattedNotes, images, cover })
  }, [step, topic, wordCount, difficulty, additionalInstructions, editableNotes, formattedNotes, images, cover, isLoading])

  const updateImage = (id, patch) => setImages((prev) => prev.map((img) => img.id === id ? { ...img, ...patch } : img))
  const clearSavedState = async () => { await idbDelete("assignment_wizard_state"); await idbDelete("assignment_draft") }

  if (isLoading) return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="h-10 w-10 rounded-full border-4 border-teal/20 border-t-teal animate-spin" /></div>

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between mb-8">
          <button onClick={async () => { await clearSavedState(); onBack() }} className="brand-back"><Logo compact /><span>Back to home</span></button>
          <div className="hidden sm:block text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Assignment workspace</div>
        </header>

        <div className="progress-shell max-w-4xl mx-auto mb-8">
          <div className="progress-topline"><span>Assignment workspace</span><strong>{Math.round(((step - 1) / 2) * 100)}% complete</strong></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} /></div>
          <div className="progress-steps">
            {STEPS.map((item) => {
              const active = step === item.n, done = step > item.n
              return <button key={item.n} onClick={() => item.n <= step && setStep(item.n)} disabled={item.n > step} className={`progress-step ${active ? "active" : ""} ${done ? "done" : ""}`}>
                <span className="progress-dot">{done ? "✓" : item.n}</span>
                <span><b>{item.label}</b><small>{item.note}</small></span>
              </button>
            })}
          </div>
        </div>

        <main className="max-w-4xl mx-auto rounded-3xl border border-line bg-white shadow-[0_24px_60px_-30px_rgba(35,38,31,.18)] p-5 sm:p-8 lg:p-10">
          <ErrorBoundary>
            {step === 1 && <Step1Topic topic={topic} setTopic={setTopic} wordCount={wordCount} setWordCount={setWordCount} difficulty={difficulty} setDifficulty={setDifficulty} additionalInstructions={additionalInstructions} setAdditionalInstructions={setAdditionalInstructions} onNext={() => setStep(2)} />}
            {step === 2 && <Step2Edit topic={topic} wordCount={wordCount} difficulty={difficulty} additionalInstructions={additionalInstructions} editableNotes={editableNotes} setEditableNotes={setEditableNotes} formattedNotes={formattedNotes} setFormattedNotes={setFormattedNotes} images={images} setImages={setImages} onNext={() => setStep(3)} onPrev={() => setStep(1)} />}
            {step === 3 && <Step3Style topic={topic} formattedNotes={formattedNotes} images={images} setImages={setImages} updateImage={(id, patch) => updateImage(id, patch)} cover={cover} setCover={setCover} onPrev={() => setStep(2)} />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export default AssignmentWizard
