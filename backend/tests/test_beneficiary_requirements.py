import uuid
from decimal import Decimal
from fastapi.testclient import TestClient


def test_beneficiary_creation_with_only_name(client: TestClient, auth_headers: dict):
    uid = uuid.uuid4().hex[:6]
    payload = {
        "name": f"Only Name Beneficiary {uid}"
    }
    resp = client.post("/api/v1/beneficiaries", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["name"] == payload["name"]
    assert data["beneficiary_number"].startswith("B-")
    assert data["phone"] is None
    assert data["father_or_husband_name"] is None
    assert data["nid_or_id"] is None
    assert data["present_address"] is None
    assert data["permanent_address"] is None
    assert data["emergency_contact_name"] is None
    assert data["emergency_contact_relation"] is None
    assert data["emergency_contact_phone"] is None
    assert data["photo_url"] is None
    assert data["signature_url"] is None
    assert data["nid_front_url"] is None
    assert data["nid_back_url"] is None


def test_beneficiary_creation_with_all_optional_fields(client: TestClient, auth_headers: dict):
    uid = uuid.uuid4().hex[:6]
    payload = {
        "name": f"Complete Beneficiary {uid}",
        "phone": "01712345678",
        "status": "ACTIVE",
        "father_or_husband_name": "Late Rafiq Ahmed",
        "nid_or_id": "8234567890",
        "present_address": "House 10, Road 4, Sector 3, Uttara, Dhaka",
        "permanent_address": "Vill: Char Fashion, Dist: Bhola",
        "emergency_contact_name": "Amena Begum",
        "emergency_contact_relation": "Mother",
        "emergency_contact_phone": "01987654321",
        "photo_url": "https://example.com/photo.jpg",
        "signature_url": "https://example.com/sig.png",
        "id_document_type": "NID",
        "nid_front_url": "https://example.com/front.jpg",
        "nid_back_url": "https://example.com/back.jpg",
        "notes": "Elderly widow deserving zakat/sadakah welfare support."
    }
    resp = client.post("/api/v1/beneficiaries", json=payload, headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["name"] == payload["name"]
    assert data["phone"] == payload["phone"]
    assert data["father_or_husband_name"] == payload["father_or_husband_name"]
    assert data["nid_or_id"] == payload["nid_or_id"]
    assert data["present_address"] == payload["present_address"]
    assert data["permanent_address"] == payload["permanent_address"]
    assert data["emergency_contact_name"] == payload["emergency_contact_name"]
    assert data["emergency_contact_relation"] == payload["emergency_contact_relation"]
    assert data["emergency_contact_phone"] == payload["emergency_contact_phone"]
    assert data["photo_url"] == payload["photo_url"]
    assert data["signature_url"] == payload["signature_url"]
    assert data["id_document_type"] == payload["id_document_type"]
    assert data["nid_front_url"] == payload["nid_front_url"]
    assert data["nid_back_url"] == payload["nid_back_url"]
    assert data["notes"] == payload["notes"]


def test_beneficiary_selector_availability(client: TestClient, auth_headers: dict):
    uid = uuid.uuid4().hex[:6]
    # Create beneficiary with only name
    resp = client.post("/api/v1/beneficiaries", json={"name": f"Selector Beneficiary {uid}"}, headers=auth_headers)
    assert resp.status_code == 200
    b_id = resp.json()["id"]

    # Check available in GET /beneficiaries
    list_resp = client.get("/api/v1/beneficiaries?page=1&page_size=200", headers=auth_headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    found = any(item["id"] == b_id for item in items)
    assert found, "New beneficiary must be immediately available in selector list"
