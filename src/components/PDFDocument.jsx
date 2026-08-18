import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { parseAssignmentMarkdown } from "../lib/document"

const formatDate = (value) => { if (!value) return ""; const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) }

const NAVY = "#1B2A4A", TEAL = "#0E7C7B", GREY = "#595959", MINT = "#EAF2F1"

const inlineText = (text) => text.replace(/\*\*/g, "")

function CoverPage({ cover = {}, title }) {
  const displayTitle = cover.assignmentTitle || title || "Assignment"
  const fields = [["Student",cover.studentName],["Subject",cover.subject],["Course",cover.course],["Instructor",cover.instructor],["University",cover.university],["Date",formatDate(cover.date)]].filter(([,value]) => value)
  return <Page size="LETTER" style={styles.coverPage}>
    <View style={styles.coverRule} />
    {cover.universityLogo ? <Image src={cover.universityLogo} style={styles.coverLogo} /> : <View style={styles.logoPlaceholder}><Text style={styles.logoLetter}>U</Text><View style={styles.logoBars}><View style={{...styles.logoBar, backgroundColor: TEAL}} /><View style={{...styles.logoBar, backgroundColor: "#B5542D"}} /><View style={{...styles.logoBar, backgroundColor: NAVY}} /></View></View>}
    <Text style={styles.coverTitle}>{displayTitle}</Text>
    <View style={styles.coverAccent} />
    <View style={styles.coverDetails}>{fields.map(([label,value]) => <View key={label} style={styles.coverField}><Text style={styles.coverLabel}>{label}</Text><Text style={styles.coverValue}>{value}</Text></View>)}</View>
  </Page>
}

function blockToElement(block, index, images) {
  if (block.type === "h1") return <View key={index} style={styles.h1Wrap}><Text style={styles.h1}>{inlineText(block.text)}</Text><View style={styles.h1Border} /></View>
  if (block.type === "h2") return <Text key={index} style={styles.h2}>{inlineText(block.text)}</Text>
  if (block.type === "h3") return <Text key={index} style={styles.h3}>{inlineText(block.text)}</Text>
  if (block.type === "paragraph") return <Text key={index} style={styles.paragraph}>{inlineText(block.text)}</Text>
  if (block.type === "quote") return <View key={index} style={styles.quote}><Text style={styles.quoteText}>{inlineText(block.text)}</Text></View>
  if (block.type === "bullet" || block.type === "numbered") return <View key={index} style={styles.list}>{block.items.map((item, itemIndex) => <View key={itemIndex} style={styles.listItem}><Text style={styles.listMarker}>{block.type === "bullet" ? "•" : `${itemIndex + 1}.`}</Text><Text style={styles.listText}>{inlineText(item)}</Text></View>)}</View>
  if (block.type === "image") {
    const image = images.find((img) => Number(img.id) === block.id && img.url); if (!image) return null
    const width = image.size === "small" ? 160 : image.size === "large" ? 480 : 300
    return <View key={index} style={{ ...styles.imageWrap, alignItems: image.position === "left" ? "flex-start" : image.position === "right" ? "flex-end" : "center" }}><Image src={image.url} style={{ width, height: width * 0.66, objectFit: "contain" }} />{image.caption && <Text style={styles.caption}>{image.caption}</Text>}</View>
  }
  return null
}

function PDFDocument({ notes, images = [], cover = {} }) {
  const blocks = parseAssignmentMarkdown(notes)
  const title = blocks.find((block) => block.type === "h1")?.text || "Assignment"
  const headings = blocks.filter((block) => block.type === "h2" || block.type === "h3")
  return <Document title={cover.assignmentTitle || title}><CoverPage cover={cover} title={title} /><Page size="LETTER" style={styles.page} wrap><View style={styles.toc}><Text style={styles.tocTitle}>Table of contents</Text>{headings.map((heading, index) => <Text key={index} style={{...styles.tocItem, marginLeft: heading.type === "h3" ? 16 : 0}}>{index + 1}. {inlineText(heading.text)}</Text>)}</View></Page><Page size="LETTER" style={styles.page} wrap>{blocks.map((block, index) => blockToElement(block, index, images))}{images.filter((image) => image.url).map((image, index) => <View key={`extra-image-${image.id}-${index}`} style={{ ...styles.imageWrap, alignItems: image.position === "left" ? "flex-start" : image.position === "right" ? "flex-end" : "center" }}><Image src={image.url} style={{ width: image.size === "small" ? 160 : image.size === "large" ? 480 : 300, height: (image.size === "small" ? 160 : image.size === "large" ? 480 : 300) * 0.66, objectFit: "contain" }} />{image.caption && <Text style={styles.caption}>{image.caption}</Text>}</View>)}</Page></Document>
}

