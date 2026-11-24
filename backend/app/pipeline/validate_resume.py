"""Validation rules for Resumes / Candidate Profiles."""
import re
from typing import Optional
from sqlalchemy.orm import Session
from ..config import settings
from ..models import Invoice, ValidationIssue


def issue(code, severity, field, msg):
    return {"code": code, "severity": severity, "field": field, "message": msg}


def validate_resume_data(data: dict, conf: Optional[dict] = None) -> list[dict]:
    """Pure validation function for resume JSON."""
    out = []

    # 1. Candidate Name
    name = (data.get("candidate_name") or "").strip()
    if not name:
        out.append(issue("MISSING_NAME", "error", "candidate_name", "Candidate name is missing."))

    # 2. Contact details
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()
    if not email and not phone:
        out.append(issue("MISSING_CONTACT", "error", "email", "Neither email nor phone number was found."))
    elif email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        out.append(issue("INVALID_EMAIL", "error", "email", f"'{email}' does not appear to be a valid email address."))

    # 3. Education / Degree
    degree = (data.get("degree") or "").strip()
    if not degree:
        out.append(issue("MISSING_DEGREE", "warning", "degree", "Education degree not detected."))

    # 4. CGPA / GPA
    cgpa = (data.get("cgpa") or "").strip()
    if not cgpa:
        out.append(issue("MISSING_CGPA", "warning", "cgpa", "CGPA / GPA score not detected."))

    # 5. Skills
    skills = data.get("skills") or []
    if not skills:
        out.append(issue("MISSING_SKILLS", "warning", "skills", "No technical or professional skills detected."))

    # 6. Confidence warnings
    if conf:
        for field, score in conf.items():
            if data.get(field) not in (None, "", []) and score < settings.review_confidence:
                out.append(issue("LOW_CONFIDENCE", "warning", field,
                                 f"Low confidence ({int(score * 100)}%) on '{field}'."))

    return out


def validate_resume_record(db: Session, inv: Invoice, extra_issues: Optional[list] = None) -> str:
    """DB-aware validation for a resume: runs pure rules and checks for duplicate candidate profiles."""
    issues = validate_resume_data(inv.data, inv.confidence)
    if extra_issues:
        issues.extend(extra_issues)

    # Cross-document duplicate candidate check by email or phone
    email = (inv.data.get("email") or "").lower().strip()
    phone = re.sub(r"\D", "", (inv.data.get("phone") or ""))
    name = (inv.data.get("candidate_name") or "").lower().strip()

    if email or (phone and len(phone) >= 10):
        q = db.query(Invoice).filter(Invoice.id != inv.id)
        for other in q.all():
            other_data = other.data or {}
            other_email = (other_data.get("email") or "").lower().strip()
            other_phone = re.sub(r"\D", "", (other_data.get("phone") or ""))
            other_name = (other_data.get("candidate_name") or "").lower().strip()

            if (email and other_email == email) or (phone and len(phone) >= 10 and other_phone == phone):
                issues.append(issue("DUPLICATE_CANDIDATE", "warning", "candidate_name",
                                    f"Candidate profile also exists in Document #{other.document_id} ({other_name or 'Candidate'})."))
                break

    # Persist issues
    inv.issues = [ValidationIssue(code=i["code"], severity=i["severity"], field=i["field"], message=i["message"])
                  for i in issues]
    has_err = any(i["severity"] == "error" for i in issues)
    has_warn = any(i["severity"] == "warning" for i in issues)
    return "needs_review" if (has_err or has_warn) else "ok"
