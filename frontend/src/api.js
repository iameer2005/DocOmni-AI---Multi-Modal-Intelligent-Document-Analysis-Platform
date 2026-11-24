const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
let stored = (localStorage.getItem("apiKey") || "").trim();
let key = (stored.length >= 4) ? stored : (import.meta.env.VITE_API_KEY || "dev-key");
if (stored.length > 0 && stored.length < 4) {
  localStorage.setItem("apiKey", "dev-key");
  key = "dev-key";
}
export const setKey = (k) => {
  key = (k && k.trim().length >= 4) ? k.trim() : "dev-key";
  localStorage.setItem("apiKey", key);
};
export const getKey = () => key;

async function req(path, opts = {}) {
  const r = await fetch(BASE + path, { ...opts, headers: { "X-API-Key": key, ...(opts.headers || {}) } });
  if (!r.ok) {
    let msg = r.statusText;
    try { const j = await r.json(); msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail); } catch {}
    throw new Error(`${r.status}: ${msg}`);
  }
  return r.json();
}
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null)).toString();

export const api = {
  upload: (files, docType = null) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const q = docType ? `?doc_type=${encodeURIComponent(docType)}` : "";
    return req("/documents" + q, { method: "POST", body: fd });
  },
  list: (p) => req("/documents?" + qs(p)),
  doc: (id) => req(`/documents/${id}`),
  result: (id) => req(`/documents/${id}/result`),
  text: (id) => req(`/documents/${id}/text`),
  correct: (id, body) => req(`/documents/${id}/result`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  reprocess: (id) => req(`/documents/${id}/reprocess?force=true`, { method: "POST" }),
  remove: (id) => req(`/documents/${id}`, { method: "DELETE" }),
  search: (p) => req("/search?" + qs(p)),
  stats: () => req("/stats"),
};
