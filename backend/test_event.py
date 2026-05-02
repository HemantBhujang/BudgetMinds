import requests

payload = {
    "name": "Company Retreat",
    "description": "Annual gathering",
    "coordinator_id": 1,
    "budget_items": [
        {"name": "Catering", "requested_amount": 20000}
    ]
}

print("Creating Event via POST /api/events/")
res = requests.post("http://localhost:8000/api/events/", json=payload)
print(f"Status: {res.status_code}")
try:
    print(res.json())
except:
    print(res.text)

print("\nFetching Events via GET /api/events/")
res2 = requests.get("http://localhost:8000/api/events/")
print(f"Status: {res2.status_code}")