const styles = StyleSheet.create({
  coverPage: { padding: 72, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "flex-start" },
  coverRule: { width: "100%", height: 3, backgroundColor: TEAL, marginTop: 28, marginBottom: 42 },
  coverLogo: { width: 92, height: 92, objectFit: "contain", marginBottom: 26 },
  logoPlaceholder: { width: 92, height: 92, borderWidth: 2, borderColor: TEAL, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 26, backgroundColor: "#F7FBFA" },
  logoLetter: { fontSize: 28, fontWeight: "bold", color: NAVY },
  logoBars: { flexDirection: "row", gap: 5, marginTop: 6 },
  logoBar: { width: 13, height: 4, borderRadius: 2 },
  toc: { backgroundColor: MINT, borderLeftWidth: 5, borderLeftColor: TEAL, padding: 18, marginBottom: 24 },
  tocTitle: { fontSize: 19, fontWeight: "bold", color: NAVY, marginBottom: 10 },
  tocItem: { fontSize: 10.5, color: GREY, marginBottom: 7 },
  coverKicker: { fontSize: 11, letterSpacing: 2, fontWeight: "bold", color: TEAL, marginBottom: 28 },
  coverTitle: { fontSize: 30, lineHeight: 1.2, fontWeight: "bold", color: NAVY, textAlign: "center", maxWidth: 450 },
  coverAccent: { width: 120, height: 2, backgroundColor: TEAL, marginTop: 24, marginBottom: 55 },
  coverDetails: { width: "75%" },
  coverField: { marginBottom: 15, alignItems: "center" },
  coverLabel: { fontSize: 9, color: TEAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  coverValue: { fontSize: 12, color: GREY, textAlign: "center" },
  coverFooter: { position: "absolute", bottom: 55, fontSize: 9, color: GREY, fontStyle: "italic" },
  page: { paddingTop: 58, paddingBottom: 58, paddingHorizontal: 62, backgroundColor: "#FFFFFF", color: GREY, fontFamily: "Helvetica" },
  h1Wrap: { marginTop: 20, marginBottom: 14 },
  h1: { fontSize: 21, lineHeight: 1.2, fontWeight: "bold", color: NAVY, marginBottom: 8 },
  h1Border: { height: 1.5, backgroundColor: TEAL, width: "100%" },
  h2: { fontSize: 15, lineHeight: 1.25, fontWeight: "bold", color: TEAL, marginTop: 15, marginBottom: 7 },
  h3: { fontSize: 13, fontWeight: "bold", color: TEAL, marginTop: 12, marginBottom: 6 },
  paragraph: { fontSize: 10.5, lineHeight: 1.55, color: GREY, marginBottom: 10, textAlign: "left" },
  quote: { backgroundColor: MINT, borderLeftWidth: 5, borderLeftColor: TEAL, paddingVertical: 9, paddingHorizontal: 12, marginVertical: 7 },
  quoteText: { fontSize: 10.5, lineHeight: 1.5, color: GREY, fontStyle: "italic" },
  list: { marginBottom: 9, marginTop: 2 },
  listItem: { flexDirection: "row", marginBottom: 4 },
  listMarker: { width: 15, fontSize: 10.5, color: GREY },
  listText: { flex: 1, fontSize: 10.5, lineHeight: 1.5, color: GREY },
  imageWrap: { marginVertical: 14 },
  caption: { fontSize: 8.5, color: GREY, fontStyle: "italic", marginTop: 5, textAlign: "center" },
})

export default PDFDocument
