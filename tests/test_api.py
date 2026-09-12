from fastapi.testclient import TestClient

from helios.api import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_runaway_endpoint():
    r = client.post(
        "/api/simulate/runaway",
        json={"chemistry": "lfp", "htc_w_m2k": 30, "k_contact_w_k": 0.8, "duration_s": 80},
    )
    assert r.status_code == 200
    body = r.json()
    assert "sim" in body and "insurance" in body
    assert body["sim"]["cells_total"] == 16


def test_products_endpoint():
    r = client.get("/api/products")
    assert r.status_code == 200
    assert len(r.json()) >= 5
