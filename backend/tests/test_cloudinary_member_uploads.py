import io
import uuid
import base64
from decimal import Decimal
import pytest
from backend.app.services.cloudinary_service import CloudinaryService


# Valid 1x1 PNG bytes for testing
TINY_PNG_BYTES = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")


@pytest.fixture
def test_group_and_member(client, auth_headers):
    uid = uuid.uuid4().hex[:6].upper()
    grp_resp = client.post("/api/v1/groups", json={
        "code": f"G-MED{uid}",
        "name": f"Media Test Group {uid}",
        "opening_balance": "1000.00",
        "status": "ACTIVE"
    }, headers=auth_headers)
    assert grp_resp.status_code == 200
    group_id = grp_resp.json()["id"]

    mem_resp = client.post("/api/v1/members", json={
        "full_name": f"Cloudinary Test Member {uid}",
        "group_id": group_id
    }, headers=auth_headers)
    assert mem_resp.status_code == 200
    member = mem_resp.json()
    return group_id, member


def test_file_validation_rejections(client, auth_headers, test_group_and_member):
    _, member = test_group_and_member
    member_id = member["id"]

    # 1. Reject invalid file type (e.g. text/plain as photo)
    fake_txt = io.BytesIO(b"not an image file")
    resp_bad_type = client.post(
        f"/api/v1/members/{member_id}/photo",
        files={"file": ("malicious.txt", fake_txt, "text/plain")},
        headers=auth_headers
    )
    assert resp_bad_type.status_code == 400
    assert "Invalid file type" in resp_bad_type.json()["error"]["message"]

    # 2. Reject empty file
    empty_file = io.BytesIO(b"")
    resp_empty = client.post(
        f"/api/v1/members/{member_id}/photo",
        files={"file": ("empty.png", empty_file, "image/png")},
        headers=auth_headers
    )
    assert resp_empty.status_code == 400
    assert "empty" in resp_empty.json()["error"]["message"]

    # 3. Reject oversized file (> 5MB for photo)
    oversized = io.BytesIO(b"0" * (6 * 1024 * 1024))
    resp_oversized = client.post(
        f"/api/v1/members/{member_id}/photo",
        files={"file": ("big.png", oversized, "image/png")},
        headers=auth_headers
    )
    assert resp_oversized.status_code == 400
    assert "exceeds maximum limit" in resp_oversized.json()["error"]["message"]


