import Logo from "./Logo"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
]

const STATS = [
  { value: "3", label: "steps from topic to export" },
  { value: "2x", label: "every draft is checked twice" },
  { value: "PDF + DOCX", label: "polished export formats" },
  { value: "$0", label: "no sign-up, no account" },
]

const STEPS = [
  {
    n: "01",
    title: "Define the brief",
    body: "Give it a topic, a word count, and a difficulty level. That's the whole setup -- no account, no onboarding wizard.",
  },
  {
    n: "02",
    title: "Draft & edit",
    body: "Watch the outline form, then each section get written against your brief. Edit freely, regenerate any passage in place, drop in images.",
  },
  {
    n: "03",
    title: "Review & export",
    body: "Add your academic details, review the live formatted pages, then download a polished PDF or Word file.",
  },
]

const FEATURES = [
  {
    title: "Outline, then write",
    body: "The model plans section-by-section before drafting, so long assignments stay on-topic instead of drifting or truncating halfway through.",
    span: "sm:col-span-2",
  },
  {
    title: "Self-checked drafts",
    body: "Every draft gets a second pass checked against your brief and word count -- issues are flagged, not hidden.",
    span: "",
  },
  {
    title: "Regenerate any passage",
    body: "Select a sentence or a paragraph and have it rewritten in place, without touching the rest of your draft.",
    span: "",
  },
  {
    title: "Images, sized and placed",
    body: "Drop in images anywhere, control size and position, and export with everything intact.",
    span: "",
  },
  {
    title: "Cover page + formatting",
    body: "Add your university details and get the same professional navy and teal document design in both PDF and Word.",
    span: "",
  },
  {
    title: "Your work stays yours",
    body: "Drafts save locally in your browser as you go. Close the tab, come back tomorrow, pick up where you left off.",
    span: "sm:col-span-2",
  },
]

const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. There is no sign-up at all. Your draft is saved in your own browser's storage as you work, so it survives refreshes and restarts without ever touching a server.",
  },
  {
    q: "What does it cost?",
    a: "Nothing. The tool is free to use -- drafts are generated through a backend proxy and saved locally on your device.",
  },
  {
    q: "What can I export to?",
    a: "Finished assignments export as a polished PDF or a Word (DOCX) document, with your chosen fonts, heading styles, images, and cover page intact.",
  },
  {
    q: "Can I edit what the AI writes?",
    a: "Yes -- that's the point of step two. The draft is fully editable, and you can select any passage and have just that part regenerated while the rest stays untouched.",
  },
  {
    q: "Will a long assignment get cut off?",
    a: "The writer plans an outline first and drafts section-by-section, then checks the result against your brief and word count. Long assignments stay coherent instead of trailing off.",
  },
]

function EditorPreview() {
  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="rounded-2xl border border-line bg-white shadow-[0_24px_60px_-24px_rgba(35,38,31,0.25)] overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line/70 bg-paper-dim/60">
          <span className="w-2.5 h-2.5 rounded-full bg-line" />
          <span className="w-2.5 h-2.5 rounded-full bg-line" />
          <span className="w-2.5 h-2.5 rounded-full bg-forest/60" />
          <span className="ml-3 font-mono text-[11px] text-ink-soft">step 2 &middot; draft &amp; edit</span>
        </div>
        <div className="grid sm:grid-cols-[1fr_240px]">
          {/* document pane */}
          <div className="p-6 sm:p-8 text-left">
            <p className="font-mono text-[11px] text-clay mb-3">outline &middot; section 2 of 5</p>
            <h3 className="font-display text-xl sm:text-2xl font-semibold mb-3">
              The causes of the French Revolution
            </h3>
            <div className="space-y-2.5">
              <div className="h-2.5 rounded bg-paper-dim w-full" />
              <div className="h-2.5 rounded bg-paper-dim w-11/12" />
              <div className="h-2.5 rounded bg-forest/25 w-full" />
              <div className="h-2.5 rounded bg-paper-dim w-10/12" />
              <div className="h-2.5 rounded bg-paper-dim w-full" />
              <div className="h-2.5 rounded bg-paper-dim w-9/12" />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-forest/40 bg-forest/5 px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
              <span className="font-mono text-[11px] text-forest">regenerating selected passage&hellip;</span>
            </div>
          </div>
          {/* inspector pane */}
          <aside className="hidden sm:block border-l border-line/70 bg-paper/70 p-5 text-left">
            <p className="font-mono text-[11px] text-ink-soft mb-3">brief check</p>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-forest text-white text-[9px] flex items-center justify-center">&#10003;</span>
                on-topic
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-forest text-white text-[9px] flex items-center justify-center">&#10003;</span>
                word count 1,482 / 1,500
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-forest text-white text-[9px] flex items-center justify-center">&#10003;</span>
                all sections drafted
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-line/70">
              <p className="font-mono text-[11px] text-ink-soft mb-2">export</p>
              <div className="flex gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-md bg-ink text-paper">PDF</span>
                <span className="text-[11px] px-2.5 py-1 rounded-md border border-line">DOCX</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {/* floating margin note */}
      <div className="margin-note absolute -top-4 right-4 sm:-right-6 px-3 py-1.5 rounded-full bg-clay-soft text-clay shadow-sm">
        checked against your brief
      </div>
    </div>
  )
}

