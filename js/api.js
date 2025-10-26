// js/api.js
// Simple wrapper around your Apps Script endpoints.
// All responses are returned as parsed JSON objects.

async function parseTextResponse(res) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch (err) {
    return { success: false, message: "Invalid JSON response", raw: txt };
  }
}

/**
 * GET summary for a type (Personal / Business / null for all)
 */
async function getSummary(type = null) {
  const params = new URLSearchParams();
  params.set("action", "getSummary");
  if (type) params.set("type", type);
  params.set("key", CONFIG.API_KEY);

  const url = `${CONFIG.API_URL}?${params.toString()}`;
  const res = await fetch(url);
  return await parseTextResponse(res);
}

/**
 * GET transactions with optional filters: { type, date, from, to }
 */
async function getTransactions(filters = {}) {
  const params = new URLSearchParams();
  params.set("action", "getTransactions");
  params.set("key", CONFIG.API_KEY);
  if (filters.type) params.set("type", filters.type);
  if (filters.date) params.set("date", filters.date);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const url = `${CONFIG.API_URL}?${params.toString()}`;
  const res = await fetch(url);
  return await parseTextResponse(res);
}

/**
 * POST add transaction
 * payload must include action:'addTransaction' and key
 */
async function addTransaction(payload) {
  const body = Object.assign({}, payload, { action: "addTransaction", key: CONFIG.API_KEY });
  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return await parseTextResponse(res);
}

/**
 * Get categories
 */
async function getCategories() {
  const params = new URLSearchParams();
  params.set("action", "getCategories");
  params.set("key", CONFIG.API_KEY);
  const res = await fetch(`${CONFIG.API_URL}?${params.toString()}`);
  return await parseTextResponse(res);
}

// expose for debugging if needed
window._api = { getSummary, getTransactions, addTransaction, getCategories };
