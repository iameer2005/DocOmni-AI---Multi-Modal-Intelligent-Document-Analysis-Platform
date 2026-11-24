"""Rule-based extractor for resumes / CVs.
Extracts candidate name, degree, CGPA, institution, graduation year, contact info, and skills.
Used as an offline baseline and as a fallback if the LLM is unavailable.
"""
import re
from typing import Optional

RESUME_EMPTY = {
    "candidate_name": None,
    "email": None,
    "phone": None,
    "location": None,
    "degree": None,
    "institution": None,
    "graduation_year": None,
    "cgpa": None,
    "skills": [],
    "experience_years": None,
    "work_experience": [],
    "projects": [],
    "certifications": [],
    "summary": None,
}

COMMON_SKILLS = [
    # Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "SQL", "R",
    # Frameworks & Libraries
    "React", "React Native", "Angular", "Vue", "Next.js", "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
    "Tailwind CSS", "Bootstrap", "HTML5", "CSS3", "Redux", "GraphQL", "REST API",
    # Data Science & AI
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "NLP", "Computer Vision", "Pandas", "NumPy", "OpenCV",
    # Databases & Cloud
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Firebase", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Linux", "Git", "CI/CD"
]

DEGREE_PATTERNS = [
    r"(?i)\b(B\.?Tech(?:nology)?(?:\s+in\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(B\.?E\.?(?:\s+in\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(B\.?S\.?(?:c)?(?:\s+in\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(Bachelor(?:'s)?(?:\s+of\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(M\.?Tech(?:nology)?(?:\s+in\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(M\.?S\.?(?:c)?(?:\s+in\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(Master(?:'s)?(?:\s+of\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(BCA|MCA|MBA|BBA|Ph\.?D(?:\s+in\s+[A-Za-z\s&]+)?)",
    r"(?i)\b(Diploma(?:\s+in\s+[A-Za-z\s&]+)?)",
]

INSTITUTION_PATTERNS = [
    r"(?i)\b([A-Za-z\s&]+(?:University|Institute\s+of\s+Technology|College\s+of\s+[A-Za-z\s&]+|Institute|Academy))",
]

CGPA_PATTERNS = [
    r"(?i)\b(?:cgpa|gpa|aggregate|score|marks|percentage)[:\s]*([0-9]+(?:\.[0-9]+)?(?:\s*/\s*[0-9]+(?:\.0)?)?%?)",
    r"(?i)\b([0-9]\.[0-9]{1,2})\s*(?:/|out of)\s*(?:10|4)(?:\.0)?\b",
    r"(?i)\b(10(?:\.0)?)\s*(?:/|out of)\s*10(?:\.0)?\b",
    r"(?i)\b([1-9][0-9](?:\.[0-9]{1,2})?%)\b",
]


def extract_candidate_name(text: str) -> Optional[str]:
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    for ln in lines[:6]:
        if re.search(r"(?i)\b(resume|curriculum|vitae|email|phone|contact|profile|objective|summary)\b", ln):
            continue
        if "@" in ln or re.search(r"\d{3,}", ln):
            continue
        # Names are typically 2 to 4 capitalized words without punctuation
        if re.match(r"^[A-Z][a-zA-Z'.\-]+(?:\s+[A-Z][a-zA-Z'.\-]+){1,3}$", ln):
            return ln
    return None


def extract_email(text: str) -> Optional[str]:
    m = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    return m.group(0) if m else None


def extract_phone(text: str) -> Optional[str]:
    m = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}", text)
    return m.group(0).strip() if m else None


def extract_cgpa(text: str) -> Optional[str]:
    for p in CGPA_PATTERNS:
        m = re.search(p, text)
        if m:
            val = m.group(1).strip()
            # Clean up trailing punctuation
            val = val.rstrip(".,;")
            return val
    return None


def extract_degree(text: str) -> Optional[str]:
    for p in DEGREE_PATTERNS:
        m = re.search(p, text)
        if m:
            clean = re.split(r"[\n,;|]", m.group(1).strip())[0].strip()
            if len(clean) > 2:
                return clean
    return None


def extract_institution(text: str) -> Optional[str]:
    for line in text.split("\n"):
        ln = line.strip()
        if not ln or re.search(r"(?i)\b(b\.?tech|b\.?e\b|b\.?s\b|m\.?tech|m\.?s\b|degree|bachelor|master)\b", ln):
            continue
        if re.search(r"(?i)\b(?:University|College|Institute|Academy)\b", ln):
            clean = re.sub(r"(?i)\b(?:Class of \d+|\d{4}|Graduated)\b.*", "", ln).strip(",. -")
            if len(clean) > 3:
                return clean
    return None


def extract_graduation_year(text: str) -> Optional[str]:
    # Look for 4-digit years near education context or general
    m = re.search(r"(?i)(?:passed|passing|graduated|batch|class of|graduation|degree)[^\n]{0,40}\b(20[123][0-9]|19[89][0-9])\b", text)
    if m:
        return m.group(1)
    # Generic year check in 2015-2030
    years = re.findall(r"\b(20[123][0-9])\b", text)
    return years[-1] if years else None


def extract_skills(text: str) -> list[str]:
    found = []
    text_lower = text.lower()
    for skill in COMMON_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def extract_resume_from_text(text: str) -> tuple[dict, dict]:
    """Rule-based resume extractor returning (data, confidence)."""
    data = dict(RESUME_EMPTY)
    conf = {k: 0.0 for k in RESUME_EMPTY}

    name = extract_candidate_name(text)
    if name:
        data["candidate_name"] = name
        conf["candidate_name"] = 0.8

    email = extract_email(text)
    if email:
        data["email"] = email
        conf["email"] = 0.95

    phone = extract_phone(text)
    if phone:
        data["phone"] = phone
        conf["phone"] = 0.9

    cgpa = extract_cgpa(text)
    if cgpa:
        data["cgpa"] = cgpa
        conf["cgpa"] = 0.85

    degree = extract_degree(text)
    if degree:
        data["degree"] = degree
        conf["degree"] = 0.8

    inst = extract_institution(text)
    if inst:
        data["institution"] = inst
        conf["institution"] = 0.75

    grad = extract_graduation_year(text)
    if grad:
        data["graduation_year"] = grad
        conf["graduation_year"] = 0.7

    skills = extract_skills(text)
    if skills:
        data["skills"] = skills
        conf["skills"] = 0.85

    # Check for experience keywords
    exp_m = re.search(r"(?i)\b([0-9]+(?:\.[0-9]+)?\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience)\b", text)
    if exp_m:
        data["experience_years"] = exp_m.group(1).strip()
        conf["experience_years"] = 0.8
    elif re.search(r"(?i)\b(fresher|entry[\s-]level)\b", text):
        data["experience_years"] = "Fresher"
        conf["experience_years"] = 0.75

    return data, conf