function Homepage({ onStart }) {
  const handleStart = () => {
    onStart()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-paper text-ink scroll-smooth">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-line/60 bg-paper/85 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3.5 px-4 sm:px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm text-ink-soft">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-ink transition">
                {l.label}
              </a>
            ))}
          </nav>
          <button
            onClick={handleStart}
            className="bg-forest hover:bg-forest-dark text-white text-sm px-5 py-2 rounded-full font-medium transition"
          >
            Start a draft
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="margin-note inline-block px-3 py-1 rounded-full bg-clay-soft text-clay mb-6">
            draft &rarr; edit &rarr; export
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.05] tracking-tight mb-6">
            Turn a topic into a
            <br />
            finished assignment.
          </h1>
          <p className="text-base sm:text-lg text-ink-soft max-w-xl mx-auto mb-10">
            An outline-first drafting workbench: the AI plans, writes, and checks its own
            work against your brief before you ever see the page.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleStart}
              className="bg-forest hover:bg-forest-dark text-white px-8 py-3 rounded-full text-base font-medium transition w-full sm:w-auto"
            >
              Start a draft
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-3 rounded-full text-base font-medium border border-line hover:bg-paper-dim transition w-full sm:w-auto text-center"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 font-mono text-xs text-ink-soft">no sign-up &middot; saves in your browser</p>
        </div>

        <div className="mt-16 sm:mt-20 px-0">
          <EditorPreview />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-line/60 bg-paper-dim/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-semibold">{s.value}</div>
              <div className="mt-1 text-xs sm:text-sm text-ink-soft">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="font-mono text-xs text-clay mb-3">the workflow</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Three steps, in order, on purpose.
            </h2>
            <p className="text-ink-soft">
              Brief first, draft second, style last. The order is the product -- each step
              constrains the next so the output stays on brief.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-line bg-white p-6 sm:p-7">
                <div className="font-mono text-sm text-clay mb-3">{s.n}</div>
                <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-line/60 bg-paper-dim/40 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="font-mono text-xs text-clay mb-3">features</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Built for accuracy, not just speed.
            </h2>
            <p className="text-ink-soft">
              Every feature exists to keep the draft honest: planned before written, checked
              after writing, editable at every point in between.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`p-5 sm:p-6 rounded-2xl border border-line bg-white ${f.span} lg:col-span-2`}
              >
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-6 py-16 sm:py-24 border-t border-line/60 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 text-center">
            <p className="font-mono text-xs text-clay mb-3">questions</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Frequently asked
            </h2>
          </div>
          <div className="divide-y divide-line/70 border-y border-line/70">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-left">
                  {f.q}
                  <span className="shrink-0 w-6 h-6 rounded-full border border-line flex items-center justify-center text-ink-soft transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-ink-soft leading-relaxed max-w-2xl">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 border-t border-line/60 bg-forest text-paper">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Your next assignment starts with one sentence.
          </h2>
          <p className="text-paper/80 mb-9">
            Type the topic. The outline, the draft, and the export are already waiting.
          </p>
          <button
            onClick={handleStart}
            className="bg-paper text-ink hover:bg-white px-8 py-3 rounded-full text-base font-medium transition"
          >
            Start a draft
          </button>
          <p className="mt-5 font-mono text-xs text-paper/70">free &middot; no account &middot; saves locally</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line/60 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display font-semibold">AI Assignment Maker</span>
          <nav className="flex items-center gap-6 text-sm text-ink-soft">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-ink transition">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