def test_member_photo_lifecycle(client, auth_headers, test_group_and_member):
    _, member = test_group_and_member
    member_id = member["id"]

    # 1. Upload initial photo
    file1 = io.BytesIO(TINY_PNG_BYTES)
    up_resp = client.post(
        f"/api/v1/members/{member_id}/photo",
        files={"file": ("avatar1.png", file1, "image/png")},
        headers=auth_headers
    )
    assert up_resp.status_code == 200
    up_data = up_resp.json()
    assert up_data["success"] is True
    assert "res.cloudinary.com" in up_data["secure_url"]
    first_pub_id = up_data["public_id"]
    assert f"foundation/members/{member_id}/profile" in first_pub_id

    # Verify member profile has updated photo_url and photo_public_id
    chk_resp = client.get(f"/api/v1/members/{member_id}", headers=auth_headers)
    assert chk_resp.status_code == 200
    assert chk_resp.json()["photo_url"] == up_data["secure_url"]

    # 2. Replace photo with a second upload
    file2 = io.BytesIO(TINY_PNG_BYTES)
    rep_resp = client.post(
        f"/api/v1/members/{member_id}/photo",
        files={"file": ("avatar2.png", file2, "image/png")},
        headers=auth_headers
    )
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    second_pub_id = rep_data["public_id"]
    assert second_pub_id != first_pub_id

    # 3. Delete photo
    del_resp = client.delete(f"/api/v1/members/{member_id}/photo", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # Verify member photo is cleared
    chk_after = client.get(f"/api/v1/members/{member_id}", headers=auth_headers).json()
    assert chk_after["photo_url"] is None


def test_member_signature_lifecycle(client, auth_headers, test_group_and_member):
    _, member = test_group_and_member
    member_id = member["id"]

    file1 = io.BytesIO(TINY_PNG_BYTES)
    up_resp = client.post(
        f"/api/v1/members/{member_id}/signature",
        files={"file": ("sig.png", file1, "image/png")},
        headers=auth_headers
    )
    assert up_resp.status_code == 200
    up_data = up_resp.json()
    assert "res.cloudinary.com" in up_data["secure_url"]
    pub_id = up_data["public_id"]
    assert f"foundation/members/{member_id}/signature" in pub_id

    # Verify get member shows signature
    chk = client.get(f"/api/v1/members/{member_id}", headers=auth_headers).json()
    assert chk["signature_url"] == up_data["secure_url"]

    # Delete signature
    del_resp = client.delete(f"/api/v1/members/{member_id}/signature", headers=auth_headers)
    assert del_resp.status_code == 200

    chk_after = client.get(f"/api/v1/members/{member_id}", headers=auth_headers).json()
    assert chk_after["signature_url"] is None


def test_member_documents_nid_and_birth_certificate(client, auth_headers, test_group_and_member):
    _, member = test_group_and_member
    member_id = member["id"]

    # 1. Upload NID Front
    f_nid_front = io.BytesIO(TINY_PNG_BYTES)
    doc1 = client.post(
        f"/api/v1/members/{member_id}/documents",
        data={"document_type": "National ID", "document_category": "NID_FRONT"},
        files={"file": ("nid_front.png", f_nid_front, "image/png")},
        headers=auth_headers
    )
    assert doc1.status_code == 200
    d1_data = doc1.json()
    assert d1_data["success"] is True
    assert "nid-front" in d1_data["document"]["cloudinary_public_id"]

    # 2. Upload NID Back
    f_nid_back = io.BytesIO(TINY_PNG_BYTES)
    doc2 = client.post(
        f"/api/v1/members/{member_id}/documents",
        data={"document_type": "National ID", "document_category": "NID_BACK"},
        files={"file": ("nid_back.png", f_nid_back, "image/png")},
        headers=auth_headers
    )
    assert doc2.status_code == 200

    # 3. List documents
    docs_resp = client.get(f"/api/v1/members/{member_id}/documents", headers=auth_headers)
    assert docs_resp.status_code == 200
    items = docs_resp.json()
    categories = [i["document_category"] for i in items]
    assert "NID_FRONT" in categories
    assert "NID_BACK" in categories

    # 4. Delete document
    doc_id = items[0]["id"]
    del_doc = client.delete(f"/api/v1/members/{member_id}/documents/{doc_id}", headers=auth_headers)
    assert del_doc.status_code == 200

    # Check list has 1 less
    docs_after = client.get(f"/api/v1/members/{member_id}/documents", headers=auth_headers).json()
    assert len(docs_after) == len(items) - 1


def test_temp_upload_and_member_creation(client, auth_headers, test_group_and_member):
    group_id, _ = test_group_and_member
    uid = uuid.uuid4().hex[:6].upper()

    # 1. Upload to temp staging
    f_temp = io.BytesIO(TINY_PNG_BYTES)
    temp_resp = client.post(
        "/api/v1/members/upload-temp",
        data={"category": "PHOTO"},
        files={"file": ("new_avatar.png", f_temp, "image/png")},
        headers=auth_headers
    )
    assert temp_resp.status_code == 200
    temp_data = temp_resp.json()
    assert temp_data["success"] is True
    assert "foundation/members/temp/photo" in temp_data["public_id"]

    # 2. Create member with staged photo URL and public_id
    new_mem = client.post("/api/v1/members", json={
        "full_name": f"Staged Member {uid}",
        "group_id": group_id,
        "photo_url": temp_data["secure_url"],
        "photo_public_id": temp_data["public_id"]
    }, headers=auth_headers)
    assert new_mem.status_code == 200
    m_data = new_mem.json()
    assert m_data["photo_url"] == temp_data["secure_url"]

    # Cleanup created asset from Cloudinary
    CloudinaryService.delete(temp_data["public_id"], resource_type="image")
