import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import PDFDocument from "./PDFDocument"

function ExportButton({ formattedNotes, images = [], cover = {} }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const handleExport = async () => {
    if (!formattedNotes) return
    setIsGenerating(true)
    try {
      const blob = await pdf(<PDFDocument notes={formattedNotes} images={images} cover={cover} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url; link.download = "my-assignment.pdf"; link.click(); URL.revokeObjectURL(url)
    } catch (error) { console.error("PDF Error:", error); alert("Could not create the PDF. Please try again.") }
    finally { setIsGenerating(false) }
  }
  return <button onClick={handleExport} disabled={!formattedNotes || isGenerating} className="workspace-secondary w-full py-3 border-navy text-navy hover:bg-paper-dim disabled:opacity-40">{isGenerating ? "Generating PDF..." : "Download PDF"}</button>
}
export default ExportButton
