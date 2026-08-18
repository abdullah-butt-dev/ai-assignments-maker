// Server-side only. Never import this from client code.
// Keys are read from process.env, set in Vercel project settings (not VITE_ prefixed).

const GEMINI_KEY = process.env.GEMINI_API_KEY
const GROQ_KEY = process.env.GROQ_API_KEY

const GEMINI_MODELS = {
  quality: "gemini-3.5-flash",       // primary: content generation, self-check
  fast: "gemini-3.1-flash-lite",     // fast/high-volume: formatting, regeneration, routing
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generic retry wrapper with exponential backoff for 429s / transient failures.
async function withRetry(fn, { attempts = 3, baseDelayMs = 600 } = {}) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const status = err?.status || err?.response?.status
      const retriable = status === 429 || status === 503 || status >= 500 || !status
      if (!retriable || i === attempts - 1) throw err
      await sleep(baseDelayMs * Math.pow(2, i))
    }
  }
  throw lastErr
}

async function callGemini(prompt, { model = GEMINI_MODELS.quality, json = false, systemInstruction } = {}) {
  if (!GEMINI_KEY) {
    const err = new Error("GEMINI_API_KEY not configured")
    err.status = 500
    throw err
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
  }

  return withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      const err = new Error(`Gemini error ${res.status}: ${errText}`)
      err.status = res.status
      throw err
    }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || ""
    if (!text) {
      const err = new Error("Gemini returned empty response")
      err.status = 502
      throw err
    }
    return text
  })
}

async function callGroq(prompt, { json = false } = {}) {
  if (!GROQ_KEY) {
    const err = new Error("GROQ_API_KEY not configured")
    err.status = 500
    throw err
  }

  return withRetry(async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      const err = new Error(`Groq error ${res.status}: ${errText}`)
      err.status = res.status
      throw err
    }
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      const err = new Error("Groq returned empty response")
      err.status = 502
      throw err
    }
    return text
  })
}

/**
 * Model routing:
 *  - tier "quality": Gemini 3.5 Flash -> Groq gpt-oss-120b -> Gemini 3.1 Flash-Lite
 *  - tier "fast":    Gemini 3.1 Flash-Lite -> Groq gpt-oss-120b
 * Falls through providers on failure so one exhausted free-tier quota doesn't break generation.
 */
async function generateText(prompt, { tier = "quality", json = false, systemInstruction } = {}) {
  const chain =
    tier === "fast"
      ? [
          () => callGemini(prompt, { model: GEMINI_MODELS.fast, json, systemInstruction }),
          () => callGroq(prompt, { json }),
        ]
      : [
          () => callGemini(prompt, { model: GEMINI_MODELS.quality, json, systemInstruction }),
          () => callGroq(prompt, { json }),
          () => callGemini(prompt, { model: GEMINI_MODELS.fast, json, systemInstruction }),
        ]

  let lastErr
  for (const attempt of chain) {
    try {
      return await attempt()
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

function stripJsonFences(text) {
  return text.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim()
}

export { generateText, callGemini, callGroq, stripJsonFences, GEMINI_MODELS }