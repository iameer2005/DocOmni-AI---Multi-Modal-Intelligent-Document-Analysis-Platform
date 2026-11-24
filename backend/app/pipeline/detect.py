"""File-type detection by magic bytes (never trust extension/MIME from the client)."""
import os

SPREADSHEET_EXT = {".xlsx", ".xls", ".csv"}


def detect_kind(path: str, filename: str = "") -> tuple[str, str]:
    """Returns (kind, mime). kind in pdf|image|spreadsheet|unknown."""
    with open(path, "rb") as f:
        head = f.read(16)
    ext = os.path.splitext(filename or path)[1].lower()
    if head.startswith(b"%PDF"):
        return "pdf", "application/pdf"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image", "image/png"
    if head.startswith(b"\xff\xd8\xff"):
        return "image", "image/jpeg"
    if head[:4] in (b"II*\x00", b"MM\x00*"):
        return "image", "image/tiff"
    if head.startswith(b"PK\x03\x04") and ext == ".xlsx":
        return "spreadsheet", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    if head.startswith(b"\xd0\xcf\x11\xe0") and ext == ".xls":
        return "spreadsheet", "application/vnd.ms-excel"
    if ext == ".csv" and _looks_like_text(path):
        return "spreadsheet", "text/csv"
    return "unknown", "application/octet-stream"


def _looks_like_text(path: str) -> bool:
    with open(path, "rb") as f:
        chunk = f.read(8192)
    if chunk.startswith((b"\xff\xfe", b"\xfe\xff")):   # UTF-16 BOM
        return True
    return b"\x00" not in chunk


def detect_doc_type(text: str, filename: str = "", hint: str = "") -> str:
    """Detects whether a document is an 'invoice' or a 'resume'."""
    if hint and hint.lower() in ("invoice", "resume"):
        return hint.lower()

    fn = (filename or "").lower()
    if any(k in fn for k in ("resume", "cv", "curriculum", "biodata", "profile", "candidate")):
        return "resume"
    if any(k in fn for k in ("invoice", "bill", "receipt", "inv", "statement")):
        return "invoice"

    text_lower = (text or "").lower()
    resume_score = sum(text_lower.count(k) for k in [
        "curriculum vitae", "resume", "education", "experience", "skills",
        "cgpa", "gpa", "b.tech", "b.e", "bachelor", "master", "university",
        "college", "projects", "certifications"
    ])
    invoice_score = sum(text_lower.count(k) for k in [
        "invoice", "receipt", "tax invoice", "subtotal", "total due",
        "balance due", "bill to", "ship to", "unit price", "line total",
        "amount due", "payment terms"
    ])

    if resume_score > invoice_score and resume_score >= 2:
        return "resume"
    return "invoice"

