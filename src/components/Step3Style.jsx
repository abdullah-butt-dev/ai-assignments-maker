import { useMemo } from "react"
import ExportDocxButton from "./ExportDocxButton"
import ExportButton from "./ExportButton"
import { parseAssignmentMarkdown } from "../lib/document"

const formatDate = (value) => { if (!value) return ""; const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) }

const defaultCover = { studentName: "", assignmentTitle: "", subject: "", course: "", instructor: "", university: "", date: "", universityLogo: "" }

function PlaceholderLogo() {
  return <div className="cover-logo-placeholder" aria-label="University logo placeholder"><span>U</span><i /><i /><i /></div>
}

function CoverPreview({ cover, title }) {
  const data = { ...defaultCover, ...cover }
  const displayTitle = data.assignmentTitle || title || "Assignment"
  return <div className="assignment-cover mx-auto">
    <div className="assignment-cover-rule" />
    {data.universityLogo ? <img src={data.universityLogo} alt="University logo" className="cover-university-logo" /> : <PlaceholderLogo />}
    <h1>{displayTitle}</h1>
    <div className="assignment-cover-line" />
    <div className="assignment-cover-details">
      {data.studentName && <div><span>Student</span><strong>{data.studentName}</strong></div>}
      {data.subject && <div><span>Subject</span><strong>{data.subject}</strong></div>}
      {data.course && <div><span>Course / section</span><strong>{data.course}</strong></div>}
      {data.instructor && <div><span>Instructor</span><strong>{data.instructor}</strong></div>}
      {data.university && <div><span>University / institution</span><strong>{data.university}</strong></div>}
      {data.date && <div><span>Date</span><strong>{formatDate(data.date)}</strong></div>}
    </div>
  </div>
}

function DocumentPreview({ formattedNotes, images }) {
  const blocks = parseAssignmentMarkdown(formattedNotes)
  return <article className="assignment-page">
    <div className="document-toc">
      <h1>Table of contents</h1>
      <ol>{blocks.filter((b) => b.type === "h2").map((b, i) => <li key={`${b.text}-${i}`}>{b.text}</li>)}</ol>
    </div>
    {blocks.map((block, index) => {
      if (block.type === "h1") return <div key={index} className="doc-h1"><h1>{block.text}</h1></div>
      if (block.type === "h2") return <h2 key={index}>{block.text}</h2>
      if (block.type === "h3") return <h3 key={index}>{block.text}</h3>
      if (block.type === "paragraph") return <p key={index}>{block.text}</p>
      if (block.type === "quote") return <blockquote key={index}>{block.text}</blockquote>
      if (block.type === "bullet") return <ul key={index}>{block.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
      if (block.type === "numbered") return <ol key={index}>{block.items.map((item, j) => <li key={j}>{item}</li>)}</ol>
      if (block.type === "image") {
        const image = images.find((img) => Number(img.id) === block.id && img.url)
        if (!image) return null
        return <figure key={index} className={`doc-image ${image.position || "center"}`}><img src={image.url} alt={image.caption || "Assignment figure"} className={image.size || "medium"} />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>
      }
      return null
    })}
  </article>
}

function Step3Style({ topic, formattedNotes, images, setImages, updateImage, cover, setCover, onPrev }) {
  const title = useMemo(() => parseAssignmentMarkdown(formattedNotes || "").find((b) => b.type === "h1")?.text || "Assignment", [formattedNotes])
  const updateCover = (field, value) => setCover((current) => ({ ...current, [field]: value }))
  const handleLogo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => updateCover("universityLogo", reader.result)
    reader.readAsDataURL(file)
  }
  if (!formattedNotes) return <div className="space-y-6"><div><div className="workspace-kicker">Step 3 of 3</div><h1 className="workspace-title">Review & export</h1><p className="workspace-subtitle">Go back to your draft and add some content first.</p></div><button onClick={onPrev} className="workspace-primary">← Back to draft</button></div>

  const usableImages = images.filter((img) => img.url)
  return <div className="space-y-8">
    <div><div className="workspace-kicker">Step 3 of 3</div><h1 className="workspace-title">Review & export</h1><p className="workspace-subtitle">Your draft is now a live formatted document. Add the cover details, review the pages, and export.</p></div>

    <section className="workspace-card p-5 sm:p-6">
      <div className="mb-5"><h2 className="text-lg font-semibold">Assignment cover</h2><p className="mt-1 text-sm text-ink-soft">Add the details normally found on a university assignment cover.</p></div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[['studentName','Student name'],['assignmentTitle','Assignment title'],['subject','Subject'],['course','Course / section'],['instructor','Instructor'],['university','University / institution']].map(([field,label]) => <label key={field} className="block"><span className="workspace-label">{label}</span><input value={cover[field] || ""} onChange={(e) => updateCover(field, e.target.value)} placeholder={label} className="workspace-input w-full mt-1.5" /></label>)}
        <label className="block"><span className="workspace-label">Date</span><input type="date" value={cover.date || ""} onChange={(e) => updateCover("date", e.target.value)} className="workspace-input w-full mt-1.5" /></label>
        <label className="block"><span className="workspace-label">University logo</span><input type="file" accept="image/*" onChange={handleLogo} className="workspace-input w-full mt-1.5" />{cover.universityLogo && <button type="button" onClick={() => updateCover("universityLogo", "")} className="mt-2 text-xs font-semibold text-clay">Remove logo</button>}</label>
      </div>
    </section>

    <section className="workspace-card p-5 sm:p-7">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Document preview</h2><p className="text-sm text-ink-soft mt-1">Cover, table of contents, headings, figures and body copy are rendered here exactly as the export structure.</p></div><span className="workspace-badge">Live preview</span></div>
      <div className="preview-stage"><CoverPreview cover={cover} title={title} /><DocumentPreview formattedNotes={formattedNotes} images={images} /></div>
    </section>

    {usableImages.length > 0 && <section className="workspace-card p-4"><h3 className="font-semibold mb-1">Image placement</h3><p className="text-xs text-ink-soft mb-3">AI places uploaded images in the most relevant section automatically. You can still override the size or position.</p><div className="space-y-3">{usableImages.map((img, index) => <div key={img.id} className="grid sm:grid-cols-[100px_1fr] gap-3 items-center"><img src={img.url} alt={img.caption || `Image ${index + 1}`} className="h-20 w-24 rounded-lg object-cover" /><div className="grid grid-cols-2 gap-2"><label className="workspace-label">Size<select value={img.size || "medium"} onChange={(e) => updateImage(img.id, { size: e.target.value })} className="workspace-input mt-1 w-full"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label><label className="workspace-label">Position<select value={img.position || "center"} onChange={(e) => updateImage(img.id, { position: e.target.value })} className="workspace-input mt-1 w-full"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div></div>)}</div></section>}

    <section className="workspace-card p-5"><div className="grid sm:grid-cols-2 gap-4"><ExportDocxButton formattedNotes={formattedNotes} images={images} cover={cover} /><ExportButton formattedNotes={formattedNotes} images={images} cover={cover} /></div><button onClick={onPrev} className="workspace-secondary w-full mt-3">← Back to draft</button></section>
  </div>
}
export default Step3Style
