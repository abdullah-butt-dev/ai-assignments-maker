// Client-side helper for the backend proxy. No API keys live here --
// they stay server-side in /api/_lib/aiClients.js.

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postJson(url, body, { signal, attempts = 3, baseDelayMs = 800 } = {}) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const err = new Error(errBody.error || `Request failed (${res.status})`)
        err.status = res.status
        throw err
      }
      return await res.json()
    } catch (err) {
      if (err.name === "AbortError") throw err // don't retry a user-cancelled request
      lastErr = err
      const retriable = err.status === 429 || err.status === 502 || err.status === 503 || !err.status
      if (!retriable || i === attempts - 1) throw err
      await sleep(baseDelayMs * Math.pow(2, i))
    }
  }
  throw lastErr
}

export const api = {
  outline: (payload, opts) => postJson("/api/generate", { action: "outline", ...payload }, opts),
  expandSection: (payload, opts) =>
    postJson("/api/generate", { action: "expand-section", ...payload }, opts),
  format: (payload, opts) => postJson("/api/generate", { action: "format", ...payload }, opts),
  regenerateSelection: (payload, opts) =>
    postJson("/api/generate", { action: "regenerate-selection", ...payload }, opts),
  selfCheck: (payload, opts) => postJson("/api/generate", { action: "self-check", ...payload }, opts),
  adjustLength: (payload, opts) =>
    postJson("/api/generate", { action: "adjust-length", ...payload }, opts),
  placeImages: (payload, opts) =>
    postJson("/api/generate", { action: "place-images", ...payload }, opts),
  suggestImages: (payload, opts) =>
    postJson("/api/generate", { action: "suggest-images", ...payload }, opts),
}
