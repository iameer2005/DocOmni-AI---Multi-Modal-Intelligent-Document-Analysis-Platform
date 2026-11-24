import React, { useCallback, useEffect, useRef, useState } from "react";
import { api, getKey, setKey } from "./api.js";
import {
  Cpu,
  Receipt,
  GraduationCap,
  Search as SearchIcon,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  FileCode,
  Trash2,
  Plus,
  X,
  Save,
  Key,
  Sun,
  Moon,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  History,
  ArrowRight,
  Filter,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";

const INVOICE_FIELDS = [
  ["invoice_number", "Invoice #", "text"],
  ["invoice_date", "Invoice Date", "date"],
  ["supplier_name", "Supplier", "text"],
  ["customer_name", "Customer", "text"],
  ["subtotal", "Subtotal", "number"],
  ["tax", "Tax", "number"],
  ["total", "Total", "number"],
  ["currency", "Currency", "text"],
];

const RESUME_FIELDS = [
  ["candidate_name", "Candidate Name", "text"],
  ["degree", "Degree / Major", "text"],
  ["institution", "College / University", "text"],
  ["cgpa", "CGPA / GPA Score", "text"],
  ["graduation_year", "Graduation Year", "text"],
  ["experience_years", "Experience Level", "text"],
  ["email", "Email Address", "email"],
  ["phone", "Phone Number", "text"],
  ["location", "Location", "text"],
];

const Badge = ({ s }) => {
  const statusStr = s || "unknown";
  return (
    <span className={`badge ${statusStr}`}>
      <span className="badge-dot" />
      {statusStr.replace("_", " ")}
    </span>
  );
};

function Upload({ onDone, docType = "invoice" }) {
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [drag, setDrag] = useState(false);
  const input = useRef();

  const isResume = docType === "resume";
  const titleText = isResume
    ? "Drop Resumes or CV Documents"
    : "Drop Invoices, Receipts & Financial Documents";
  const formatsText = isResume
    ? "Supported: PDF, JPG, PNG, TIFF"
    : "Supported: PDF, JPG, PNG, TIFF, XLSX, XLS, CSV";

  const send = async (files) => {
    if (!files.length) return;
    setBusy(true);
    try {
      const r = await api.upload([...files], docType);
      setMsgs(
        r.results.map((x) => ({
          ok: x.accepted,
          text: x.accepted
            ? `${x.filename} successfully queued`
            : `${x.filename}: ${x.error}`,
        }))
      );
      onDone();
    } catch (e) {
      setMsgs([{ ok: false, text: `Upload failed: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`dropzone-container ${drag ? "drag-active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        send(e.dataTransfer.files);
      }}
    >
      <div className="dropzone-icon-wrap">
        <UploadCloud size={22} />
      </div>
      <div className="dropzone-title">{titleText}</div>
      <div className="dropzone-sub">{formatsText}</div>
      <div className="dropzone-actions">
        <button
          className="btn-primary"
          disabled={busy}
          onClick={() => input.current.click()}
        >
          {busy ? (
            <>
              <Loader2 size={14} className="spin" /> Uploading…
            </>
          ) : (
            <>
              <UploadCloud size={14} />
              {isResume ? "Select Resumes" : "Select Invoices"}
            </>
          )}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.xlsx,.xls,.csv"
        onChange={(e) => {
          send(e.target.files);
          e.target.value = "";
        }}
      />
      {msgs.length > 0 && (
        <div className="upload-feedback-list">
          {msgs.map((m, i) => (
            <div key={i} className={`feedback-pill ${m.ok ? "ok" : "err"}`}>
              {m.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{m.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocTable({ docs, selected, onSelect, docType = "invoice" }) {
  const isResume = docType === "resume";

  return (
    <div className="table-container">
      <table className="tech-table">
        <thead>
          <tr>
            <th style={{ width: "45px" }}>ID</th>
            <th>Document</th>
            {isResume ? (
              <>
                <th>Candidate</th>
                <th>Degree</th>
                <th>CGPA</th>
                <th>Institution</th>
              </>
            ) : (
              <>
                <th>Supplier</th>
                <th>Amount</th>
              </>
            )}
            <th>Status</th>
            <th>Pipeline</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr
              key={d.id}
              className={selected === d.id ? "selected-row" : ""}
              onClick={() => onSelect(d.id)}
            >
              <td className="id-cell">#{d.id}</td>
              <td title={d.error || ""}>
                <span className="file-name">{d.filename}</span>
              </td>
              {isResume ? (
                <>
                  <td>
                    <b>{d.candidate_name || "—"}</b>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {d.degree || "—"}
                  </td>
                  <td>
                    {d.cgpa ? (
                      <span className="cgpa-pill">{d.cgpa}</span>
                    ) : (
                      <span style={{ color: "var(--text-dim)" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                    {d.institution || "—"}
                  </td>
                </>
              ) : (
                <>
                  <td>{d.supplier_name || "—"}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {d.total != null ? `${d.total} ${d.currency || ""}` : "—"}
                  </td>
                </>
              )}
              <td>
                <Badge s={d.status} />
              </td>
              <td>
                <div className="progress-container">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.round((d.progress || 0) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="progress-label">
                    {d.stage}
                    {d.pages_total ? ` (${d.pages_done}/${d.pages_total})` : ""}
                  </span>
                </div>
              </td>
              <td className="time-cell">
                {d.processing_ms != null
                  ? `${(d.processing_ms / 1000).toFixed(1)}s`
                  : "—"}
              </td>
            </tr>
          ))}
          {!docs.length && (
            <tr>
              <td
                colSpan={isResume ? 9 : 7}
                style={{ textAlign: "center", padding: "36px 12px" }}
              >
                <div className="empty-state">
                  <FileText size={28} />
                  <p>
                    No {isResume ? "resumes" : "invoices"} found in current view.
                    Drop files above to start processing.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ResumeEditor({ docId, inv, onSaved }) {
  const [form, setForm] = useState({});
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...(inv.data || {}) });
    setSkills([...(inv.data?.skills || [])]);
    setErr("");
  }, [inv]);

  const lowConf = (f) =>
    inv.confidence && inv.confidence[f] != null && inv.confidence[f] < 0.6;
  const issueFields = new Set(
    (inv.issues || []).filter((i) => i.severity === "error").map((i) => i.field)
  );

  const addSkill = (e) => {
    e.preventDefault();
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill("");
    }
  };

  const removeSkill = (sk) => {
    setSkills(skills.filter((s) => s !== sk));
  };

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      const body = { invoice_id: inv.id, corrected_by: "ui-user" };
      RESUME_FIELDS.forEach(([k]) => {
        const v = form[k];
        const orig = inv.data?.[k];
        if ((v ?? "") === (orig ?? "")) return;
        body[k] = v === "" || v == null ? null : v;
      });
      if (form.summary !== inv.data?.summary) {
        body.summary = form.summary || null;
      }
      if (JSON.stringify(skills) !== JSON.stringify(inv.data?.skills || [])) {
        body.skills = skills;
      }
      if (Object.keys(body).length <= 2) {
        setErr("No modifications detected.");
        return;
      }
      await api.correct(docId, body);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="detail-inspector">
      <div className="candidate-hero">
        <h3>
          <span>{form.candidate_name || "Unnamed Candidate"}</span>
          {form.cgpa && <span className="cgpa-pill">GPA: {form.cgpa}</span>}
          <Badge s={inv.status} />
        </h3>
        <div className="candidate-meta-grid">
          {form.degree && (
            <div className="meta-chip">
              <GraduationCap size={14} />
              <span><b>{form.degree}</b></span>
            </div>
          )}
          {form.institution && (
            <div className="meta-chip">
              <Building2 size={14} />
              <span>{form.institution}</span>
            </div>
          )}
          {form.graduation_year && (
            <div className="meta-chip">
              <Calendar size={14} />
              <span>Class of {form.graduation_year}</span>
            </div>
          )}
          {form.experience_years && (
            <div className="meta-chip">
              <Briefcase size={14} />
              <span>{form.experience_years}</span>
            </div>
          )}
          {form.email && (
            <div className="meta-chip">
              <Mail size={14} />
              <span>{form.email}</span>
            </div>
          )}
          {form.phone && (
            <div className="meta-chip">
              <Phone size={14} />
              <span>{form.phone}</span>
            </div>
          )}
          {form.location && (
            <div className="meta-chip">
              <MapPin size={14} />
              <span>{form.location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="inspector-card">
        <div className="section-heading">Candidate Parameters</div>
        <div className="fields-grid">
          {RESUME_FIELDS.map(([k, label, t]) => (
            <label
              key={k}
              className={`field-label ${lowConf(k) ? "low-conf" : ""} ${
                issueFields.has(k) ? "has-issue" : ""
              }`}
            >
              <span>
                {label}{" "}
                {inv.confidence?.[k] != null && (
                  <span className="conf-indicator">
                    ({Number(inv.confidence[k]).toFixed(2)})
                  </span>
                )}
              </span>
              <input
                type={t}
                value={form[k] ?? ""}
                placeholder="Not detected"
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </label>
          ))}
        </div>

        <div className="section-heading" style={{ marginTop: "20px" }}>
          Skills Inventory ({skills.length})
        </div>
        <div className="skills-container">
          {skills.map((sk) => (
            <span key={sk} className="skill-pill">
              <span>{sk}</span>
              <button
                type="button"
                className="remove-skill-btn"
                title="Remove skill"
                onClick={() => removeSkill(sk)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {!skills.length && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              No skills recognized.
            </span>
          )}
        </div>
        <form onSubmit={addSkill} className="add-skill-form">
          <input
            placeholder="Add skill tag (e.g. Python, Docker, PyTorch)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <button type="submit" className="btn-subtle">
            <Plus size={13} /> Add Tag
          </button>
        </form>

        <div className="section-heading" style={{ marginTop: "20px" }}>
          Executive Summary
        </div>
        <textarea
          style={{
            width: "100%",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-default)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            padding: "8px 10px",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            minHeight: "72px",
            resize: "vertical",
          }}
          value={form.summary ?? ""}
          placeholder="Summary or objective statement..."
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />

        {inv.data?.work_experience?.length > 0 && (
          <div>
            <div className="section-heading" style={{ marginTop: "20px" }}>
              Work History
            </div>
            <ul className="experience-list">
              {inv.data.work_experience.map((w, i) => (
                <li key={i} className="experience-card">
                  <div className="exp-header">
                    <span>
                      {w.role || "Role"} · {w.company || "Company"}
                    </span>
                    {w.duration && (
                      <span className="exp-duration">{w.duration}</span>
                    )}
                  </div>
                  {w.description && <p className="exp-desc">{w.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="section-heading" style={{ marginTop: "20px" }}>
          Rule Engine Validation
        </div>
        {(!inv.issues || inv.issues.length === 0) && (
          <div className="feedback-pill ok" style={{ marginBottom: "10px" }}>
            <CheckCircle2 size={13} />
            <span>Profile verified. No rule violations.</span>
          </div>
        )}
        <ul className="issues-list">
          {(inv.issues || []).map((i) => (
            <li
              key={i.id || i.code}
              className={`issue-item ${
                i.severity === "error" ? "error" : "warning"
              }`}
            >
              {i.severity === "error" ? (
                <AlertCircle size={14} />
              ) : (
                <AlertTriangle size={14} />
              )}
              <div>
                <span className="issue-code">{i.code}</span>
                {i.field ? ` [${i.field}]` : ""}: {i.message}
              </div>
            </li>
          ))}
        </ul>

        {err && (
          <div className="feedback-pill err" style={{ marginTop: "10px" }}>
            <AlertCircle size={13} />
            <span>{err}</span>
          </div>
        )}

        <div style={{ marginTop: "16px" }}>
          <button
            className="btn-primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="spin" /> Committing Changes…
              </>
            ) : (
              <>
                <Save size={14} /> Commit Changes
              </>
            )}
          </button>
        </div>

        {inv.corrections?.length > 0 && (
          <details className="tech-details">
            <summary>
              <History size={14} /> Audit Trail ({inv.corrections.length} revisions)
            </summary>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginTop: "8px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {inv.corrections.map((c, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>{c.field}</span>:
                  <span>{JSON.stringify(c.old)}</span>
                  <ArrowRight size={12} />
                  <span style={{ color: "var(--color-success)" }}>
                    {JSON.stringify(c.new)}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    by {c.by}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function InvoiceEditor({ docId, inv, onSaved }) {
  const [form, setForm] = useState({});
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...(inv.data || {}) });
    setItems((inv.data?.line_items || []).map((x) => ({ ...x })));
    setErr("");
  }, [inv]);

  const lowConf = (f) =>
    inv.confidence && inv.confidence[f] != null && inv.confidence[f] < 0.6;
  const issueFields = new Set(
    (inv.issues || []).filter((i) => i.severity === "error").map((i) => i.field)
  );

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      const body = { invoice_id: inv.id, corrected_by: "ui-user" };
      INVOICE_FIELDS.forEach(([k, , t]) => {
        const v = form[k];
        const orig = inv.data?.[k];
        if ((v ?? "") === (orig ?? "")) return;
        body[k] = v === "" || v == null ? null : t === "number" ? Number(v) : v;
      });
      if (JSON.stringify(items) !== JSON.stringify(inv.data?.line_items || [])) {
        body.line_items = items.map((i) => ({
          ...i,
          quantity: num(i.quantity),
          unit_price: num(i.unit_price),
          line_total: num(i.line_total),
        }));
      }
      if (Object.keys(body).length <= 2) {
        setErr("No modifications detected.");
        return;
      }
      await api.correct(docId, body);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const num = (v) => (v === "" || v == null ? null : Number(v));

  return (
    <div className="inspector-card">
      <div className="detail-title-row">
        <h3>
          <span>Invoice #{inv.id}</span>
          <Badge s={inv.status} />
        </h3>
        <span className="pill-tag">
          pp. {inv.page_start}–{inv.page_end} · {inv.extractor}
        </span>
      </div>

      <div className="section-heading">Financial Parameters</div>
      <div className="fields-grid">
        {INVOICE_FIELDS.map(([k, label, t]) => (
          <label
            key={k}
            className={`field-label ${lowConf(k) ? "low-conf" : ""} ${
              issueFields.has(k) ? "has-issue" : ""
            }`}
          >
            <span>
              {label}{" "}
              {inv.confidence?.[k] != null && (
                <span className="conf-indicator">
                  ({Number(inv.confidence[k]).toFixed(2)})
                </span>
              )}
            </span>
            <input
              type={t === "number" ? "number" : t === "date" ? "date" : "text"}
              step="0.01"
              value={form[k] ?? ""}
              placeholder="Not detected"
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>

      <div className="section-heading" style={{ marginTop: "20px" }}>
        Line Item Breakdown
      </div>
      <div className="table-container" style={{ margin: "8px 0" }}>
        <table className="tech-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: "80px" }}>Qty</th>
              <th style={{ width: "100px" }}>Unit Price</th>
              <th style={{ width: "100px" }}>Total</th>
              <th style={{ width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>
                  <input
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      background: "transparent",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                    }}
                    value={it.description ?? ""}
                    onChange={(e) =>
                      setItems(
                        items.map((x, j) =>
                          j === i ? { ...x, description: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      background: "transparent",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                    }}
                    value={it.quantity ?? ""}
                    onChange={(e) =>
                      setItems(
                        items.map((x, j) =>
                          j === i ? { ...x, quantity: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      background: "transparent",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                    }}
                    value={it.unit_price ?? ""}
                    onChange={(e) =>
                      setItems(
                        items.map((x, j) =>
                          j === i ? { ...x, unit_price: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      background: "transparent",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                    }}
                    value={it.line_total ?? ""}
                    onChange={(e) =>
                      setItems(
                        items.map((x, j) =>
                          j === i ? { ...x, line_total: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    className="icon-btn"
                    title="Remove item"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                  >
                    <X size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="btn-subtle"
        onClick={() =>
          setItems([
            ...items,
            { description: "", quantity: "", unit_price: "", line_total: "" },
          ])
        }
      >
        <Plus size={13} /> Add Line Item
      </button>

      <div className="section-heading" style={{ marginTop: "20px" }}>
        Validation Audit
      </div>
      {(!inv.issues || inv.issues.length === 0) && (
        <div className="feedback-pill ok">
          <CheckCircle2 size={13} />
          <span>All checks passed. Mathematical verification valid.</span>
        </div>
      )}
      <ul className="issues-list">
        {(inv.issues || []).map((i) => (
          <li
            key={i.id || i.code}
            className={`issue-item ${
              i.severity === "error" ? "error" : "warning"
            }`}
          >
            {i.severity === "error" ? (
              <AlertCircle size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}
            <div>
              <span className="issue-code">{i.code}</span>
              {i.field ? ` [${i.field}]` : ""}: {i.message}
            </div>
          </li>
        ))}
      </ul>

      {err && (
        <div className="feedback-pill err" style={{ marginTop: "10px" }}>
          <AlertCircle size={13} />
          <span>{err}</span>
        </div>
      )}

      <div style={{ marginTop: "16px" }}>
        <button
          className="btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="spin" /> Verifying…
            </>
          ) : (
            <>
              <Save size={14} /> Commit & Revalidate
            </>
          )}
        </button>
      </div>

      {inv.corrections?.length > 0 && (
        <details className="tech-details">
          <summary>
            <History size={14} /> Revisions ({inv.corrections.length})
          </summary>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginTop: "8px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            {inv.corrections.map((c, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--text-secondary)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>{c.field}</span>:
                <span>{JSON.stringify(c.old)}</span>
                <ArrowRight size={12} />
                <span style={{ color: "var(--color-success)" }}>
                  {JSON.stringify(c.new)}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  by {c.by}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Detail({ id, onChanged }) {
  const [res, setRes] = useState(null);
  const [doc, setDoc] = useState(null);
  const [text, setText] = useState(null);
  const [err, setErr] = useState("");
  const [reprocessing, setReprocessing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, d] = await Promise.all([api.result(id), api.doc(id)]);
      setRes(r);
      setDoc(d);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }, [id]);

  useEffect(() => {
    setRes(null);
    setText(null);
    load();
  }, [load]);

  useEffect(() => {
    if (res && ["queued", "processing"].includes(res.document.status)) {
      const t = setTimeout(load, 1500);
      return () => clearTimeout(t);
    }
  }, [res, load]);

  if (err) {
    return (
      <div className="feedback-pill err">
        <AlertCircle size={14} />
        <span>{err}</span>
      </div>
    );
  }
  if (!res) {
    return (
      <div className="empty-state">
        <Loader2 size={24} className="spin" />
        <p>Fetching document telemetry…</p>
      </div>
    );
  }

  const d = res.document;
  const isResume = res.doc_type === "resume" || d.doc_type === "resume";
  const records = res.invoices || [];

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await api.reprocess(id);
      load();
      onChanged();
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div className="detail-inspector">
      <div className="detail-header-card">
        <div className="detail-title-row">
          <h3>
            <span>{d.filename}</span>
            <Badge s={d.status} />
            <span className="pill-tag">
              {isResume ? "Resume Intelligence" : "Invoice Parser"}
            </span>
          </h3>
        </div>

        {d.error && (
          <div className="feedback-pill err" style={{ marginBottom: "12px" }}>
            <AlertCircle size={14} />
            <span>{d.error}</span>
          </div>
        )}

        <div className="toolbar-actions">
          <button
            className="btn-secondary"
            disabled={reprocessing}
            onClick={handleReprocess}
          >
            <RefreshCw
              size={13}
              className={reprocessing ? "spin" : ""}
            />
            {d.status === "failed" ? "Retry Processing" : "Reprocess Document"}
          </button>
          <button
            className="btn-secondary"
            onClick={async () => setText((await api.text(id)).pages)}
          >
            <FileCode size={13} />
            Extracted Text
          </button>
          <button
            className="btn-danger"
            onClick={async () => {
              if (confirm("Permanently delete this document and extracted data?")) {
                await api.remove(id);
                onChanged(true);
              }
            }}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>

      {isResume ? (
        records.map((r) => (
          <ResumeEditor
            key={r.id}
            docId={id}
            inv={r}
            onSaved={() => {
              load();
              onChanged();
            }}
          />
        ))
      ) : (
        records.map((inv) => (
          <InvoiceEditor
            key={inv.id}
            docId={id}
            inv={inv}
            onSaved={() => {
              load();
              onChanged();
            }}
          />
        ))
      )}

      {d.status !== "failed" &&
        records.length === 0 &&
        d.status !== "queued" &&
        d.status !== "processing" && (
          <div className="empty-state">
            <Info size={24} />
            <p>No structured entities detected in this document.</p>
          </div>
        )}

      {text && (
        <details className="tech-details" open>
          <summary>
            <FileCode size={14} /> Raw OCR & Vectorized Text ({text.length} pages)
          </summary>
          {text.map((p) => (
            <div key={p.page_no} style={{ marginTop: "10px" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                {p.label || `Page ${p.page_no}`} · engine: {p.method}
                {p.ocr_confidence != null
                  ? ` · conf ${(p.ocr_confidence * 100).toFixed(0)}%`
                  : ""}
              </div>
              <pre className="code-block">{p.text}</pre>
            </div>
          ))}
        </details>
      )}

      {doc && (
        <details className="tech-details">
          <summary>
            <History size={14} /> Pipeline Event Execution Log
          </summary>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
            }}
          >
            {(doc.events || []).map((e, i) => (
              <li
                key={i}
                style={{
                  color:
                    e.level === "error"
                      ? "var(--color-danger)"
                      : e.level === "warning"
                      ? "var(--color-warning)"
                      : "var(--text-secondary)",
                }}
              >
                [{e.stage}] {e.message}
                {e.duration_ms != null ? ` (${e.duration_ms}ms)` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Search({ onOpen }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("hybrid");
  const [docType, setDocType] = useState("");
  const [f, setF] = useState({ supplier: "", currency: "" });
  const [rev, setRev] = useState(false);
  const [hits, setHits] = useState(null);
  const [err, setErr] = useState("");
  const [searching, setSearching] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    setErr("");
    setSearching(true);
    try {
      const p = {
        q,
        mode,
        ...f,
        doc_type: docType || "",
        needs_review: rev || "",
      };
      const res = await api.search(p);
      setHits(res.results);
    } catch (x) {
      setErr(x.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <form onSubmit={go} className="filter-bar" style={{ flexWrap: "wrap" }}>
        <div className="search-input-wrap" style={{ flex: 2, minWidth: "260px" }}>
          <SearchIcon size={14} />
          <input
            required
            placeholder="Search candidates, skills, educational institutions, vendors, amounts…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="select-tech"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="hybrid">Hybrid Engine</option>
          <option value="keyword">BM25 Keyword</option>
          <option value="semantic">Vector Semantic</option>
        </select>
        <select
          className="select-tech"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          <option value="">All Document Types</option>
          <option value="resume">Resumes Only</option>
          <option value="invoice">Invoices Only</option>
        </select>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={rev}
            onChange={(e) => setRev(e.target.checked)}
          />
          Needs review
        </label>
        <button className="btn-primary" type="submit" disabled={searching}>
          {searching ? <Loader2 size={13} className="spin" /> : <SearchIcon size={13} />}
          Query
        </button>
      </form>

      {err && (
        <div className="feedback-pill err">
          <AlertCircle size={14} />
          <span>{err}</span>
        </div>
      )}

      {hits && (
        <div className="table-container">
          <table className="tech-table">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Class</th>
                <th>Entity Match</th>
                <th>Structured Data</th>
                <th>Status</th>
                <th>Relevance</th>
                <th>Strategy</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((h) => {
                const isResume =
                  h.doc_type === "resume" || !!h.data?.candidate_name;
                return (
                  <tr
                    key={`${h.document_id}-${h.invoice_id}`}
                    onClick={() =>
                      onOpen(h.document_id, isResume ? "resumes" : "invoices")
                    }
                  >
                    <td>
                      <span className="pill-tag">
                        {isResume ? "Resume" : "Invoice"}
                      </span>
                    </td>
                    <td>
                      <b>
                        {isResume
                          ? h.data?.candidate_name || h.filename
                          : h.data?.supplier_name || h.filename}
                      </b>
                    </td>
                    <td>
                      {isResume ? (
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {h.data?.degree && `${h.data.degree} `}
                          {h.data?.cgpa && (
                            <span className="cgpa-pill">GPA: {h.data.cgpa}</span>
                          )}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                          }}
                        >
                          {h.data?.invoice_number ? `#${h.data.invoice_number} ` : ""}
                          {h.data?.total != null
                            ? `${h.data.total} ${h.data.currency || ""}`
                            : ""}
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge s={h.status} />
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      {Number(h.score).toFixed(3)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {h.matched_by?.join("+")}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!hits.length && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "36px 12px" }}>
                    <div className="empty-state">
                      <SearchIcon size={24} />
                      <p>No documents matched the specified query parameters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("invoices"); // invoices | resumes | search
  const [docs, setDocs] = useState([]);
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState({ status: "", q: "" });
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [theme, setTheme] = useState(
    localStorage.getItem("docwork_theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("docwork_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const refresh = useCallback(async () => {
    try {
      const docTypeParam =
        tab === "search" ? "" : tab === "resumes" ? "resume" : "invoice";
      const [l, s] = await Promise.all([
        api.list({ ...filter, doc_type: docTypeParam, limit: 100 }),
        api.stats(),
      ]);
      setDocs(l.items);
      setStats(s);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }, [filter, tab]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = docs.some((d) => ["queued", "processing"].includes(d.status));
  useEffect(() => {
    const t = setInterval(refresh, active ? 1500 : 8000);
    return () => clearInterval(t);
  }, [refresh, active]);

  const handleOpenDoc = (id, targetTab) => {
    setSel(id);
    if (targetTab) setTab(targetTab);
  };

  return (
    <div className="app">
      <header className="main-header">
        <div className="brand-section">
          <img src="/logo.png" alt="OmniDoc Logo" className="brand-logo" />
          <div className="brand-text">
            <h1>
              OmniDoc
              <span className="engine-tag">Enterprise</span>
            </h1>
            <p>Intelligent Document Processing & Entity Extraction</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={tab === "invoices" ? "active" : ""}
            onClick={() => {
              setTab("invoices");
              setSel(null);
            }}
          >
            <Receipt size={14} />
            Invoices & Billing
            {stats?.by_type?.invoice != null && (
              <span className="tab-badge">{stats.by_type.invoice}</span>
            )}
          </button>
          <button
            className={tab === "resumes" ? "active" : ""}
            onClick={() => {
              setTab("resumes");
              setSel(null);
            }}
          >
            <GraduationCap size={14} />
            Resumes & Talent
            {stats?.by_type?.resume != null && (
              <span className="tab-badge">{stats.by_type.resume}</span>
            )}
          </button>
          <button
            className={tab === "search" ? "active" : ""}
            onClick={() => setTab("search")}
          >
            <SearchIcon size={14} />
            Vector Search
          </button>
        </nav>

        <div className="header-actions">
          <div className="api-key-wrapper" title="System API Authentication Key">
            <Key size={13} />
            <input
              className="api-key-input"
              type="text"
              defaultValue={getKey()}
              placeholder="API Key"
              onBlur={(e) => {
                setKey(e.target.value);
                refresh();
              }}
            />
          </div>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {stats && (
        <div className="telemetry-strip">
          <div className="telemetry-item">
            <span className="status-indicator" />
            <span className="val" style={{ color: "var(--color-success)" }}>
              Engine Ready
            </span>
          </div>

          <div className="telemetry-divider" />

          {Object.entries(stats.by_status || {}).map(([k, v]) => (
            <div key={k} className="telemetry-item">
              <span className="label">{k.replace("_", " ")}:</span>
              <span className="val">{v}</span>
            </div>
          ))}

          <div className="telemetry-divider" />

          <div className="telemetry-item">
            <span className="label">Avg Latency:</span>
            <span className="val">
              {(stats.avg_processing_ms / 1000).toFixed(2)}s
            </span>
          </div>

          <div className="telemetry-divider" />

          <div className="telemetry-item">
            <span className="label">Total Managed:</span>
            <span className="val">
              {(stats.by_type?.invoice || 0) + (stats.by_type?.resume || 0)} docs
            </span>
          </div>
        </div>
      )}

      {err && (
        <div className="feedback-pill err" style={{ marginBottom: "16px" }}>
          <AlertCircle size={14} />
          <span>{err}</span>
        </div>
      )}

      {tab === "search" ? (
        <Search onOpen={handleOpenDoc} />
      ) : (
        <div className="cols">
          <section>
            <Upload
              docType={tab === "resumes" ? "resume" : "invoice"}
              onDone={refresh}
            />

            <div className="filter-bar">
              <select
                className="select-tech"
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                {[
                  "queued",
                  "processing",
                  "completed",
                  "needs_review",
                  "failed",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>

              <div className="search-input-wrap">
                <SearchIcon size={13} />
                <input
                  placeholder={
                    tab === "resumes"
                      ? "Filter candidate, college, filename…"
                      : "Filter vendor, invoice #, filename…"
                  }
                  value={filter.q}
                  onChange={(e) =>
                    setFilter({ ...filter, q: e.target.value })
                  }
                />
              </div>
            </div>

            <DocTable
              docs={docs}
              selected={sel}
              onSelect={setSel}
              docType={tab === "resumes" ? "resume" : "invoice"}
            />
          </section>

          <section>
            {sel ? (
              <Detail
                key={sel}
                id={sel}
                onChanged={(del) => {
                  if (del) setSel(null);
                  refresh();
                }}
              />
            ) : (
              <div className="table-container" style={{ padding: "48px 24px" }}>
                <div className="empty-state">
                  <FileText size={32} />
                  <p>
                    Select an entry from the ledger to inspect extracted entities,
                    review confidence metrics, and commit corrections.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
