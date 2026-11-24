"""Unit and integration tests for Resume Extraction and Validation in OmniDoc AI."""
import pytest
from app.pipeline.detect import detect_doc_type
from app.pipeline.extract_resume_rules import extract_resume_from_text
from app.pipeline.validate_resume import validate_resume_data


SAMPLE_RESUME = """
Johnathan Doe
Email: john.doe@example.com | Phone: (555) 123-4567 | Location: San Francisco, CA

SUMMARY
Experienced Software Engineer with a passion for building scalable web apps and machine learning models.

EDUCATION
B.Tech in Computer Science and Engineering
Stanford University, Class of 2024
CGPA: 8.9 / 10

SKILLS
Python, JavaScript, React, FastAPI, Docker, SQL, Machine Learning, Git

EXPERIENCE
Software Engineering Intern at Acme Corp (2 years of experience)
Developed REST APIs and backend microservices using FastAPI and PostgreSQL.
"""


def test_detect_doc_type():
    assert detect_doc_type(SAMPLE_RESUME, "resume_john.pdf") == "resume"
    assert detect_doc_type("INVOICE #101\nTotal: $500\nSupplier: Acme", "invoice.pdf") == "invoice"
    assert detect_doc_type("Some ambiguous text", hint="resume") == "resume"
    assert detect_doc_type("Some ambiguous text", hint="invoice") == "invoice"


def test_resume_rule_extractor():
    data, conf = extract_resume_from_text(SAMPLE_RESUME)
    assert data["candidate_name"] == "Johnathan Doe"
    assert data["email"] == "john.doe@example.com"
    assert "555" in data["phone"]
    assert "B.Tech" in data["degree"]
    assert "Stanford" in data["institution"]
    assert data["graduation_year"] == "2024"
    assert "8.9" in data["cgpa"]
    assert "Python" in data["skills"]
    assert "FastAPI" in data["skills"]
    assert "React" in data["skills"]
    assert conf["candidate_name"] >= 0.7
    assert conf["email"] >= 0.8


def test_resume_validation():
    data, conf = extract_resume_from_text(SAMPLE_RESUME)
    issues = validate_resume_data(data, conf)
    # Complete resume should have no critical errors
    errors = [i for i in issues if i["severity"] == "error"]
    assert len(errors) == 0

    # Incomplete resume missing candidate name and contact
    bad_data = {"candidate_name": "", "email": "invalid-email-address", "phone": "", "degree": "", "cgpa": ""}
    bad_issues = validate_resume_data(bad_data)
    codes = {i["code"] for i in bad_issues}
    assert "MISSING_NAME" in codes
    assert "INVALID_EMAIL" in codes
    assert "MISSING_DEGREE" in codes


def test_resume_api_end_to_end(client, tmp_path):
    import pymupdf as fitz
    d = fitz.open()
    page = d.new_page()
    page.insert_text((50, 50), SAMPLE_RESUME)
    pdf_path = tmp_path / "resume_jane.pdf"
    d.save(str(pdf_path))

    # Upload with doc_type=resume
    with open(pdf_path, "rb") as f:
        r = client.post("/documents?doc_type=resume", files={"files": ("resume_jane.pdf", f, "application/pdf")},
                        headers={"X-API-Key": "test-key"})
    assert r.status_code == 202
    doc_id = r.json()["results"][0]["id"]

    # Verify document listing includes doc_type
    doc_resp = client.get(f"/documents/{doc_id}", headers={"X-API-Key": "test-key"}).json()
    assert doc_resp["doc_type"] == "resume"

    # Verify results
    res_resp = client.get(f"/documents/{doc_id}/result", headers={"X-API-Key": "test-key"}).json()
    assert res_resp["doc_type"] == "resume"
    assert len(res_resp["resumes"]) == 1
    resume_data = res_resp["resumes"][0]["data"]
    assert resume_data["candidate_name"] == "Johnathan Doe"
    assert "8.9" in resume_data["cgpa"]
    assert "B.Tech" in resume_data["degree"]
