import { useState } from "react"

const topicSamples = [
  "Write an essay on the causes and effects of climate change",
  "Explain artificial intelligence and its impact on society",
  "Discuss the importance of renewable energy sources",
  "Write about the benefits of exercise on mental health",
  "Explain the process of photosynthesis",
  "Discuss the pros and cons of social media",
]

function Step1Topic({ topic, setTopic, wordCount, setWordCount, difficulty, setDifficulty, additionalInstructions, setAdditionalInstructions, onNext }) {
  const [sampleIndex, setSampleIndex] = useState(0)
  const loadSampleTopic = () => {
    const next = (sampleIndex + 1) % topicSamples.length
    setSampleIndex(next)
    setTopic(topicSamples[next])
  }
  const handleNext = () => {
    if (!topic.trim()) return alert("Please enter an assignment topic")
    onNext()
  }

  return <div className="space-y-8">
    <div>
      <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">Step 1 of 3</div>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-navy">Define your assignment</h1>
      <p className="mt-2 max-w-2xl text-sm sm:text-base leading-6 text-slate-500">Give the workspace a clear brief. The generator will use these details to plan and write the draft.</p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2"><label className="text-sm font-semibold text-navy">Assignment topic <span className="text-teal">*</span></label><button onClick={loadSampleTopic} className="text-xs font-semibold text-teal hover:underline">Use sample</button></div>
        <textarea rows="4" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10" placeholder="e.g. Write a 1,000-word essay on climate change and its economic impact..." />
        <div className="mt-2 text-xs text-slate-400 text-right">{topic.length} characters</div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-semibold">Word count</span><select value={wordCount} onChange={(e) => setWordCount(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"><option>500</option><option>1000</option><option>1500</option><option>2000</option></select></label>
        <label className="block"><span className="text-sm font-semibold">Difficulty</span><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"><option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option></select></label>
      </div>

      <label className="block"><span className="text-sm font-semibold">Additional instructions <span className="font-normal text-slate-400">Optional</span></span><textarea rows="3" value={additionalInstructions} onChange={(e) => setAdditionalInstructions(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-teal focus:ring-4 focus:ring-teal/10" placeholder="Specific requirements, sources, structure, examples, or topics to cover..." /></label>
    </div>

    <div className="flex justify-end"><button onClick={handleNext} className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-navy/90 transition">Continue to draft →</button></div>
  </div>
}
export default Step1Topic
